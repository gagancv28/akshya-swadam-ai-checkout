import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getRazorpay } from '@/lib/razorpay';
import type { Product, ParsedCartItem } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { items }: { items: ParsedCartItem[] } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // ── 1. Fetch fresh prices from DB (never trust frontend) ─
    const productIds = items.map(i => i.product_id);
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (dbError || !products || products.length === 0) {
      return NextResponse.json({ error: 'Could not validate products' }, { status: 500 });
    }

    // ── 2. Server-side total recalculation ───────────────────
    let totalInPaise = 0;
    const cartSnapshot: Array<{ product: Product; quantity: number }> = [];

    for (const item of items) {
      const product = (products as Product[]).find(p => p.id === item.product_id);

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found` },
          { status: 400 }
        );
      }
      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity for ${product.name}` },
          { status: 400 }
        );
      }
      if (item.quantity > product.stock_quantity) {
        return NextResponse.json(
          { error: `Only ${product.stock_quantity} units of "${product.name}" in stock` },
          { status: 400 }
        );
      }

      totalInPaise += product.price_in_paise * item.quantity;
      cartSnapshot.push({ product, quantity: item.quantity });
    }

    if (totalInPaise < 100) {
      return NextResponse.json(
        { error: 'Minimum order amount is ₹1.00' },
        { status: 400 }
      );
    }

    // ── 3. Create order record in Supabase (status: pending) ─
    const { data: orderRow, error: orderError } = await supabase
      .from('orders')
      .insert({
        total_amount: totalInPaise,
        status: 'pending',
        cart_snapshot: cartSnapshot,
      })
      .select()
      .single();

    if (orderError || !orderRow) {
      console.error('Order insert error:', orderError);
      return NextResponse.json({ error: 'Failed to create order record' }, { status: 500 });
    }

    // ── 4. Create Razorpay order ─────────────────────────────
    const rzpOrder = await getRazorpay().orders.create({
      amount: totalInPaise,
      currency: 'INR',
      receipt: orderRow.id,
      notes: {
        brand: 'Akshya Swadam',
        items_count: String(items.length),
      },
    });

    // ── 5. Update DB row with Razorpay order ID ──────────────
    await supabase
      .from('orders')
      .update({ razorpay_order_id: rzpOrder.id })
      .eq('id', orderRow.id);

    return NextResponse.json({
      orderId: rzpOrder.id,
      amount: totalInPaise,
      currency: 'INR',
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      dbOrderId: orderRow.id,
    });
  } catch (err) {
    console.error('/api/checkout error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
