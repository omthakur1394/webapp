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

    // Find by order_id (e.g. 'ORD-48F389D2')
    let order = await ordersCollection.findOne({ order_id: orderId });

    // Fallback to find by ObjectId if order_id is a 24-character hex string
    if (!order && ObjectId.isValid(orderId)) {
      order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
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
