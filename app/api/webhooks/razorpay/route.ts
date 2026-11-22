import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';

const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  'CFeHqLgj5jYCzflxKerDQxqT';

const MONGO_URI = process.env.MONGO_URI || '';

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  try {
    const signature = request.headers.get('x-razorpay-signature');
    if (!signature) {
      console.warn('Razorpay webhook: Missing signature header');
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 });
    }

    // Read the raw text body for HMAC verification
    const rawBody = await request.text();

    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('Razorpay webhook: Signature verification mismatch');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 });
    }

    const event = payload.event;
    console.log(`[Razorpay Webhook] Received verified event: ${event}`);

    // Handle payment.captured or order.paid
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const paymentId: string = paymentEntity?.id || '';
      const rzpOrderId: string = paymentEntity?.order_id || orderEntity?.id || '';
      const amountInPaise: number = paymentEntity?.amount ?? orderEntity?.amount ?? 0;
      const price: number = Math.round(amountInPaise / 100);

      const notes = paymentEntity?.notes || orderEntity?.notes || {};

      client = new MongoClient(MONGO_URI);
      await client.connect();
      const db = client.db('shopease_db');
      const ordersCollection = db.collection('orders');

      // Check if this order has already been recorded by the frontend verify-payment call
      const queryOr: any[] = [];
      if (rzpOrderId) queryOr.push({ razorpay_order_id: rzpOrderId });
      if (paymentId) queryOr.push({ razorpay_payment_id: paymentId });

      let existingOrder = null;
      if (queryOr.length > 0) {
        existingOrder = await ordersCollection.findOne({ $or: queryOr });
      }

      if (existingOrder) {
        // Idempotent update: mark confirmed and verified by webhook
        const updateDoc: any = {
          payment_status: 'Paid',
          status: 'Placed',
          updated_at: new Date(),
          webhook_verified_at: new Date(),
        };
        if (paymentId && !existingOrder.razorpay_payment_id) {
          updateDoc.razorpay_payment_id = paymentId;
        }
        await ordersCollection.updateOne({ _id: existingOrder._id }, { $set: updateDoc });
        console.log(`[Razorpay Webhook] Idempotently updated order: ${existingOrder.order_id}`);
      } else {
        // Edge case: User's browser closed or dropped connection right after payment was captured!
        // Webhook safely reconstructs and saves the order.
        const generatedOrderId = notes.order_id || `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const newOrder = {
          order_id: generatedOrderId,
          user_id: String(notes.user_id || 'Guest'),
          username: String(notes.username || notes.customer_name || 'Guest'),
          product_name: String(notes.product_name || 'ShopEase Item'),
          price: price,
          status: 'Placed',
          payment_status: 'Paid',
          payment_method: 'Razorpay',
          razorpay_order_id: rzpOrderId,
          razorpay_payment_id: paymentId,
          shipping_address: String(notes.shipping_address || '123 E-Commerce Way, Tech City'),
          hub_region: String(notes.hub_region || 'General Hub'),
          created_at: new Date(),
          source: 'webhook_fallback',
        };

        await ordersCollection.insertOne(newOrder);
        console.log(`[Razorpay Webhook] Created missing order from webhook: ${generatedOrderId}`);
      }
    }

    // Return 200 OK for all successfully received events so Razorpay acknowledges receipt
    return NextResponse.json({
      status: 'success',
      event: event,
      received: true,
    });
  } catch (err: any) {
    console.error('Razorpay webhook processing error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
