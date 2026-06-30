import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');
  const username = searchParams.get('username');

  if (!userId && !username) {
    return NextResponse.json(
      { error: 'Missing user_id or username query parameter' },
      { status: 400 }
    );
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const walletsCollection = db.collection('wallets');

    let query: any = {};
    if (userId) {
      query.user_id = userId;
    } else if (username) {
      query.username = username;
    }

    let wallet = await walletsCollection.findOne(query);

    if (!wallet) {
      const defaultWallet = {
        user_id: userId || 'Guest',
        username: username || 'Guest',
        balance: 0,
        shipping_address: '123 E-Commerce Way, Tech City',
        updated_at: new Date()
      };
      await walletsCollection.insertOne(defaultWallet);
      wallet = defaultWallet as any;
    }

    return NextResponse.json(wallet);
  } catch (error: any) {
    console.error('Error fetching wallet from MongoDB:', error);
    return NextResponse.json(
      { error: error?.message || 'Database query failure' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
