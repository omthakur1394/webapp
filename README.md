# ShopEase Support AI — E-Commerce Customer Assistant

ShopEase Support is a modern, high-fidelity customer support interface built with **Next.js 16 (App Router)** and **Tailwind CSS v4**. It connects to a Hugging Face AI assistant via a secure proxy API to answer e-commerce customer queries regarding orders, sizing, promotions, and returns.

## Key Features

* **Multi-Session Chat History**
  * Manage multiple separate conversations concurrently.
  * Start new chat sessions, search through chat titles, rename session headers inline, and delete conversations.
  * Auto-generates chat titles based on the first query submitted in a session.
* **Collapsible Left Sidebar Layout**
  * **Desktop Expanded Mode**: Full sidebar showing brand header, search bar, active/past chats list, and settings control.
  * **Desktop Compact Rail Mode**: Collapses to a thin icon rail to maximize chat screen area, with interactive tooltips on hover.
  * **Mobile Drawer Mode**: Completely hidden on small screens; slides in smoothly as a drawer when the header menu is clicked.
* **Unified Theme Switcher**
  * Toggle between a unified **Light Mode** and **Dark Mode** via a Sun/Moon toggle button in the header.
  * Automatically respects the user's operating system setting (`prefers-color-scheme`) on first load.
  * Persists selected theme preferences across refreshes.
* **Voice Speech-to-Text Typing**
  * Voice microphone dictation using the browser-native **Web Speech API**.
  * Shows a red, pulsing visual microphone state when actively listening.
  * Gracefully appends voice transcripts directly into the search text field.
* **Premium UX Modals**
  * custom-built confirmation modals replace raw browser prompt panels for deleting chats, resetting sessions, and clearing history.

## Technology Stack

* **Frontend Framework**: Next.js 16.2 & React 19 (Client Components)
* **Styling**: Tailwind CSS v4 & custom transition animations
* **Icons**: Lucide React
* **Markdown Parser**: React Markdown
* **Local Storage**: Auto-saves active session IDs and chat histories for persistent client-side data security.

---

## Getting Started

### 1. Environment Configuration
Create a `.env.local` file in the root directory and configure your Hugging Face AI agent endpoints:
```env
HF_API_CHAT_URL=https://your-hf-space.hf.space/chat
HF_API_ORDER_URL=https://your-hf-space.hf.space/order
```
If your Hugging Face API only exposes a single `/chat` endpoint, you may set just `HF_API_CHAT_URL` and the order route will derive `/order` automatically.

If your Hugging Face endpoint is protected, also add:
```env
HF_TOKEN=your-hf-token-here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```


### 4. Build for Production
```bash
npm run build
npm start
```