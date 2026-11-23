import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || '';

export async function GET(request: Request) {
  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ordersCollection = db.collection('orders');

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

    if (order.status === 'Delivered') {
      return NextResponse.json(
        { error: 'Cannot modify order: This order has already been delivered and is finalized.' },
        { status: 400 }
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
      updateFields.admin_note = '';
      message = `Order ${order_id} has been resumed.`;
    } else if (action === 'hold') {
      targetStatus = 'On Hold';
      updateFields.status = 'On Hold';
      updateFields.held_at = new Date();
      updateFields.held_by_region = region;
      message = `Order ${order_id} put on hold successfully.`;
    } else if (action === 'status') {
      const allowed = ['Placed', 'Dispatched', 'Out for Delivery', 'Delivered'];
      const newStatus = body.status || body.new_status;
      if (allowed.includes(newStatus)) {
        targetStatus = newStatus;
        updateFields.status = newStatus;
        if (newStatus === 'Delivered') updateFields.delivered_at = new Date();
        if (newStatus === 'Dispatched') updateFields.dispatched_at = new Date();
        if (newStatus === 'Out for Delivery') updateFields.out_for_delivery_at = new Date();
        message = `Order ${order_id} status updated to ${newStatus}.`;
      } else {
        return NextResponse.json({ error: `Invalid status: ${newStatus}` }, { status: 400 });
      }
    } else if (action === 'note') {
      message = `System note updated for order ${order_id}.`;
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
