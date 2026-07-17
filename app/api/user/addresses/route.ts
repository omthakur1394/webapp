import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

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
    const addressesCollection = db.collection('addresses');

    const query: any = {};
    if (userId) query.user_id = userId;
    else if (username) query.username = username;

    const list = await addressesCollection.find(query).sort({ is_default: -1, created_at: -1 }).toArray();
    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  try {
    const body = await request.json();
    const { address_id, user_id, username, address_line, city, postal_code, is_default } = body;

    if (!user_id || !username || !address_line || !city || !postal_code) {
      return NextResponse.json(
        { error: 'Missing required address fields' },
        { status: 400 }
      );
    }

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const addressesCollection = db.collection('addresses');

    if (is_default) {
      await addressesCollection.updateMany(
        { user_id },
        { $set: { is_default: false } }
      );
    }

    if (address_id && ObjectId.isValid(address_id)) {
      await addressesCollection.updateOne(
        { _id: new ObjectId(address_id) },
        {
          $set: {
            address_line,
            city,
            postal_code,
            is_default: !!is_default,
            updated_at: new Date()
          }
        }
      );
      return NextResponse.json({ message: 'Address updated successfully' });
    } else {
      const doc = {
        user_id,
        username,
        address_line,
        city,
        postal_code,
        is_default: !!is_default,
        created_at: new Date()
      };
      const result = await addressesCollection.insertOne(doc);
      return NextResponse.json({ _id: result.insertedId.toString(), ...doc });
    }
  } catch (error: any) {
    console.error('Error saving address:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const addressId = searchParams.get('address_id');

  if (!addressId || !ObjectId.isValid(addressId)) {
    return NextResponse.json(
      { error: 'Missing or invalid address_id parameter' },
      { status: 400 }
    );
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const addressesCollection = db.collection('addresses');

    const result = await addressesCollection.deleteOne({ _id: new ObjectId(addressId) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
