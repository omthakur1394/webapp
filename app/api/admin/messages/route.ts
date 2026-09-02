import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function GET(request: Request) {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const notesCollection = db.collection('hub_notes');
    const ticketsCollection = db.collection('tickets');

    const notes = await notesCollection.find({}).sort({ created_at: -1 }).toArray();
    const tickets = await ticketsCollection.find({}).sort({ created_at: -1 }).toArray();

    return NextResponse.json({ notes, tickets });
  } catch (error: any) {
    console.error('Error fetching admin messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  try {
    const body = await request.json();
    const { region, note, content, type } = body;

    const messageText = note || content;
    if (!messageText) {
      return NextResponse.json({ error: 'Missing message content' }, { status: 400 });
    }

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const notesCollection = db.collection('hub_notes');

    const doc = {
      region: region || 'General',
      note: messageText,
      content: messageText,
      type: type || 'system_note',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await notesCollection.insertOne(doc);
    return NextResponse.json({ _id: result.insertedId.toString(), ...doc });
  } catch (error: any) {
    console.error('Error creating admin message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function PUT(request: Request) {
  let client: MongoClient | null = null;
  try {
    const body = await request.json();
    const { id, note, content } = body;

    if (!id || (!note && !content)) {
      return NextResponse.json({ error: 'Missing id or updated content' }, { status: 400 });
    }

    const updatedText = note || content;

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const notesCollection = db.collection('hub_notes');

    let queryId: any = id;
    if (ObjectId.isValid(id)) {
      queryId = new ObjectId(id);
    }

    const result = await notesCollection.updateOne(
      { $or: [{ _id: queryId }, { _id: id }] },
      {
        $set: {
          note: updatedText,
          content: updatedText,
          updated_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      // Try updating tickets collection as fallback
      const ticketsCollection = db.collection('tickets');
      await ticketsCollection.updateOne(
        { $or: [{ _id: queryId }, { _id: id }] },
        { $set: { message: updatedText, updated_at: new Date() } }
      );
    }

    return NextResponse.json({ success: true, message: 'Message updated in MongoDB' });
  } catch (error: any) {
    console.error('Error updating admin message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function DELETE(request: Request) {
  let client: MongoClient | null = null;
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing message id parameter' }, { status: 400 });
    }

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const notesCollection = db.collection('hub_notes');

    let queryId: any = id;
    if (ObjectId.isValid(id)) {
      queryId = new ObjectId(id);
    }

    const result = await notesCollection.deleteOne({
      $or: [{ _id: queryId }, { _id: id }]
    });

    if (result.deletedCount === 0) {
      const ticketsCollection = db.collection('tickets');
      await ticketsCollection.deleteOne({
        $or: [{ _id: queryId }, { _id: id }]
      });
    }

    return NextResponse.json({ success: true, message: 'Message deleted from MongoDB' });
  } catch (error: any) {
    console.error('Error deleting admin message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
