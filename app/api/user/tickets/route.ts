import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const username = searchParams.get('username');

  if (!email && !username) {
    return NextResponse.json({ error: 'Missing user credentials parameter' }, { status: 400 });
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ticketsCollection = db.collection('tickets');
    const ordersCollection = db.collection('orders');

    // Query tickets by email, username, or thread_id
    const userQuery: any[] = [];
    if (email) userQuery.push({ email: { $regex: new RegExp(email, 'i') } });
    if (username) userQuery.push({ username: { $regex: new RegExp(username, 'i') } }, { customer: { $regex: new RegExp(username, 'i') } });

    const tickets = await ticketsCollection.find({
      $or: userQuery.length > 0 ? userQuery : [{ username }]
    }).sort({ created_at: -1 }).toArray();

    // Query user orders with grievances / notes / paused status
    const orderQuery: any[] = [];
    if (email) orderQuery.push({ email });
    if (username) orderQuery.push({ username });

    const grievances = await ordersCollection.find({
      $and: [
        { $or: orderQuery.length > 0 ? orderQuery : [{ username }] },
        {
          $or: [
            { status: 'Paused' },
            { status: 'On Hold' },
            { status: 'Refunded' },
            { admin_note: { $exists: true, $ne: '' } }
          ]
        }
      ]
    }).sort({ created_at: -1 }).toArray();

    return NextResponse.json({ tickets, grievances });
  } catch (error: any) {
    console.error('Error fetching user grievance tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
