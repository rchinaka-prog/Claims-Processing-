
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Badge, NeuralFeed, QRCodeUI } from './Shared';
import { aimsApi } from '../src/services/aimsApi';
import { 
  BarChart3, Activity, AlertTriangle, ShieldAlert, 
  MapPin, TrendingUp, TrendingDown, Users,
  ExternalLink, FileText, Download, Filter, ChevronRight,
  ShieldCheck, AlertCircle, RefreshCcw, Eye,
  DollarSign, Trophy, Globe, Zap, PlusCircle, Plus,
  FileBarChart, Clock, Loader2, X, ClipboardList, Shield, Construction,
  UserCheck, Timer, Briefcase, Star, Mail, CheckCircle2, Cpu, Brain, Network, Rocket,
  MailCheck, ShieldQuestion, Send, Check, Smartphone, MessageCircle, MessageSquare, QrCode, User,
  FileSpreadsheet, FileJson, Archive, Target, LayoutGrid, Fingerprint, Lock, ShieldEllipsis, AtSign, LogOut,
  Info, ArrowRightLeft, UserMinus, UserPlus, AlertOctagon, MailWarning, History, Flag, Search, Database, HardDrive, FileUp,
  UserRoundPlus, ShieldPlus, UserSearch, Scale, ShieldQuestion as ShieldQ, FileWarning, Terminal
} from 'lucide-react';

interface InterventionLog {
  id: string;
  timestamp: string;
  type: 'Performance Email' | 'Formal Review' | 'Broadcast' | 'Compliance Audit';
  subject: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: 'Assessor' | 'Support' | 'Repair Partner';
  rating: number;
  totalClaims: number;
  email: string;
  avatar: string;
  load: number; // 0-100
  complianceStatus: 'COMPLIANT' | 'SLA_VIOLATION' | 'KYC_PENDING' | 'AUDIT_REQUIRED';
  interventions: InterventionLog[];
}

interface EmailDraft {
  to: string;
  cc: string;
  subject: string;
  body: string;
  staffId: string;
  isUrgent: boolean;
}

const RecruitNodeModal: React.FC<{ 
  onClose: () => void, 
  onRecruit: (node: Partial<StaffMember>) => void,
  isProcessing: boolean
}> = ({ onClose, onRecruit, isProcessing }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Support' as 'Support' | 'Assessor' | 'Repair Partner',
    region: 'Harare Central'
  });

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-lg bg-white rounded-[40px] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col">
        <div className="p-8 bg-zinc-950 text-white flex justify-between items-center border-b-4 border-[#E31B23]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-zinc-900 rounded-2xl border border-white/5 shadow-xl">
              <UserRoundPlus size={24} className="text-[#E31B23]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest leading-none">Add New Staff</h3>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5 italic">Adding new member to the system</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-10 space-y-8 bg-slate-50/30">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 italic">Staff Role</label>
              <div className="grid grid-cols-3 gap-3">
                {['Support', 'Assessor', 'Repair Partner'].map(r => (
                  <button 
                    key={r}
                    type="button"
                    onClick={() => setFormData({...formData, role: r as any})}
                    className={`p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${formData.role === r ? 'bg-black text-white border-black shadow-lg' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 italic">Full Name</label>
              <div className="relative group">
                <UserSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#E31B23]" size={18} />
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border-2 border-zinc-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:border-black shadow-sm"
                  placeholder="EX: CLARA HOVE"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 italic">Network Contact (Email)</label>
              <div className="relative group">
                <AtSign className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-[#E31B23]" size={18} />
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-white border-2 border-zinc-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold outline-none focus:border-black shadow-sm"
                  placeholder="EX: C.HOVE@FIRSTMUTUAL.CO.ZW"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex gap-4">
           <Button variant="outline" onClick={onClose} className="flex-1 h-14 rounded-2xl text-[10px] font-black italic">ABORT</Button>
           <Button 
             disabled={!formData.name || !formData.email || isProcessing}
             onClick={() => onRecruit(formData)}
             className="flex-[2] h-14 bg-black text-white rounded-2xl shadow-2xl text-[10px] font-black italic"
           >
             {isProcessing ? <Loader2 size={20} className="animate-spin" /> : 'AUTHORIZE PROVISIONING'}
           </Button>
        </div>
      </Card>
    </div>
  );
};

const EmailDraftModal: React.FC<{ 
  draft: EmailDraft, 
  onClose: () => void, 
  onSend: (draft: EmailDraft) => void,
  isSending: boolean
}> = ({ draft, onClose, onSend, isSending }) => {
  const [editedBody, setEditedBody] = useState(draft.body);
  const [editedSubject, setEditedSubject] = useState(draft.subject);

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-2xl bg-white rounded-[40px] border-none shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-8 bg-zinc-950 text-white flex justify-between items-center border-b-4 border-[#E31B23]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#E31B23] rounded-2xl shadow-xl">
              <Send size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest leading-none">Internal Advisory Dispatch</h3>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5 italic">Secured Leadership Communication</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar bg-slate-50/30">
          <div className="bg-white rounded-[24px] border border-zinc-100 p-8 space-y-6 shadow-sm">
            <div className="grid grid-cols-[80px_1fr] items-center gap-4 pb-4 border-b border-zinc-50">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">To Node</span>
              <span className="text-xs font-black text-black italic bg-zinc-50 px-3 py-1.5 rounded-xl w-fit border border-zinc-100">{draft.to}</span>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic mb-2 block">Subject Line</label>
              <input 
                type="text"
                value={editedSubject}
                onChange={(e) => setEditedSubject(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-xs font-bold text-black outline-none focus:border-black"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest italic mb-2 block">Message Payload</label>
              <textarea 
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="w-full h-64 bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-[12px] font-medium text-zinc-700 leading-relaxed outline-none focus:border-[#E31B23] focus:bg-white transition-all resize-none italic shadow-inner custom-scrollbar"
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex gap-4 justify-end">
           <Button variant="outline" onClick={onClose} className="h-14 px-8 text-[10px] rounded-2xl font-black italic">CANCEL</Button>
           <Button 
             onClick={() => onSend({ ...draft, subject: editedSubject, body: editedBody })} 
             disabled={isSending}
             className="h-14 px-12 text-[10px] shadow-2xl rounded-2xl bg-black hover:bg-zinc-800 font-black italic"
           >
             {isSending ? <Loader2 size={18} className="animate-spin" /> : 'DISPATCH ADVISORY'}
           </Button>
        </div>
      </Card>
    </div>
  );
};

const BatchProcessModal: React.FC<{ 
  onClose: () => void, 
  progress: number,
  logs: string[],
  isComplete: boolean,
  stats: { total: number, dispatched: number }
}> = ({ onClose, progress, logs, isComplete, stats }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
      <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-800 rounded-[40px] shadow-[0_0_100px_rgba(227,27,35,0.15)] overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-10 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center text-[#E31B23] border border-white/5 shadow-2xl relative">
              <RefreshCcw size={28} className={!isComplete ? "animate-spin" : ""} />
              {isComplete && <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-zinc-950"><Check size={12} className="text-white" /></div>}
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-white italic">Batch Renewal Engine</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5 italic">AIMS Automated Dispatch Protocol</p>
            </div>
          </div>
          {isComplete && (
            <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"><X size={24} /></button>
          )}
        </div>

        <div className="flex-1 p-10 space-y-10 overflow-hidden flex flex-col">
          <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Process Velocity</span>
              <span className="text-2xl font-black italic text-white">{progress}%</span>
            </div>
            <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-[#E31B23] transition-all duration-300 shadow-[0_0_20px_rgba(227,27,35,0.4)]" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Policies Flagged</p>
              <p className="text-3xl font-black italic text-white">{stats.total}</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/5 rounded-3xl space-y-2">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Dispatched</p>
              <p className="text-3xl font-black italic text-[#E31B23]">{stats.dispatched}</p>
            </div>
          </div>

          <div className="flex-1 bg-black rounded-3xl border border-white/5 p-6 font-mono text-[10px] overflow-hidden flex flex-col shadow-inner">
            <div className="flex items-center gap-3 mb-4 text-zinc-500 border-b border-white/5 pb-3">
              <Terminal size={14} />
              <span className="uppercase tracking-widest font-black italic">System Telemetry</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4 animate-in slide-in-from-left-2 duration-300">
                  <span className="text-[#E31B23] opacity-50">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                  <span className={log.includes('SUCCESS') ? 'text-green-500' : log.includes('ERROR') ? 'text-red-500' : 'text-zinc-400'}>
                    {log}
                  </span>
                </div>
              ))}
              {!isComplete && <div className="w-1.5 h-4 bg-white/20 animate-pulse inline-block ml-1" />}
            </div>
          </div>
        </div>

        <div className="p-10 bg-white/5 border-t border-white/5 flex justify-end">
          <Button 
            disabled={!isComplete} 
            onClick={onClose}
            className={`h-14 px-12 text-[10px] font-black italic rounded-2xl transition-all ${isComplete ? 'bg-[#E31B23] text-white shadow-2xl' : 'bg-zinc-800 text-zinc-500'}`}
          >
            {isComplete ? 'CLOSE CONSOLE' : 'PROCESSING...'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

interface ManagementDashboardProps {
  onLogout: () => void;
}

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({ onLogout }) => {
  const [activeView, setActiveView] = useState<'overview' | 'reports' | 'staff' | 'compliance'>('overview');
  const [isIntervening, setIsIntervening] = useState(false);
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [showRecruitModal, setShowRecruitModal] = useState(false);
  const [activeEmailDraft, setActiveEmailDraft] = useState<EmailDraft | null>(null);
  
  const [isCheckingDatabase, setIsCheckingDatabase] = useState(false);
  const [dbStatus, setDbStatus] = useState<'nominal' | 'scanning' | 'error' | null>('nominal');
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderProgress, setReminderProgress] = useState(0);
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const [batchStats, setBatchStats] = useState({ total: 412, dispatched: 0 });
  const [isBatchComplete, setIsBatchComplete] = useState(false);
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>(["Management System Ready.", "System Stable."]);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [staffData, statsData, auditLogs] = await Promise.all([
          aimsApi.staff.getAll(),
          aimsApi.system.getStats(),
          aimsApi.system.getAuditLogs()
        ]);
        setStaff(staffData);
        setStats(statsData);
        const formattedLogs = auditLogs.slice(0, 20).map((log: any) => 
          `${log.action}: ${JSON.stringify(log.details)}`
        );
        setHandshakeLogs(prev => [...prev, ...formattedLogs]);
      } catch (e) {
        console.error("Failed to fetch management data", e);
      }
    };
    fetchData();
  }, []);

  const complianceScore = useMemo(() => {
    if (staff.length === 0) return 0;
    const compliantCount = staff.filter(s => s.complianceStatus === 'COMPLIANT').length;
    return Math.round((compliantCount / staff.length) * 100);
  }, [staff]);

  const checkDatabaseIntegrity = async () => {
    setIsCheckingDatabase(true);
    setDbStatus('scanning');
    setHandshakeLogs(prev => [...prev, "Initiating global audit...", "Scanning claims..."]);
    
    for(let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 600));
      setHandshakeLogs(prev => [...prev, `Verifying Node AIMS-DB-BLK-${1000 + i}... OK`]);
    }
    
    await new Promise(r => setTimeout(r, 800));
    setHandshakeLogs(prev => [...prev, "Database integrity: 100% NOMINAL.", "AIMS Ledger verified."]);
    setDbStatus('nominal');
    setIsCheckingDatabase(false);
  };

  const sendRenewalReminders = async () => {
    setIsSendingReminders(true);
    setIsBatchComplete(false);
    setReminderProgress(0);
    setBatchStats({ total: 412, dispatched: 0 });
    setBatchLogs(["Initializing Batch Engine...", "Authenticating with FirstMutual SMTP...", "Scanning Policy Registry..."]);
    
    // Stage 1: Scanning
    await new Promise(r => setTimeout(r, 1000));
    setBatchLogs(prev => [...prev, "Found 412 policies expiring within 30 days.", "Compiling recipient list..."]);
    setReminderProgress(15);

    // Stage 2: Processing in chunks
    const policies = ['ND-GOLD-9921', 'ND-SILVER-4401', 'ND-BRONZE-1102', 'ND-GOLD-8821', 'ND-PLAT-1022'];
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 400));
      const policy = policies[i % policies.length];
      const dispatchedCount = Math.min(412, Math.round((i + 1) * 41.2));
      setBatchStats(prev => ({ ...prev, dispatched: dispatchedCount }));
      setBatchLogs(prev => [...prev, `DISPATCH SUCCESS: Reminder sent to holder of ${policy}...`]);
      setReminderProgress(15 + Math.round((i + 1) * 7.5));
    }

    // Stage 3: Finalizing
    setBatchLogs(prev => [...prev, "Finalizing batch transmission...", "Verifying delivery receipts..."]);
    setReminderProgress(95);
    await new Promise(r => setTimeout(r, 1000));
    
    setReminderProgress(100);
    setBatchStats({ total: 412, dispatched: 412 });
    setBatchLogs(prev => [...prev, "BATCH COMPLETE: 412 Reminders dispatched.", "System log updated."]);
    setIsBatchComplete(true);
    setHandshakeLogs(prev => [...prev, "Batch renewal reminders dispatched successfully.", "412 holders notified."]);
  };

  const downloadReport = async (type: string) => {
    setHandshakeLogs(prev => [...prev, `Compiling ${type} report...`, "Generating archive..."]);
    
    let reportData: any = { type, timestamp: new Date().toISOString() };
    
    try {
      if (type === 'Claims Registry') {
        const response = await fetch('/api/claims');
        if (response.ok) {
          reportData.claims = await response.json();
        }
      } else {
        reportData.stats = { total_claims: 12840, renewals: 412 };
      }
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      reportData.error = "Data fetch failed";
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AIMS_${type}_Report_${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setHandshakeLogs(prev => [...prev, `Report [${type}] downloaded successfully.`]);
  };

  const handleRecruit = async (nodeData: Partial<StaffMember>) => {
    setIsRecruiting(true);
    setHandshakeLogs(prev => [...prev, `Adding ${nodeData.role} member: ${nodeData.name}...`]);
    
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nodeData)
      });
      
      if (res.ok) {
        const newNode = await res.json();
        setStaff(prev => [newNode, ...prev]);
        setHandshakeLogs(prev => [...prev, `Node ${newNode.id} successfully joined AIMS network.`, `Welcome email dispatched to ${newNode.email}.`]);
      }
    } catch (e) {
      console.error("Failed to recruit node", e);
    } finally {
      setIsRecruiting(false);
      setShowRecruitModal(false);
    }
  };

  const initiateComplianceAudit = (staffId: string) => {
    const s = staff.find(member => member.id === staffId);
    if (!s) return;
    const draft: EmailDraft = {
      staffId: s.id,
      to: s.email,
      cc: 'compliance@firstmutual.co.zw',
      subject: `MANDATORY AUDIT: Regulatory Protocol Violation [${s.id}]`,
      body: `Dear ${s.name},\n\nYour account ${s.id} has triggered a compliance flag: ${s.complianceStatus}.\n\nA formal review is now mandatory. Please upload all missing documentation immediately.`,
      isUrgent: true
    };
    setActiveEmailDraft(draft);
  };

  const initiateEmailDraft = (staffId: string) => {
    const s = staff.find(member => member.id === staffId);
    if (!s) return;
    const draft: EmailDraft = {
      staffId: s.id,
      to: s.email,
      cc: 'ops@firstmutual.co.zw',
      subject: `System Advisory: Operational Review [${s.id}]`,
      body: `Dear ${s.name},\n\nWe are conducting a routine review of staff member ${s.id}. Your current load is at ${s.load}%.\n\nPlease ensure all pending approvals are finalized before the daily system close.`,
      isUrgent: true
    };
    setActiveEmailDraft(draft);
  };

  const handleIntervention = async (draft: EmailDraft) => {
    setIsIntervening(true);
    setHandshakeLogs(prev => [...prev, `Encrypting advisory for ${draft.to}...`, "Pushing via SMTP cluster..."]);
    
    try {
      const res = await fetch(`/api/staff/${draft.staffId}/interventions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: draft.subject.includes('AUDIT') ? 'Compliance Audit' : 'Performance Email',
          subject: draft.subject
        })
      });

      if (res.ok) {
        const intervention = await res.json();
        setStaff(prev => prev.map(s => s.id === draft.staffId ? { 
          ...s, 
          interventions: [intervention, ...s.interventions] 
        } : s));
        setHandshakeLogs(prev => [...prev, `Advisory ${draft.subject} successfully dispatched.`]);
      }
    } catch (e) {
      console.error("Failed to send intervention", e);
    } finally {
      setIsIntervening(false);
      setActiveEmailDraft(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col relative overflow-x-hidden">
      {/* Header Overlay for Reminders */}
      {isSendingReminders && (
        <div className="fixed top-0 left-0 w-full h-1 bg-zinc-200 z-[100]">
          <div className="h-full bg-[#E31B23] transition-all duration-300" style={{ width: `${reminderProgress}%` }} />
        </div>
      )}

      {/* Leadership Header */}
      <div className="bg-black px-6 md:px-10 py-10 md:py-14 text-white border-b-8 border-[#E31B23] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-6"><BarChart3 size={320} /></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 relative z-10">
          <div className="space-y-4">
            <p className="text-[9px] font-bold text-[#E31B23] uppercase tracking-[0.4em] italic leading-none">MANAGEMENT COMMAND</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase italic leading-none text-white">Executive Hub</h1>
            <div className="flex items-center gap-6">
              <button 
                onClick={checkDatabaseIntegrity} 
                disabled={isCheckingDatabase}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${dbStatus === 'nominal' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-[#E31B23]'}`}
              >
                {isCheckingDatabase ? <RefreshCcw size={14} className="animate-spin" /> : <Database size={14} />}
                <span className="text-[9px] font-black uppercase tracking-widest">{isCheckingDatabase ? 'SCANNING DATABASE...' : 'SYSTEM INTEGRITY: NOMINAL'}</span>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-6 w-full lg:w-auto">
            <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-white/5 shadow-2xl flex-1 lg:flex-none overflow-x-auto no-scrollbar">
              {['overview', 'reports', 'staff', 'compliance'].map(tab => (
                <button key={tab} onClick={() => setActiveView(tab as any)} className={`flex-1 lg:flex-none px-6 md:px-10 py-3 text-[10px] font-bold uppercase tracking-widest transition-all rounded-xl whitespace-nowrap ${activeView === tab ? 'bg-[#E31B23] text-white shadow-lg shadow-red-900/20' : 'text-zinc-500 hover:text-white'}`}>
                  {tab === 'staff' ? 'Team' : tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="p-6 md:p-12 space-y-10 md:space-y-14 max-w-[1600px] mx-auto w-full">
        {activeEmailDraft && (
          <EmailDraftModal 
            draft={activeEmailDraft} 
            onClose={() => setActiveEmailDraft(null)} 
            onSend={handleIntervention}
            isSending={isIntervening}
          />
        )}

        {showRecruitModal && (
          <RecruitNodeModal 
            onClose={() => setShowRecruitModal(false)}
            onRecruit={handleRecruit}
            isProcessing={isRecruiting}
          />
        )}

        {isSendingReminders && (
          <BatchProcessModal 
            onClose={() => setIsSendingReminders(false)}
            progress={reminderProgress}
            logs={batchLogs}
            isComplete={isBatchComplete}
            stats={batchStats}
          />
        )}

        {activeView === 'overview' && (
          <div className="space-y-10 md:space-y-14 animate-in fade-in duration-500">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { label: 'Network Operations', val: stats?.totalClaims || '...', icon: <Activity size={20}/>, color: 'text-blue-500' },
                { label: 'Avg Payout Cycle', val: '8.4 DAYS', icon: <Timer size={20}/>, color: 'text-[#E31B23]' },
                { label: 'Settlement Liquidity', val: stats ? `$${(stats.totalPayout / 1000000).toFixed(2)}M` : '...', icon: <DollarSign size={20}/>, color: 'text-green-500' },
                { label: 'Compliance Rating', val: `${complianceScore}%`, icon: <ShieldCheck size={20}/>, color: 'text-zinc-400' },
              ].map((stat, i) => (
                <Card key={i} className="p-8 border-none shadow-xl bg-white rounded-[32px] flex flex-col justify-between hover:scale-[1.02] transition-all group">
                  <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center ${stat.color} mb-8 shadow-inner group-hover:bg-black transition-colors`}>{stat.icon}</div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black text-black italic uppercase tracking-tight">{stat.val}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-8 p-10 bg-white border-none shadow-xl rounded-[48px] flex items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-105 transition-all duration-1000"><Shield size={200} /></div>
                <div className="relative z-10 flex flex-col justify-between h-full space-y-10">
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-[#E31B23] uppercase tracking-widest italic leading-none">AIMS PORTFOLIO</p>
                    <h3 className="text-2xl font-black text-black uppercase tracking-tight italic">Active Customer Policies</h3>
                  </div>
                  <div>
                    <p className="text-7xl md:text-8xl font-black text-black italic tracking-tighter leading-none">12,840</p>
                  </div>
                </div>
              </Card>

              <Card className="lg:col-span-4 p-10 bg-[#812323] text-white border-none shadow-2xl rounded-[48px] flex flex-col justify-center relative overflow-hidden group">
                 <div className="relative z-10 space-y-6">
                   <div>
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest italic mb-2">RENEWALS REQUIRED</p>
                     <h3 className="text-2xl font-black uppercase italic tracking-tight leading-none text-white">Expiring Node List</h3>
                   </div>
                   <p className="text-7xl font-black italic tracking-tighter leading-none text-white">412</p>
                   <Button 
                    onClick={sendRenewalReminders} 
                    disabled={isSendingReminders}
                    className={`w-full h-16 text-white text-[10px] font-black rounded-2xl shadow-xl uppercase transition-all ${isSendingReminders ? 'bg-zinc-800' : 'bg-white/10 border-white/20 hover:bg-white hover:text-black'}`}
                   >
                     {isSendingReminders ? `SENDING (${reminderProgress}%)` : 'SEND BATCH REMINDERS'}
                   </Button>
                 </div>
              </Card>
            </div>

            {/* Telemetry Console */}
            <Card className="p-10 bg-zinc-950 text-white rounded-[40px] border-none shadow-2xl space-y-8 h-[300px] flex flex-col">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-4 italic text-zinc-400">
                  <Zap size={18} className="text-[#E31B23]" /> System Integrity Handshake Feed
                </h3>
                {isCheckingDatabase && <Loader2 size={16} className="animate-spin text-zinc-600" />}
              </div>
              <div className="flex-1 overflow-hidden">
                <NeuralFeed logs={handshakeLogs} />
              </div>
            </Card>
          </div>
        )}

        {activeView === 'reports' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase italic text-black leading-none">Reporting Deck</h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">AIMS Data Export Modules</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[
                 { title: 'Claims Registry', desc: 'Full audit history for current quarter', icon: <FileText className="text-blue-500" /> },
                 { title: 'Financial Ledger', desc: 'Settlement flows and liquidity tracking', icon: <DollarSign className="text-green-500" /> },
                 { title: 'Staff KPI Deck', desc: 'Node-level performance and intervention logs', icon: <Target className="text-[#E31B23]" /> },
               ].map((report, i) => (
                 <Card key={i} className="p-10 bg-white border-none shadow-xl rounded-[32px] hover:shadow-2xl transition-all group border border-slate-100 flex flex-col justify-between min-h-[280px]">
                    <div className="space-y-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner group-hover:bg-black group-hover:text-white transition-colors">{report.icon}</div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black uppercase italic text-black">{report.title}</h4>
                        <p className="text-xs font-medium text-zinc-400 italic leading-relaxed">{report.desc}</p>
                      </div>
                    </div>
                    <div className="pt-8 flex gap-3">
                       <button onClick={() => downloadReport(report.title)} className="flex-1 h-14 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                         <Download size={16} /> JSON
                       </button>
                    </div>
                 </Card>
               ))}
             </div>
          </div>
        )}

        {activeView === 'staff' && (
          <div className="animate-in slide-in-from-bottom-4 space-y-10">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-1">
               <div className="space-y-2">
                 <h2 className="text-3xl font-black uppercase italic text-black leading-none">Network Nodes</h2>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Active Lifecycle Operators</p>
               </div>
               <Button onClick={() => setShowRecruitModal(true)} className="h-16 px-10 text-[10px] rounded-2xl uppercase shadow-xl bg-black flex gap-3 items-center">
                 <Plus size={20} className="text-[#E31B23]" />
                 RECRUIT NODE
               </Button>
             </div>

             <Card className="overflow-hidden border-none shadow-xl rounded-[40px] bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                        <th className="px-10 py-6">TEAM MEMBER / PARTNER</th>
                        <th className="px-10 py-6">ROLE IDENTITY</th>
                        <th className="px-10 py-6">AUDIT SCORE</th>
                        <th className="px-10 py-6 text-right">DISPATCH ADVISORY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {staff.map(member => (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black italic text-sm shadow-md ${member.role === 'Repair Partner' ? 'bg-[#E31B23] text-white' : 'bg-black text-white'}`}>
                                {member.avatar}
                              </div>
                              <div>
                                <p className="text-base font-black text-black uppercase italic leading-none">{member.name}</p>
                                <p className="text-[10px] font-bold text-zinc-400 mt-2 uppercase tracking-widest">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-xs font-black text-zinc-500 uppercase italic">
                            <Badge className="border-none bg-zinc-50 text-zinc-400">{member.role}</Badge>
                          </td>
                          <td className="px-10 py-8">
                             <div className="flex items-center gap-4">
                               <span className={`text-lg font-black italic ${member.rating < 3.5 ? 'text-red-600' : 'text-black'}`}>{member.rating}</span>
                               <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full transition-all duration-1000 ${member.rating < 3.5 ? 'bg-red-600' : 'bg-green-500'}`} style={{ width: `${(member.rating / 5) * 100}%` }} />
                               </div>
                             </div>
                          </td>
                          <td className="px-10 py-8 text-right">
                             <button 
                               onClick={() => initiateEmailDraft(member.id)} 
                               className="p-5 bg-zinc-50 text-zinc-400 hover:text-white hover:bg-black rounded-2xl transition-all shadow-sm flex items-center gap-3 ml-auto group/btn"
                              >
                               <span className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover/btn:opacity-100 transition-opacity">Contact Node</span>
                               <Mail size={20} />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </Card>
          </div>
        )}

        {activeView === 'compliance' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 px-1">
               <div className="space-y-2">
                 <h2 className="text-3xl font-black uppercase italic text-black leading-none">Compliance Control</h2>
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">Regulatory & SLA Audit Deck</p>
               </div>
               <div className="flex gap-4">
                 <Button variant="outline" className="h-14 px-8 text-[9px] font-black rounded-xl">IFRS 17 STATUS</Button>
                 <Button className="h-14 px-8 text-[9px] font-black bg-black text-white rounded-xl shadow-xl">GLOBAL REMEDIATION</Button>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                 { label: 'KYC Verified', val: '92%', icon: <Fingerprint className="text-blue-500" /> },
                 { label: 'SLA Adherence', val: '98.4%', icon: <Clock className="text-green-500" /> },
                 { label: 'Critical Alerts', val: '3', icon: <AlertTriangle className="text-[#E31B23]" /> },
                 { label: 'Audit Pipeline', val: '12', icon: <Scale className="text-zinc-400" /> },
               ].map((stat, i) => (
                 <Card key={i} className="p-8 bg-white border-none shadow-xl rounded-[32px] hover:scale-[1.02] transition-all group">
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner group-hover:bg-black group-hover:text-white transition-colors">
                     {stat.icon}
                   </div>
                   <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">{stat.label}</p>
                   <p className="text-2xl font-black italic text-black uppercase tracking-tight">{stat.val}</p>
                 </Card>
               ))}
             </div>

             <Card className="rounded-[40px] border-none shadow-2xl bg-white overflow-hidden">
                <div className="p-8 bg-zinc-950 text-white flex items-center justify-between border-b border-white/5">
                   <h3 className="text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3">
                     <ShieldCheck size={18} className="text-[#E31B23]" /> Network Compliance Matrix
                   </h3>
                   <div className="flex items-center gap-3 text-[9px] font-bold text-zinc-500 uppercase">
                      <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full" /> Compliant</div>
                      <div className="flex items-center gap-1.5 ml-4"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Violation</div>
                   </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-900 border-b border-white/5 text-white/40">
                      <tr className="text-[9px] font-black uppercase tracking-widest">
                        <th className="px-10 py-6">ENTITY NODE</th>
                        <th className="px-10 py-6">ROLE</th>
                        <th className="px-10 py-6">COMPLIANCE STATUS</th>
                        <th className="px-10 py-6 text-right">REMEDIATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {staff.map(member => (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black italic text-xs shadow-sm ${member.complianceStatus === 'COMPLIANT' ? 'bg-zinc-100 text-black' : 'bg-red-50 text-[#E31B23]'}`}>
                                {member.avatar}
                              </div>
                              <span className="text-sm font-black text-black uppercase italic">{member.name}</span>
                            </div>
                          </td>
                          <td className="px-10 py-8 text-[9px] font-bold text-zinc-400 uppercase italic">
                            {member.role}
                          </td>
                          <td className="px-10 py-8">
                             <Badge status={member.complianceStatus === 'COMPLIANT' ? 'success' : 'critical'} className="border-none text-[8px] font-black italic rounded-lg">
                                {member.complianceStatus.replace('_', ' ')}
                             </Badge>
                          </td>
                          <td className="px-10 py-8 text-right">
                             {member.complianceStatus !== 'COMPLIANT' ? (
                               <Button 
                                onClick={() => initiateComplianceAudit(member.id)}
                                className="h-10 px-6 bg-black text-white text-[8px] font-black rounded-lg shadow-xl hover:bg-red-700 transition-all flex items-center gap-2 ml-auto"
                               >
                                 <FileWarning size={14} /> TRIGGER AUDIT
                               </Button>
                             ) : (
                               <span className="text-[8px] font-black text-green-600 uppercase italic tracking-widest flex items-center justify-end gap-2">
                                 <ShieldCheck size={14} /> NOMINAL
                               </span>
                             )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagementDashboard;
