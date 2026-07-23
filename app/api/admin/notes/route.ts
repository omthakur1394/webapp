import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');

  if (!region) {
    return NextResponse.json({ error: 'Missing region parameter' }, { status: 400 });
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const notesCollection = db.collection('hub_notes');

    const list = await notesCollection.find({ region }).sort({ created_at: -1 }).toArray();
    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching hub notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  try {
    const body = await request.json();
    const { region, note } = body;

    if (!region || !note) {
      return NextResponse.json({ error: 'Missing region or note parameters' }, { status: 400 });
    }

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const notesCollection = db.collection('hub_notes');

    const doc = {
      region,
      note,
      created_at: new Date()
    };

    const result = await notesCollection.insertOne(doc);
    return NextResponse.json({ _id: result.insertedId.toString(), ...doc });
  } catch (error: any) {
    console.error('Error saving hub note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
