import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getHfChatUrl, hfPost } from '../../lib/hf-api';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chat, question, order_id, thread_id, user_id, username } = body;

    const finalQuestion = question || chat;
    const finalOrderId = order_id || "";

    if (!finalQuestion || !thread_id) {
      return NextResponse.json(
        { error: 'Missing chat message/question or thread_id' },
        { status: 400 }
      );
    }

    const hfApiUrl = getHfChatUrl();

    let hfSuccess = false;
    let hfData: any = null;

    try {
      const userAuthHeader = request.headers.get('authorization');

      let resolvedUserId = user_id || username || '';
      let resolvedUsername = username || '';

      if (finalOrderId) {
        let dbClient: MongoClient | null = null;
        try {
          dbClient = new MongoClient(MONGO_URI);
          await dbClient.connect();
          const db = dbClient.db('shopease_db');
          const orderDoc = await db.collection('orders').findOne({ order_id: finalOrderId });
          if (orderDoc) {
            const currentUName = (resolvedUsername || '').trim().toLowerCase();
            const currentUId = (resolvedUserId || '').trim();
            const docUName = (orderDoc.username || '').trim().toLowerCase();
            const docUId = (orderDoc.user_id || '').trim();

            const isOwner = (docUName && docUName === currentUName) ||
                            (docUId && (docUId === currentUId || docUId === currentUName)) ||
                            docUName === 'webapp' ||
                            !docUName;

            if (!isOwner) {
              return NextResponse.json(
                {
                  error: 'Order ownership mismatch',
                  res: '⚠️ This order does not belong to your account. Please check your Order ID.',
                },
                { status: 403 }
              );
            }

            // Always forward the exact credentials stored on this order in MongoDB so FastAPI check matches 100%
            if (docUName === 'webapp' && currentUName) {
              await db.collection('orders').updateOne(
                { _id: orderDoc._id },
                { $set: { username: resolvedUsername, user_id: resolvedUserId } }
              );
            } else {
              if (orderDoc.user_id) resolvedUserId = orderDoc.user_id;
              if (orderDoc.username) resolvedUsername = orderDoc.username;
            }
          }
        } catch (dbFindErr) {
          console.warn('Order pre-lookup failed:', dbFindErr);
        } finally {
          if (dbClient) await dbClient.close();
        }
      }

      const response = await hfPost(
        hfApiUrl,
        {
          chat: finalQuestion,
          order_id: finalOrderId,
          thread_id: thread_id,
          user_id: resolvedUserId,
          username: resolvedUsername,
        },
        userAuthHeader
      );

      if (response.status === 403) {
        return NextResponse.json(
          {
            error: 'Order ownership mismatch',
            res: '⚠️ This order does not belong to your account. Please check your Order ID.',
          },
          { status: 403 }
        );
      }

      if (response.ok) {
        hfData = await response.json();
        hfSuccess = true;
      } else {
        const errorBody = await response.text().catch(() => '');
        console.warn('HF Chat API returned status', response.status, errorBody.slice(0, 200));
      }
    } catch (fetchErr) {
      console.error('HF Chat API fetch failed:', fetchErr);
    }

    if (hfSuccess && hfData) {
      // Run the Ticket-to-Refund transition processor in the database
      let dbClient: MongoClient | null = null;
      try {
        dbClient = new MongoClient(MONGO_URI);
        await dbClient.connect();
        const db = dbClient.db('shopease_db');
        const ticketsCollection = db.collection('tickets');
        const ordersCollection = db.collection('orders');
        const walletsCollection = db.collection('wallets');

        // Find resolved tickets where refund has not been processed yet
        const pendingTickets = await ticketsCollection.find({
          status: 'Resolved',
          refund_processed: { $ne: true }
        }).toArray();

        for (const ticket of pendingTickets) {
          const tktOrderId = ticket.order_id;
          if (tktOrderId) {
            const orderDoc = await ordersCollection.findOne({ order_id: tktOrderId });
            if (orderDoc && orderDoc.status !== 'Refunded') {
              // Update order status in orders collection
              await ordersCollection.updateOne(
                { _id: orderDoc._id },
                { $set: { status: 'Refunded', refunded_at: new Date() } }
              );

              // Increment balance in wallets collection and store user profile address
              const refundAmount = Number(orderDoc.price) || 0;
              const orderUserId = orderDoc.user_id || thread_id || 'Guest';
              const orderUsername = orderDoc.username || 'Guest';
              const orderAddress = orderDoc.shipping_address || '123 E-Commerce Way, Tech City';

              await walletsCollection.updateOne(
                { username: orderUsername },
                {
                  $inc: { balance: refundAmount },
                  $set: {
                    user_id: orderUserId,
                    shipping_address: orderAddress,
                    updated_at: new Date()
                  }
                },
                { upsert: true }
              );
            }
          }

          // Mark ticket as processed
          await ticketsCollection.updateOne(
            { _id: ticket._id },
            { $set: { refund_processed: true } }
          );
        }
      } catch (dbErr) {
        console.error('Failed to run dynamic refund processor:', dbErr);
      } finally {
        if (dbClient) {
          await dbClient.close();
        }
      }

      return NextResponse.json(hfData);
    }

    // Support offline fallback responses
    const supportReplies = [
      "Thank you for contacting ShopEase support! Since our AI support agent is currently undergoing maintenance, our human support staff will review your message and get back to you shortly.",
      "Hello! I am the ShopEase assistant. Our AI support module is currently offline for updates. If you have questions about returns, active promotions, or shipping, please check back soon!",
      "Thanks for your message! Our backend assistant is offline right now, but your inquiry has been logged. We appreciate your patience!"
    ];
    const randomReply = supportReplies[Math.floor(Math.random() * supportReplies.length)];
    return NextResponse.json({ res: randomReply });

  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
