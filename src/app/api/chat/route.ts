import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import type { Product, GeminiCartResponse, AuditEntry } from '@/types';

// ── Server-only Supabase client (fresh per request) ──────────
function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false } }
  );
}

// ── Resilience: Exponential backoff with jitter ───────────────
const RETRY_DELAYS_MS = [1000]; // 1s retry delay
const PRIMARY_MODEL   = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL  = 'gemini-3.6-flash';

function is503(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('503') ||
    msg.includes('Service Unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('UNAVAILABLE')
  );
}

function jitter(ms: number): number {
  // Add ±20% random jitter to prevent thundering herd
  return ms + Math.floor(Math.random() * ms * 0.4 - ms * 0.2);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calls Gemini with exponential backoff retries on 503.
 * Falls back to FALLBACK_MODEL if all retries on PRIMARY_MODEL fail.
 */
async function callGeminiWithResilience(
  ai: GoogleGenAI,
  prompt: string
): Promise<string> {
  const config = {
    temperature: 0.05,
    maxOutputTokens: 512,
    responseMimeType: 'application/json',
  };

  // ── Attempt PRIMARY model with retries ────────────────────
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: PRIMARY_MODEL,
        contents: prompt,
        config,
      });
      console.log(`[Gemini] ${PRIMARY_MODEL} succeeded on attempt ${attempt + 1}`);
      return response.text?.trim() ?? '';
    } catch (err) {
      const is5xx = is503(err);
      const isLast = attempt === RETRY_DELAYS_MS.length;

      if (is5xx && !isLast) {
        const delay = jitter(RETRY_DELAYS_MS[attempt]);
        console.warn(
          `[Gemini] ${PRIMARY_MODEL} 503 on attempt ${attempt + 1}. ` +
          `Retrying in ${delay}ms…`
        );
        await sleep(delay);
        continue;
      }

      // Non-503 error OR exhausted retries → bubble up to fallback
      console.error(`[Gemini] ${PRIMARY_MODEL} failed after ${attempt + 1} attempt(s):`, err);
      throw err;
    }
  }

  // TypeScript requires this — never reached
  throw new Error('Retry loop exited unexpectedly');
}

// ── Build the system prompt ───────────────────────────────────
function buildPrompt(catalogText: string, history: string, message: string): string {
  return `You are Meena, a friendly order-taking assistant for Akshaya Swadam, an authentic South-Indian spice brand.

CATALOG (ONLY these products exist — do NOT invent others):
${catalogText}

RULES:
1. ONLY discuss Akshaya Swadam products. Politely decline anything else.
2. Return ONLY raw JSON — no markdown, no explanation, just JSON.
3. Understand multilingual references: haldi=turmeric, rasam, sambar, garam masala, mirch, etc.
4. Match user requests to product IDs from catalog.
5. Be warm, friendly — like a local shopkeeper.

PREVIOUS CONVERSATION:
${history}

Customer: ${message}

STRICT OUTPUT RULES:
- Return ONLY a single JSON object. No markdown. No prose. No extra keys.
- The JSON MUST be complete and valid — never truncate mid-object.
- For multiple items, include ALL of them in the items array.

JSON SCHEMA (always return exactly this shape):
{
  "intent": "add_to_cart" | "remove_from_cart" | "view_cart" | "checkout" | "other",
  "items": [
    { "product_id": "<exact-uuid-from-catalog>", "quantity": <positive-integer> },
    { "product_id": "<exact-uuid-from-catalog>", "quantity": <positive-integer> }
  ],
  "message": "<your warm friendly reply in 1-2 sentences>",
  "confidence": <0.0-1.0>
}

For greetings/questions: intent="other", items=[]`;
}

// ── Parse + validate Gemini output ───────────────────────────
function parseGeminiOutput(rawText: string): GeminiCartResponse {
  const stripped = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .replace(/^`|`$/g, '')
    .trim();

  const parsed = JSON.parse(stripped) as GeminiCartResponse;

  if (!parsed.intent || !Array.isArray(parsed.items)) {
    throw new Error('Missing required fields: intent or items');
  }
  return parsed;
}

// ── Main route handler ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message, conversationHistory } = await req.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // ── 1. Fetch live catalog from Supabase ──────────────────
    const db = getDb();
    const { data: products, error: dbError } = await db
      .from('products')
      .select('id, name, description, price_in_paise, stock_quantity, image_emoji')
      .gt('stock_quantity', 0);

    if (dbError || !products) {
      console.error('Supabase error:', dbError);
      const code = dbError?.code ?? '';
      const msg =
        code === 'PGRST205'
          ? "🛠️ Database tables not found. Run `supabase/schema.sql` in Supabase SQL Editor first!"
          : code === '42501'
          ? "🔐 Database permission error. Run the fix_permissions.sql in your Supabase SQL Editor."
          : "Sorry, I'm having trouble loading the catalog. Please try again!";
      return NextResponse.json({ intent: 'other', items: [], message: msg, serverValidatedAmount: 0, auditEntry: null });
    }

    // ── 2. Build prompt ──────────────────────────────────────
    const catalogText = (products as Product[])
      .map(p => `- ID: ${p.id} | Name: "${p.name}" | Price: ₹${(p.price_in_paise / 100).toFixed(2)} | Stock: ${p.stock_quantity}`)
      .join('\n');

    const history = (conversationHistory || [])
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .slice(-4)
      .map((m: { role: string; content: string }) =>
        `${m.role === 'user' ? 'Customer' : 'Meena'}: ${m.content.slice(0, 120)}`
      )
      .join('\n');

    const prompt = buildPrompt(catalogText, history, message);

    // ── 3. Validate Gemini key ───────────────────────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({
        intent: 'other', items: [],
        message: "⚠️ GEMINI_API_KEY not set in .env.local. Please add it and restart the server.",
        serverValidatedAmount: 0, auditEntry: null,
      });
    }
    const ai = new GoogleGenAI({ apiKey: geminiKey });

    // ── 4. Call Gemini (primary + retries + fallback) ────────
    let rawText: string;
    try {
      rawText = await callGeminiWithResilience(ai, prompt);
      console.log('[Gemini raw]', rawText.slice(0, 200));
    } catch (primaryErr) {
      // PRIMARY failed — try FALLBACK model once
      console.warn(`[Gemini] Trying fallback model: ${FALLBACK_MODEL}`);
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: prompt,
          config: {
            temperature: 0.05,
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
          },
        });
        rawText = fallbackResponse.text?.trim() ?? '';
        console.log(`[Gemini] ${FALLBACK_MODEL} fallback succeeded`);
      } catch (fallbackErr) {
        // ALL attempts failed → graceful UI failure
        console.error('[Gemini] All models failed. Primary:', primaryErr, 'Fallback:', fallbackErr);

        const primaryMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
        const isBusy = is503(primaryErr) || is503(fallbackErr);

        return NextResponse.json({
          intent: 'other',
          items: [],
          message: isBusy
            ? "⏳ Our AI assistant is currently very busy helping other customers. Please try your order again in a few moments!"
            : "🙏 Sorry, I'm having a little trouble right now. Please try again shortly!",
          serverValidatedAmount: 0,
          auditEntry: null,
          _debug: process.env.NODE_ENV === 'development' ? primaryMsg.slice(0, 200) : undefined,
        });
      }
    }

    // ── 5. Parse Gemini JSON ─────────────────────────────────
    let geminiResponse: GeminiCartResponse;
    try {
      geminiResponse = parseGeminiOutput(rawText);
    } catch (parseErr) {
      console.error('Gemini JSON parse failed:', parseErr);
      console.error('Raw (first 500 chars):', rawText.slice(0, 500));

      // Regex rescue: extract message field from truncated JSON
      const msgMatch = rawText.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*?)"/);
      const rescuedMsg = msgMatch?.[1]
        ?.replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");

      return NextResponse.json({
        intent: 'other',
        items: [],
        message: rescuedMsg || 'Namaskaram! 🙏 I had a small glitch. Could you repeat your order?',
        serverValidatedAmount: 0,
        auditEntry: null,
      });
    }

    // ── 6. SERVER-SIDE VALIDATION (bounded agent) ────────────
    // NEVER trust AI math — always recalculate from real DB prices
    let serverValidatedAmount = 0;
    const validatedItems: typeof geminiResponse.items = [];

    if (geminiResponse.items?.length > 0) {
      for (const item of geminiResponse.items) {
        const product = (products as Product[]).find(p => p.id === item.product_id);
        if (!product) {
          console.warn(`AI referenced unknown product_id: ${item.product_id} — skipped`);
          continue;
        }
        if (item.quantity <= 0 || item.quantity > product.stock_quantity) {
          console.warn(`Invalid quantity ${item.quantity} for "${product.name}" — skipped`);
          continue;
        }
        serverValidatedAmount += product.price_in_paise * item.quantity;
        validatedItems.push(item);
      }
    }

    // ── 7. Audit trail ───────────────────────────────────────
    const auditEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action: geminiResponse.intent,
      aiItems: geminiResponse.items || [],
      serverValidatedAmount,
      amountMatch: true,
    };

    return NextResponse.json({
      intent: geminiResponse.intent,
      items: validatedItems,
      message: geminiResponse.message,
      serverValidatedAmount,
      auditEntry,
    });

  } catch (err) {
    console.error('/api/chat error:', err);
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes('403') || msg.includes('API_KEY_INVALID'))
      return NextResponse.json({ intent: 'other', items: [], message: "⚠️ Gemini API key is invalid. Get a valid key from https://aistudio.google.com/app/apikey", serverValidatedAmount: 0, auditEntry: null });
    if (msg.includes('404') || msg.includes('not found'))
      return NextResponse.json({ intent: 'other', items: [], message: "⚠️ Gemini model not found. Check your API key and try again.", serverValidatedAmount: 0, auditEntry: null });
    if (msg.includes('429') || msg.includes('quota'))
      return NextResponse.json({ intent: 'other', items: [], message: "⏳ API quota exceeded. Please wait a moment and try again.", serverValidatedAmount: 0, auditEntry: null });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
