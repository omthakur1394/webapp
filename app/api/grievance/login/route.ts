import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const officersCollection = db.collection('grievance_officers');

    // Query officer strictly from MongoDB database
    const officer = await officersCollection.findOne({
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') },
      password: trimmedPassword
    });

    if (!officer) {
      return NextResponse.json(
        { error: 'Invalid credentials or unauthorized grievance account' },
        { status: 401 }
      );
    }

    // Update last login timestamp in database
    await officersCollection.updateOne(
      { _id: officer._id },
      { $set: { last_login: new Date() } }
    );

    return NextResponse.json({
      success: true,
      user: {
        name: officer.name,
        email: officer.email,
        role: officer.role,
        level: officer.level,
        badgeColor: officer.badgeColor || 'indigo'
      }
    });
  } catch (err: any) {
    console.error('Error logging in grievance officer from MongoDB:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
