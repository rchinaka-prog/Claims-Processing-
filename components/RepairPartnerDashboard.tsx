import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge, NeuralFeed } from './Shared';
import { 
  Clock, Settings, MessageSquare, Send, X, ArrowLeft, 
  Star, ClipboardCheck, Camera, Check, FileImage, 
  User, ShieldCheck, Zap, Factory, AlertCircle, Wrench,
  MessageCircle, LogOut, Loader2, UserRound, ShieldAlert,
  Search, Terminal, DollarSign, TrendingUp, Landmark, 
  Wallet, Receipt, History, ImagePlus, FileCheck, CheckCircle2,
  Lock, ArrowRightLeft, Shield, Trophy
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ProgressLog {
  id: string;
  timestamp: string;
  description: string;
  photos: string[];
}

interface ChatMessage {
  id: string;
  sender: 'Repairer' | 'Assessor' | 'Support';
  text: string;
  time: string;
}

interface Job {
  id: string;
  customer: string;
  vehicle: string;
  registration: string;
  status: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  budget: number;
  requestedAmount?: number;
  negotiationStatus?: 'IDLE' | 'PENDING' | 'APPROVED' | 'COUNTER';
  progress: number;
  dateReceived: string;
  taskDescription: string;
  checklist: { label: string; completed: boolean; dueDate?: string }[];
  progressLogs: ProgressLog[];
  fixedCarPhotos: string[];
  isAccepted: boolean;
  assessorName: string;
  chatHistory: ChatMessage[];
  financeHistory: ChatMessage[];
}

interface RepairPartnerDashboardProps {
  onLogout: () => void;
}

const RepairPartnerDashboard: React.FC<RepairPartnerDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'reputation'>('active');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'assessor' | 'finance'>('assessor');
  const [chatInput, setChatInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [partnerStats] = useState({ 
    rating: 4.9, 
    reviews: 142, 
    completed: 128, 
    acceptanceRate: '98%',
    liquidityTrust: 'Elite',
    avgPayout: '4.2 Days'
  });

  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('/api/claims');
        if (response.ok) {
          const data = await response.json();
          const mappedJobs = data.map((c: any) => ({
            id: c.id,
            customer: c.customer || c.owner,
            vehicle: c.vehicle || c.car,
            registration: c.regNo,
            status: c.status,
            priority: c.priority,
            budget: c.coverage,
            progress: c.progress || 0,
            dateReceived: c.submittedAt || new Date().toISOString(),
            taskDescription: c.userStatement,
            isAccepted: c.status !== 'REPAIRER ASSIGNED',
            assessorName: c.assignedAssessor || 'Marcus Flint',
            fixedCarPhotos: [],
            checklist: [
              { label: 'Structural Inspection', completed: false, dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0] }, 
              { label: 'System Sync', completed: false, dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0] }
            ],
            progressLogs: [],
            chatHistory: [],
            financeHistory: []
          }));
          setJobs(mappedJobs);
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      }
    };
    fetchJobs();
  }, []);

  const activeJob = jobs.find(j => j.id === selectedJobId);

  useEffect(() => {
    if (selectedJobId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeJob?.chatHistory, activeJob?.financeHistory, isTyping, selectedJobId, chatMode]);

  const handleAcceptJob = (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, isAccepted: true, status: 'REPAIR IN_PROGRESS' } : j));
  };

  const toggleChecklist = (jobId: string, label: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== jobId) return j;
      const newChecklist = j.checklist.map(item => 
        item.label === label ? { ...item, completed: !item.completed } : item
      );
      const completedCount = newChecklist.filter(i => i.completed).length;
      const progress = Math.round((completedCount / newChecklist.length) * 100);
      return { ...j, checklist: newChecklist, progress };
    }));
  };

  const updateTaskDueDate = (jobId: string, label: string, dueDate: string) => {
    setJobs(prev => prev.map(j => {
      if (j.id !== jobId) return j;
      const newChecklist = j.checklist.map(item => 
        item.label === label ? { ...item, dueDate } : item
      );
      return { ...j, checklist: newChecklist };
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && activeJob) {
      // Cast FileList to File array to ensure the 'file' variable is recognized as a Blob by FileReader.readAsDataURL.
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, fixedCarPhotos: [...j.fixedCarPhotos, reader.result as string] } : j));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const initializeNegotiation = async () => {
    if (!amountInput || !activeJob) return;
    setIsNegotiating(true);
    const amount = parseFloat(amountInput);
    
    setJobs(prev => prev.map(j => j.id === activeJob.id ? { 
      ...j, 
      requestedAmount: amount, 
      negotiationStatus: 'PENDING',
      financeHistory: [...j.financeHistory, {
        id: Date.now().toString(),
        sender: 'Repairer',
        text: `Requesting adjustment to settlement. Proposed amount: $${amount.toLocaleString()}. Budget discrepancy explained in previous logs.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]
    } : j));

    setAmountInput('');
    setIsTyping(true);

    try {
      // Initialize with apiKey as a string to ensure type safety in generateContent parameters
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a Finance & Billing specialist for First Mutual Insurance. 
        A repairer is requesting a sum of $${amount} for claim ${activeJob.id}. The original budget was $${activeJob.budget}.
        Respond to the repairer. Be formal, mention "policy ceiling", "audit cycle", and either ask for more proof or say you are reviewing it with the manager.`,
      });

      const supportMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        sender: 'Support', 
        text: response.text || "Financial request acknowledged. Routing to Billing Hub for audit.", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };

      setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, financeHistory: [...j.financeHistory, supportMsg] } : j));
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
      setIsNegotiating(false);
    }
  };

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeJob) return;

    const currentText = chatInput;
    const historyKey = chatMode === 'assessor' ? 'chatHistory' : 'financeHistory';
    const sender = 'Repairer';
    const msg: ChatMessage = { 
      id: Date.now().toString(), 
      sender, 
      text: currentText, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };

    setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, [historyKey]: [...(j[historyKey] as any), msg] } : j));
    setChatInput('');
    setIsTyping(true);

    try {
      // Initialize with apiKey as a string to ensure type safety in generateContent parameters
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const rolePrompt = chatMode === 'assessor' ? 
        `You are ${activeJob.assessorName}, a professional insurance assessor.` : 
        `You are the Finance Hub agent for Nicoz Diamond Insurance.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${rolePrompt} A repair partner is messaging you about Job ${activeJob.id}. 
        Msg: "${currentText}". Respond appropriately.`,
      });

      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        sender: chatMode === 'assessor' ? 'Assessor' : 'Support', 
        text: response.text || "Message acknowledged. Syncing with system.", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };

      setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, [historyKey]: [...(j[historyKey] as any), aiMsg] } : j));
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-4 md:p-10 space-y-6 md:space-y-10">
      <div className="space-y-1 px-1 flex justify-between items-end">
        <div>
          <p className="text-[9px] font-bold text-[#E31B23] uppercase tracking-[0.3em] italic leading-none">ENTERPRISE PORTAL</p>
          <h1 className="text-xl md:text-3xl font-bold text-black uppercase tracking-tight italic leading-none">REPAIRER CONSOLE</h1>
        </div>
        <button onClick={onLogout} className="p-3 bg-white rounded-xl shadow-sm text-zinc-400 hover:text-black transition-all">
          <LogOut size={20} />
        </button>
      </div>

      <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-full sm:w-fit shadow-sm overflow-x-auto no-scrollbar">
        {['active', 'reputation'].map(t => (
          <button key={t} onClick={() => { setActiveTab(t as any); setSelectedJobId(null); }} className={`flex-1 sm:flex-none px-6 md:px-10 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === t ? 'bg-black text-white shadow-md' : 'text-zinc-400'}`}>
            {t === 'active' ? 'Workshop' : 'Trust Index'}
          </button>
        ))}
      </div>

      {activeTab === 'active' && !selectedJobId && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {jobs.map(job => (
            <Card key={job.id} className="p-6 md:p-10 bg-white border-none shadow-xl rounded-2xl md:rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8 relative overflow-hidden group">
              <div className="flex-1 space-y-5 md:space-y-6 w-full">
                <div className="flex flex-wrap gap-2 md:gap-3">
                  <div className="bg-black text-white px-3 py-1 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-md md:rounded-lg">{job.id}</div>
                  <Badge status={job.priority} className="px-3 py-1 text-[8px] md:text-[9px] font-bold rounded-md md:rounded-lg uppercase">{job.priority}</Badge>
                  {job.negotiationStatus === 'PENDING' && <Badge className="bg-yellow-50 text-yellow-600 border-yellow-100 text-[8px] font-bold rounded-md uppercase">Fin Review</Badge>}
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-4xl font-bold text-black uppercase tracking-tight italic leading-none truncate">{job.registration}</h2>
                  <p className="text-[11px] md:text-sm font-bold text-zinc-400 uppercase italic truncate">{job.customer} • {job.vehicle}</p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 italic text-[10px] font-bold text-slate-500">
                    Budget: ${job.budget.toLocaleString()}
                  </div>
                  {job.requestedAmount && (
                    <div className="bg-[#E31B23]/5 px-4 py-2 rounded-lg border border-[#E31B23]/10 italic text-[10px] font-black text-[#E31B23]">
                      Requested: ${job.requestedAmount.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full lg:w-[320px] shrink-0 space-y-4">
                {!job.isAccepted ? (
                  <Button onClick={() => handleAcceptJob(job.id)} className="w-full h-14 md:h-16 bg-[#812323] text-[9px] md:text-[10px] font-bold shadow-lg rounded-xl md:rounded-2xl">ACCEPT TASK</Button>
                ) : (
                  <Button onClick={() => setSelectedJobId(job.id)} className="w-full h-14 md:h-16 bg-black text-[9px] md:text-[10px] font-bold shadow-lg rounded-xl md:rounded-2xl">OPEN LOG</Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedJobId && activeJob && (
        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
            <button onClick={() => setSelectedJobId(null)} className="flex items-center gap-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-all italic group">
              <ArrowLeft size={16} /> Back to Workshop
            </button>
            <div className="flex items-center gap-4">
              <Badge status="success" className="text-[8px] md:text-[9px] font-bold px-4 md:px-5 py-1.5 rounded-md md:rounded-lg border-none bg-green-50 text-green-600 uppercase">AIMS SYNC ACTIVE</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
            <div className="lg:col-span-8 space-y-6 md:space-y-8">
               <Card className="p-6 md:p-10 bg-black text-white rounded-[24px] md:rounded-[32px] border-none shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-all duration-1000"><Wrench size={180} md:size={240} /></div>
                 <div className="relative z-10 space-y-8 md:space-y-10">
                   <div>
                     <p className="text-[8px] md:text-[9px] font-bold text-[#E31B23] uppercase tracking-widest italic mb-3 md:mb-4">ACTIVE COMMAND</p>
                     <h2 className="text-4xl md:text-7xl font-bold italic uppercase leading-none tracking-tight truncate">{activeJob.registration}</h2>
                     <p className="text-base md:text-lg font-bold text-zinc-500 uppercase italic mt-3 md:mt-4 truncate">{activeJob.vehicle}</p>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 pt-8 md:pt-10 border-t border-white/10">
                     <div className="space-y-1">
                       <p className="text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic">Budget Hub</p>
                       <p className="text-lg md:text-xl font-bold italic uppercase text-white truncate">${activeJob.budget.toLocaleString()}</p>
                     </div>
                     <div className="space-y-1">
                       <p className="text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic">Delta</p>
                       <p className="text-3xl md:text-5xl font-bold italic text-[#E31B23] leading-none">{activeJob.progress}%</p>
                     </div>
                   </div>
                 </div>
               </Card>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* Task Checklist Card */}
                  <Card className="p-8 bg-white border-none shadow-xl rounded-[24px] space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-zinc-50 rounded-xl shadow-inner text-black"><ClipboardCheck size={20} /></div>
                        <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Task Checklist</h3>
                      </div>
                      <Badge className="bg-zinc-50 border-none text-[8px] text-zinc-400 font-bold">
                        {activeJob.checklist.filter(i => i.completed).length}/{activeJob.checklist.length} DONE
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {activeJob.checklist.map((task, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl hover:bg-white hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4 flex-1">
                            <button 
                              onClick={() => toggleChecklist(activeJob.id, task.label)}
                              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-zinc-200 text-transparent hover:border-black'}`}
                            >
                              <Check size={14} />
                            </button>
                            <div className="flex-1">
                              <p className={`text-[11px] font-bold uppercase italic leading-none ${task.completed ? 'text-zinc-300 line-through' : 'text-black'}`}>
                                {task.label}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Clock size={10} className="text-zinc-400" />
                                <input 
                                  type="date"
                                  value={task.dueDate || ''}
                                  onChange={(e) => updateTaskDueDate(activeJob.id, task.label, e.target.value)}
                                  className="bg-transparent text-[8px] font-black text-zinc-400 uppercase tracking-widest outline-none border-none p-0 cursor-pointer hover:text-black transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                          {task.dueDate && new Date(task.dueDate) < new Date() && !task.completed && (
                            <Badge className="bg-red-50 text-red-600 border-none text-[7px] font-black uppercase px-2 py-0.5 animate-pulse">OVERDUE</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                 {/* Financial Negotiation Card */}
                 <Card className="p-8 bg-[#FFD700]/5 border-2 border-[#FFD700]/10 shadow-xl rounded-[24px] space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-zinc-950 text-[#FFD700] rounded-xl shadow-inner"><DollarSign size={20} /></div>
                       <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Financial Handshake</h3>
                    </div>
                    <div className="space-y-4">
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">Initialize Sum Negotiation</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input 
                            type="number"
                            value={amountInput}
                            onChange={(e) => setAmountInput(e.target.value)}
                            placeholder="Amount..."
                            className="w-full h-12 bg-white border border-zinc-100 rounded-xl pl-10 pr-4 text-xs font-bold outline-none focus:border-black"
                          />
                        </div>
                        <Button 
                          onClick={initializeNegotiation} 
                          disabled={isNegotiating || !amountInput}
                          className="h-12 bg-black text-white text-[9px] rounded-xl px-4"
                        >
                          REQUEST
                        </Button>
                      </div>
                      {activeJob.negotiationStatus !== 'IDLE' && (
                        <div className="p-4 bg-zinc-950 text-white rounded-xl space-y-2 border border-[#FFD700]/20">
                           <div className="flex justify-between items-center text-[8px] font-black uppercase italic">
                              <span className="text-zinc-500">Proposed Sum</span>
                              <span className="text-[#FFD700]">${activeJob.requestedAmount?.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center text-[8px] font-black uppercase italic">
                              <span className="text-zinc-500">Audit Status</span>
                              <span className="text-white">{activeJob.negotiationStatus}</span>
                           </div>
                        </div>
                      )}
                    </div>
                 </Card>

                 {/* Fixed Car Upload Card */}
                 <Card className="p-8 bg-white border-none shadow-xl rounded-[24px] space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-zinc-50 rounded-xl shadow-inner text-[#E31B23]"><ImagePlus size={20} /></div>
                         <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Restoration Evidence</h3>
                      </div>
                      <Badge className="bg-zinc-50 border-none text-[8px] text-zinc-400 font-bold">{activeJob.fixedCarPhotos.length} FRAMES</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-black transition-all group"
                       >
                          <Camera size={20} className="text-zinc-300 group-hover:text-black" />
                          <span className="text-[7px] font-black uppercase text-zinc-400">UPLOAD FIXED</span>
                          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
                       </button>
                       {activeJob.fixedCarPhotos.map((photo, i) => (
                         <div key={i} className="aspect-square rounded-xl overflow-hidden border border-zinc-100 shadow-inner group relative">
                            <img src={photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <CheckCircle2 size={24} className="text-green-400" />
                            </div>
                         </div>
                       ))}
                    </div>
                 </Card>
               </div>
            </div>

            {/* Communication Deck */}
            <div className="lg:col-span-4 h-full flex flex-col min-h-[500px] lg:min-h-[600px]">
               <Card className="flex-1 rounded-[24px] border-none shadow-2xl bg-white overflow-hidden flex flex-col">
                  <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex gap-2">
                    <button 
                      onClick={() => setChatMode('assessor')}
                      className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${chatMode === 'assessor' ? 'bg-black text-white' : 'text-zinc-400 hover:text-black'}`}
                    >
                      <Shield size={14} /> Assessor
                    </button>
                    <button 
                      onClick={() => setChatMode('finance')}
                      className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${chatMode === 'finance' ? 'bg-[#FFD700] text-black' : 'text-zinc-400 hover:text-black'}`}
                    >
                      <Landmark size={14} /> Finance
                    </button>
                  </div>

                  <div className="p-6 bg-zinc-950 text-white border-b-4 border-[#E31B23] shrink-0">
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner font-black italic border border-white/5 ${chatMode === 'finance' ? 'bg-[#FFD700] text-black' : 'bg-zinc-900 text-[#E31B23]'}`}>
                          {chatMode === 'finance' ? 'FD' : 'AS'}
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic mb-1">{chatMode === 'finance' ? 'Billing Hub Liaison' : 'Expert Liaison'}</p>
                          <h4 className="text-[11px] font-black uppercase tracking-tight italic text-white leading-none">{chatMode === 'finance' ? 'Nicoz Finance Desk' : activeJob.assessorName}</h4>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 custom-scrollbar flex flex-col">
                     {((chatMode === 'assessor' ? activeJob.chatHistory : activeJob.financeHistory) as any).length === 0 ? (
                       <div className="flex-1 flex flex-col items-center justify-center opacity-10 space-y-4">
                          <MessageCircle size={48} className="text-zinc-950" />
                          <p className="text-[9px] font-black uppercase tracking-[0.4em]">Initialize Connection</p>
                       </div>
                     ) : (
                        ((chatMode === 'assessor' ? activeJob.chatHistory : activeJob.financeHistory) as any).map((msg: any, i: number) => (
                           <div key={i} className={`flex flex-col ${msg.sender === 'Repairer' ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-[11px] font-medium leading-relaxed italic ${msg.sender === 'Repairer' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-black border border-slate-100 rounded-tl-none'}`}>
                                 {msg.text}
                              </div>
                              <span className="text-[7px] font-black text-zinc-400 uppercase mt-2 italic">{msg.sender.toUpperCase()} • {msg.time}</span>
                           </div>
                        ))
                     )}
                     {isTyping && (
                       <div className="flex flex-col items-start animate-in fade-in">
                          <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" />
                             <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                             <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                          <span className="text-[7px] font-black text-zinc-400 uppercase mt-2 italic tracking-widest">AIMS Processing...</span>
                       </div>
                     )}
                     <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={sendChatMessage} className="p-5 bg-white border-t border-slate-100">
                     <div className="flex gap-3 bg-zinc-50 p-2 rounded-2xl border border-zinc-100 shadow-inner group-focus-within:border-black transition-all">
                        <input 
                          type="text" 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder={chatMode === 'finance' ? "Discuss payout sum..." : "Technical update..."}
                          className="flex-1 bg-transparent border-none px-4 py-2.5 text-[11px] font-bold italic outline-none text-black"
                        />
                        <button 
                          type="submit"
                          disabled={!chatInput.trim() || isTyping}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 shadow-xl ${chatMode === 'finance' ? 'bg-[#FFD700] text-black' : 'bg-black text-white'}`}
                        >
                           <Send size={18} />
                        </button>
                     </div>
                  </form>
               </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reputation' && (
        <div className="space-y-8 md:space-y-12 animate-in fade-in max-w-6xl mx-auto w-full">
           <Card className="p-10 md:p-16 bg-black text-white rounded-[40px] border-none shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Star size={320} /></div>
             <div className="relative z-10 space-y-12">
               <div className="flex justify-between items-start">
                 <div className="space-y-2">
                   <p className="text-[10px] font-bold text-[#E31B23] uppercase tracking-[0.4em] italic">TRUST INDEX DECK</p>
                   <h2 className="text-4xl md:text-5xl font-black italic uppercase leading-none tracking-tighter">Network Standing</h2>
                 </div>
                 {/* Fixed: Added Trophy icon which was previously not imported or recognized */}
                 <Badge status="gold" className="text-[9px] font-bold border-none bg-yellow-500/10 text-yellow-500 px-6 py-2.5 rounded-xl uppercase tracking-widest italic flex gap-2"><Trophy size={14}/> ELITE NODE</Badge>
               </div>
               
               <div className="flex flex-col md:flex-row md:items-end gap-10">
                 <h3 className="text-8xl md:text-9xl font-black italic leading-none tracking-tight text-white">{partnerStats.rating}</h3>
                 <div className="space-y-6 mb-4">
                    <div className="flex gap-2 text-yellow-500">
                       {[1,2,3,4,5].map(i => <Star key={i} size={32} fill={i <= 4 ? "currentColor" : "none"} className={i === 5 ? 'opacity-20' : ''} />)}
                    </div>
                    <div className="flex flex-wrap gap-8">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Node Reviews</p>
                        <p className="text-xl font-bold italic uppercase">{partnerStats.reviews} Audits</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Liquidity Class</p>
                        <p className="text-xl font-bold italic uppercase text-green-500">{partnerStats.liquidityTrust}</p>
                      </div>
                    </div>
                 </div>
               </div>
             </div>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { label: 'Avg Payout Cycle', val: partnerStats.avgPayout, icon: <Clock className="text-blue-500" /> },
               { label: 'Completion Rate', val: '99.2%', icon: <Receipt className="text-green-500" /> },
               { label: 'SLA Adherence', val: '94.8%', icon: <ShieldCheck className="text-[#E31B23]" /> }
             ].map((s, i) => (
               <Card key={i} className="p-8 bg-white border-none shadow-xl rounded-[32px] hover:scale-[1.02] transition-all group">
                 <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-black group-hover:text-white transition-colors shadow-inner">{s.icon}</div>
                 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic mb-1">{s.label}</p>
                 <p className="text-3xl font-black italic uppercase text-black tracking-tight">{s.val}</p>
               </Card>
             ))}
           </div>

           <Card className="p-10 bg-white border-none shadow-xl rounded-[40px] space-y-8">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-widest italic flex items-center gap-3"><History size={18} /> Recent Ledger Entries</h4>
                <Button variant="ghost" className="text-[9px] font-black uppercase tracking-widest">EXPORT DECK</Button>
              </div>
              <div className="space-y-4">
                {[
                  { id: 'LD-901', type: 'Settlement', status: 'PAID', amount: '$4,150', date: 'Yesterday' },
                  { id: 'LD-882', type: 'Audit Correction', status: 'ADJUSTED', amount: '+$1,200', date: '3 days ago' },
                  { id: 'LD-712', type: 'Settlement', status: 'PAID', amount: '$12,800', date: '1 week ago' }
                ].map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-6">
                       <div className="bg-white p-3 rounded-xl shadow-sm text-zinc-400"><Landmark size={18} /></div>
                       <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest italic mb-1">{entry.id}</p>
                          <p className="text-sm font-black italic uppercase text-black">{entry.type}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black italic text-black leading-none mb-1">{entry.amount}</p>
                       <Badge status={entry.status} className="border-none text-[8px] font-bold px-3 py-1 rounded-md">{entry.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
           </Card>
        </div>
      )}
    </div>
  );
};

export default RepairPartnerDashboard;