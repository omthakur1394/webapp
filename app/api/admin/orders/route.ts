import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function GET(request: Request) {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ordersCollection = db.collection('orders');

    // Automatically update orders placed > 7 days ago to 'Delivered'
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await ordersCollection.updateMany(
      {
        status: 'Placed',
        $or: [
          { created_at: { $lte: sevenDaysAgo } },
          { created_at: { $lte: sevenDaysAgo.toISOString() } }
        ]
      },
      {
        $set: {
          status: 'Delivered',
          delivered_at: new Date()
        }
      }
    );

    const list = await ordersCollection.find({}).sort({ created_at: -1 }).toArray();
    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  try {
    const body = await request.json();
    const { order_id, region } = body;

    if (!order_id || !region) {
      return NextResponse.json(
        { error: 'Missing order_id or region parameter' },
        { status: 400 }
      );
    }

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ordersCollection = db.collection('orders');

    let order = await ordersCollection.findOne({ order_id });
    if (!order && ObjectId.isValid(order_id)) {
      order = await ordersCollection.findOne({ _id: new ObjectId(order_id) });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const addr = (order.shipping_address || '').toLowerCase();
    if (!addr.includes(region.toLowerCase())) {
      return NextResponse.json(
        { error: `Access Denied: You only have access to hold orders in the ${region} region.` },
        { status: 403 }
      );
    }

    await ordersCollection.updateOne(
      { _id: order._id },
      { $set: { status: 'On Hold', held_at: new Date(), held_by_region: region } }
    );

    return NextResponse.json({ success: true, message: `Order ${order_id} put on hold successfully` });
  } catch (error: any) {
    console.error('Error holding order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
