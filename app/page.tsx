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
  MicOff
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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

export default function Home() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Custom modals confirmation states
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  
  // Scroll and container references
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Voice recognition states & refs
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const initialInputRef = useRef<string>('');

  // Derived state: current active session and its messages
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  // Load initial session, theme, and chat history on mount
  useEffect(() => {
    // Load theme
    const savedTheme = localStorage.getItem('shopease_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    const savedSessions = localStorage.getItem('shopease_chat_sessions');
    const savedActiveId = localStorage.getItem('shopease_active_session_id');

    if (savedSessions) {
      try {
        const parsed: ChatSession[] = JSON.parse(savedSessions).map((s: any) => ({
          ...s,
          createdAt: new Date(s.createdAt || Date.now()),
          updatedAt: new Date(s.updatedAt || Date.now()),
          messages: s.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
        }));
        setSessions(parsed);
        if (savedActiveId && parsed.some(s => s.id === savedActiveId)) {
          setActiveSessionId(savedActiveId);
        } else if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        } else {
          createNewSession(parsed);
        }
      } catch (err) {
        console.error('Failed to parse chat sessions:', err);
        initializeDefaultSession();
      }
    } else {
      // Check for legacy single-session chat history to migrate
      const legacyHistory = localStorage.getItem('shopease_chat_history');
      if (legacyHistory) {
        try {
          const parsedMessages = JSON.parse(legacyHistory).map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          const legacyThreadId = sessionStorage.getItem('shopease_thread_id') || crypto.randomUUID();
          
          // Determine title from first user message if possible
          const firstUserMsg = parsedMessages.find((m: any) => m.role === 'user');
          const title = firstUserMsg 
            ? (firstUserMsg.content.length > 30 ? firstUserMsg.content.substring(0, 30) + '...' : firstUserMsg.content)
            : 'Imported Chat';

          const migratedSession: ChatSession = {
            id: legacyThreadId,
            title,
            messages: parsedMessages,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          setSessions([migratedSession]);
          setActiveSessionId(legacyThreadId);
          localStorage.setItem('shopease_chat_sessions', JSON.stringify([migratedSession]));
          localStorage.setItem('shopease_active_session_id', legacyThreadId);
          
          // Clear legacy history to prevent re-migration
          localStorage.removeItem('shopease_chat_history');
        } catch (err) {
          console.error('Failed to migrate legacy chat history:', err);
          initializeDefaultSession();
        }
      } else {
        initializeDefaultSession();
      }
    }
  }, []);

  // Default welcome session initializer
  const initializeDefaultSession = () => {
    const welcomeId = crypto.randomUUID();
    const welcomeSession: ChatSession = {
      id: welcomeId,
      title: 'Welcome Chat',
      messages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hi there! I'm ShopEase Support, your personal digital shopping assistant. How can I help you today? You can ask about order tracking, returns, active promotions, or product sizing!",
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSessions([welcomeSession]);
    setActiveSessionId(welcomeId);
    localStorage.setItem('shopease_chat_sessions', JSON.stringify([welcomeSession]));
    localStorage.setItem('shopease_active_session_id', welcomeId);
  };

  // Create new session
  const createNewSession = (existingSessions: ChatSession[] = sessions) => {
    const newId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Hi there! I'm ShopEase Support, your personal digital shopping assistant. How can I help you today? You can ask about order tracking, returns, active promotions, or product sizing!",
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updated = [newSession, ...existingSessions];
    setSessions(updated);
    setActiveSessionId(newId);
    setInputValue('');
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmSessionId(id);
  };

  const executeDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        // If no sessions remain, create a welcome session
        const newId = crypto.randomUUID();
        const newSession: ChatSession = {
          id: newId,
          title: 'Welcome Chat',
          messages: [
            {
              id: 'welcome',
              role: 'assistant',
              content: "Hi there! I'm ShopEase Support, your personal digital shopping assistant. How can I help you today? You can ask about order tracking, returns, active promotions, or product sizing!",
              timestamp: new Date()
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setSessions([newSession]);
        setActiveSessionId(newId);
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
    setSessions(prev => prev.map(s => {
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

  // Save sessions to local storage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('shopease_chat_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Save active session ID
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('shopease_active_session_id', activeSessionId);
    }
  }, [activeSessionId]);

  // Save theme selection to localStorage
  useEffect(() => {
    localStorage.setItem('shopease_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
  }, [messages, isLoading]);

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
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const currentSessionId = activeSessionId;
    if (!currentSessionId) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    // Append user message and auto-generate title if it's the default welcome/new chat title
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        let newTitle = s.title;
        if (s.title === 'New Chat' || s.title === 'Welcome Chat') {
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
          thread_id: currentSessionId
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

      setSessions(prev => prev.map(s => {
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
      console.error('Chat API request failed:', err);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to the support server right now. Please check your network and try again.",
        timestamp: new Date(),
        isError: true
      };
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, errorMessage],
            updatedAt: new Date()
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
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
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: 'Reset Chat',
          messages: [
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: "Session reset. Hello! I'm ShopEase Support. How can I help you today?",
              timestamp: new Date()
            }
          ],
          updatedAt: new Date()
        };
      }
      return s;
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to find the last user message for the retry button
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');



  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className={`flex flex-col min-h-screen font-sans items-center justify-center p-0 sm:p-4 transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Main Container wrapping Sidebar and Chat */}
      <div className={`w-full sm:max-w-6xl h-screen sm:h-[88vh] sm:rounded-2xl sm:border sm:shadow-xl flex flex-row overflow-hidden relative transition-all duration-300 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
        
        {/* Sidebar Backdrop for Mobile */}
        {isSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <aside 
          className={`
            flex flex-col transition-all duration-300 h-full border-r z-40
            fixed inset-y-0 left-0 transform md:relative md:translate-x-0
            ${theme === 'dark' ? 'bg-zinc-950 text-zinc-200 border-zinc-900' : 'bg-zinc-100 text-zinc-800 border-zinc-200'}
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
                    ShopEase Support
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
                  title="Collapse sidebar"
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

            {/* Search Chats (only when open) */}
            {isSidebarOpen ? (
              <div className="px-3 pb-3 w-full flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-9 pr-8 py-2 border text-xs transition-all focus:outline-none rounded-lg ${theme === 'dark' ? 'bg-zinc-900/60 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 text-white placeholder-zinc-550' : 'bg-zinc-200/50 border-zinc-300 focus:border-zinc-450 focus:ring-1 focus:ring-zinc-400 text-zinc-900 placeholder-zinc-500'}`}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-550 ${theme === 'dark' ? 'hover:text-white' : 'hover:text-zinc-900'}`}
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
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'}`}
                  title="Search chats"
                >
                  <Search className="w-4.5 h-4.5" />
                </button>
              </div>
            )}

            {/* Recent Chats Section */}
            <div className="flex-1 overflow-y-auto px-2 w-full space-y-1">
              {isSidebarOpen && (
                <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Recent Chats
                </div>
              )}
              
              {isSidebarOpen ? (
                filteredSessions.length > 0 ? (
                  filteredSessions.map((session) => {
                    const isActive = session.id === activeSessionId;
                    const isEditing = session.id === editingSessionId;

                    return (
                      <div
                        key={session.id}
                        onClick={() => !isEditing && setActiveSessionId(session.id)}
                        className={`
                          group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer
                          ${isActive 
                            ? (theme === 'dark' ? 'bg-indigo-650/15 text-white border-l-2 border-indigo-500 font-semibold' : 'bg-indigo-100 text-indigo-950 border-l-2 border-indigo-600 font-semibold') 
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
                              title="Rename Chat"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className={`p-1 rounded transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-850 text-zinc-500 hover:text-red-400' : 'hover:bg-zinc-200 text-zinc-500 hover:text-red-650'}`}
                              title="Delete Chat"
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
                /* Rail list of recent sessions */
                filteredSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <button
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`
                        w-full flex justify-center py-2.5 rounded-xl transition-all cursor-pointer mb-1
                        ${isActive ? (theme === 'dark' ? 'bg-indigo-650/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600') : (theme === 'dark' ? 'text-zinc-500 hover:bg-zinc-900 hover:text-white' : 'text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900')}
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
                <div className="flex items-center justify-between w-full text-[10px] px-1.5 font-medium">
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
                  className={`p-2 rounded-xl transition-all cursor-pointer ${theme === 'dark' ? 'hover:bg-zinc-900 text-zinc-500 hover:text-red-400' : 'hover:bg-zinc-200 text-zinc-500 hover:text-red-650'}`}
                  title="Clear All Chats"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Right Chat Container */}
        <section className={`flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'}`}>
          
          {/* Header */}
          <header className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-150'}`}>
            <div className="flex items-center gap-3">
              {/* Toggle Sidebar Button */}
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

              <div className="relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border text-indigo-650 ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700' : 'bg-indigo-50 border-indigo-100'}`}>
                  <Bot className="w-5.5 h-5.5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className={`font-semibold text-sm md:text-base leading-none ${theme === 'dark' ? 'text-white' : 'text-zinc-900'}`}>ShopEase Support</h2>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${theme === 'dark' ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    Online
                  </span>
                </div>
                <p className={`text-[11px] mt-1 ${theme === 'dark' ? 'text-zinc-455' : 'text-zinc-500'}`}>Ask order, shipping, & sizing questions</p>
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
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-all active:scale-[0.98] cursor-pointer ${theme === 'dark' ? 'text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-800 border-zinc-700' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200'}`}
                title="Reset Current Chat Session"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Session</span>
              </button>
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium ${theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900 text-indigo-400' : 'bg-indigo-50/50 border-indigo-100 text-indigo-700'}`}>
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span>PROXIED SECURITY</span>
              </div>
            </div>
          </header>

          {/* Scrollable Chat Area */}
          <div 
            ref={chatContainerRef}
            onScroll={handleScroll}
            className={`flex-1 overflow-y-auto px-4 py-6 md:p-6 space-y-5 relative transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-950/20' : 'bg-zinc-50/30'}`}
          >
            {messages.map((message) => {
              const isBot = message.role === 'assistant';
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
                        ? (theme === 'dark' ? 'bg-zinc-800 border border-zinc-700 text-zinc-400' : 'bg-zinc-100 border border-zinc-200 text-zinc-600')
                        : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                    }`}
                  >
                    {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble Column */}
                  <div className="flex flex-col gap-1 group max-w-full">
                    {/* Bubble */}
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
                                <code className={`px-1.5 py-0.5 rounded font-mono text-[11px] border ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-indigo-400' : 'bg-zinc-100 border-zinc-205 text-indigo-700'}`} {...props} />
                              ),
                              a: ({ node, ...props }) => (
                                <a
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`font-medium underline underline-offset-2 transition-colors inline-flex items-center gap-0.5 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                                  {...props}
                                />
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}

                      {/* Quick utility: Copy button */}
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className={`absolute top-1 right-1 p-1 border rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 cursor-pointer ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200' : 'bg-zinc-50 border-zinc-205 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-855'}`}
                        title="Copy to clipboard"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {/* Individual Message Retry Button */}
                      {message.isError && lastUserMessage && (
                        <button
                          onClick={() => {
                            setSessions(prev => prev.map(s => {
                              if (s.id === activeSessionId) {
                                return {
                                  ...s,
                                  messages: s.messages.filter(m => m.id !== message.id)
                                };
                              }
                              return s;
                            }));
                            handleSendMessage(lastUserMessage.content);
                          }}
                          className={`mt-2.5 flex items-center gap-1.5 px-3 py-1 border rounded-lg text-[10px] font-semibold transition-all active:scale-[0.98] w-fit cursor-pointer ${theme === 'dark' ? 'bg-red-950/20 hover:bg-red-950/40 text-red-400 border-red-900/40' : 'bg-red-50 hover:bg-red-100 text-red-750 border border-red-200'}`}
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retry Query
                        </button>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span
                      className={`text-[9px] font-medium px-1 flex items-center gap-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'} ${
                        isBot ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Bouncing Dots Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 max-w-[75%] mr-auto animate-fadeIn">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-405' : 'bg-zinc-100 border-zinc-200 text-zinc-600'}`}>
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className={`border px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-8 ${theme === 'dark' ? 'bg-zinc-805 border-zinc-700 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-zinc-500' : 'bg-zinc-400'}`} style={{ animationDelay: '0ms' }}></span>
                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-zinc-500' : 'bg-zinc-400'}`} style={{ animationDelay: '150ms' }}></span>
                    <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${theme === 'dark' ? 'bg-zinc-500' : 'bg-zinc-400'}`} style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className={`text-[9px] px-1 ${theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'}`}>ShopEase Support is typing...</span>
                </div>
              </div>
            )}

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to Bottom Floating Button */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom()}
              className={`absolute bottom-24 right-6 p-2.5 rounded-full border shadow-lg transition-all hover:scale-105 active:scale-95 animate-bounce z-20 flex items-center justify-center cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-indigo-400 hover:text-indigo-305' : 'bg-white border-zinc-200 text-indigo-650 hover:text-indigo-800'}`}
              title="Scroll to bottom"
            >
              <ArrowDown className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Bottom Input Zone */}
          <footer className={`border-t px-4 py-4 md:px-6 flex-shrink-0 transition-colors duration-300 ${theme === 'dark' ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="max-w-4xl mx-auto w-full">
              <form onSubmit={handleFormSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  maxLength={1000}
                  placeholder={isLoading ? "Please wait..." : "Ask ShopEase support anything..."}
                  disabled={isLoading}
                  className={`flex-1 focus:ring-1 text-xs transition-all focus:outline-none disabled:opacity-60 rounded-xl px-4 py-3 ${theme === 'dark' ? 'bg-zinc-950 border-zinc-800 focus:border-indigo-600 focus:ring-indigo-600 text-white placeholder-zinc-550' : 'bg-zinc-50 border-zinc-200 focus:border-indigo-600 focus:ring-indigo-600 text-zinc-900 placeholder-zinc-400'}`}
                />

                {/* Voice Input Mic Button */}
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isLoading}
                  className={`px-3.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                    ${isListening 
                      ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 animate-pulse' 
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
                  <ShieldCheck className="w-3 h-3" /> SSL Shield Active
                </span>
                <span>{inputValue.length} / 1000 characters</span>
              </p>
            </div>
          </footer>
        </section>
      </div>

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
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-650'}`}
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
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-red-600/15"
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
                  localStorage.removeItem('shopease_chat_sessions');
                  localStorage.removeItem('shopease_active_session_id');
                  initializeDefaultSession();
                  setClearConfirmOpen(false);
                }}
                className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-red-600/15"
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
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${theme === 'dark' ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-650'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  executeResetSession();
                  setResetConfirmOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-indigo-600/15"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
