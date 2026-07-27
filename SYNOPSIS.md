# G H RAISONI UNIVERSITY, AMRAVATI
## SCHOOL OF ENGINEERING & TECHNOLOGY
### Department of Computer Science & Engineering

---

# PROJECT SYNOPSIS

---

## 1. Title of the Project
**ShopEase: An Agentic Self-RAG AI-Powered E-Commerce Platform with Regional Logistics & Autonomous Order Fulfillment**

---

## 2. Abstract
Modern e-commerce platforms struggle with high customer support costs, slow inquiry response times, and inefficient regional order distribution. Standard Artificial Intelligence (AI) chatbots often generate inaccurate information (hallucinations) regarding store policies, refunds, and order tracking. 

To overcome these challenges, **ShopEase** introduces an intelligent e-commerce ecosystem integrating a **Self-Reflective Retrieval-Augmented Generation (Self-RAG)** AI pipeline with a full-stack e-commerce web application and a regional fulfillment portal. The system uses a stateless Next.js 16 frontend backed by MongoDB for transaction management and a microservice architecture running a FastAPI + LangGraph AI agent hosted on Hugging Face Spaces. 

Unlike traditional static RAG models, the Self-RAG agent dynamically evaluates retrieved document context before generating responses, ensuring 100% factual accuracy regarding shipping, refunds, and product specifications. Furthermore, the platform incorporates a multi-region fulfillment administrative panel (Mumbai & Nagpur Hubs) featuring address-based access control, an automated 7-day delivery lifecycle engine, and real-time hub delay logging. The expected outcome is a scalable, enterprise-ready web application that reduces customer support ticket volume by up to 80% while providing transparent regional order tracking.

---

## 3. Introduction

### 3.1 Background of the Problem
The rapid expansion of online retail has increased customer expectations for instant, 24/7 post-purchase support and fast delivery. Traditional e-commerce support relies heavily on human support agents or rudimentary rule-based decision trees, leading to high operational expenditure and long query resolution times. While Large Language Models (LLMs) can generate natural conversational responses, standard LLMs suffer from severe hallucinations when answering specific policy or inventory questions.

### 3.2 Motivation for Choosing the Topic
Integrating Artificial Intelligence with specialized domain data through **Self-RAG (Self-Reflective Retrieval-Augmented Generation)** presents an innovative breakthrough. By forcing the AI model to self-evaluate its retrieval quality, factual consistency, and response relevance via graph-based state machine execution (LangGraph), we can eliminate AI hallucinations. Combining this cutting-edge AI architecture with a practical regional supply chain distribution system offers a complete end-to-end engineering solution for real-world enterprise needs.

### 3.3 Scope and Significance
The scope of ShopEase encompasses:
1. **Interactive AI Assistant**: A hybrid sales and support conversational agent capable of semantic product recommendation and database-driven order status checking.
2. **Deterministic Security**: Cross-service JWT (JSON Web Token) authentication signed with HS256 to ensure stateless authorization between Next.js and FastAPI.
3. **Regional Fulfillment Hub Engine**: Automated geographic order routing between distinct fulfillment hubs (Mumbai & Nagpur) with strict regional access control.
4. **Autonomous Lifecycle Engine**: Automated background state transition for orders from `Placed` to `Delivered` upon reaching a 7-day threshold.

### 3.4 Real-life Application
ShopEase can be directly deployed by mid-to-large-scale e-commerce vendors, multi-region logistics partners, and digital marketplaces looking to streamline customer service overhead while establishing a secure, scalable fulfillment pipeline across geographically distributed hubs.

---

## 4. Objectives of the Project
The primary objectives of the ShopEase project are:
1. **To Eliminate AI Hallucinations**: Implement a graph-based **Self-RAG pipeline** using LangGraph to evaluate document relevance before response generation.
2. **To Automate Customer Support**: Develop an AI agent capable of parsing natural language customer queries and answering policy, refund, and order tracking inquiries in real-time.
3. **To Implement Secure Cross-Service Authorization**: Secure FastAPI AI endpoints using stateless JWT bearer token verification matching Next.js authentication keys.
4. **To Build a Regional Fulfillment Architecture**: Create a multi-region administrative dashboard (Mumbai & Nagpur Hubs) restricting order intervention rights based on regional address geography and explicit `hub_region` metadata.
5. **To Automate Order State Lifecycles**: Engineer a zero-cron autonomous lifecycle engine that converts orders older than 7 days from `Placed` to `Delivered`.
6. **To Establish Logistical Transparency**: Provide regional hub managers with a dedicated bottleneck logging framework to record operational delays.

---

## 5. Problem Statement
Current digital retail applications face a critical disconnect between automated customer interaction systems and regional logistics administration:
1. Standard AI chatbots lack domain-specific reflection, resulting in false promises regarding warranties, returns, and delivery dates.
2. E-commerce logistics platforms often expose global order controls to regional hub personnel, causing security risks and unauthorized status overrides across distinct geographic fulfillment centers.
3. Managing manual delivery status updates for thousands of packages creates significant database overhead and operational delay.

**ShopEase addresses these challenges by unifying a Self-Reflective RAG AI agent with a geographically scoped, multi-tenant administrative portal and an automated database lifecycle workflow.**

---

## 6. Literature Review / Existing System

### 6.1 Existing Systems Analysis
1. **Rule-Based Support Chatbots (e.g., ManyChat, Tidio)**: Rely on fixed decision trees. They fail when customers ask complex, multi-part questions or express inquiries in unconventional phrasing.
2. **Standard RAG Systems**: Retrieve documents based purely on vector similarity (e.g., Cosine Similarity) and pass them directly to an LLM. If the vector search retrieves irrelevant chunks, the LLM incorporates incorrect context into its response without verification.
3. **Centralized Order Portals**: Expose all national orders to a single flat dashboard without regional access scoping, increasing human error risks during regional dispatch.

### 6.2 Limitations & Gaps
* Lack of self-correction mechanisms in standard LLM pipelines.
* High cost associated with unnecessary LLM API invocations.
* Absence of unified multi-region fulfillment scoping in modern open-source retail templates.

### 6.3 Proposed Improvements in ShopEase
ShopEase introduces **Self-Reflection Nodes** (Retrieval Evaluator, Hallucination Grader, Answer Grader) inside a LangGraph state network. If retrieved documents are irrelevant, the system triggers targeted query rewriting or safe fallback execution. Furthermore, regional fulfillment security is enforced at both the API and database levels.

---

## 7. Proposed System
The proposed system is an enterprise-grade, microservice-architected web application comprising three main operational layers:

```
[ User Browser / Next.js 16 Web App ]
         │
         ├──► [ API Layer: Auth, Orders, Wallet, Addresses ] ──► [ MongoDB Atlas (shopease_db) ]
         │
         └──► [ AI Layer: /api/chat ] ──► [ FastAPI Service (Hugging Face) ]
                                                   │
                                         [ LangGraph Self-RAG Pipeline ]
                                                   │
                                    ┌──────────────┴──────────────┐
                                    ▼                             ▼
                          [ Vector DB / Policy RAG ]     [ HuggingFace LLM ]
```

### Key Modules:
1. **E-Commerce Storefront Module**: Browsing catalog, dynamic search, price filtering, interactive cart, and one-click checkout modal with explicit **Delivery Hub Dropdown** selection (`Mumbai Hub` / `Nagpur Hub`).
2. **Self-RAG AI Support & Sales Engine**: Multi-threaded conversational drawer and embedded chatbot providing product recommendations, policy verification, and live MongoDB order tracking via client-side components.
3. **Regional Admin Fulfillment Portal**: Scoped dashboard (`/admin`) for Mumbai and Nagpur hub administrators featuring hub-specific metrics, regional order hold capabilities, and delay reporting.
4. **Stateless JWT Security Subsystem**: HS256 cryptographic signing and token validation across Next.js and FastAPI services.

---

## 8. Methodology / Technologies to be Used

### 8.1 Software & Hardware Technologies
* **Frontend Framework**: Next.js 16 (React 19, TypeScript, Turbopack)
* **Styling**: Vanilla CSS with Tailwind CSS v4, Lucide React Icons
* **Backend Database**: MongoDB Atlas (Node.js MongoDB Native Driver)
* **AI Microservice**: Python 3.10+, FastAPI, Uvicorn
* **AI Orchestration Framework**: LangGraph, LangChain Core
* **Cryptographic Authorization**: PyJWT / python-jose (HS256)
* **Containerization & Deployment**: Docker (Multi-stage Alpine Build), Vercel, Hugging Face Spaces

### 8.2 Architectural Methodology (AI Deep-Dive)
The AI pipeline executes a graph-based **Self-RAG loop**:
1. **Input State**: Receives `chat`, `order_id`, and `thread_id`.
2. **Document Retrieval**: Queries vector embeddings of ShopEase store policies.
3. **Retrieval Evaluation Node**: Evaluates retrieved document relevance against the user prompt.
4. **Generation Node**: Generates a candidate answer using retrieved context.
5. **Hallucination Grader Node**: Checks if the generated response is grounded in the retrieved documents.
6. **Answer Grader Node**: Verifies if the answer directly addresses the user's question.
7. **Query Rewriter Loop**: If document relevance is low, the agent rewrites the prompt and re-executes retrieval up to maximum recursion limits.

---

## 9. Modules Description

### 9.1 User Authentication & Profile Module
* Handles password hashing, registration, login, and JWT generation.
* Manages user saved delivery addresses and virtual wallet balances.

### 9.2 Product Catalog & Interactive Checkout Module
* Displays store inventory with category filtering and instant search.
* Integrates a modal checkout system with explicit **Hub Region Selection** (`Mumbai Hub` / `Nagpur Hub`).

### 9.3 Self-RAG AI Chatbot Module (`/api/chat`)
* Embedded chat drawer with markdown rendering, message history persistence, and dynamic product recommendations.
* Forwards `Authorization: Bearer <token>` to the external FastAPI service for stateless identity extraction.

### 9.4 Regional Admin Fulfillment Module (`/admin`)
* Hub administrator authentication matching region-specific access credentials.
* Address and `hub_region` validation ensuring Mumbai Hub admins can only modify Mumbai orders, while Nagpur Hub admins manage Nagpur orders.
* Actionable single-click **Hold Order** trigger for regional logistics intervention.

### 9.5 Automated Order Lifecycle Module
* Executes date-comparison updates (`$lte 7 days`) on MongoDB order documents.
* Automatically transitions package status from `Placed` to `Delivered` upon retrieval without requiring scheduled cron jobs.

### 9.6 Hub Difficulty Logger Module (`/api/admin/notes`)
* Dedicated log reporting interface for hub managers to record regional logistics bottlenecks (e.g., weather delays, transport strikes).

---

## 10. Expected Outcomes

### 10.1 Functional Outcomes
* **100% Accurate AI Support**: Zero AI hallucinations regarding return policies, shipping durations, and order states due to Self-RAG evaluation nodes.
* **Geofenced Order Administration**: Strict regional separation between Mumbai and Nagpur fulfillment operations.
* **Instant Hub Assignment**: Seamless mapping of customer checkout selections to target regional fulfillment hubs.
* **Autonomous Order Settlement**: Zero manual overhead for marking orders delivered after the 7-day shipping window.

### 10.2 Non-Functional Outcomes
* **High Performance**: Sub-second Next.js page loads powered by Turbopack compilation.
* **Security & Confidentiality**: Protection against JWT forgery and unauthenticated API calls across frontend and AI microservices.
* **Scalability**: Dockerized multi-stage container deployment ready for cloud deployment (Vercel, AWS, Hugging Face).

---

### Submitted By:
**Student Name**: [Your Name / Team Members]  
**Roll No. / Enrollment No.**: [Your Roll Number]  
**Branch**: Department of Computer Science & Engineering  
**Guide / Supervisor**: [Faculty Guide Name]  
**Institution**: G H Raisoni University, Amravati  
