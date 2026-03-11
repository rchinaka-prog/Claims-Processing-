import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Badge, NeuralFeed } from './Shared';
import { 
  Clock, Settings, MessageSquare, Send, X, ArrowLeft, 
  Star, ClipboardCheck, Camera, Check, FileImage, 
  User, ShieldCheck, Zap, Factory, AlertCircle, Wrench,
  MessageCircle, LogOut, Loader2, UserRound, ShieldAlert,
  Search, Terminal, DollarSign, TrendingUp, Landmark, 
  Wallet, Receipt, History, ImagePlus, FileCheck, CheckCircle2,
  Lock, ArrowRightLeft, Shield, Trophy, Calendar, ChevronRight
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
  priority: 'CRITICAL' | 'MEDIUM';
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
  dueDate?: string;
  startDate?: string;
  endDate?: string;
}

interface RepairPartnerDashboardProps {
  onLogout: () => void;
  activeTab: 'active' | 'shop' | 'reputation' | 'calendar';
  onTabChange: (tab: 'active' | 'shop' | 'reputation' | 'calendar') => void;
}

const RepairPartnerDashboard: React.FC<RepairPartnerDashboardProps> = ({ onLogout, activeTab, onTabChange }) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingJobId, setSchedulingJobId] = useState<string | null>(null);
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  
  const [assessorInput, setAssessorInput] = useState('');
  const [financeInput, setFinanceInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [isTypingAssessor, setIsTypingAssessor] = useState(false);
  const [isTypingFinance, setIsTypingFinance] = useState(false);
  const [isNegotiating, setIsNegotiating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  
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
            dueDate: c.dueDate,
            startDate: c.startDate,
            endDate: c.endDate,
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

  const handleScheduleJob = async () => {
    if (!schedulingJobId || !startDateInput || !endDateInput) return;
    
    try {
      const res = await fetch(`/api/claims/${schedulingJobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          startDate: startDateInput, 
          endDate: endDateInput,
          dueDate: endDateInput // Sync due date with end date
        })
      });
      
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === schedulingJobId ? { 
          ...j, 
          startDate: startDateInput, 
          endDate: endDateInput,
          dueDate: endDateInput 
        } : j));
        setShowScheduleModal(false);
        setSchedulingJobId(null);
        setStartDateInput('');
        setEndDateInput('');
      }
    } catch (error) {
      console.error("Failed to schedule job:", error);
    }
  };

  const openScheduleModal = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setStartDateInput(job.startDate || '');
      setEndDateInput(job.endDate || '');
      setSchedulingJobId(jobId);
      setShowScheduleModal(true);
    }
  };

  const activeJob = jobs.find(j => j.id === selectedJobId);

  useEffect(() => {
    if (selectedJobId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeJob?.chatHistory, activeJob?.financeHistory, isTypingAssessor, isTypingFinance, selectedJobId]);

  const handleAcceptJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/claims/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REPAIR_IN_PROGRESS' })
      });
      if (res.ok) {
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, isAccepted: true, status: 'REPAIR_IN_PROGRESS' } : j));
      }
    } catch (error) {
      console.error("Failed to accept job:", error);
    }
  };

  const handleRejectJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/claims/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REPAIRER_REJECTED', repairer: null })
      });
      if (res.ok) {
        setJobs(prev => prev.filter(j => j.id !== jobId));
      }
    } catch (error) {
      console.error("Failed to reject job:", error);
    }
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
    setIsTypingFinance(true);

    try {
      // Initialize with apiKey as a string to ensure type safety in generateContent parameters
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
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
      setIsTypingFinance(false);
      setIsNegotiating(false);
    }
  };

  const sendChatMessage = async (mode: 'assessor' | 'finance') => {
    const text = mode === 'assessor' ? assessorInput : financeInput;
    if (!text.trim() || !activeJob) return;

    const historyKey = mode === 'assessor' ? 'chatHistory' : 'financeHistory';
    const sender = 'Repairer';
    const msg: ChatMessage = { 
      id: Date.now().toString(), 
      sender, 
      text: text, 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    };

    setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, [historyKey]: [...(j[historyKey] as any), msg] } : j));
    
    if (mode === 'assessor') {
      setAssessorInput('');
      setIsTypingAssessor(true);
    } else {
      setFinanceInput('');
      setIsTypingFinance(true);
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const rolePrompt = mode === 'assessor' ? 
        `You are ${activeJob.assessorName}, a professional insurance assessor.` : 
        `You are the Finance Hub agent for Nicoz Diamond Insurance.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${rolePrompt} A repair partner is messaging you about Job ${activeJob.id}. 
        Msg: "${text}". Respond appropriately.`,
      });

      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        sender: mode === 'assessor' ? 'Assessor' : 'Support', 
        text: response.text || "Message acknowledged. Syncing with system.", 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
      };

      setJobs(prev => prev.map(j => j.id === activeJob.id ? { ...j, [historyKey]: [...(j[historyKey] as any), aiMsg] } : j));
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      if (mode === 'assessor') setIsTypingAssessor(false);
      else setIsTypingFinance(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-6 md:p-10 space-y-8 md:space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black text-[#E31B23] uppercase tracking-[0.4em] italic leading-none">AIMS WORKSHOP</p>
            <ChevronRight size={10} className="text-zinc-600" />
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] italic leading-none">
              {activeTab === 'shop' ? 'MARKETPLACE' : 
               activeTab === 'active' ? 'WORKSHOP BAY' : 
               activeTab === 'calendar' ? 'SCHEDULE' : 'TRUST INDEX'}
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic leading-none text-black">
            {activeTab === 'shop' ? 'Job Offers' : 
             activeTab === 'active' ? (selectedJobId ? 'Job Audit' : 'Active Repairs') : 
             activeTab === 'calendar' ? 'Calendar' : 'Reputation'}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-white p-1.5 rounded-2xl border border-zinc-200 shadow-xl overflow-x-auto no-scrollbar">
            {['shop', 'active', 'calendar', 'reputation'].map(tab => (
              <button 
                key={tab} 
                onClick={() => onTabChange(tab as any)} 
                className={`px-6 md:px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-black text-white shadow-lg' : 'text-slate-400 hover:text-black'}`}
              >
                {tab === 'shop' ? 'Offers' : tab === 'active' ? 'Workshop' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-full sm:w-fit shadow-sm overflow-x-auto no-scrollbar">
        {[
          { id: 'shop', label: 'Marketplace' },
          { id: 'active', label: 'Workshop' },
          { id: 'calendar', label: 'Calendar' },
          { id: 'reputation', label: 'Trust Index' }
        ].map(t => (
          <button key={t.id} onClick={() => { onTabChange(t.id as any); setSelectedJobId(null); }} className={`flex-1 sm:flex-none px-6 md:px-10 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === t.id ? 'bg-black text-white shadow-md' : 'text-zinc-400 hover:text-black'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'shop' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 italic">Incoming Repair Offers</h2>
            <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] font-black">{jobs.filter(j => !j.isAccepted).length} NEW</Badge>
          </div>
          
          {jobs.filter(j => !j.isAccepted).length === 0 ? (
            <Card className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-white border-dashed border-2 border-zinc-100">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
                <Factory size={32} />
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No pending job offers in your region.</p>
            </Card>
          ) : (
            jobs.filter(j => !j.isAccepted).map(job => (
              <Card key={job.id} className="p-6 md:p-10 bg-white border-none shadow-xl rounded-2xl md:rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8 relative overflow-hidden group border-t-4 border-t-blue-500">
                <div className="flex-1 space-y-5 md:space-y-6 w-full">
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <div className="bg-black text-white px-3 py-1 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-md md:rounded-lg">{job.id}</div>
                    <Badge status={job.priority} className="px-3 py-1 text-[8px] md:text-[9px] font-bold rounded-md md:rounded-lg uppercase">{job.priority}</Badge>
                    <Badge className="bg-blue-50 text-blue-600 border-none text-[8px] font-bold rounded-md uppercase">New Offer</Badge>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl md:text-4xl font-bold text-black uppercase tracking-tight italic leading-none truncate">{job.registration}</h2>
                    <p className="text-[11px] md:text-sm font-bold text-zinc-400 uppercase italic truncate">{job.customer} • {job.vehicle}</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 italic text-[10px] font-bold text-slate-500 flex items-center gap-2">
                      <DollarSign size={12} /> Budget: ${job.budget.toLocaleString()}
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 italic text-[10px] font-bold text-slate-500 flex items-center gap-2">
                      <Clock size={12} /> Received: {new Date(job.dateReceived).toLocaleDateString()}
                    </div>
                    {job.dueDate && (
                      <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100 italic text-[10px] font-black text-[#E31B23] flex items-center gap-2">
                        <Calendar size={12} /> Due: {new Date(job.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-full lg:w-[320px] shrink-0 flex gap-3">
                  <Button onClick={() => handleRejectJob(job.id)} variant="outline" className="flex-1 h-14 md:h-16 text-[9px] md:text-[10px] font-bold rounded-xl md:rounded-2xl border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-600">REJECT</Button>
                  <Button onClick={() => handleAcceptJob(job.id)} className="flex-[2] h-14 md:h-16 bg-blue-600 text-white text-[9px] md:text-[10px] font-bold shadow-lg rounded-xl md:rounded-2xl hover:bg-blue-700">ACCEPT JOB</Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'active' && !selectedJobId && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 italic">Active Workshop Bay</h2>
            <Badge className="bg-green-50 text-green-600 border-none text-[8px] font-black">{jobs.filter(j => j.isAccepted).length} ACTIVE</Badge>
          </div>

          {jobs.filter(j => j.isAccepted).length === 0 ? (
            <Card className="p-20 flex flex-col items-center justify-center text-center space-y-4 bg-white border-dashed border-2 border-zinc-100">
              <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200">
                <Wrench size={32} />
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No active repairs in progress.</p>
            </Card>
          ) : (
            jobs.filter(j => j.isAccepted).map(job => (
              <Card key={job.id} className="p-6 md:p-10 bg-white border-none shadow-xl rounded-2xl md:rounded-3xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8 relative overflow-hidden group">
                <div className="flex-1 space-y-5 md:space-y-6 w-full">
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    <div className="bg-black text-white px-3 py-1 text-[8px] md:text-[9px] font-bold uppercase tracking-widest rounded-md md:rounded-lg">{job.id}</div>
                    <Badge status={job.priority} className="px-3 py-1 text-[8px] md:text-[9px] font-bold rounded-md md:rounded-lg uppercase">{job.priority}</Badge>
                    <Badge status={job.status} className="px-3 py-1 text-[8px] md:text-[9px] font-bold rounded-md md:rounded-lg uppercase">{job.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-2xl md:text-4xl font-bold text-black uppercase tracking-tight italic leading-none truncate">{job.registration}</h2>
                    <div className="flex justify-between items-center">
                      <p className="text-[11px] md:text-sm font-bold text-zinc-400 uppercase italic truncate">{job.customer} • {job.vehicle}</p>
                      {job.dueDate && (
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#E31B23] uppercase italic">
                          <Calendar size={14} />
                          Due: {new Date(job.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full max-w-md bg-zinc-50 h-2 rounded-full overflow-hidden border border-zinc-100">
                    <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${job.progress}%` }} />
                  </div>
                </div>
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-3">
                  <Button onClick={() => setSelectedJobId(job.id)} className="w-full h-14 bg-black text-[9px] font-bold shadow-lg rounded-xl">OPEN LOG</Button>
                  <Button onClick={() => openScheduleModal(job.id)} variant="outline" className="w-full h-12 text-[9px] font-bold rounded-xl border-zinc-200 text-zinc-500 hover:text-black">
                    <Calendar size={14} className="mr-2" /> {job.startDate ? 'RESCHEDULE' : 'SCHEDULE REPAIR'}
                  </Button>
                </div>
              </Card>
            ))
          )}
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
                 <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-all duration-1000"><Wrench size={240} /></div>
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
                  {/* Financial Intelligence Hub */}
                  <Card className="p-8 bg-zinc-950 text-white rounded-[32px] border-none shadow-2xl space-y-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#FFD700] text-black rounded-xl shadow-xl"><Landmark size={20} /></div>
                        <h3 className="text-xs font-black uppercase tracking-widest italic">Financial Intelligence Hub</h3>
                      </div>
                      <Badge className="bg-[#FFD700]/10 text-[#FFD700] border-none text-[8px] font-black uppercase px-3 py-1">Ledger Sync: Active</Badge>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                      {/* Left: Negotiation Controls */}
                      <div className="space-y-8">
                        <div className="space-y-4">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic">Initialize Sum Negotiation</p>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                              <input 
                                type="number"
                                value={amountInput}
                                onChange={(e) => setAmountInput(e.target.value)}
                                placeholder="Amount..."
                                className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-xs font-bold outline-none focus:border-[#FFD700] text-white"
                              />
                            </div>
                            <Button 
                              onClick={initializeNegotiation} 
                              disabled={isNegotiating || !amountInput}
                              className="h-12 bg-[#FFD700] text-black text-[9px] font-black rounded-xl px-6 hover:bg-[#FFD700]/80 transition-all"
                            >
                              REQUEST
                            </Button>
                          </div>
                          
                          {activeJob.negotiationStatus !== 'IDLE' && (
                            <div className="p-5 bg-white/5 rounded-2xl space-y-3 border border-white/10">
                               <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
                                  <span className="text-zinc-500">Proposed Sum</span>
                                  <span className="text-[#FFD700]">${activeJob.requestedAmount?.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
                                  <span className="text-zinc-500">Audit Status</span>
                                  <span className="text-white">{activeJob.negotiationStatus}</span>
                               </div>
                            </div>
                          )}
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                           <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic">Payment Confirmations</p>
                           {activeJob.status === 'Paid' ? (
                             <div className="p-6 bg-green-500/10 rounded-2xl border border-green-500/20 flex flex-col items-center justify-center text-center space-y-2">
                               <ShieldCheck size={24} className="text-green-500" />
                               <p className="text-[10px] font-black text-green-500 uppercase tracking-widest italic">Payment Received & Verified</p>
                             </div>
                           ) : activeJob.status === 'Settled' ? (
                             <Button className="w-full h-14 bg-green-600 text-white text-[10px] font-black rounded-xl flex items-center justify-center gap-2">
                               <CheckCircle2 size={18} /> CONFIRM PAYOUT RECEIPT
                             </Button>
                           ) : (
                             <div className="p-6 bg-white/5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-2">
                               <Lock size={20} className="text-zinc-600" />
                               <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest italic">Payout locked until audit finalization</p>
                             </div>
                           )}
                        </div>
                      </div>

                      {/* Right: Finance Chat */}
                      <div className="flex flex-col h-[400px] bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <MessageSquare size={12} className="text-[#FFD700]" />
                              <span className="text-[9px] font-black uppercase tracking-widest italic">Billing Liaison</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-[7px] font-black text-zinc-500 uppercase italic">Online</span>
                           </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar flex flex-col">
                           {activeJob.financeHistory.length === 0 ? (
                             <div className="flex-1 flex flex-col items-center justify-center opacity-10 space-y-4">
                                <Landmark size={48} className="text-white" />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em]">Ledger Empty</p>
                             </div>
                           ) : (
                             activeJob.financeHistory.map((msg: any, i: number) => (
                               <div key={i} className={`flex flex-col ${msg.sender === 'Repairer' ? 'items-end' : 'items-start'}`}>
                                  <div className={`max-w-[90%] p-4 rounded-2xl shadow-sm text-[11px] font-medium leading-relaxed italic ${msg.sender === 'Repairer' ? 'bg-[#FFD700] text-black rounded-tr-none' : 'bg-white/10 text-white border border-white/5 rounded-tl-none'}`}>
                                     {msg.text}
                                  </div>
                                  <span className="text-[7px] font-black text-zinc-500 uppercase mt-2 italic">{msg.sender.toUpperCase()} • {msg.time}</span>
                               </div>
                             ))
                           )}
                           {isTypingFinance && (
                             <div className="flex flex-col items-start animate-in fade-in">
                                <div className="p-4 bg-white/10 border border-white/5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                   <div className="w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-bounce" />
                                   <div className="w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-bounce [animation-delay:0.2s]" />
                                   <div className="w-1.5 h-1.5 bg-[#FFD700] rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                             </div>
                           )}
                        </div>
                        <form 
                          onSubmit={(e) => { e.preventDefault(); sendChatMessage('finance'); }} 
                          className="p-4 bg-white/5 border-t border-white/5"
                        >
                           <div className="flex gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                              <input 
                                type="text" 
                                value={financeInput}
                                onChange={(e) => setFinanceInput(e.target.value)}
                                placeholder="Discuss budget / payout..."
                                className="flex-1 bg-transparent border-none px-4 py-2 text-[11px] font-bold italic outline-none text-white"
                              />
                              <button 
                                type="submit"
                                disabled={!financeInput.trim() || isTypingFinance}
                                className="w-10 h-10 rounded-lg bg-[#FFD700] text-black flex items-center justify-center transition-all disabled:opacity-30"
                              >
                                 <Send size={16} />
                              </button>
                           </div>
                        </form>
                      </div>
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
                  <div className="p-6 bg-zinc-950 text-white border-b-4 border-[#E31B23] shrink-0">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner font-black italic border border-white/5 bg-zinc-900 text-[#E31B23]">
                          AS
                       </div>
                       <div>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic mb-1">Expert Liaison</p>
                          <h4 className="text-[11px] font-black uppercase tracking-tight italic text-white leading-none">{activeJob.assessorName}</h4>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/20 custom-scrollbar flex flex-col">
                     {activeJob.chatHistory.length === 0 ? (
                       <div className="flex-1 flex flex-col items-center justify-center opacity-10 space-y-4">
                          <MessageCircle size={48} className="text-zinc-950" />
                          <p className="text-[9px] font-black uppercase tracking-[0.4em]">Initialize Connection</p>
                       </div>
                     ) : (
                        activeJob.chatHistory.map((msg: any, i: number) => (
                           <div key={i} className={`flex flex-col ${msg.sender === 'Repairer' ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-[11px] font-medium leading-relaxed italic ${msg.sender === 'Repairer' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-black border border-slate-100 rounded-tl-none'}`}>
                                 {msg.text}
                              </div>
                              <span className="text-[7px] font-black text-zinc-400 uppercase mt-2 italic">{msg.sender.toUpperCase()} • {msg.time}</span>
                           </div>
                        ))
                     )}
                     {isTypingAssessor && (
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

                  <form 
                    onSubmit={(e) => { e.preventDefault(); sendChatMessage('assessor'); }} 
                    className="p-5 bg-white border-t border-slate-100"
                  >
                     <div className="flex gap-3 bg-zinc-50 p-2 rounded-2xl border border-zinc-100 shadow-inner group-focus-within:border-black transition-all">
                        <input 
                          type="text" 
                          value={assessorInput}
                          onChange={(e) => setAssessorInput(e.target.value)}
                          placeholder="Technical update..."
                          className="flex-1 bg-transparent border-none px-4 py-2.5 text-[11px] font-bold italic outline-none text-black"
                        />
                        <button 
                          type="submit"
                          disabled={!assessorInput.trim() || isTypingAssessor}
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all disabled:opacity-30 shadow-xl bg-black text-white"
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

      {activeTab === 'calendar' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 px-1">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-bold text-black uppercase tracking-tight italic leading-none">Workshop Schedule</h2>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">Availability & Job Distribution</p>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2"
              >
                <ArrowLeft size={16} />
              </Button>
              <h3 className="text-sm font-black uppercase tracking-widest italic">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2"
              >
                <ArrowLeft size={16} className="rotate-180" />
              </Button>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#E31B23] rounded-full" />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Medium</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-8 p-8 bg-white rounded-[32px] border-none shadow-xl overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-zinc-100 border border-zinc-100 rounded-2xl overflow-hidden">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-zinc-50 p-4 text-center text-[9px] font-black uppercase tracking-widest text-zinc-400">{day}</div>
                ))}
                {(() => {
                  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
                  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
                  const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
                  
                  return Array.from({ length: 42 }).map((_, i) => {
                    let dayNum: number;
                    let isCurrentMonth = true;
                    let date: Date;

                    if (i < firstDayOfMonth) {
                      dayNum = prevMonthDays - firstDayOfMonth + i + 1;
                      isCurrentMonth = false;
                      date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, dayNum);
                    } else if (i < firstDayOfMonth + daysInMonth) {
                      dayNum = i - firstDayOfMonth + 1;
                      date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum);
                    } else {
                      dayNum = i - (firstDayOfMonth + daysInMonth) + 1;
                      isCurrentMonth = false;
                      date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, dayNum);
                    }

                    const dateStr = date.toISOString().split('T')[0];
                    const dayJobs = jobs.filter(j => j.startDate === dateStr || j.endDate === dateStr);
                    const isToday = new Date().toISOString().split('T')[0] === dateStr;
                    
                    return (
                      <div key={i} className={`bg-white min-h-[120px] p-3 border-t border-zinc-50 transition-all hover:bg-slate-50/50 ${!isCurrentMonth ? 'opacity-20' : ''} ${isToday ? 'ring-2 ring-inset ring-[#E31B23]/20 bg-red-50/10' : ''}`}>
                        <p className={`text-[10px] font-black mb-2 ${isToday ? 'text-[#E31B23]' : 'text-zinc-300'}`}>{dayNum}</p>
                        <div className="space-y-1">
                          {dayJobs.map(job => (
                            <div 
                              key={job.id} 
                              onClick={() => { setSelectedJobId(job.id); onTabChange('active'); }}
                              className={`p-1.5 rounded-md text-[7px] font-black uppercase tracking-tighter cursor-pointer transition-all hover:scale-105 truncate ${job.priority === 'CRITICAL' ? 'bg-red-50 text-[#E31B23] border-l-2 border-[#E31B23]' : 'bg-blue-50 text-blue-600 border-l-2 border-blue-500'}`}
                            >
                              {job.startDate === dateStr ? 'START: ' : 'END: '} {job.registration}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </Card>

            <div className="lg:col-span-4 space-y-8">
              <Card className="p-8 bg-zinc-950 text-white rounded-[32px] space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none"><Calendar size={120} /></div>
                <div className="relative z-10 space-y-4">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Shop Availability</h3>
                  <div className="space-y-4">
                    {[
                      { day: 'Monday - Friday', hours: '08:00 - 17:00', status: 'OPEN' },
                      { day: 'Saturday', hours: '09:00 - 13:00', status: 'OPEN' },
                      { day: 'Sunday', hours: 'Closed', status: 'CLOSED' }
                    ].map((slot, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                        <div>
                          <p className="text-[11px] font-black italic uppercase">{slot.day}</p>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{slot.hours}</p>
                        </div>
                        <Badge className={`border-none text-[8px] font-black px-3 py-1 rounded-md ${slot.status === 'OPEN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>{slot.status}</Badge>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full h-12 text-[9px] border-white/10 text-zinc-400 hover:text-white hover:border-white">EDIT OPERATING HOURS</Button>
                </div>
              </Card>

              <Card className="p-8 bg-white border-none shadow-xl rounded-[32px] space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest italic text-zinc-400">Upcoming Deadlines</h3>
                <div className="space-y-4">
                  {jobs.filter(j => j.endDate).sort((a,b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime()).slice(0, 3).map(job => (
                    <div key={job.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${job.priority === 'CRITICAL' ? 'bg-[#E31B23]' : 'bg-blue-500'}`}>
                        <Clock size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black italic uppercase truncate">{job.registration}</p>
                        <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Due: {new Date(job.endDate!).toLocaleDateString()}</p>
                      </div>
                      <ArrowRightLeft size={14} className="text-zinc-300" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {showScheduleModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-10 bg-white rounded-[40px] border-none shadow-2xl space-y-8 animate-in zoom-in-95">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-zinc-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-xl">
                <Calendar size={32} className="text-[#E31B23]" />
              </div>
              <h3 className="text-2xl font-black text-black uppercase tracking-tighter italic">Schedule Repair</h3>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] italic">AIMS Workshop Allocation</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic ml-1">Start Date</label>
                <input 
                  type="date" 
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 text-xs font-bold outline-none focus:border-[#E31B23] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 italic ml-1">Estimated Completion</label>
                <input 
                  type="date" 
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 text-xs font-bold outline-none focus:border-[#E31B23] transition-all"
                />
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-start">
                <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[9px] font-medium text-blue-600 leading-relaxed italic">
                  Scheduling this job will notify the customer and assessor of the expected restoration timeline.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)} className="flex-1 h-14 text-[10px] rounded-2xl">CANCEL</Button>
              <Button 
                onClick={handleScheduleJob} 
                disabled={!startDateInput || !endDateInput}
                className="flex-[2] h-14 bg-black text-white text-[10px] rounded-2xl shadow-xl"
              >
                CONFIRM SCHEDULE
              </Button>
            </div>
          </Card>
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