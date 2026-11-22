import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || '';

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

    // Query tickets by email, username, or customer
    const userQuery: any[] = [];
    if (email) userQuery.push({ email: { $regex: new RegExp(email, 'i') } });
    if (username) userQuery.push({ username: { $regex: new RegExp(username, 'i') } }, { customer: { $regex: new RegExp(username, 'i') } });

    const tickets = await ticketsCollection.find({
      $or: userQuery.length > 0 ? userQuery : [{ username }]
    }).sort({ created_at: -1 }).toArray();

    // Only return genuine tickets from the tickets collection
    return NextResponse.json({ tickets, grievances: [] });
  } catch (error: any) {
    console.error('Error fetching user grievance tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
