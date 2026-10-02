# Product Specification Document (PRD) — ShopEase

**Project Name:** ShopEase  
**Application Type:** Next.js 16 Full-Stack E-Commerce & AI Customer Support Platform  
**Target Environment:** Local Dev (`http://localhost:3000`) & Production  

---

## 1. Executive Summary & Purpose

ShopEase is an enterprise-grade e-commerce storefront and customer support platform integrated with an Agentic Self-RAG (Retrieval-Augmented Generation) AI pipeline and multilingual voice phone support. The application enables customers to browse products, place orders routed through regional fulfillment hubs (Mumbai Hub & Nagpur Hub), manage orders and wallets, and interact with an AI support agent through text chat or a 100% hands-free voice call.

Additionally, the platform includes a regional logistics management administrative portal (`/admin`) and a customer grievance management portal (`/grievance`).

---

## 2. Test Account Credentials

| Role | Username / Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Customer (Standard)** | `use123` or `testuser@shopease.com` | `Password123` | Storefront, Cart, Orders, Support Chat, Voice Call |
| **Mumbai Hub Admin** | `mumbai_admin` | `Mumbai@Hub2025` | `/admin` portal (Mumbai Hub regional fulfillment orders only) |
| **Nagpur Hub Admin** | `nagpur_admin` | `Nagpur@Hub2025` | `/admin` portal (Nagpur Hub regional fulfillment orders only) |
| **Super Administrator** | `superadmin` | `Admin@Super2025` | Global admin access across all fulfillment hubs |

---

## 3. Core Pages & Routes

1. **Storefront & Catalog Grid** (`/`):
   - Hero showcase with categorized product filtering (All, Electronics, Audio, Wearables, etc.).
   - Price range filters (preset pills like *Under ₹2,000*, *₹2k-5k*, etc., plus custom min/max range).
   - Product cards featuring images, pricing, technical specifications table, "Add to Cart", and "Buy Now".
   - Floating chat trigger for opening the drawer assistant.

2. **Customer Authentication Modal** (`/`):
   - Tabbed glassmorphic modal with **Sign In** and **Sign Up**.
   - Input validation (username, email, password with toggle show/hide).
   - JWT session issuance stored securely in browser state/cookies.

3. **Checkout & Order Placement Modal** (`/`):
   - Triggered by clicking **Buy Now** on any product.
   - Hub selection dropdown: `Mumbai Hub` or `Nagpur Hub`.
   - Shipping address input with auto-fill from saved user addresses.
   - Order confirmation with generated order ID (format: `ORD-XXXXXXXX`).

4. **Interactive Support Chat Drawer** (`/`):
   - Multi-session chat management (new session, rename, delete, switch).
   - Integrated quick order selector showing top 5 recent orders.
   - Text input with Web Speech API dictation and Sarvam AI text-to-speech replay.
   - Connects to `/api/chat` for Self-RAG document retrieval and verified citations.

5. **Pure Hands-Free Voice Support Call** (`/` -> Voice Support Tab):
   - Order Verification Gate: requires valid customer `order_id` (auto-selectable from recent orders).
   - Continuous 2-way phone support call simulation powered by Sarvam AI (`saaras:v3`).
   - **Automatic Voice Activity Detection (VAD)**: pauses of 1.5 seconds automatically stop recording and send the query.
   - **Automatic Turn-Taking**: when assistant finishes speaking audio response, mic automatically resumes listening.
   - **Echo Prevention**: mic auto-mutes while assistant is playing audio.
   - **Interrupt Capability**: tapping the central orb interrupts assistant speech immediately.
   - Language selector: English (`en-IN`), Hindi (`hi-IN`), Marathi (`mr-IN`).
   - Clean hang up with **End Call** button releasing all microphone tracks and audio contexts.

6. **Logistics & Admin Portal** (`/admin`):
   - Secure login form requiring admin credentials.
   - Scoped order view: regional filtering for Mumbai vs Nagpur vs All orders.
   - Order status management: `Placed`, `In Transit`, `Out for Delivery`, `Delivered`, `Paused`, `On Hold`.
   - Hub operational delay bottleneck logging with manager notes.

7. **Customer Grievance Portal** (`/grievance`):
   - Dedicated dispute and ticket filing for delayed or damaged packages.
   - Real-time ticket status tracking and resolution notes.

---

## 4. Key Functional Workflows & Acceptance Criteria

### Workflow 1: User Sign In & Catalog Browsing
- **Step 1:** User opens `http://localhost:3000`.
- **Step 2:** User clicks "Sign In" in top navigation bar.
- **Step 3:** Enter username `use123` and password `Password123`.
- **Expected:** Modal closes, navbar updates to show user avatar, wallet balance (₹10,000), and past orders.

### Workflow 2: Product Filtering & Checkout
- **Step 1:** Filter catalog by clicking price preset or typing in search.
- **Step 2:** Click **Buy Now** on a product card.
- **Step 3:** Select "Mumbai Hub" as the fulfillment center and enter shipping address.
- **Step 4:** Submit order.
- **Expected:** Order confirmation modal displays new Order ID (`ORD-XXXXXXXX`) and reflects in Recent Orders list.

### Workflow 3: AI Customer Support Chat
- **Step 1:** Open Support Chat drawer or navigate to Support Chat.
- **Step 2:** Select the newly placed order from recent order pills or type `Where is my order ORD-XXXXXXXX?`.
- **Step 3:** Send query.
- **Expected:** Assistant responds with live tracking status, estimated delivery dates, and policy details without hallucinations.

### Workflow 4: Hands-Free Voice Support Call
- **Step 1:** Click **Voice Support** tab in navigation.
- **Step 2:** Select an order from Top 5 Recent Orders list and click **Start Voice Call**.
- **Step 3:** Assistant plays welcome audio: *"Hello! Welcome to ShopEase Voice Support..."*.
- **Step 4:** As soon as welcome audio completes, microphone automatically turns green (*"Listening… Speak naturally"*).
- **Step 5:** User speaks *"What is the status of my shipment?"* and pauses for 1.5 seconds.
- **Expected:** System detects pause, sends audio to Sarvam STT, fetches response, and speaks answer aloud.
- **Step 6:** Click **End Call**. Browser microphone hardware indicator immediately turns off.

### Workflow 5: Admin Fulfillment Hub Order Management
- **Step 1:** Navigate to `http://localhost:3000/admin`.
- **Step 2:** Login with `mumbai_admin` / `Mumbai@Hub2025`.
- **Step 3:** Verify only Mumbai Hub orders are editable; Nagpur orders are restricted or read-only.
- **Step 4:** Update an order status to `In Transit` and add a delay note.
- **Expected:** Status updates successfully in database and reflects immediately across customer tracking.

---

## 5. Technical Specifications

- **Frontend:** Next.js 16.2.7 (Turbopack, App Router, React 19 Client/Server Components)
- **Styling:** Tailwind CSS v4 with unified Light/Dark glassmorphic themes
- **Database:** MongoDB Atlas (`shopease_db` database, `orders`, `users`, `admins`, `tickets` collections)
- **Speech & Audio Services:** 
  - Sarvam AI Speech-to-Text (`/api/sarvam/stt` with `saaras:v3`)
  - Sarvam AI Text-to-Speech (`/api/sarvam/tts` with Indian accents: English, Hindi, Marathi)
  - Browser Web Speech API & Web Audio API `AudioContext` with `AnalyserNode`
- **Security & Authorization:** Stateless JWT (HS256) bearer token cross-service authentication.
