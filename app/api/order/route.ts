import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import productsData from '../../data/products.json';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://omthakur:sxB1fxPqt50ddAT5@cluster0.lv5os6g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Helper to search and match products by query keywords
function findMatchingProducts(query: string): any[] {
  const cleanQuery = query.toLowerCase();
  const words = cleanQuery.split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return [];

  const matches = (productsData as any[]).map(p => {
    let score = 0;
    const nameLower = p.name.toLowerCase();
    const catLower = p.category.toLowerCase();
    const descLower = (p.description || '').toLowerCase();

    // Direct category matches get a high boost
    if (cleanQuery.includes(catLower)) {
      score += 10;
    }

    for (const word of words) {
      if (nameLower.includes(word)) score += 5;
      if (catLower.includes(word)) score += 3;
      if (descLower.includes(word)) score += 1;
    }
    return { product: p, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(item => item.product);

  return matches;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chat, thread_id, user_id, product_name, price, username, shipping_address } = body;

    // Direct UI Checkout Modal handling
    if (user_id && product_name && price) {
      let client: MongoClient | null = null;
      try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db('shopease_db');
        const ordersCollection = db.collection('orders');

        const mockOrderId = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const orderData = {
          order_id: mockOrderId,
          user_id: user_id,
          product_name: product_name,
          price: Number(price),
          status: 'Placed',
          username: username || 'Guest',
          shipping_address: shipping_address || '123 E-Commerce Way, Tech City',
          created_at: new Date()
        };

        const result = await ordersCollection.insertOne(orderData);
        return NextResponse.json({
          _id: result.insertedId.toString(),
          order_id: mockOrderId,
          user_id: user_id,
          product_name: product_name,
          price: Number(price),
          status: 'Placed',
          created_at: orderData.created_at.toISOString()
        });
      } catch (dbErr: any) {
        console.error('Direct checkout insert failed:', dbErr);
        return NextResponse.json({ error: dbErr.message }, { status: 500 });
      } finally {
        if (client) {
          await client.close();
        }
      }
    }

    if (!chat || !thread_id) {
      return NextResponse.json(
        { error: 'Missing chat message or thread_id' },
        { status: 400 }
      );
    }

    const hfApiUrl = process.env.HF_API_URL || 'https://omthakur1394-shopease-self-rag.hf.space/chat';
    const orderUrl = hfApiUrl.replace(/\/chat$/, '/order');

    let hfSuccess = false;
    let hfData: any = null;

    // Try forwarding to the Hugging Face FastAPI /order endpoint
    try {
      const response = await fetch(orderUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat, thread_id }),
      });

      if (response.ok) {
        hfData = await response.json();
        hfSuccess = true;
        console.log("Placed order directly via FastAPI endpoint /order");
      }
    } catch (fetchErr) {
      console.error('HF Order API fetch failed:', fetchErr);
    }

    if (hfSuccess && hfData) {
      return NextResponse.json(hfData);
    }

    // --- OFFLINE FALLBACK ---
    // If the HF space is offline, we parse the user's message locally
    const chatText = chat.toLowerCase();
    const isBuyRequest = chatText.includes('buy') || chatText.includes('order') || chatText.includes('purchase') || chatText.includes('checkout');

    if (isBuyRequest) {
      const matches = findMatchingProducts(chatText);
      let targetProduct = matches[0];

      // Fallback searches if matching list is empty
      if (!targetProduct) {
        if (chatText.includes('tv') || chatText.includes('television') || chatText.includes('vu') || chatText.includes('samsung')) {
          targetProduct = (productsData as any[]).find(p => p.category === 'Electronics' || p.category === 'Monitors');
        } else if (chatText.includes('laptop') || chatText.includes('dell') || chatText.includes('lenovo') || chatText.includes('macbook')) {
          targetProduct = (productsData as any[]).find(p => p.category === 'Laptops');
        } else if (chatText.includes('keyboard') || chatText.includes('mouse') || chatText.includes('mice')) {
          targetProduct = (productsData as any[]).find(p => p.category === 'Keyboards & Mice');
        }
      }

      if (!targetProduct) {
        targetProduct = productsData[0];
      }

      // Save order to MongoDB
      let orderSuccess = false;
      let orderDoc: any = null;
      let client: MongoClient | null = null;

      try {
        client = new MongoClient(MONGO_URI);
        await client.connect();
        const db = client.db('shopease_db');
        const ordersCollection = db.collection('orders');
        
        const mockOrderId = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const orderData = {
          order_id: mockOrderId,
          user_id: thread_id, // Map thread_id as user_id in MongoDB
          product_name: targetProduct.name,
          price: Number(targetProduct.price),
          status: 'Placed',
          username: username || 'Guest',
          shipping_address: shipping_address || '123 E-Commerce Way, Tech City',
          created_at: new Date()
        };
        
        const result = await ordersCollection.insertOne(orderData);
        orderDoc = {
          _id: result.insertedId.toString(),
          order_id: mockOrderId,
          user_id: thread_id,
          product_name: targetProduct.name,
          price: Number(targetProduct.price),
          status: 'Placed',
          username: username || 'Guest',
          shipping_address: shipping_address || '123 E-Commerce Way, Tech City',
          created_at: orderData.created_at.toISOString()
        };
        orderSuccess = true;
      } catch (dbErr) {
        console.error('Failed to save order to MongoDB directly in fallback:', dbErr);
      } finally {
        if (client) {
          await client.close();
        }
      }

      if (orderSuccess && orderDoc) {
        return NextResponse.json({
          res: `Your order for the **${targetProduct.name}** has been successfully placed at a price of ₹${Number(targetProduct.price).toLocaleString('en-IN')}. \n\nOrder ID: ${orderDoc.order_id}. \n\nIf you have any further questions or need assistance, feel free to ask!`
        });
      }
    }

    // Recommendation fallback query check
    const isRecommendationQuery = chatText.includes('recommend') || chatText.includes('suggest') || chatText.includes('show') || chatText.includes('find') || chatText.includes('good') || chatText.includes('best') || chatText.includes('list');

    if (isRecommendationQuery) {
      const matches = findMatchingProducts(chatText);
      if (matches.length > 0) {
        const topMatches = matches.slice(0, 2);
        let categoryName = topMatches[0].category;
        let reply = `Here are two good ${categoryName} options for you:\n\n`;
        topMatches.forEach((p, idx) => {
          reply += `${idx + 1}. **${p.name}**\n`;
          reply += `   - Price: ₹${p.price.toLocaleString('en-IN')}\n`;
          if (p.specs) {
            Object.entries(p.specs).slice(0, 3).forEach(([key, val]) => {
              reply += `   - ${key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}: ${val}\n`;
            });
          }
          reply += `\n`;
        });
        reply += "Would you like to buy one of these?";
        return NextResponse.json({ res: reply });
      }
    }

    // Default static Sales Assistant greeting fallback
    return NextResponse.json({
      res: "I am your Personal Sales Assistant! I can help you find products, give recommendations, or place orders. Try saying: 'Recommend a good Smart TV' or click 'Buy via Chat' on any product to place an order."
    });

  } catch (error: any) {
    console.error('Error in order API route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
