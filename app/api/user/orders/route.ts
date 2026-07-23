import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const username = searchParams.get('username');

  if (!userId && !username) {
    return NextResponse.json(
      { error: 'Missing user_id or username parameter' },
      { status: 400 }
    );
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ordersCollection = db.collection('orders');

    const query: any = {
      $or: []
    };
    if (userId) query.$or.push({ user_id: userId });
    if (username) query.$or.push({ username: username });

    if (query.$or.length === 0) {
      return NextResponse.json([]);
    }

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

    const list = await ordersCollection.find(query).sort({ created_at: -1 }).toArray();
    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
