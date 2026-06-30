import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.json(
      { error: 'Missing order_id query parameter' },
      { status: 400 }
    );
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ordersCollection = db.collection('orders');

    let order = await ordersCollection.findOne({ order_id: orderId });

    if (!order && ObjectId.isValid(orderId)) {
      order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Dynamic enrichment if database fields are missing
    const usernameParam = searchParams.get('username');
    const addressParam = searchParams.get('shipping_address');

    let needsUpdate = false;
    const updateFields: any = {};

    if (!order.username && usernameParam) {
      updateFields.username = usernameParam;
      needsUpdate = true;
    }
    if (!order.shipping_address && addressParam) {
      updateFields.shipping_address = addressParam || '123 E-Commerce Way, Tech City';
      needsUpdate = true;
    }

    if (needsUpdate) {
      await ordersCollection.updateOne(
        { _id: order._id },
        { $set: updateFields }
      );
      order = { ...order, ...updateFields };
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error fetching order from MongoDB:', error);
    return NextResponse.json(
      { error: error?.message || 'Database connection/query failure' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
