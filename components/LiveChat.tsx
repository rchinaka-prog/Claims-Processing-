
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { MessageSquare, X, Send, User, Loader2, MinusCircle, Maximize2, ShieldCheck, Zap } from 'lucide-react';
import { AuthSession, UserRole } from '../types';
import { aimsApi } from '../src/services/aimsApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: input,
        config: {
          systemInstruction: `You are the AIMS (AutoClaim Information Management System) AI Navigator.
          User Role: ${session.user.role}. User: ${session.user.full_name}.
          
          CAPABILITIES:
          1. NAVIGATION: You can help the user navigate the app. If they want to see "claims", "stats", "staff", or "settings", suggest the appropriate tab.
          2. DATA RETRIEVAL: You have access to the AIMS API (aimsApi) for claims, staff, and system stats.
          3. SUPPORT: Answer questions about insurance policies and repair lifecycles.
          
          CONTEXT:
          ${context || "Main Dashboard"}
          
          AVAILABLE TABS (Role Dependent):
          - Customer: 'track', 'new', 'history'
          - Support: 'main', 'claims', 'staff', 'audit'
          - Manager: 'overview', 'performance', 'risk'
          
          INSTRUCTIONS:
          - If the user wants to navigate, respond with a JSON object in your text if possible, or just tell them where to go.
          - Be extremely professional and efficient.
          - Use the AIMS API terminology: "Claims Ledger", "Staff Load", "Compliance Index".`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING, description: "Your text response to the user" },
              navigateTo: { type: Type.STRING, description: "The tab ID to navigate to, if applicable" },
              apiAction: { type: Type.STRING, description: "The AIMS API action to perform, if applicable" }
            },
            required: ["reply"]
          }
        },
      });

      const result = JSON.parse(response.text || '{}');
      
      if (result.navigateTo && onNavigate) {
        onNavigate(result.navigateTo);
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.reply || "I'm here to help.", 
        timestamp: new Date() 
      }]);

    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting to the AIMS Neural Link. Please try again.", 
        timestamp: new Date() 
      }]);
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
      className={`fixed bottom-4 right-4 md:bottom-10 md:right-10 w-[calc(100vw-2rem)] md:w-[420px] bg-white rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.2)] flex flex-col z-[100] overflow-hidden transition-all duration-300 border border-slate-100 ${
        isMinimized ? 'h-16' : 'h-[550px] md:h-[650px] max-h-[calc(100vh-6rem)]'
      }`}
    >
      <div className="bg-black p-5 flex items-center justify-between text-white shrink-0 border-b-4 border-[#E31B23]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#E31B23] rounded-xl flex items-center justify-center">
            <Zap size={20} fill="currentColor" />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest leading-none">AIMS AI Assistant</h3>
            {context && !isMinimized && (
              <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mt-1.5 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Dashboard Synced
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><MinusCircle size={18} /></button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={18} /></button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`p-5 rounded-3xl text-[12px] font-bold leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-black text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.content}
                    {isLoading && idx === messages.length - 1 && !msg.content && <Loader2 size={14} className="animate-spin opacity-50" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-5 bg-white border-t border-slate-100">
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your queue..."
                className="flex-1 bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-[#E31B23] transition-all"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !input.trim()} 
                className="w-14 h-14 bg-[#E31B23] text-white rounded-2xl flex items-center justify-center hover:bg-black transition-all shadow-xl disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-[8px] font-black text-zinc-300 uppercase text-center mt-4 tracking-[0.2em]">Secure AI Handshake Encrypted</p>
          </form>
        </>
      )}
    </div>
  );
};

export default LiveChat;
