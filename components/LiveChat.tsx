
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { MessageSquare, X, Send, User, Loader2, MinusCircle, Maximize2, ShieldCheck, Zap, ChevronDown, Sparkles, Database, Network } from 'lucide-react';
import { AuthSession, UserRole } from '../types';
import { aimsApi } from '../src/services/aimsApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface LiveChatProps {
  session: AuthSession;
  context?: string;
  onNavigate?: (tab: string) => void;
}

const LiveChat: React.FC<LiveChatProps> = ({ session, context, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${session.user.full_name}, I'm your AIMS AI Assistant. ${context ? "I'm synced with your dashboard. How can I help you navigate or manage your tasks?" : "How can I help you today?"}`,
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    const userMessage: Message = {
      role: 'user',
      content: userMsg,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add a placeholder for the assistant's response
    const assistantPlaceholder: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    setMessages(prev => [...prev, assistantPlaceholder]);

    try {
      // Use the platform-provided API key
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("AIMS Neural Link: API Key missing. Please configure in settings.");
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const tools = [
        {
          functionDeclarations: [
            {
              name: "getClaims",
              description: "Get all insurance claims in the system. Use this to answer questions about specific claims, statuses, or volumes.",
              parameters: { type: Type.OBJECT, properties: {} }
            },
            {
              name: "getStats",
              description: "Get system-wide statistics like total claims, payout ratios, and financial metrics.",
              parameters: { type: Type.OBJECT, properties: {} }
            },
            {
              name: "getStaff",
              description: "Get a list of all staff members, their roles, and current workload.",
              parameters: { type: Type.OBJECT, properties: {} }
            }
          ]
        }
      ];

      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are the AIMS (AutoClaim Information Management System) AI Navigator.
          User Role: ${session.user.role}. User: ${session.user.full_name}.
          
          CAPABILITIES:
          1. NAVIGATION: Help the user navigate. Suggest tab IDs like 'track', 'submit', 'history', 'policies' (Customer) or 'main', 'claims', 'billing' (Support).
          2. DATA: Access AIMS API via tools for real-time claim and staff data.
          3. SUPPORT: Professional guidance on insurance and repairs.
          
          RESPONSE FORMAT:
          - ALWAYS respond with a JSON object.
          - "reply": Your helpful text response.
          - "navigateTo": (Optional) Tab ID if the user wants to go somewhere.
          
          Be concise, professional, and use AIMS terminology.`,
          tools,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              navigateTo: { type: Type.STRING },
            },
            required: ["reply"]
          }
        }
      });

      let response = await chat.sendMessage({ message: userMsg });
      
      // Handle function calls
      while (response.functionCalls) {
        const functionResponses = [];
        for (const call of response.functionCalls) {
          let data;
          try {
            if (call.name === 'getClaims') data = await aimsApi.claims.getAll();
            else if (call.name === 'getStats') data = await aimsApi.system.getStats();
            else if (call.name === 'getStaff') data = await aimsApi.staff.getAll();
            
            functionResponses.push({
              name: call.name,
              response: { content: data },
              id: call.id
            });
          } catch (apiErr) {
            functionResponses.push({
              name: call.name,
              response: { error: "Failed to retrieve data from AIMS API" },
              id: call.id
            });
          }
        }
        response = await chat.sendMessage({
          message: functionResponses.map(res => ({
            functionResponse: res
          }))
        });
      }

      const fullText = response.text || '';

      // Final parse of the complete JSON
      try {
        const parsed = JSON.parse(fullText);
        if (parsed.navigateTo && onNavigate) {
          onNavigate(parsed.navigateTo);
        }
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = parsed.reply || "I've updated your view.";
            lastMsg.isStreaming = false;
          }
          return newMessages;
        });
      } catch (e) {
        // Fallback if JSON parsing fails
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg.role === 'assistant') {
            lastMsg.content = fullText || "I'm processing your request.";
            lastMsg.isStreaming = false;
          }
          return newMessages;
        });
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages.pop(); // Remove placeholder
        return [...newMessages, { 
          role: 'assistant', 
          content: "I'm having trouble connecting to the AIMS Neural Link. Please check your connection and try again.", 
          timestamp: new Date() 
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 md:bottom-10 md:right-10 w-16 h-16 bg-[#E31B23] text-white rounded-full shadow-[0_20px_50px_rgba(227,27,35,0.4)] flex items-center justify-center hover:scale-110 hover:bg-black transition-all z-[100] group"
      >
        <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full animate-pulse" />
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-[100] transition-all duration-500 ease-in-out flex flex-col overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.3)] border border-slate-100 bg-white
        ${isMinimized 
          ? 'bottom-4 right-4 md:bottom-10 md:right-10 w-72 h-16 rounded-2xl' 
          : 'bottom-0 right-0 w-full h-full md:bottom-10 md:right-10 md:w-[450px] md:h-[700px] md:max-h-[calc(100vh-8rem)] md:rounded-[40px]'
        }`}
    >
      <div className={`bg-black p-5 flex items-center justify-between text-white shrink-0 border-b-4 border-[#E31B23] ${isMinimized ? 'h-full' : ''}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#E31B23] rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest leading-none flex items-center gap-2">
              AIMS AI Assistant
              {!isMinimized && <Sparkles size={12} className="text-yellow-400 animate-pulse" />}
            </h3>
            {context && !isMinimized && (
              <div className="flex items-center gap-3 mt-1.5">
                <p className="text-[8px] font-black text-green-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Dashboard Synced
                </p>
                <span className="text-zinc-700 text-[8px]">|</span>
                <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Network size={8} /> Neural Link Active
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-2 hover:bg-white/10 rounded-xl transition-colors hidden md:block"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 size={18} /> : <MinusCircle size={18} />}
          </button>
          <button 
            onClick={() => setIsMinimized(!isMinimized)} 
            className="p-2 hover:bg-white/10 rounded-xl transition-colors md:hidden"
          >
            {isMinimized ? <Maximize2 size={18} /> : <ChevronDown size={18} />}
          </button>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/80 backdrop-blur-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[90%] md:max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0 mt-1 shadow-md">
                      <Zap size={14} className="text-[#E31B23]" />
                    </div>
                  )}
                  <div className={`p-5 rounded-3xl text-[13px] font-bold leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.isStreaming && !msg.content ? (
                      <div className="flex gap-1 py-1">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100 pb-10 md:pb-6">
            <div className="flex gap-3 items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your queue..."
                className="flex-1 bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:border-[#E31B23] transition-all placeholder:text-zinc-300"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                className="w-16 h-16 bg-[#E31B23] text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-xl disabled:opacity-50 active:scale-95"
              >
                <Send size={22} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 opacity-30">
              <ShieldCheck size={10} />
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Secure AI Handshake Encrypted</p>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default LiveChat;
