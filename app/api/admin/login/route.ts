import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

const DEFAULT_ADMINS = [
  {
    username: 'superadmin',
    password: 'Admin@Super2025',
    region: 'Super',
    role: 'superadmin',
    name: 'Super Administrator'
  },
  {
    username: 'mumbai_admin',
    password: 'Mumbai@Hub2025',
    region: 'Mumbai',
    role: 'hub_admin',
    name: 'Mumbai Hub Lead'
  },
  {
    username: 'nagpur_admin',
    password: 'Nagpur@Hub2025',
    region: 'Nagpur',
    role: 'hub_admin',
    name: 'Nagpur Hub Lead'
  }
];

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const adminsCollection = db.collection('admins');

    const totalAdmins = await adminsCollection.countDocuments();
    if (totalAdmins === 0) {
      await adminsCollection.insertMany(DEFAULT_ADMINS.map(a => ({ ...a, created_at: new Date() })));
    }

    const trimmedPassword = password.trim();
    const trimmedUsername = (username || '').trim().toLowerCase();

    let admin: any = null;

    if (trimmedUsername) {
      admin = await adminsCollection.findOne({
        username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') },
        password: trimmedPassword
      });
    }

    if (!admin) {
      admin = await adminsCollection.findOne({ password: trimmedPassword });
    }

    if (!admin) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    await adminsCollection.updateOne(
      { _id: admin._id },
      { $set: { last_login: new Date() } }
    );

    return NextResponse.json({
      success: true,
      username: admin.username,
      name: admin.name || admin.username,
      region: admin.region,
      role: admin.role,
      token: `admin-${admin.region.toLowerCase()}-${admin.username}-session`
    });
  } catch (err: any) {
    console.error('Error logging in admin from MongoDB:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
