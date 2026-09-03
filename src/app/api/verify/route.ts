import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id } =
      await req.json();

    // ── Verify signature (HMAC SHA256) ───────────────────────
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      // Mark order as failed
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', db_order_id);

      return NextResponse.json({ error: 'Payment signature invalid', verified: false }, { status: 400 });
    }

    // ── Update order status to paid ──────────────────────────
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', db_order_id);

    if (updateError) {
      console.error('Failed to update order status:', updateError);
    }

    return NextResponse.json({ verified: true, message: 'Payment verified successfully!' });
  } catch (err) {
    console.error('/api/verify error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
