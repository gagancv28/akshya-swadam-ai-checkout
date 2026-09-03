# 🌶️ Akshaya Swadam — Conversational Checkout Agent

> **Razorpay Buildathon — Track 01: AI Growth & Agentic Commerce**
>
> A fully-functional AI-powered spice shop where customers order in natural language (English / Tamil / Telugu / Hindi) and pay via Razorpay test-mode checkout.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🤖 Conversational AI | Gemini 1.5 Flash — strict JSON-only extraction engine |
| 🛡️ Bounded Agent | Server recalculates ALL prices from DB — AI math is never trusted |
| 📋 Audit Trail | Every AI action logged with server-validated amount |
| 💳 Razorpay Checkout | Test-mode order creation + HMAC signature verification |
| 🗄️ Supabase Backend | PostgreSQL with RLS — products, orders, order_items |
| 🌍 Multilingual | Handles haldi, paruppu podi, garam masala, and more |
| ♿ Accessible | Full ARIA labels, keyboard navigation, screen-reader support |
| 🔒 Secure | Zero hardcoded secrets, .gitignore enforced |

---

## 🏗️ Architecture

```
Browser
  ├── ChatWindow  →  POST /api/chat   →  Gemini API (JSON extraction)
  │                                    →  Supabase (live catalog)
  │                                    →  Server price validation (bounded)
  │                                    →  Audit log entry
  │
  └── CartPanel   →  POST /api/checkout  →  Supabase (price recheck)
                                          →  Razorpay orders.create()
                  →  Razorpay Modal (frontend)
                  →  POST /api/verify   →  HMAC-SHA256 verification
                                         →  Supabase order status update
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd akshaya-swadam
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env.local
# Edit .env.local with your real credentials
```

### 3. Set Up Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → Run
3. Copy your project URL and anon key from **Settings → API**

### 4. Get API Keys

| Service | Where to Get |
|---|---|
| Supabase | Dashboard → Settings → API |
| Gemini | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| Razorpay (test) | [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys → Generate Test Key |

### 5. Run

```bash
npm run dev
# Open http://localhost:3000
```

---

## 🔐 Security

- ✅ `.gitignore` excludes `.env`, `.env.local`, `node_modules`, `.next`
- ✅ No hardcoded secrets anywhere in codebase
- ✅ All prices recalculated server-side before Razorpay order creation
- ✅ HMAC-SHA256 signature verification on payment callback
- ✅ Supabase Row Level Security (RLS) enabled on all tables

---

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css          # Brand CSS (yellow/red/orange palette)
│   ├── layout.tsx           # Root layout + SEO metadata
│   ├── page.tsx             # Main page — state orchestration
│   └── api/
│       ├── chat/route.ts    # Gemini NLP + bounded validation
│       ├── checkout/route.ts # Razorpay order creation
│       └── verify/route.ts  # Payment verification
├── components/
│   ├── ChatWindow.tsx       # Chat UI with typing indicator
│   └── CartPanel.tsx        # Cart + audit trail + checkout
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── razorpay.ts          # Razorpay SDK instance
├── types/
│   └── index.ts             # Shared TypeScript types
supabase/
└── schema.sql               # DB schema + seed data
```

---

## 🧪 Testing Payments

Use Razorpay test credentials:
- **Card**: 4111 1111 1111 1111 | Expiry: any future | CVV: any
- **UPI**: success@razorpay
- **Net Banking**: Any bank → success

---

## 🌶️ Products Catalog

| Product | Price |
|---|---|
| Signature Garam Masala | ₹349 |
| Premium Turmeric Powder | ₹189 |
| Authentic Sambar Powder | ₹249 |
| Rasam Powder | ₹219 |
| Byadgi Chilli Powder | ₹279 |
