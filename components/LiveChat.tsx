
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MessageSquare, X, Send, User, Loader2, MinusCircle, Maximize2, ShieldCheck, Zap } from 'lucide-react';
import { AuthSession, UserRole } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LiveChatProps {
  session: AuthSession;
  context?: string; // Added optional context prop
}

const LiveChat: React.FC<LiveChatProps> = ({ session, context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${session.user.full_name}, I'm your AutoClaim Pro assistant. ${context ? "I have synced with your current dashboard view. How can I assist with your queue today?" : "How can I help you today?"}`,
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: `You are an expert support agent for AutoClaim Pro (First Mutual Holdings). 
          Role: ${session.user.role}. User: ${session.user.full_name}. 
          
          CURRENT DASHBOARD CONTEXT:
          ${context || "No specific dashboard context provided."}
          
          Instructions:
          - Use the context provided to answer questions about specific claims, billing, or policies.
          - If the user asks about a claim in the list, refer to its status and risk level.
          - Be professional, concise, and focused on helping the staff manage the repair lifecycle efficiently.
          - Use a helpful, authoritative, yet friendly tone.`,
        },
      });

      const streamResponse = await chat.sendMessageStream({ message: input });
      
      let assistantContent = "";
      setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

      for await (const chunk of streamResponse) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          assistantContent += text;
          setMessages(prev => {
            const last = prev[prev.length - 1];
            const others = prev.slice(0, -1);
            return [...others, { ...last, content: assistantContent }];
          });
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm having trouble connecting. Please try again later.", 
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
