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

    // ── 2. Build catalog for prompt ──────────────────────────
    const catalogText = (products as Product[])
      .map(p => `- ID: ${p.id} | Name: "${p.name}" | Price: ₹${(p.price_in_paise / 100).toFixed(2)} | Stock: ${p.stock_quantity}`)
      .join('\n');

    const prompt = `You are Meena, a friendly order-taking assistant for Akshaya Swadam, an authentic South-Indian spice brand.

CATALOG (ONLY these products exist — do NOT invent others):
${catalogText}

RULES:
1. ONLY discuss Akshaya Swadam products. Politely decline anything else.
2. Return ONLY raw JSON — no markdown, no explanation, just JSON.
3. Understand multilingual references: haldi=turmeric, rasam, sambar, garam masala, mirch, etc.
4. Match user requests to product IDs from catalog.
5. Be warm, friendly — like a local shopkeeper.

PREVIOUS CONVERSATION:
${(conversationHistory || [])
  .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
  .slice(-6)
  .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'Customer' : 'Meena'}: ${m.content}`)
  .join('\n')}

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

    // ── 3. Call Gemini via new @google/genai SDK ─────────────
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({
        intent: 'other', items: [],
        message: "⚠️ GEMINI_API_KEY not set in .env.local. Please add it and restart the server.",
        serverValidatedAmount: 0, auditEntry: null,
      });
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.1,          // Lower = more deterministic JSON output
        maxOutputTokens: 2048,     // Large enough for full multi-item responses
        responseMimeType: 'application/json', // Forces complete, valid JSON
      },
    });

    const rawText = response.text?.trim() ?? '';
    console.log('[Gemini raw]', rawText.slice(0, 200)); // Debug: first 200 chars

    // ── 4. Parse JSON response ───────────────────────────────
    // Step 1: Strip any accidental markdown fences Gemini might add
    const stripped = rawText
      .replace(/^```json\s*/i, '')   // leading ```json
      .replace(/^```\s*/i, '')       // leading ```
      .replace(/\s*```\s*$/,  '')    // trailing ```
      .replace(/^`|`$/g, '')         // single backticks
      .trim();

    let geminiResponse: GeminiCartResponse;
    try {
      geminiResponse = JSON.parse(stripped);

      // Validate required fields exist
      if (!geminiResponse.intent || !Array.isArray(geminiResponse.items)) {
        throw new Error('Missing required fields: intent or items');
      }
    } catch (parseErr) {
      console.error('Gemini JSON parse failed:', parseErr);
      console.error('Raw (first 500 chars):', rawText.slice(0, 500));

      // Step 2: Regex rescue — try to extract the message field even from truncated JSON
      const msgMatch = stripped.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*?)"/);
      const rescuedMsg = msgMatch?.[1]
        ?.replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'");

      // Step 3: Clean graceful fallback — never show raw JSON to the user
      return NextResponse.json({
        intent: 'other',
        items: [],
        message: rescuedMsg || 'Namaskaram! 🙏 I had a small glitch understanding that. Could you repeat your order?',
        serverValidatedAmount: 0,
        auditEntry: null,
      });
    }

    // ── 5. SERVER-SIDE VALIDATION (bounded agent) ────────────
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

    // ── 6. Audit trail ───────────────────────────────────────
    const auditEntry: AuditEntry = {
      timestamp: new Date().toISOString(),
      action: geminiResponse.intent,
      aiItems: geminiResponse.items || [],
      serverValidatedAmount,
      amountMatch: true, // server is always authoritative
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

    // Friendly in-chat error messages
    if (msg.includes('403') || msg.includes('API_KEY_INVALID'))
      return NextResponse.json({ intent: 'other', items: [], message: "⚠️ Gemini API key is invalid. Get a valid key from https://aistudio.google.com/app/apikey", serverValidatedAmount: 0, auditEntry: null });
    if (msg.includes('404') || msg.includes('not found'))
      return NextResponse.json({ intent: 'other', items: [], message: "⚠️ Gemini model not found. Check your API key and try again.", serverValidatedAmount: 0, auditEntry: null });
    if (msg.includes('429') || msg.includes('quota'))
      return NextResponse.json({ intent: 'other', items: [], message: "⏳ API quota exceeded. Please wait a moment and try again.", serverValidatedAmount: 0, auditEntry: null });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
