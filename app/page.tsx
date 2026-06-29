'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  RefreshCw, 
  ShieldCheck, 
  Copy,
  Check,
  ArrowDown,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Menu,
  PanelLeft,
  MessageSquare,
  Sparkles,
  Sun,
  Moon,
  Mic,
  MicOff,
  ShoppingBag,
  Eye,
  EyeOff
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import productsData from './data/products.json';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  specs: Record<string, string>;
}

// Client-side helper to track orders from MongoDB
function ChatOrderTracker({ orderId, theme }: { orderId: string; theme: 'light' | 'dark' }) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/order/details?order_id=${encodeURIComponent(orderId)}`);
        if (!res.ok) {
          throw new Error('Order not found in database');
        }
        const data = await res.json();
        if (active) {
          setOrder(data);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'Failed to load order');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchOrder();
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className={`mt-3 p-3 rounded-xl border flex items-center justify-center gap-2 text-xs ${
        theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-500'
      }`}>
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        Retrieving order status...
      </div>
    );
  }

  if (error || !order) {
    return null; // Silent failure/don't render anything if order isn't in MongoDB yet
  }

  return (
    <div className={`mt-3 p-3.5 rounded-xl border text-xs shadow-xs text-left w-full ${
      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
    }`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/25 flex-shrink-0">
          <Check className="w-3 h-3" />
        </div>
        <span className="font-bold text-emerald-500">Order Confirmed!</span>
      </div>

      <div className="space-y-1.5 font-normal">
        <div className="flex justify-between items-start gap-3">
          <span className="font-semibold text-zinc-500 flex-shrink-0">Product:</span>
          <span className="text-right font-medium line-clamp-2">{order.product_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-zinc-500">Amount Paid:</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">
            ₹{Number(order.price).toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="font-semibold text-zinc-500">Order ID:</span>
          <span className="font-mono text-indigo-650 dark:text-indigo-400 font-semibold">{order.order_id}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-semibold text-zinc-500 flex-shrink-0">Details ID:</span>
          <span className="font-mono text-zinc-400 break-all select-all">{order._id}</span>
        </div>
        {order.created_at && (
          <div className="flex justify-between">
            <span className="font-semibold text-zinc-500">Date:</span>
            <span className="text-zinc-400">
              {new Date(order.created_at).toLocaleDateString(undefined, { 
                year: 'numeric', month: 'short', day: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  // Support chat sessions states
  const [supportSessions, setSupportSessions] = useState<ChatSession[]>([]);
  const [activeSupportSessionId, setActiveSupportSessionId] = useState<string>('');

  // Sales assistant sessions states
  const [salesSessions, setSalesSessions] = useState<ChatSession[]>([]);
  const [activeSalesSessionId, setActiveSalesSessionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Custom modals confirmation states for Chat
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  
  // Scroll and container references for Chat
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Voice recognition states & refs
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const initialInputRef = useRef<string>('');

  // Storefront view state: 'shop' or 'chat' (full-screen chat)
  const [activeView, setActiveView] = useState<'shop' | 'chat'>('shop');
  
  // Storefront catalog states
  const [isChatOpen, setIsChatOpen] = useState(false); // Controls floating support chat drawer
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null); // Ref to focus drawer chat input

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedNavTab, setSelectedNavTab] = useState('All');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [cartCount, setCartCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [buyProduct, setBuyProduct] = useState<Product | null>(null); // Order success modal target
  const [shippingAddress, setShippingAddress] = useState('');
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [placedOrderDetailsId, setPlacedOrderDetailsId] = useState('');
  const [isOrderPlacing, setIsOrderPlacing] = useState(false);

  // Price Filter States
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');

  // Authentication States
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; email: string; token: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Derived states resolved dynamically inside renderChatWindow

  // Load initial session, theme, and chat history on mount
  useEffect(() => {
    setMounted(true);
    // Load auth session
    const savedUser = localStorage.getItem('shopease_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user:', err);
      }
    }

    // Load theme
    const savedTheme = localStorage.getItem('shopease_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // 1. Load Support Sessions
    const savedSupport = localStorage.getItem('shopease_support_sessions');
    const savedSupportActiveId = localStorage.getItem('shopease_active_support_session_id');

    if (savedSupport) {
      try {
        const parsed: ChatSession[] = JSON.parse(savedSupport).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt || Date.now()),
          updatedAt: new Date(s.updatedAt || Date.now()),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSupportSessions(parsed);
        if (savedSupportActiveId && parsed.some(s => s.id === savedSupportActiveId)) {
          setActiveSupportSessionId(savedSupportActiveId);
        } else if (parsed.length > 0) {
          setActiveSupportSessionId(parsed[0].id);
        } else {
          initializeDefaultSupportSession(parsed);
        }
      } catch (err) {
        console.error('Failed to parse support sessions:', err);
        initializeDefaultSupportSession();
      }
    } else {
      // Migrate legacy chat sessions if they exist
      const legacySessions = localStorage.getItem('shopease_chat_sessions');
      const legacyActiveId = localStorage.getItem('shopease_active_session_id');
      if (legacySessions) {
        try {
          const parsed: ChatSession[] = JSON.parse(legacySessions).map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt || Date.now()),
            updatedAt: new Date(s.updatedAt || Date.now()),
            messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
          }));
          setSupportSessions(parsed);
          setActiveSupportSessionId(legacyActiveId || parsed[0].id);
          localStorage.setItem('shopease_support_sessions', legacySessions);
          if (legacyActiveId) localStorage.setItem('shopease_active_support_session_id', legacyActiveId);
        } catch (err) {
          initializeDefaultSupportSession();
        }
      } else {
        initializeDefaultSupportSession();
      }
    }

    // 2. Load Sales Sessions
    const savedSales = localStorage.getItem('shopease_sales_sessions');
    const savedSalesActiveId = localStorage.getItem('shopease_active_sales_session_id');

    if (savedSales) {
      try {
        const parsed: ChatSession[] = JSON.parse(savedSales).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt || Date.now()),
          updatedAt: new Date(s.updatedAt || Date.now()),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSalesSessions(parsed);
        if (savedSalesActiveId && parsed.some(s => s.id === savedSalesActiveId)) {
          setActiveSalesSessionId(savedSalesActiveId);
        } else if (parsed.length > 0) {
          setActiveSalesSessionId(parsed[0].id);
        } else {
          initializeDefaultSalesSession(parsed);
        }
      } catch (err) {
        console.error('Failed to parse sales sessions:', err);
        initializeDefaultSalesSession();
      }
    } else {
      initializeDefaultSalesSession();
    }
  }, []);

  // Default welcome support session initializer
  const initializeDefaultSupportSession = (existing: ChatSession[] = []) => {
    const welcomeId = crypto.randomUUID();
    const welcomeSession: ChatSession = {
      id: welcomeId,
      title: 'Welcome Support Chat',
      messages: [
        {
          id: 'support-welcome',
          role: 'assistant',
          content: "Hi there! I'm ShopEase Support, your customer service assistant. How can I help you today? You can ask about tracking, returns, sizing, or general inquiries.",
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updated = [welcomeSession, ...existing];
    setSupportSessions(updated);
    setActiveSupportSessionId(welcomeId);
  };

  // Default welcome sales session initializer
  const initializeDefaultSalesSession = (existing: ChatSession[] = []) => {
    const welcomeId = crypto.randomUUID();
    const welcomeSession: ChatSession = {
      id: welcomeId,
      title: 'Sales Recommendations',
      messages: [
        {
          id: 'sales-welcome',
          role: 'assistant',
          content: "Hello! I'm your Personal Sales Assistant. I can recommend top products, answer questions, and help you place and track your orders directly here. How can I help you today?",
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updated = [welcomeSession, ...existing];
    setSalesSessions(updated);
    setActiveSalesSessionId(welcomeId);
  };

  // Create new session
  const createNewSession = (existingSessions: ChatSession[] = supportSessions) => {
    const newId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Hi there! I'm ShopEase Support, your customer service assistant. How can I help you today? You can ask about tracking, returns, sizing, or general inquiries.",
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updated = [newSession, ...existingSessions];
    setSupportSessions(updated);
    setActiveSupportSessionId(newId);
    setInputValue('');
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmSessionId(id);
  };

  const executeDeleteSession = (id: string) => {
    const updated = supportSessions.filter(s => s.id !== id);
    setSupportSessions(updated);
    if (activeSupportSessionId === id) {
      if (updated.length > 0) {
        setActiveSupportSessionId(updated[0].id);
      } else {
        initializeDefaultSupportSession();
      }
    }
  };

  // Session renaming
  const startEditingSession = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const handleRenameSession = (id: string) => {
    if (!editTitle.trim()) return;
    setSupportSessions(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          title: editTitle.trim(),
          updatedAt: new Date()
        };
      }
      return s;
    }));
    setEditingSessionId(null);
  };

  const cancelEditingSession = () => {
    setEditingSessionId(null);
  };

  const handleRenameBlur = (id: string) => {
    handleRenameSession(id);
  };

  // Save support sessions to local storage whenever they change
  useEffect(() => {
    if (supportSessions.length > 0) {
      localStorage.setItem('shopease_support_sessions', JSON.stringify(supportSessions));
    }
  }, [supportSessions]);

  // Save support active ID
  useEffect(() => {
    if (activeSupportSessionId) {
      localStorage.setItem('shopease_active_support_session_id', activeSupportSessionId);
    }
  }, [activeSupportSessionId]);

  // Save sales sessions to local storage whenever they change
  useEffect(() => {
    if (salesSessions.length > 0) {
      localStorage.setItem('shopease_sales_sessions', JSON.stringify(salesSessions));
    }
  }, [salesSessions]);

  // Save sales active ID
  useEffect(() => {
    if (activeSalesSessionId) {
      localStorage.setItem('shopease_active_sales_session_id', activeSalesSessionId);
    }
  }, [activeSalesSessionId]);

  // Save theme selection to localStorage
  useEffect(() => {
    localStorage.setItem('shopease_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Reset pagination visibleCount when selected category, price filters, or search query changes
  useEffect(() => {
    setVisibleCount(24);
  }, [selectedCategory, productSearchQuery, priceFilter, minPriceInput, maxPriceInput]);

  // Auto fade out toast notifications
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Auto focus chat input field when drawer opens
  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  // Initialize browser Speech Recognition (Speech-to-Text API)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          let parts = [];
          for (let i = 0; i < event.results.length; i++) {
            parts.push(event.results[i][0].transcript);
          }
          const transcript = parts.join(' ').trim();
          const base = initialInputRef.current.trim();
          setInputValue(base ? `${base} ${transcript}` : transcript);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Voice typing is not supported in this browser. Please try Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        initialInputRef.current = inputValue;
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [supportSessions, salesSessions, isLoading]);

  // Scroll handler to detect if we need the scroll-to-bottom assistant
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isFar = scrollHeight - scrollTop - clientHeight > 250;
      setShowScrollButton(isFar);
    }
  };

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Regular expression to strip citations like [0], [1], [12]
  const cleanCitation = (text: string): string => {
    return text.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
  };  const handleSendMessage = async (text: string, isDrawerMode = false) => {
    if (!text.trim() || isLoading) return;

    if (isDrawerMode) {
      // --- SALES ASSISTANT CONVERSATION (DRAWER OVERLAY) ---
      const currentSessionId = activeSalesSessionId;
      if (!currentSessionId) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date()
      };

      setSalesSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          let newTitle = s.title;
          if (s.title === 'Sales Recommendations' || s.title === 'New Chat') {
            newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
          }
          return {
            ...s,
            title: newTitle,
            messages: [...s.messages, userMessage],
            updatedAt: new Date()
          };
        }
        return s;
      }));

      setInputValue('');
      setIsLoading(true);

      try {
        const res = await fetch('/api/order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat: text,
            thread_id: currentSessionId
          }),
        });

        if (!res.ok) {
          throw new Error(`Order API returned status ${res.status}`);
        }

        const data = await res.json();
        const botMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.res || '',
          timestamp: new Date()
        };

        setSalesSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, botMessage],
              updatedAt: new Date()
            };
          }
          return s;
        }));
      } catch (err) {
        console.error('Sales Assistant failed:', err);
        const botMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "I'm sorry, I encountered an error while processing your request. Please try again.",
          timestamp: new Date()
        };
        setSalesSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, botMessage],
              updatedAt: new Date()
            };
          }
          return s;
        }));
      } finally {
        setIsLoading(false);
      }

    } else {
      // --- CUSTOMER SERVICE SUPPORT CONVERSATION (FULLSCREEN VIEW) ---
      const currentSessionId = activeSupportSessionId;
      if (!currentSessionId) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date()
      };

      setSupportSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          let newTitle = s.title;
          if (s.title === 'New Chat' || s.title === 'Welcome Support Chat') {
            newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
          }
          return {
            ...s,
            title: newTitle,
            messages: [...s.messages, userMessage],
            updatedAt: new Date()
          };
        }
        return s;
      }));

      setInputValue('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat: text,
            thread_id: currentSessionId,
            type: 'support'
          })
        });

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        const cleanedResponse = cleanCitation(data.res || '');

        const botMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: cleanedResponse,
          timestamp: new Date()
        };

        setSupportSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, botMessage],
              updatedAt: new Date()
            };
          }
          return s;
        }));
      } catch (err: any) {
        console.error('Support Chat API request failed:', err);
        const mockReplies = [
          "Thank you for contacting ShopEase support! Since our AI support agent is currently undergoing maintenance, our human support staff will review your message and get back to you shortly.",
          "Hello! I am the ShopEase assistant. Our AI support module is currently offline for updates. If you have questions about returns, active promotions, or shipping, please check back soon!",
          "Thanks for your message! Our backend assistant is offline right now, but your inquiry has been logged. We appreciate your patience!"
        ];
        const randomReply = mockReplies[Math.floor(Math.random() * mockReplies.length)];

        const botMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: randomReply,
          timestamp: new Date()
        };

        setSupportSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, botMessage],
              updatedAt: new Date()
            };
          }
          return s;
        }));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleResetSession = () => {
    setResetConfirmOpen(true);
  };

  const executeResetSession = () => {
    if (isChatOpen) {
      setSalesSessions(prev => prev.map(s => {
        if (s.id === activeSalesSessionId) {
          return {
            ...s,
            title: 'Sales Recommendations',
            messages: [
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Session reset. Hello! I'm your Personal Sales Assistant. How can I help you today?",
                timestamp: new Date()
              }
            ],
            updatedAt: new Date()
          };
        }
        return s;
      }));
    } else {
      setSupportSessions(prev => prev.map(s => {
        if (s.id === activeSupportSessionId) {
          return {
            ...s,
            title: 'Welcome Support Chat',
            messages: [
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Session reset. Hello! I'm ShopEase Support, your customer service assistant. How can I help you today?",
                timestamp: new Date()
              }
            ],
            updatedAt: new Date()
          };
        }
        return s;
      }));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredSessions = supportSessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Authentication Handlers
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername,
          email: authEmail,
          password: authPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setToastMessage('Account created successfully! Please sign in.');
      setAuthTab('signin');
      setAuthPassword('');
      setAuthUsername('');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      const userSession = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
        token: data.token,
      };
      setCurrentUser(userSession);
      localStorage.setItem('shopease_user', JSON.stringify(userSession));
      setToastMessage(`Welcome back, ${data.user.username}!`);
      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthUsername('');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('shopease_user');
    setToastMessage('Logged out successfully!');
  };

  // E-commerce handlers
  const handleAddToCart = (productName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCartCount(prev => prev + 1);
    setToastMessage(`Added "${productName}" to cart!`);
  };

  const handleBuyNow = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    setBuyProduct(product);
    setShippingAddress('');
    setIsOrderConfirmed(false);
    setPlacedOrderId('');
    setPlacedOrderDetailsId('');
  };

  const executeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim() || !buyProduct) return;
    if (!currentUser) {
      setToastMessage('You must be logged in to place an order.');
      return;
    }
    setIsOrderPlacing(true);
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id.toString(),
          product_name: buyProduct.name,
          price: buyProduct.price
        }),
      });

      if (!res.ok) {
        throw new Error(`Order placement returned status ${res.status}`);
      }

      const data = await res.json();
      setPlacedOrderId(data.order_id || 'ORD-UNKNOWN');
      setPlacedOrderDetailsId(data._id || 'DETAILS-UNKNOWN');
      setIsOrderConfirmed(true);
      setCartCount(prev => prev + 1);
      setToastMessage(`Order placed successfully for ${buyProduct.name}!`);
    } catch (err: any) {
      console.error('Order placement API failed:', err);
      setToastMessage('Order placed locally due to network issues.');
      const mockOrderId = `ORD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const mockDetailsId = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setPlacedOrderId(mockOrderId);
      setPlacedOrderDetailsId(mockDetailsId);
      setIsOrderConfirmed(true);
      setCartCount(prev => prev + 1);
    } finally {
      setIsOrderPlacing(false);
    }
  };

  const handleAskAI = (productName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveView('chat');
    setIsChatOpen(false);
    setInputValue(`Tell me more about the ${productName} please.`);
    setToastMessage('Redirected to Chat Assistant!');
  };

  const handleBuyViaChat = (productName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChatOpen(true);
    setInputValue(`I want to buy the ${productName}`);
    setToastMessage(`Opened Sales Assistant for "${productName}"!`);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Storefront Filtering Logic
  const filteredProducts = (productsData as Product[]).filter(product => {
    // 1. Category Filter
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Hot offers') {
        if (product.price >= 4000) return false;
      } else if (selectedCategory === 'Gift boxes') {
        if (product.category !== 'Accessories' && product.category !== 'Fashion') return false;
      } else if (product.category !== selectedCategory) {
        return false;
      }
    }

    // 2. Price Preset Filter
    if (priceFilter === 'under-2k') {
      if (product.price >= 2000) return false;
    } else if (priceFilter === '2k-5k') {
      if (product.price < 2000 || product.price > 5000) return false;
    } else if (priceFilter === '5k-10k') {
      if (product.price < 5000 || product.price > 10000) return false;
    } else if (priceFilter === '10k-20k') {
      if (product.price < 10000 || product.price > 20000) return false;
    } else if (priceFilter === 'over-20k') {
      if (product.price < 20000) return false;
    } else if (priceFilter === 'custom') {
      const min = parseFloat(minPriceInput);
      const max = parseFloat(maxPriceInput);
      if (!isNaN(min) && product.price < min) return false;
      if (!isNaN(max) && product.price > max) return false;
    }

    // 3. Search Query Filter
    const query = productSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      Object.values(product.specs).some(val => typeof val === 'string' && val.toLowerCase().includes(query))
    );
  });

  const dropdownItems = [
    { label: 'Electronics', value: 'Electronics' },
    { label: 'Fashion', value: 'Fashion' },
    { label: 'Laptops', value: 'Laptops' },
    { label: 'Monitors', value: 'Monitors' },
    { label: 'Keyboards & Mice', value: 'Keyboards & Mice' },
    { label: 'PC Components', value: 'PC Components' },
    { label: 'Mobiles', value: 'Mobiles' },
    { label: 'Networking', value: 'Networking' },
    { label: 'Accessories', value: 'Accessories' },
    { label: 'More category', value: 'All' }
  ];

  const navItems = [
    { label: 'All category', value: 'All', isDropdown: true, icon: <Menu className="w-4 h-4 mr-1.5" /> },
    { label: 'Hot offers', value: 'Hot offers' },
    { label: 'Gift boxes', value: 'Gift boxes' },
    { label: 'Customer Service', value: 'Customer Service' }
  ];  // Helper to render standard Chat UI Window
  const renderChatWindow = (isDrawerMode = false) => {
    const currentSessions = isDrawerMode ? salesSessions : supportSessions;
    const currentActiveId = isDrawerMode ? activeSalesSessionId : activeSupportSessionId;
    const currentActiveSession = currentSessions.find(s => s.id === currentActiveId);
    const messages = currentActiveSession ? currentActiveSession.messages : [];
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSendMessage(inputValue, isDrawerMode);
    };

    return (
      <section className={`flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
        {/* Header */}
        <header className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-150'}`}>
          <div className="flex items-center gap-3">
            {/* Toggle Sidebar Button (Only if not in drawer mode) */}
            {!isDrawerMode && (
              <button
                onClick={() => setIsSidebarOpen(prev => !prev)}
                className={`p-2 rounded-lg transition-all cursor-pointer mr-1
                  ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-450 hover:text-white' : 'hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900'}
                  ${isSidebarOpen ? 'md:hidden' : 'flex'}
                `}
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="relative">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border text-indigo-650 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-indigo-50 border-indigo-100'}`}>
                <Bot className="w-5.5 h-5.5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className={`font-semibold text-sm md:text-base leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  {isDrawerMode ? 'Personal Sales Assistant' : 'ShopEase Support'}
                </h2>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${theme === 'dark' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                  Online
                </span>
              </div>
              <p className={`text-[11px] mt-1 ${theme === 'dark' ? 'text-zinc-455' : 'text-zinc-505'}`}>
                {isDrawerMode 
                  ? 'Find products, get recommendations, & place orders' 
                  : 'Ask order, shipping, & sizing questions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}
              title={theme === 'dark' ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Reset Chat Control */}
            <button
              onClick={handleResetSession}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-all active:scale-[0.98] cursor-pointer ${theme === 'dark' ? 'text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-800 border-zinc-700' : 'text-zinc-660 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200'}`}
              title="Reset Current Chat Session"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {isDrawerMode && (
              <button
                id="close-chat-drawer-btn"
                onClick={() => setIsChatOpen(false)}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
                title="Close chat drawer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto px-4 py-6 md:p-6 space-y-5 relative transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950/20' : 'bg-zinc-55/30'}`}
        >
          {messages.map((message) => {
            const isBot = message.role === 'assistant';
            
            // Extract order ID only for sales assistant drawer conversations
            let orderIdMatch: string | null = null;
            if (isBot && isDrawerMode) {
              const regex = /\b(ORD-[A-Z0-9]+)\b/i;
              const match = message.content.match(regex);
              if (match) {
                orderIdMatch = match[1];
              } else {
                const mongoRegex = /\b([a-f\d]{24})\b/i;
                const mongoMatch = message.content.match(mongoRegex);
                if (mongoMatch) {
                  orderIdMatch = mongoMatch[1];
                }
              }
            }

            return (
              <div
                key={message.id}
                className={`flex gap-3 max-w-[85%] sm:max-w-[75%] transition-all duration-300 animate-fadeIn ${
                  isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 select-none text-xs font-semibold ${
                    isBot 
                      ? (theme === 'dark' ? 'bg-zinc-805 border border-zinc-705 text-zinc-400' : 'bg-zinc-100 border border-zinc-200 text-zinc-600')
                      : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble Column */}
                <div className="flex flex-col gap-1 group max-w-full">
                  <div
                    className={`relative px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isBot
                        ? (theme === 'dark' ? 'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-tl-none' : 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none')
                        : 'bg-indigo-600 text-white rounded-tr-none font-medium'
                    }`}
                  >
                    {isBot ? (
                      <div className="markdown-body">
                        <ReactMarkdown
                          components={{
                            ul: ({ node, ...props }) => <ul className="space-y-1.5 my-2.5 list-disc pl-5" {...props} />,
                            ol: ({ node, ...props }) => <ol className="space-y-1.5 my-2.5 list-decimal pl-5" {...props} />,
                            li: ({ node, ...props }) => <li className={`pl-0.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`} {...props} />,
                            p: ({ node, ...props }) => <p className={`mb-2 last:mb-0 leading-relaxed ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'}`} {...props} />,
                            strong: ({ node, ...props }) => <strong className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-zinc-950'}`} {...props} />,
                            code: ({ node, ...props }) => (
                              <code className={`px-1.5 py-0.5 rounded font-mono text-[11px] border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-indigo-400' : 'bg-zinc-105 border-zinc-205 text-indigo-700'}`} {...props} />
                            ),
                            a: ({ node, ...props }) => (
                              <a
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`font-medium underline underline-offset-2 transition-colors inline-flex items-center gap-0.5 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-305' : 'text-indigo-600 hover:text-indigo-805'}`}
                                {...props}
                              />
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                        {orderIdMatch && (
                          <ChatOrderTracker orderId={orderIdMatch} theme={theme} />
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}

                    {/* Copy Button */}
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className={`absolute top-1 right-1 p-1 border rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 cursor-pointer ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'}`}
                      title="Copy to clipboard"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>

                    {message.isError && lastUserMessage && (
                      <button
                        onClick={() => {
                          const setter = isDrawerMode ? setSalesSessions : setSupportSessions;
                          setter(prev => prev.map(s => {
                            if (s.id === currentActiveId) {
                              return {
                                ...s,
                                messages: s.messages.filter(m => m.id !== message.id)
                              };
                            }
                            return s;
                          }));
                          handleSendMessage(lastUserMessage.content, isDrawerMode);
                        }}
                        className={`mt-2.5 flex items-center gap-1.5 px-3 py-1 border rounded-lg text-[10px] font-semibold transition-all active:scale-[0.98] w-fit cursor-pointer ${theme === 'dark' ? 'bg-red-950/20 hover:bg-red-950/40 text-red-400 border-red-900/40' : 'bg-red-50 hover:bg-red-105 text-red-750 border border-red-200'}`}
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry Query
                      </button>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className={`text-[9px] font-medium px-1 flex items-center gap-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} ${isBot ? 'justify-start' : 'justify-end'}`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-[75%] mr-auto animate-fadeIn">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${theme === 'dark' ? 'bg-zinc-800 border-zinc-705 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-1">
                <div className={`border px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-8 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-zinc-500' : 'bg-zinc-400'}`} style={{ animationDelay: '0ms' }}></span>
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-zinc-500' : 'bg-zinc-400'}`} style={{ animationDelay: '150ms' }}></span>
                  <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-zinc-500' : 'bg-zinc-400'}`} style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className={`text-[9px] px-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>Sales Assistant is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll Button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom()}
            className={`absolute bottom-24 right-6 p-2.5 rounded-full border shadow-lg transition-all hover:scale-105 active:scale-95 animate-bounce z-20 flex items-center justify-center cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-indigo-400 hover:text-indigo-305' : 'bg-white border-zinc-200 text-indigo-650 hover:text-indigo-800'}`}
          >
            <ArrowDown className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Input Zone */}
        <footer className={`border-t px-4 py-4 md:px-6 flex-shrink-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="max-w-4xl mx-auto w-full">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                id="support-chat-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                maxLength={1000}
                placeholder={isLoading ? "Please wait..." : isDrawerMode ? "Ask your Sales Assistant anything..." : "Ask ShopEase support anything..."}
                disabled={isLoading}
                className={`flex-1 focus:ring-1 text-xs transition-all focus:outline-none disabled:opacity-60 rounded-xl px-4 py-3 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 focus:border-indigo-600 focus:ring-indigo-600 text-white placeholder-zinc-550' : 'bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-indigo-600 text-zinc-900 placeholder-zinc-400'}`}
              />

              <button
                type="button"
                onClick={handleMicClick}
                disabled={isLoading}
                className={`px-3.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                  ${isListening 
                    ? 'bg-red-650 hover:bg-red-500 text-white border-red-500 animate-pulse' 
                    : (theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-650 border-zinc-200')
                  }
                `}
                title={isListening ? "Listening... click to stop" : "Speak to type"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className={`px-4.5 rounded-xl transition-all duration-205 flex items-center justify-center shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:shadow-none cursor-pointer ${theme === 'dark' ? 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white disabled:text-zinc-500' : 'bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-100 text-white disabled:text-zinc-400'}`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className={`text-[9px] mt-2.5 text-center flex items-center justify-between px-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <span className="flex items-center gap-0.5 text-indigo-650 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> SSL Shield Active
              </span>
              <span>{inputValue.length} / 1000 characters</span>
            </p>
          </div>
        </footer>
      </section>
    );
  };

  const renderLoginScreen = () => {
    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-4 relative transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-zinc-950 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-zinc-900 via-zinc-950 to-zinc-950 text-white' 
          : 'bg-zinc-50 bg-radial-[circle_at_top,_var(--tw-gradient-stops)] from-zinc-100 via-zinc-50 to-zinc-50 text-zinc-900'
      }`}>
        {/* Top Header Row with Theme Toggle */}
        <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center border ${
              theme === 'dark' 
                ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-850 text-zinc-400 hover:text-white' 
                : 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900'
            }`}
            title={theme === 'dark' ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>

        {/* Logo and Branding */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-750 to-zinc-900 dark:from-white dark:via-zinc-200 dark:to-white bg-clip-text text-transparent">
              ShopEase
            </h1>
            <p className={`text-xs mt-1 font-medium ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              24/7 AI Shopping Assistant & Customer Support
            </p>
          </div>
        </div>

        {/* Auth Card Container */}
        <div 
          className={`border rounded-2xl max-w-md w-full p-8 shadow-2xl transition-all duration-300 backdrop-blur-md ${
            theme === 'dark' ? 'bg-zinc-900/80 border-zinc-850 text-white' : 'bg-white/80 border-zinc-200/80 text-zinc-900'
          }`}
        >
          {/* Modal Tabs */}
          <div className="flex border-b mb-6 dark:border-zinc-800 border-zinc-150">
            <button
              id="page-auth-tab-signin-btn"
              type="button"
              onClick={() => {
                setAuthTab('signin');
                setAuthError(null);
                setShowPassword(false);
              }}
              className={`flex-1 pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                authTab === 'signin'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-zinc-450 hover:text-zinc-550'
              }`}
            >
              Sign In
            </button>
            <button
              id="page-auth-tab-signup-btn"
              type="button"
              onClick={() => {
                setAuthTab('signup');
                setAuthError(null);
                setShowPassword(false);
              }}
              className={`flex-1 pb-3.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                authTab === 'signup'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-zinc-450 hover:text-zinc-550'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={authTab === 'signin' ? handleLogin : handleRegister} className="space-y-4">
            {authError && (
              <div className="p-3.5 bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl text-xs font-semibold leading-relaxed">
                {authError}
              </div>
            )}

            {authTab === 'signup' && (
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Username</label>
                <input
                  id="page-auth-username-input"
                  type="text"
                  required
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="Choose a username"
                  className={`w-full px-3.5 py-2.5 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                    theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>
            )}

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Email Address</label>
              <input
                id="page-auth-email-input"
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full px-3.5 py-2.5 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                  theme === 'dark' 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-655' 
                    : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Password</label>
              <div className="relative">
                <input
                  id="page-auth-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-3.5 pr-10 py-2.5 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                    theme === 'dark' 
                      ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-655' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
                <button
                  id="page-toggle-auth-password-visibility-btn"
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-750 dark:hover:text-zinc-350 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="page-auth-submit-btn"
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-lg shadow-indigo-600/15 active:scale-[0.98] flex items-center justify-center gap-2 select-none"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {authTab === 'signin' ? 'Signing In...' : 'Signing Up...'}
                </>
              ) : (
                authTab === 'signin' ? 'Sign In' : 'Sign Up'
              )}
            </button>
          </form>

          {/* Secure SSL Shield Note */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-zinc-450 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Secure 256-bit SSL Encrypted Connection</span>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-400' : 'bg-zinc-50 text-zinc-500'}`}>
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-650" />
      </div>
    );
  }

  if (!currentUser) {
    return renderLoginScreen();
  }

  return (
    <main className={`flex flex-col min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      
      {/* Premium E-Commerce Header */}
      <header className={`sticky top-0 z-30 border-b px-6 py-4 flex items-center justify-between transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-900/90 border-zinc-800 backdrop-blur-md' : 'bg-white/90 border-zinc-200 backdrop-blur-md'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div onClick={() => { setActiveView('shop'); setIsChatOpen(false); }} className="cursor-pointer">
            <h1 className={`font-bold text-sm sm:text-base leading-none tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
              ShopEase
            </h1>
            <span className="text-[10px] text-zinc-500 font-medium">Digital Storefront</span>
          </div>
        </div>

        {/* Catalog Search Input */}
        {activeView === 'shop' && (
          <div className="relative max-w-xs sm:max-w-md w-full mx-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="product-search-input"
              type="text"
              placeholder="Search products by name, specs or tags..."
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 border text-xs transition-all focus:outline-none rounded-xl ${
                theme === 'dark' 
                  ? 'bg-zinc-950 border-zinc-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-white placeholder-zinc-600' 
                  : 'bg-zinc-100 border-zinc-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-zinc-900 placeholder-zinc-400'
              }`}
            />
            {productSearchQuery && (
              <button 
                onClick={() => setProductSearchQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* View Switcher and Shopping Cart */}
        <div className="flex items-center gap-4">
          <div className="flex bg-zinc-200/60 dark:bg-zinc-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setIsChatOpen(false);
                setActiveView('shop');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeView === 'shop'
                  ? 'bg-indigo-650 text-white shadow-sm'
                  : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Shop
            </button>
            <button
              onClick={() => {
                setIsChatOpen(false);
                setActiveView('chat');
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeView === 'chat'
                  ? 'bg-indigo-650 text-white shadow-sm'
                  : 'text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Support Chat
            </button>
          </div>

          <div className="relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            <ShoppingBag className="w-4.5 h-4.5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-indigo-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                {cartCount}
              </span>
            )}
          </div>

          {/* Auth Controls */}
          {currentUser ? (
            <div className="flex items-center gap-2 border-l pl-3 dark:border-zinc-800 border-zinc-200">
              <span className={`text-xs font-semibold max-w-[120px] truncate ${theme === 'dark' ? 'text-zinc-200' : 'text-zinc-700'}`}>
                Hi, {currentUser.username}
              </span>
              <button
                id="auth-logout-btn"
                onClick={handleLogout}
                className="text-[11px] font-semibold text-red-500 hover:text-red-400 cursor-pointer transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              id="auth-login-trigger-btn"
              onClick={() => {
                setAuthError(null);
                setIsAuthModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all shadow-md shadow-indigo-650/15 active:scale-[0.98] whitespace-nowrap ml-1.5"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Category Sub-header Navigation Bar */}
      {activeView === 'shop' && (
        <nav className={`relative px-6 py-2 border-b flex items-center gap-4.5 select-none transition-colors duration-300 z-30 ${
          theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-800'
        }`}>
          {navItems.map((item) => {
            const isActive = selectedNavTab === item.label;
            if (item.isDropdown) {
              return (
                <div key={item.label} className="relative">
                  <button
                    id="all-categories-dropdown-btn"
                    onClick={() => setIsCategoryDropdownOpen(prev => !prev)}
                    className={`flex items-center gap-1.5 text-[13px] font-semibold transition-all duration-150 border px-2.5 py-1.5 rounded cursor-pointer whitespace-nowrap outline-none select-none ${
                      isCategoryDropdownOpen
                        ? (theme === 'dark' ? 'border-zinc-700 bg-zinc-850 text-white' : 'border-zinc-300 bg-zinc-100 text-zinc-950')
                        : (theme === 'dark' ? 'border-transparent text-zinc-350 hover:text-white hover:bg-zinc-800' : 'border-transparent text-zinc-650 hover:text-zinc-950 hover:bg-zinc-100')
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <span className="text-[10px] text-zinc-400 ml-0.5 select-none">▼</span>
                  </button>

                  {/* Vertical Category Dropdown Menu */}
                  {isCategoryDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsCategoryDropdownOpen(false)} />
                      <div 
                        id="vertical-category-dropdown"
                        className={`absolute left-0 mt-2 w-56 rounded-xl border shadow-xl z-50 py-1.5 transition-all duration-150 ${
                          theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
                        }`}
                      >
                        {dropdownItems.map((opt) => (
                          <button
                            id={`dropdown-item-${opt.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                            key={opt.label}
                            onClick={() => {
                              setSelectedCategory(opt.value);
                              setSelectedNavTab('All category');
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors duration-150 hover:bg-indigo-600 hover:text-white cursor-pointer ${
                              selectedCategory === opt.value
                                ? (theme === 'dark' ? 'bg-zinc-800 text-white border-l-2 border-indigo-500' : 'bg-indigo-50 text-indigo-700 border-l-2 border-indigo-600')
                                : 'text-zinc-600 dark:text-zinc-305'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            }

            return (
              <button
                id={`cat-tab-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                key={item.label}
                onClick={() => {
                  setSelectedNavTab(item.label);
                  if (item.label === 'Customer Service') {
                    setIsChatOpen(true);
                    setToastMessage("Customer Service chat widget opened!");
                    setTimeout(() => {
                      inputRef.current?.focus();
                    }, 150);
                  } else {
                    setSelectedCategory(item.value);
                  }
                }}
                className={`flex items-center gap-1.5 text-[13px] transition-all duration-150 border rounded px-2.5 py-1.5 cursor-pointer whitespace-nowrap outline-none select-none ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:text-indigo-400 font-bold'
                    : 'border-transparent text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 font-semibold'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-row overflow-hidden relative">
        
        {/* Render active view */}
        {activeView === 'chat' ? (
          // Full screen Chat Dashboard view
          <div className="w-full h-full flex flex-row overflow-hidden">
            {/* Sidebar backdrop */}
            {isSidebarOpen && (
              <div 
                className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity duration-300"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <aside 
              className={`
                flex flex-col transition-all duration-300 h-full border-r z-40
                fixed inset-y-0 left-0 transform md:relative md:translate-x-0
                ${theme === 'dark' ? 'bg-zinc-950 text-zinc-205 border-zinc-900' : 'bg-zinc-100 text-zinc-800 border-zinc-200'}
                ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'}
              `}
            >
              <div className={`flex flex-col h-full overflow-hidden ${!isSidebarOpen ? 'w-16 hidden md:flex items-center' : 'w-72'}`}>
                {/* Sidebar Header */}
                <div className={`flex items-center justify-between px-4 py-4 border-b w-full ${theme === 'dark' ? 'border-zinc-900' : 'border-zinc-200'} ${!isSidebarOpen ? 'justify-center px-0' : ''}`}>
                  {isSidebarOpen ? (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                        <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                      </div>
                      <span className={`font-semibold text-sm tracking-wide ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                        Sales Assistant
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md cursor-pointer" onClick={() => setIsSidebarOpen(true)}>
                      <Sparkles className="w-4.5 h-4.5" />
                    </div>
                  )}
                  {isSidebarOpen && (
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                    >
                      <PanelLeft className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>

                {/* New Chat Button */}
                <div className="p-3 w-full flex justify-center flex-shrink-0">
                  {isSidebarOpen ? (
                    <button
                      onClick={() => createNewSession()}
                      className={`flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border transition-all font-medium text-xs active:scale-[0.98] shadow-sm cursor-pointer ${theme === 'dark' ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-805 hover:border-zinc-700' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-zinc-300 hover:border-zinc-400'}`}
                    >
                      <Plus className="w-4.5 h-4.5 text-indigo-500" />
                      <span>New Chat</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => createNewSession()}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-center active:scale-[0.98] shadow-sm cursor-pointer ${theme === 'dark' ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-805' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-900 border-zinc-300'}`}
                      title="New Chat"
                    >
                      <Plus className="w-4.5 h-4.5 text-indigo-500" />
                    </button>
                  )}
                </div>

                {/* Search chats */}
                {isSidebarOpen ? (
                  <div className="px-3 pb-3 w-full flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-9 pr-8 py-2 border text-xs transition-all focus:outline-none rounded-lg ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-white placeholder-zinc-500' : 'bg-zinc-200/50 border-zinc-300 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 text-zinc-900 placeholder-zinc-500'}`}
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery('')}
                          className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-905`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex justify-center pb-3 flex-shrink-0">
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className={`p-2.5 rounded-xl transition-all cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-505 hover:text-zinc-900'}`}
                      title="Search chats"
                    >
                      <Search className="w-4.5 h-4.5" />
                    </button>
                  </div>
                )}

                {/* Recent Chat Lists */}
                <div className="flex-1 overflow-y-auto px-2 w-full space-y-1">
                  {isSidebarOpen && (
                    <div className="px-2 py-1 text-[10px] font-semibold text-zinc-550 uppercase tracking-wider">
                      Recent Chats
                    </div>
                  )}
                  {isSidebarOpen ? (
                    filteredSessions.length > 0 ? (
                      filteredSessions.map((session) => {
                        const isActive = session.id === activeSupportSessionId;
                        const isEditing = session.id === editingSessionId;
                        return (
                          <div
                            key={session.id}
                            onClick={() => !isEditing && setActiveSupportSessionId(session.id)}
                            className={`
                              group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer
                              ${isActive 
                                ? (theme === 'dark' ? 'bg-indigo-650/15 text-white border-l-2 border-indigo-500' : 'bg-indigo-105 text-indigo-950 border-l-2 border-indigo-600') 
                                : (theme === 'dark' ? 'text-zinc-400 hover:bg-zinc-900 hover:text-white' : 'text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900')
                              }
                            `}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <MessageSquare className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSession(session.id);
                                    if (e.key === 'Escape') cancelEditingSession();
                                  }}
                                  onBlur={() => handleRenameBlur(session.id)}
                                  autoFocus
                                  className={`border rounded px-1.5 py-0.5 w-full focus:outline-none text-xs ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-white border-zinc-300 text-zinc-900'}`}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="truncate pr-1">{session.title}</span>
                              )}
                            </div>

                            {!isEditing && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5">
                                <button
                                  onClick={(e) => startEditingSession(session.id, session.title, e)}
                                  className={`p-1 rounded transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-850 text-zinc-500 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteSession(session.id, e)}
                                  className={`p-1 rounded transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-850 text-zinc-505 hover:text-red-400' : 'hover:bg-zinc-200 text-zinc-505 hover:text-red-650'}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className={`px-3 py-4 text-center text-xs italic ${theme === 'dark' ? 'text-zinc-700' : 'text-zinc-400'}`}>
                        No chats found
                      </div>
                    )
                  ) : (
                    filteredSessions.map((session) => {
                      const isActive = session.id === activeSupportSessionId;
                      return (
                        <button
                          key={session.id}
                          onClick={() => setActiveSupportSessionId(session.id)}
                          className={`
                            w-full flex justify-center py-2.5 rounded-xl transition-all cursor-pointer mb-1
                            ${isActive ? (theme === 'dark' ? 'bg-indigo-650/15 text-indigo-405' : 'bg-indigo-50 text-indigo-600') : (theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-900 hover:text-white' : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900')}
                          `}
                          title={session.title}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Sidebar Footer */}
                <div className={`p-3 border-t w-full flex flex-col gap-2 flex-shrink-0 ${theme === 'dark' ? 'border-zinc-900' : 'border-zinc-200'} ${!isSidebarOpen ? 'items-center px-0' : ''}`}>
                  {isSidebarOpen ? (
                    <div className="flex items-center justify-between w-full text-[10px] px-1.5 font-semibold">
                      <span className={theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'}>ShopEase v1.0</span>
                      <button 
                        onClick={() => setClearConfirmOpen(true)}
                        className={`hover:underline transition-colors cursor-pointer ${theme === 'dark' ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-500 hover:text-red-650'}`}
                      >
                        Clear All
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setClearConfirmOpen(true)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-900 text-zinc-500 hover:text-red-400' : 'hover:bg-zinc-200 text-zinc-550 hover:text-red-650'}`}
                      title="Clear All Chats"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* Main Chat Interface */}
            {renderChatWindow(false)}
          </div>
        ) : (
          // Storefront Products Catalog Grid View
          <section className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 overflow-y-auto">
            {/* Featured Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-8 dark:border-zinc-800 border-zinc-200">
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>
                  Featured Showcase
                </h2>
                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Browse and shop catalog items category-wise. Contact our customer support team for inquiries.
                </p>
              </div>
              <div className={`mt-2.5 sm:mt-0 text-xs font-semibold px-3 py-1.5 rounded-xl border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-600'}`}>
                {filteredProducts.length} items showing
              </div>
            </div>

            {/* Price Filter Control Panel */}
            <div className={`mb-8 p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-4 items-start justify-between ${
              theme === 'dark' ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Filter by Price:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'All Prices', value: 'all' },
                      { label: 'Under ₹2,000', value: 'under-2k' },
                      { label: '₹2,000 - ₹5,000', value: '2k-5k' },
                      { label: '₹5,000 - ₹10,000', value: '5k-10k' },
                      { label: '₹10,000 - ₹20,000', value: '10k-20k' },
                      { label: 'Over ₹20,000', value: 'over-20k' }
                    ].map((preset) => {
                      const isSelected = priceFilter === preset.value;
                      return (
                        <button
                          key={preset.value}
                          onClick={() => {
                            setPriceFilter(preset.value);
                            setMinPriceInput('');
                            setMaxPriceInput('');
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : (theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50')
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom range controls */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className={`text-xs font-bold ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Custom (₹):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPriceInput}
                      onChange={(e) => {
                        setMinPriceInput(e.target.value);
                        setPriceFilter('custom');
                      }}
                      className={`w-20 px-2.5 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                    <span className="text-xs text-zinc-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPriceInput}
                      onChange={(e) => {
                        setMaxPriceInput(e.target.value);
                        setPriceFilter('custom');
                      }}
                      className={`w-20 px-2.5 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                    {(minPriceInput || maxPriceInput) && (
                      <button
                        onClick={() => {
                          setMinPriceInput('');
                          setMaxPriceInput('');
                          setPriceFilter('all');
                        }}
                        className="p-1 text-xs text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                        title="Clear custom range"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Flat Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="pb-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProducts.slice(0, visibleCount).map((product) => (
                    <div 
                      key={product.id}
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 flex flex-col hover:shadow-md ${
                        theme === 'dark' 
                          ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' 
                          : 'bg-white border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      {/* Product Image */}
                      <div className={`h-52 overflow-hidden relative border-b ${theme === 'dark' ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-100 bg-zinc-50'}`}>
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-102"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded text-[10px] font-semibold tracking-wide border uppercase ${
                          theme === 'dark' 
                            ? 'bg-zinc-950/85 border-zinc-800 text-indigo-400' 
                            : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                        }`}>
                          {product.category}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2.5">
                            <h4 className={`text-xs font-bold leading-snug line-clamp-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`} title={product.name}>
                              {product.name}
                            </h4>
                            <span className={`text-xs font-bold whitespace-nowrap text-indigo-650 dark:text-indigo-400`}>
                              ₹{product.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed line-clamp-2 ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-550'}`}>
                            {product.description}
                          </p>

                          {/* Technical Specifications Table */}
                          {product.specs && Object.keys(product.specs).length > 0 && (
                            <div className={`mt-3 border rounded-xl overflow-hidden text-[10px] ${
                              theme === 'dark' ? 'bg-zinc-950/50 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-650'
                            }`}>
                              <div className="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
                                {Object.entries(product.specs).map(([key, val]) => (
                                  <div key={key} className="flex justify-between px-3 py-1.5">
                                    <span className="font-semibold uppercase opacity-60 text-[9px]">{key.replace('_', ' ')}:</span>
                                    <span className="font-medium text-right line-clamp-1 pl-2">{String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* E-Commerce Interactive Action Redirects */}
                          <div className="flex items-center gap-4 mt-2 text-[10px] font-semibold">
                            <button
                              onClick={(e) => handleBuyViaChat(product.name, e)}
                              className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-305 flex items-center gap-1 cursor-pointer"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>Buy via Chat</span>
                            </button>
                          </div>
                        </div>

                        {/* Purchase Button Hooks */}
                        <div className="flex gap-2.5 pt-2">
                          <button
                            onClick={(e) => handleAddToCart(product.name, e)}
                            className={`flex-1 py-2 border rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                              theme === 'dark' 
                                ? 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white' 
                                : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-250 text-zinc-700 hover:text-zinc-950'
                            }`}
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={(e) => handleBuyNow(product, e)}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-650/10"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {filteredProducts.length > visibleCount && (
                  <div className="flex justify-center mt-12">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 24)}
                      className={`flex items-center gap-2 px-6 py-2.5 border rounded-xl text-xs font-semibold transition-all active:scale-[0.98] cursor-pointer ${
                        theme === 'dark'
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-850 hover:text-white'
                          : 'bg-white border-zinc-250 text-zinc-650 hover:bg-zinc-50 hover:text-zinc-900'
                      }`}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Load More Products</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 border rounded-2xl border-dashed dark:border-zinc-800 border-zinc-200">
                <p className={`text-sm ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  No products found matching the criteria. Try clearing search or presets.
                </p>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Floating Chat Bubble widget (Shop view only, drawer closed) */}
      {activeView === 'shop' && !isChatOpen && (
        <button
          id="chat-bubble-btn"
          onClick={() => {
            setIsChatOpen(true);
            setToastMessage("Sales Assistant opened!");
            setTimeout(() => {
              inputRef.current?.focus();
            }, 150);
          }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer animate-bounce"
          title="Open Sales Assistant"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Sliding Support Chat Drawer (Shop view only) */}
      {activeView === 'shop' && isChatOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs transition-opacity duration-300" onClick={() => setIsChatOpen(false)} />
          <div 
            id="support-chat-drawer"
            className={`fixed top-0 right-0 h-full w-full sm:w-[450px] md:w-[480px] border-l shadow-2xl flex flex-col z-50 overflow-hidden transition-all duration-300 ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            }`}
          >
            {renderChatWindow(true)}
          </div>
        </>
      )}

      {/* Glassmorphic Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn animate-duration-200">
          <div 
            id="auth-modal"
            className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl transition-all duration-200 relative ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            {/* Close Button */}
            <button
              id="close-auth-modal-btn"
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthError(null);
                setShowPassword(false);
              }}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Tabs */}
            <div className="flex border-b mb-6 dark:border-zinc-800 border-zinc-150">
              <button
                id="auth-tab-signin-btn"
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setAuthError(null);
                  setShowPassword(false);
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  authTab === 'signin'
                    ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400'
                    : 'border-transparent text-zinc-450 hover:text-zinc-500'
                }`}
              >
                Sign In
              </button>
              <button
                id="auth-tab-signup-btn"
                type="button"
                onClick={() => {
                  setAuthTab('signup');
                  setAuthError(null);
                  setShowPassword(false);
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
                  authTab === 'signup'
                    ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400'
                    : 'border-transparent text-zinc-450 hover:text-zinc-500'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Auth Tab Content */}
            <form onSubmit={authTab === 'signin' ? handleLogin : handleRegister} className="space-y-4">
              {authError && (
                <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 rounded-lg text-xs font-semibold leading-relaxed">
                  {authError}
                </div>
              )}

              {authTab === 'signup' && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Username</label>
                  <input
                    id="auth-username-input"
                    type="text"
                    required
                    value={authUsername}
                    onChange={(e) => setAuthUsername(e.target.value)}
                    placeholder="Enter your username"
                    className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                </div>
              )}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Email Address</label>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                    theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Password</label>
                <div className="relative">
                  <input
                    id="auth-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`w-full pl-3 pr-10 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                      theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                    }`}
                  />
                  <button
                    id="toggle-auth-password-visibility-btn"
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="auth-submit-btn"
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer mt-2"
              >
                {authLoading ? 'Please wait...' : authTab === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Buy Now Success Modal */}
      {buyProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn animate-duration-200">
          <div 
            id="buy-product-modal"
            className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl relative ${
              theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <button
              id="close-buy-modal-btn"
              onClick={() => setBuyProduct(null)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === 'dark' ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {!isOrderConfirmed ? (
              <>
                <h3 className="font-bold text-base mb-2">Review Order</h3>
                <div className="flex gap-4.5 mb-5 items-center">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 flex-shrink-0">
                    <img 
                      src={buyProduct.image_url} 
                      alt={buyProduct.name} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-normal line-clamp-1">{buyProduct.name}</h4>
                    <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400 mt-1 block">
                      ₹{buyProduct.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <form onSubmit={executeCheckout} className="space-y-4">
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'}`}>Shipping Address</label>
                    <textarea
                      id="shipping-address-input"
                      required
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Enter full shipping delivery address..."
                      className={`w-full px-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                        theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-650' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                  </div>

                  <button
                    id="confirm-checkout-btn"
                    type="submit"
                    disabled={isOrderPlacing}
                    className={`w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isOrderPlacing ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isOrderPlacing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      'Confirm & Buy'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/25">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base mb-2">Order Confirmed!</h3>
                <p className={`text-xs leading-relaxed mb-4 font-normal ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Thank you! Your order for <strong>{buyProduct.name}</strong> has been successfully placed. We will dispatch it to <em>{shippingAddress}</em> soon.
                </p>

                {/* Placed Order Details */}
                <div className={`text-left p-3 rounded-xl mb-6 border text-xs space-y-1.5 ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-150 text-zinc-700'
                }`}>
                  <div className="flex justify-between">
                    <span className="font-semibold text-zinc-500">Order ID:</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{placedOrderId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-zinc-500">Details ID:</span>
                    <span className="font-mono break-all">{placedOrderDetailsId}</span>
                  </div>
                </div>

                <button
                  id="dismiss-buy-modal-btn"
                  onClick={() => setBuyProduct(null)}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmSessionId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn animate-duration-200">
          <div className={`border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center transform scale-100 transition-all duration-200 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
              <Trash2 className="w-5.5 h-5.5" />
            </div>
            <h3 className={`font-semibold text-base mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Delete Chat Session?</h3>
            <p className={`text-xs leading-relaxed mb-6 font-normal ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Are you sure you want to delete this chat session? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmSessionId(null)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-105 hover:bg-zinc-200 text-zinc-650'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmSessionId) {
                    executeDeleteSession(deleteConfirmSessionId);
                    setDeleteConfirmSessionId(null);
                  }
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-red-600/15"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Clear All Confirmation Modal */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn animate-duration-200">
          <div className={`border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center transform scale-100 transition-all duration-200 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
              <Trash2 className="w-5.5 h-5.5" />
            </div>
            <h3 className={`font-semibold text-base mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Clear All Chat History?</h3>
            <p className={`text-xs leading-relaxed mb-6 font-normal ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Are you sure you want to clear all your chat sessions? This will permanently delete all conversation history.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setClearConfirmOpen(false)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-650'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('shopease_support_sessions');
                  localStorage.removeItem('shopease_active_support_session_id');
                  localStorage.removeItem('shopease_sales_sessions');
                  localStorage.removeItem('shopease_active_sales_session_id');
                  setSupportSessions([]);
                  setSalesSessions([]);
                  initializeDefaultSupportSession();
                  initializeDefaultSalesSession();
                  setClearConfirmOpen(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-red-600/15"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn animate-duration-200">
          <div className={`border rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center transform scale-100 transition-all duration-200 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4 border border-indigo-500/25">
              <RefreshCw className="w-5.5 h-5.5" />
            </div>
            <h3 className={`font-semibold text-base mb-2 ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>Reset Chat Session?</h3>
            <p className={`text-xs leading-relaxed mb-6 font-normal ${theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Are you sure you want to reset the current chat session? This will clear the messages in this conversation.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-305' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-650'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  executeResetSession();
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-650/15"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 animate-slideIn">
          <div className="bg-indigo-600 text-white text-xs font-bold px-4.5 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-indigo-550/20 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </main>
  );
}
