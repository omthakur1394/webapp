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
  ArrowDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threadId, setThreadId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Scroll and container references
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Load initial session and chat history on mount
  useEffect(() => {
    let id = sessionStorage.getItem('shopease_thread_id');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('shopease_thread_id', id);
    }
    setThreadId(id);

    const savedHistory = localStorage.getItem('shopease_chat_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(parsed);
      } catch (err) {
        console.error('Failed to parse chat history:', err);
        setInitialWelcomeMessage();
      }
    } else {
      setInitialWelcomeMessage();
    }
  }, []);

  // Set the default initial assistant message
  const setInitialWelcomeMessage = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: "Hi there! I'm ShopEase Support, your personal digital shopping assistant. How can I help you today? You can ask about order tracking, returns, active promotions, or product sizing!",
        timestamp: new Date()
      }
    ]);
  };

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('shopease_chat_history', JSON.stringify(messages));
    }
  }, [messages]);

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

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
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
          thread_id: threadId
        })
      });

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      
      // Clean citation markers before saving to state
      const cleanedResponse = cleanCitation(data.res || '');

      const botMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: cleanedResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err: any) {
      console.error('Chat API request failed:', err);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting to the support server right now. Please check your network and try again.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handleResetSession = () => {
    if (confirm("Are you sure you want to reset this chat session? This will clear memory and start a new conversation.")) {
      const newId = crypto.randomUUID();
      sessionStorage.setItem('shopease_thread_id', newId);
      setThreadId(newId);
      localStorage.removeItem('shopease_chat_history');
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: "Session reset. Hello! I'm ShopEase Support. How can I help you today?",
          timestamp: new Date()
        }
      ]);
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

  // Helper to find the last user message for the retry button
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');



  return (
    <main className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900 font-sans items-center justify-center p-0 sm:p-4">
      {/* Main Chat Container */}
      <section className="w-full sm:max-w-4xl h-screen sm:h-[88vh] bg-white sm:rounded-2xl sm:border border-zinc-200 sm:shadow-xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-zinc-150 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
                <Bot className="w-5.5 h-5.5" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold text-zinc-900 text-sm md:text-base leading-none">ShopEase Support</h2>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Ask order, shipping, & sizing questions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset Chat Control */}
            <button
              onClick={handleResetSession}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-all active:scale-[0.98]"
              title="Reset Chat Session"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Session</span>
            </button>
            <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50/50 px-2.5 py-1.5 rounded-lg border border-indigo-100 text-indigo-700 text-[10px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>PROXIED SECURITY</span>
            </div>
          </div>
        </header>

        {/* Scrollable Chat Area */}
        <div 
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 md:p-6 space-y-5 bg-zinc-50/30 relative"
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
                      ? 'bg-zinc-100 border border-zinc-200 text-zinc-600' 
                      : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Bubble Column */}
                <div className="flex flex-col gap-1 group max-w-full">
                  {/* Bubble - Text Size set to text-xs */}
                  <div
                    className={`relative px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isBot
                        ? 'bg-white border border-zinc-200 text-zinc-800 rounded-tl-none'
                        : 'bg-indigo-600 text-white rounded-tr-none font-medium'
                    }`}
                  >
                    {isBot ? (
                      <div className="markdown-body">
                        <ReactMarkdown
                          components={{
                            ul: ({ node, ...props }) => <ul className="space-y-1.5 my-2.5 list-disc pl-5" {...props} />,
                            ol: ({ node, ...props }) => <ol className="space-y-1.5 my-2.5 list-decimal pl-5" {...props} />,
                            li: ({ node, ...props }) => <li className="text-zinc-700 pl-0.5" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-zinc-800 leading-relaxed" {...props} />,
                            strong: ({ node, ...props }) => <strong className="font-semibold text-zinc-950" {...props} />,
                            code: ({ node, ...props }) => (
                              <code className="px-1.5 py-0.5 rounded bg-zinc-100 text-indigo-700 font-mono text-[11px] border border-zinc-200" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                              <a
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2 transition-colors inline-flex items-center gap-0.5"
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
                      className="absolute top-1 right-1 p-1 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
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
                          setMessages(prev => prev.filter(m => m.id !== message.id));
                          handleSendMessage(lastUserMessage.content);
                        }}
                        className="mt-2.5 flex items-center gap-1.5 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-semibold transition-all active:scale-[0.98] w-fit"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry Query
                      </button>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span
                    className={`text-[9px] text-zinc-400 font-medium px-1 flex items-center gap-1 ${
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
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="bg-white border border-zinc-200 text-zinc-800 px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 h-8">
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="text-[9px] text-zinc-400 px-1">ShopEase Support is typing...</span>
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
            className="absolute bottom-24 right-6 p-2.5 rounded-full bg-white hover:bg-zinc-50 border border-zinc-200 text-indigo-600 hover:text-indigo-800 shadow-lg transition-all hover:scale-105 active:scale-95 animate-bounce z-20 flex items-center justify-center cursor-pointer"
            title="Scroll to bottom"
          >
            <ArrowDown className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Bottom Input Zone */}
        <footer className="border-t border-zinc-200 bg-white px-4 py-4 md:px-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto w-full">
            <form onSubmit={handleFormSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                maxLength={1000}
                placeholder={isLoading ? "Please wait..." : "Ask ShopEase support anything..."}
                disabled={isLoading}
                className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-zinc-900 placeholder-zinc-400 rounded-xl px-4 py-3 text-xs transition-all focus:outline-none disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-100 text-white disabled:text-zinc-400 px-4.5 rounded-xl transition-all duration-200 flex items-center justify-center shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:shadow-none"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            
            <p className="text-[9px] text-zinc-400 mt-2.5 text-center flex items-center justify-between px-1">
              <span className="flex items-center gap-0.5 text-indigo-600 font-medium">
                <ShieldCheck className="w-3 h-3" /> SSL Shield Active
              </span>
              <span>{inputValue.length} / 1000 characters</span>
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}
