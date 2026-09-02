import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function GET(request: Request) {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ordersCollection = db.collection('orders');

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

    const list = await ordersCollection.find({}).sort({ created_at: -1 }).toArray();
    return NextResponse.json(list);
  } catch (error: any) {
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function POST(request: Request) {
  let client: MongoClient | null = null;
  try {
    const body = await request.json();
    const { order_id, region, action, admin_note } = body;

    if (!order_id || !region) {
      return NextResponse.json(
        { error: 'Missing order_id or region parameter' },
        { status: 400 }
      );
    }

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ordersCollection = db.collection('orders');

    let order = await ordersCollection.findOne({ order_id });
    if (!order && ObjectId.isValid(order_id)) {
      order = await ordersCollection.findOne({ _id: new ObjectId(order_id) });
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const addr = (order.shipping_address || '').toLowerCase();
    const hubRegion = (order.hub_region || '').toLowerCase();
    const regionLower = region.toLowerCase();

    const regionMatchesAddress = addr.includes(regionLower);
    const regionMatchesHub = hubRegion.includes(regionLower);

    if (!regionMatchesAddress && !regionMatchesHub && region !== 'Super') {
      return NextResponse.json(
        { error: `Access Denied: You only have permission for orders in the ${region} region.` },
        { status: 403 }
      );
    }

    const updateFields: any = {
      updated_at: new Date(),
      last_modified_by: region
    };

    let targetStatus = order.status;
    let message = '';

    if (action === 'pause') {
      targetStatus = 'Paused';
      updateFields.status = 'Paused';
      updateFields.paused_at = new Date();
      updateFields.paused_by_region = region;
      message = `Order ${order_id} has been paused.`;
    } else if (action === 'resume') {
      targetStatus = 'Placed';
      updateFields.status = 'Placed';
      updateFields.resumed_at = new Date();
      updateFields.resumed_by_region = region;
      message = `Order ${order_id} has been resumed.`;
    } else if (action === 'hold') {
      targetStatus = 'On Hold';
      updateFields.status = 'On Hold';
      updateFields.held_at = new Date();
      updateFields.held_by_region = region;
      message = `Order ${order_id} put on hold successfully.`;
    }

    if (admin_note) {
      updateFields.admin_note = admin_note;
      updateFields.admin_note_at = new Date();
    }

    await ordersCollection.updateOne(
      { _id: order._id },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      status: targetStatus,
      message: message || `Order ${order_id} updated successfully`
    });
  } catch (error: any) {
    console.error('Error updating admin order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
