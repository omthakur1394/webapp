# PROJECT SYNOPSIS

---

### **G H RAISONI UNIVERSITY, AMRAVATI**
#### **SCHOOL OF ENGINEERING & TECHNOLOGY**
##### **Department of Computer Science & Engineering**

---

## **1. Title of the Project**
**ShopEase Support AI: AI-Driven E-Commerce Customer Support System with Self-RAG Architecture and Automated Ticket-Refund Workflows**

---

## **2. Abstract**
Modern e-commerce platforms struggle with high customer support volumes, prolonged resolution times, and inefficient manual ticket-to-refund processing. **ShopEase Support AI** is an intelligent, full-stack customer assistant system engineered to deliver context-aware support and automated workflow resolution. Built using **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **MongoDB**, and **Hugging Face / Self-RAG AI services**, the system integrates advanced Retrieval-Augmented Generation (RAG) with real-time transactional databases. 

The primary objective is to automate multi-session customer inquiries regarding order status, product sizing, delivery policies, and returns while maintaining enterprise-grade security via **JWT Authentication** and **Bcrypt hashing**. The methodology includes a dual-tiered architecture: an interactive frontend featuring **Web Speech API dictation** and **multi-session state management**, coupled with a backend pipeline that dynamically triggers automated wallet credit updates upon ticket resolution. Expected outcomes include a reduction in customer response latency by over 80%, error-free order refund processing, and a scalable web application for modern e-commerce enterprises.

---

## **3. Introduction**

### **Background of the Problem**
With the exponential growth of online shopping, e-commerce retailers face an overwhelming volume of customer inquiries daily. Traditional customer support relies heavily on human agents or basic decision-tree chatbots. Human support creates operational bottlenecks and high overhead costs, while rule-based chatbots struggle with ambiguous language, contextual understanding, and multi-turn conversations.

### **Motivation for Choosing the Topic**
The recent emergence of Large Language Models (LLMs) combined with Retrieval-Augmented Generation (RAG) opens new possibilities for conversational AI. However, standard LLMs often hallucinate policies or lack real-time integration with backend transaction databases. This project was motivated by the need for an intelligent system that not only understands complex natural language inquiries through **Self-RAG** but also executes real-time database actions (e.g., verifying order statuses and processing refunds directly into user wallets).

### **Scope and Significance**
- **Scope**: Covers end-to-end user authentication, multi-thread session management, real-time voice speech-to-text dictation, intelligent policy retrieval, order tracking, admin monitoring, and automated refund fulfillment.
- **Significance**: Minimizes human agent burden, eliminates manual data-entry errors during refund cycles, and offers customers 24/7 instant resolution.

### **Real-Life Application**
ShopEase Support AI can be deployed directly into small-to-enterprise e-commerce platforms, retail portals, and service desk environments as an autonomous customer support co-pilot.

---

## **4. Objectives of the Project**
1. **Automate Customer Support**: Provide immediate, multi-turn AI answers for order status, sizing, shipping, and store policies using Self-RAG architecture.
2. **Real-Time Data Integration**: Connect conversational AI with MongoDB transactional databases to query real-time order history and user profiles.
3. **Automate Ticket-to-Refund Processing**: Dynamically monitor support tickets and update order statuses to *Refunded* while automatically crediting user digital wallets upon ticket resolution.
4. **Deliver a Modern, Accessible Interface**: Implement a responsive web UI featuring dark/light themes, multi-session management, and hands-free **Web Speech API** voice input.
5. **Role-Based Security & Management**: Provide secure JWT authentication and dedicated admin endpoints for ticket management, user role control, and database administration.

---

## **5. Problem Statement**
"Conventional e-commerce customer support systems suffer from long response latencies, high operational costs, and static rule-based chatbots that fail to handle complex context or execute backend transactional actions. Furthermore, manual verification of return tickets and refund processing leads to delayed resolution times and human error. There is a critical need for an integrated, AI-driven support platform capable of intelligent policy retrieval, real-time order database lookup, and automated ticket-to-refund processing within a secure, responsive web environment."

---

## **6. Literature Review / Existing System**

### **Existing Solutions & Similar Systems**
1. **Traditional Rule-Based Chatbots**: Standard chatbots operating on keyword matching and fixed decision trees (e.g., basic FAQ bots).
2. **Generic LLM Wrappers**: Commercial AI chatbots connected directly to LLM APIs without grounding in store-specific vector embeddings or transaction databases.
3. **Manual Helpdesk Systems**: Ticketing platforms (e.g., Zendesk, Freshdesk) requiring manual agent triage for every query and manual bank/wallet transfer verification.

### **Limitations & Gaps**
- **Inflexibility**: Rule-based systems fail when queries deviate from exact keywords.
- **Hallucination Risk**: Generic LLMs synthesize incorrect store policies or fake order details due to lack of ground-truth data connection.
- **Disconnected Workflows**: Existing bots answer queries but cannot modify database states (such as initiating refunds or updating order statuses).

### **Why ShopEase Support AI is an Improvement**
- **Self-RAG Grounding**: Combines vector retrieval with self-correction mechanisms to ensure accurate policy answers.
- **Active Backend Automation**: Automatically handles ticket-to-refund status changes and wallet balance updates directly in MongoDB.
- **Rich Multi-Modal Frontend**: Offers session management, voice dictation, inline history editing, and full dark/light mode responsiveness.

---

## **7. Proposed System**

### **System Description**
The proposed **ShopEase Support AI** system is a full-stack web platform built on **Next.js 16 (App Router)** and **MongoDB**. The user interacts through a modern React frontend capable of voice input and multi-session tracking. When a query is submitted, the backend routes the request through a proxy handler to a specialized **Hugging Face / Self-RAG** inference engine. Simultaneously, a dynamic database processor monitors resolved support tickets and executes refund transactions seamlessly.

### **Key Components**
1. **Frontend Presentation Layer**: Next.js 16 + React 19 Client UI with Tailwind CSS v4, Lucide React icons, Web Speech API integration, and responsive layout modes (Desktop Expanded, Compact Rail, Mobile Drawer).
2. **API Proxy & Security Gateway**: Serverless route handlers in Next.js enforcing JWT token authentication, input validation, and secure communication with external HF spaces.
3. **Self-RAG Inference Engine**: Machine learning backend utilizing vector embeddings and LLM reasoning to evaluate context relevance before generating answers.
4. **Database & Workflow Automation Module**: MongoDB Atlas cluster storing `users`, `orders`, `tickets`, and `wallets`, driven by an automatic refund engine.

### **How it Solves the Problem Better**
It replaces manual support triage with instant, ground-truth AI responses while closing the loop on support requests through automated database mutations (status update + wallet credit).

---

## **8. Methodology / Technologies to be Used**

### **Technology Stack**
- **Frontend Framework**: Next.js 16.2 (App Router), React 19.2
- **Styling & UI**: Tailwind CSS v4, Lucide React Icons, React Markdown
- **Languages**: TypeScript, JavaScript (Node.js)
- **Database**: MongoDB Atlas (`mongodb` driver v7.3), Supabase Client (`@supabase/supabase-js`)
- **Authentication & Security**: JSON Web Tokens (`jsonwebtoken`), Bcrypt password hashing (`bcryptjs`)
- **Artificial Intelligence / ML**: Self-RAG architecture, Hugging Face AI microservice endpoints
- **Browser APIs**: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) for voice-to-text dictation
- **DevOps & Containerization**: Docker, Node.js runtime environment

---

## **9. Modules Description**

1. **User Authentication & Authorization Module**
   - Handles user registration, login, JWT token issuance, and password encryption using Bcrypt.
   - Manages role-based access control (Customer vs. Administrator).

2. **Multi-Session Chat & Voice UI Module**
   - Provides multi-thread conversation history management (create, rename, search, delete).
   - Features Web Speech API dictation for hands-free text input and real-time streaming visualization.
   - Implements dynamic theme switching (Dark/Light mode) and responsive drawer layouts.

3. **Self-RAG Conversational AI Module**
   - Connects to Hugging Face AI backend spaces using secure proxy routes (`app/api/chat/route.ts`).
   - Evaluates retrieved knowledge vectors against user queries to supply accurate e-commerce policy information.

4. **Order Lookup & Tracking Module**
   - Enables users to check real-time order status, shipping details, and items by passing `order_id` parameters into chat or dedicated order routes (`app/api/order/route.ts`).

5. **Automated Ticket & Refund Processor Module**
   - Scans MongoDB `tickets` collection for resolved customer inquiries.
   - Updates corresponding order statuses to *Refunded* and atomically increments user wallet balances in the `wallets` collection.

6. **Admin & Monitoring Module**
   - Dashboard interface for platform administrators to review active sessions, inspect ticket queues, and manage store data.

---

## **10. Expected Outcomes**

### **Functional Outcomes**
- **Context-Aware Assistance**: Instant, high-accuracy conversational answers to customer inquiries.
- **Voice Dictation**: Seamless conversion of spoken user input into text query fields.
- **Automated Refund Cycle**: Zero-touch wallet credit and order status synchronization upon ticket resolution.
- **Multi-Session Persistence**: Ability for users to save, rename, and review historical support interactions.

### **Non-Functional Outcomes**
- **Performance**: Sub-second API response time for cached/retrieved queries and immediate UI state feedback.
- **Security**: Robust protection of user credentials and API endpoints via JWT tokens and encrypted database channels.
- **Scalability**: Decoupled serverless architecture ready for deployment on Vercel/Docker containers.
- **Usability & Accessibility**: Modern, intuitive UI adhering to dark/light mode standards and responsive mobile viewports.
