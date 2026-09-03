import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedLevel = parseInt(searchParams.get('level') || '0', 10);

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ticketsCollection = db.collection('tickets');
    const ordersCollection = db.collection('orders');

    let ticketQuery: any = {};
    let orderQuery: any = {};

    if (requestedLevel === 1) {
      ticketQuery = {
        $or: [
          { escalation_level: 1 },
          { escalation_level: { $exists: false } },
          { escalation_level: null }
        ]
      };
      orderQuery = {
        $or: [
          { status: 'On Hold' },
          { escalation_level: 1 },
          { admin_note: { $exists: true, $ne: '' }, escalation_level: { $exists: false } }
        ]
      };
    } else if (requestedLevel === 2) {
      ticketQuery = { escalation_level: 2 };
      orderQuery = {
        $or: [
          { status: 'Paused' },
          { escalation_level: 2 }
        ]
      };
    } else if (requestedLevel === 3) {
      ticketQuery = { escalation_level: 3 };
      orderQuery = {
        $or: [
          { status: 'Security Hold' },
          { escalation_level: 3 }
        ]
      };
    } else if (requestedLevel === 4) {
      ticketQuery = { escalation_level: 4 };
      orderQuery = { escalation_level: 4 };
    }

    const tickets = await ticketsCollection.find(ticketQuery).sort({ created_at: -1 }).toArray();
    const pausedOrders = await ordersCollection.find(orderQuery).sort({ created_at: -1 }).toArray();

    return NextResponse.json({ tickets, pausedOrders });
  } catch (error: any) {
    console.error('Error fetching grievance tickets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}

export async function PUT(request: Request) {
  let client: MongoClient | null = null;
  try {
    const body = await request.json();
    const { ticket_id, order_id, status, level, officer_note, officer_email } = body;

    client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db('shopease_db');
    const ticketsCollection = db.collection('tickets');
    const ordersCollection = db.collection('orders');
    const walletsCollection = db.collection('wallets');

    const updateFields: any = {
      updated_at: new Date(),
      last_handled_by: officer_email
    };

    if (status) updateFields.status = status;
    if (level) updateFields.escalation_level = level;
    if (officer_note) {
      updateFields.officer_response = officer_note;
      updateFields.officer_response_at = new Date();
    }

    if (ticket_id) {
      let queryId: any = ticket_id;
      if (ObjectId.isValid(ticket_id)) queryId = new ObjectId(ticket_id);
      await ticketsCollection.updateOne(
        { $or: [{ _id: queryId }, { _id: ticket_id }] },
        { $set: updateFields }
      );
    }

    if (order_id) {
      const orderDoc = await ordersCollection.findOne({ order_id });
      if (orderDoc) {
        const orderUpdate: any = {
          last_grievance_update: new Date(),
          last_officer: officer_email
        };
        if (level) orderUpdate.escalation_level = level;
        if (status === 'Refunded') {
          orderUpdate.status = 'Refunded';
          orderUpdate.refunded_at = new Date();

          // Credit customer wallet
          const refundAmount = Number(orderDoc.price) || 0;
          const orderUsername = orderDoc.username || 'Guest';
          await walletsCollection.updateOne(
            { username: orderUsername },
            { $inc: { balance: refundAmount }, $set: { updated_at: new Date() } },
            { upsert: true }
          );
        } else if (status === 'Resolved') {
          orderUpdate.status = 'Resolved';
        } else if (status === 'Rejected') {
          orderUpdate.status = 'Rejected';
        } else if (status === 'Replaced' || status === 'Replacement Order Placed') {
          orderUpdate.status = 'Replacement Order Placed';
          orderUpdate.replacement_dispatched_at = new Date();
        } else if (status) {
          orderUpdate.status = status;
        }

        if (officer_note) {
          orderUpdate.admin_note = officer_note;
        }

        await ordersCollection.updateOne(
          { _id: orderDoc._id },
          { $set: orderUpdate }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Grievance ticket ${ticket_id || order_id} updated successfully`
    });
  } catch (error: any) {
    console.error('Error updating grievance ticket:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}
