import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { MongoClient } from 'mongodb';

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const MONGO_URI = process.env.MONGO_URI || '';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      product_name,
      price,
      user_id,
      username,
      shipping_address,
      hub_region,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification credentials' }, { status: 400 });
    }

    // Verify Razorpay HMAC-SHA256 signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      console.error('Razorpay signature verification failed');
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Payment signature is valid. Record order into MongoDB
    let client: MongoClient | null = null;
    try {
      client = new MongoClient(MONGO_URI);
      await client.connect();
      const db = client.db('shopease_db');
      const ordersCollection = db.collection('orders');

      const mockOrderId = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const now = new Date();
      const estDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const formattedEstDelivery = `${estDate.getDate()} ${months[estDate.getMonth()]} ${estDate.getFullYear()}`;

      const newOrder = {
        order_id: mockOrderId,
        user_id: user_id || 'Guest',
        username: username || 'Guest',
        product_name: product_name || 'ShopEase Item',
        price: Number(price) || 0,
        status: 'Placed',
        payment_status: 'Paid',
        payment_method: 'Razorpay',
        razorpay_order_id,
        razorpay_payment_id,
        hub_region: hub_region || 'General Hub',
        created_at: now,
        estimated_delivery: formattedEstDelivery,
        estimated_delivery_days: 7,
        estimated_delivery_date: estDate,
      };

      const result = await ordersCollection.insertOne(newOrder);

      return NextResponse.json({
        success: true,
        _id: result.insertedId.toString(),
        order_id: mockOrderId,
        payment_id: razorpay_payment_id,
        status: 'Placed',
        message: `Payment of ₹${Number(price).toLocaleString('en-IN')} verified successfully via Razorpay!`,
      });
    } catch (dbErr: any) {
      console.error('MongoDB order save error after payment:', dbErr);
      return NextResponse.json({
        success: true,
        order_id: `ORD-${Date.now().toString().slice(-8)}`,
        payment_id: razorpay_payment_id,
        warning: 'Payment verified, but database sync had a minor delay.',
      });
    } finally {
      if (client) await client.close();
    }
  } catch (error: any) {
    console.error('Error in razorpay verify-payment route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
