import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || '';

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

    // Automatically progress active orders based on elapsed time:
    // 1. > 7 days -> 'Delivered' (automatically delivered to user in 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await ordersCollection.updateMany(
      {
        status: { $in: ['Placed', 'Dispatched', 'Out for Delivery'] },
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

    // 2. > 6 days -> 'Out for Delivery' (same day delivery before day 7)
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    await ordersCollection.updateMany(
      {
        status: { $in: ['Placed', 'Dispatched'] },
        $or: [
          { created_at: { $lte: sixDaysAgo } },
          { created_at: { $lte: sixDaysAgo.toISOString() } }
        ]
      },
      {
        $set: {
          status: 'Out for Delivery',
          out_for_delivery_at: new Date()
        }
      }
    );

    // 3. > 2 days -> 'Dispatched' (package leaves warehouse)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await ordersCollection.updateMany(
      {
        status: 'Placed',
        $or: [
          { created_at: { $lte: twoDaysAgo } },
          { created_at: { $lte: twoDaysAgo.toISOString() } }
        ]
      },
      {
        $set: {
          status: 'Dispatched',
          dispatched_at: new Date()
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
