import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chat, question, order_id, thread_id } = body;

    const finalQuestion = question || chat;
    const finalOrderId = order_id || "";

    if (!finalQuestion || !thread_id) {
      return NextResponse.json(
        { error: 'Missing chat message/question or thread_id' },
        { status: 400 }
      );
    }

    const hfApiUrl = process.env.HF_API_URL || 'https://omthakur1394-shopease-self-rag.hf.space/chat';

    let hfSuccess = false;
    let hfData: any = null;

    try {
      // Forward the new schema to FastAPI
      const response = await fetch(hfApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat: finalQuestion,
          order_id: finalOrderId,
          thread_id: thread_id
        }),
      });

      if (response.ok) {
        hfData = await response.json();
        hfSuccess = true;
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
