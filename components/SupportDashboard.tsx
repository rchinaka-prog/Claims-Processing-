
import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Badge, PaymentBridge } from './Shared';
import LiveChat from './LiveChat';
import { aimsApi } from '../src/services/aimsApi';
import { 
  UserCog, Phone, X, AlertTriangle, 
  ChevronRight, Search, Filter, 
  LayoutList, ListFilter, ArrowLeft,
  CheckCircle, CreditCard, Inbox, MessageSquare, 
  Trash2, Send, Clock, AlertCircle, TrendingUp,
  LayoutDashboard, ClipboardList, Shield, DollarSign,
  LogOut, Calendar, UserPlus, Loader2, RefreshCw, Scale, Brain,
  Landmark, FileCheck, Image as ImageIcon, CheckCircle2
} from 'lucide-react';
import type { Notification } from './Shared';
import { AuthSession } from '../types';

interface ClaimNote {
  id: string;
  text: string;
  timestamp: string;
  visibleToRepairer: boolean;
}

interface SupportClaim {
  id: string;
  customer: string;
  customerPhone: string;
  vehicle: string;
  regNo: string;
  status: 'Reviewing' | 'Approved' | 'Finished' | 'Stagnant' | 'Documents Pending' | 'Submitted' | 'Settled';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  date: string;
  submittedAt: string; // ISO string for deadline tracking
  type: string;
  amount: string;
  rawAmount: number;
  coverage: number;
  policyLimit: string;
  policyStatus: 'ACTIVE' | 'EXPIRED' | 'INACTIVE';
  assignedAssessor?: string;
  repairer: string;
  insurancePaid: boolean;
  bottleneckReason?: string;
  progress: number;
  consistencyIndex?: number;
  assessorFindings?: string;
  negotiationPending?: boolean;
  requestedAmount?: number;
  completionPhotos?: string[];
  notes?: ClaimNote[];
}

interface StaffMessage {
  id: string;
  user: string;
  preview: string;
  time: string;
  unread: boolean;
  avatar: string;
}

const assessors = [
  { id: 'AS-882', name: 'Marcus Flint' },
  { id: 'AS-883', name: 'Sarah Jenkins' },
  { id: 'AS-884', name: 'Terrence Moyo' },
  { id: 'AS-885', name: 'Brian Phiri' }
];

const SupportDashboard: React.FC<SupportDashboardProps> = ({ session, activeTab, onTabChange, addNotification, onLogout }) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [showPaymentBridge, setShowPaymentBridge] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [isAssigning, setIsAssigning] = useState(false);
  const [targetAssessorId, setTargetAssessorId] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [isNoteVisibleToRepairer, setIsNoteVisibleToRepairer] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  
  const notifiedStagnantIds = useRef<Set<string>>(new Set());
  const lastKnownStatuses = useRef<Record<string, string>>({});

  const [claimsQueue, setClaimsQueue] = useState<SupportClaim[]>([]);

  useEffect(() => {
    const fetchClaims = async () => {
      try {
        const data = await aimsApi.claims.getAll();
        // Map backend fields to SupportClaim fields if necessary
        const mappedData = data.map((c: any) => ({
          ...c,
          customer: c.customer || c.owner,
          customerPhone: c.phone,
          vehicle: c.vehicle || c.car,
          submittedAt: c.submittedAt || new Date().toISOString(),
          status: c.status === 'PENDING_INSPECTION' ? 'Reviewing' : c.status,
          rawAmount: c.coverage,
          insurancePaid: c.insurancePaid || false,
          progress: c.progress || 0
        }));
        setClaimsQueue(mappedData);
      } catch (error) {
        console.error("Failed to fetch claims:", error);
      }
    };
    fetchClaims();
  }, []);

  const [inboxMessages] = useState<StaffMessage[]>([
    { id: '1', user: 'John Doe', preview: 'When will my car be ready?', time: '2m ago', unread: true, avatar: 'JD' },
    { id: '2', user: 'Sarah Jenkins', preview: 'Uploaded report to portal.', time: '1h ago', unread: false, avatar: 'SJ' },
    { id: '3', user: 'City Auto Elite', preview: 'Requesting budget approval.', time: '3h ago', unread: true, avatar: 'CA' },
  ]);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getDeadlineInfo = (submittedAt: string) => {
    const submissionDate = new Date(submittedAt);
    const deadlineDate = new Date(submissionDate.getTime() + 24 * 60 * 60 * 1000);
    const diff = deadlineDate.getTime() - now.getTime();
    
    const isOverdue = diff < 0;
    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

    return {
      text: `${isOverdue ? '-' : ''}${hours}h ${minutes}m ${seconds}s`,
      isOverdue,
      isCritical: !isOverdue && hours < 4,
      percentage: Math.max(0, Math.min(100, (diff / (24 * 60 * 60 * 1000)) * 100))
    };
  };

  const filteredClaims = claimsQueue.filter(c => {
    const matchesSearch = 
      c.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'ALL' || c.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  const selectedClaim = claimsQueue.find(c => c.id === selectedClaimId);

  const handleAssignAssessor = async () => {
    if (!selectedClaimId || !targetAssessorId) return;
    setIsAssigning(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const assessor = assessors.find(a => a.id === targetAssessorId);
    try {
      await fetch(`/api/claims/${selectedClaimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedAssessor: assessor?.name, status: 'Reviewing', progress: 40 })
      });

      setClaimsQueue(prev => prev.map(c => 
        c.id === selectedClaimId ? { ...c, assignedAssessor: assessor?.name, status: 'Reviewing', progress: 40 } : c
      ));
      
      addNotification({
        id: `assign-${Date.now()}`,
        title: "Assessor Assigned",
        message: `${assessor?.name} has been assigned to claim ${selectedClaimId}.`,
        type: 'success',
        timestamp: new Date(),
        isRead: false
      });
    } catch (error) {
      console.error("Failed to assign assessor:", error);
    }
    setTargetAssessorId('');
    setIsAssigning(false);
  };

  const approveNegotiation = async () => {
    if (!selectedClaimId || !selectedClaim) return;
    
    try {
      const newAmount = `$${(selectedClaim.requestedAmount || 0).toLocaleString()}`;
      const newCoverage = selectedClaim.requestedAmount || selectedClaim.coverage;
      
      await fetch(`/api/claims/${selectedClaimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coverage: newCoverage, 
          amount: newAmount, 
          negotiationPending: false, 
          status: 'Approved' 
        })
      });

      setClaimsQueue(prev => prev.map(c => 
        c.id === selectedClaimId ? { ...c, coverage: newCoverage, amount: newAmount, negotiationPending: false, status: 'Approved' } : c
      ));
      
      addNotification({
        id: `neg-ok-${Date.now()}`,
        title: "Negotiation Approved",
        message: `Final repair sum for ${selectedClaimId} set to $${selectedClaim.requestedAmount?.toLocaleString()}.`,
        type: 'success',
        timestamp: new Date(),
        isRead: false
      });
    } catch (error) {
      console.error("Failed to approve negotiation:", error);
    }
  };

  const requestCounter = async () => {
    if (!selectedClaimId || !selectedClaim) return;
    
    try {
      await fetch(`/api/claims/${selectedClaimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          negotiationPending: false, 
          bottleneckReason: 'Counter-offer issued by Support', 
          status: 'Reviewing' 
        })
      });

      setClaimsQueue(prev => prev.map(c => 
        c.id === selectedClaimId ? { ...c, negotiationPending: false, bottleneckReason: 'Counter-offer issued by Support', status: 'Reviewing' } : c
      ));
      
      addNotification({
        id: `neg-counter-${Date.now()}`,
        title: "Counter-offer Issued",
        message: `A counter-offer has been initiated for claim ${selectedClaimId}.`,
        type: 'info',
        timestamp: new Date(),
        isRead: false
      });
    } catch (error) {
      console.error("Failed to issue counter-offer:", error);
    }
  };

  const handleProcessPayout = async () => {
    if (!selectedClaimId || !selectedClaim) return;
    
    try {
      await fetch(`/api/claims/${selectedClaimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'Settled',
          insurancePaid: true
        })
      });

      setClaimsQueue(prev => prev.map(c => 
        c.id === selectedClaimId ? { ...c, status: 'Settled', insurancePaid: true } : c
      ));
      
      addNotification({
        id: `payout-${Date.now()}`,
        title: "Payout Processed",
        message: `Claim ${selectedClaimId} has been settled.`,
        type: 'success',
        timestamp: new Date(),
        isRead: false
      });
    } catch (error) {
      console.error("Failed to process payout:", error);
    }
    setShowPaymentBridge(false);
  };

  const handleAddNote = async () => {
    if (!selectedClaimId || !newNoteText.trim()) return;
    setIsSavingNote(true);
    try {
      const response = await fetch(`/api/claims/${selectedClaimId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: newNoteText,
          visibleToRepairer: isNoteVisibleToRepairer
        })
      });
      if (response.ok) {
        const newNote = await response.json();
        setClaimsQueue(prev => prev.map(c => 
          c.id === selectedClaimId ? { ...c, notes: [...(c.notes || []), newNote] } : c
        ));
        setNewNoteText('');
        setIsNoteVisibleToRepairer(false);
        addNotification({
          id: `note-${Date.now()}`,
          title: "Note Added",
          message: "The private note has been saved to the claim dossier.",
          type: 'success',
          timestamp: new Date(),
          isRead: false
        });
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (activeTab === 'inbox') {
    return (
      <div className="flex flex-col min-h-full bg-slate-50">
        <div className="p-6 md:p-8 border-b border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold text-black uppercase tracking-tight italic leading-none">Staff Inbox</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Correspondence Node</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6 max-w-5xl mx-auto w-full">
          <Card className="rounded-2xl md:rounded-3xl border-none shadow-xl overflow-hidden bg-white">
            <div className="divide-y divide-slate-100">
              {inboxMessages.map(msg => (
                <div key={msg.id} className={`p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group ${msg.unread ? 'border-l-4 border-[#E31B23]' : ''}`}>
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-black text-white rounded-lg md:rounded-xl flex items-center justify-center font-bold italic shadow-md shrink-0">{msg.avatar}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`text-xs md:text-sm font-bold uppercase italic truncate ${msg.unread ? 'text-black' : 'text-slate-400'}`}>{msg.user}</h4>
                        {msg.unread && <div className="w-1.5 h-1.5 bg-[#E31B23] rounded-full animate-pulse" />}
                      </div>
                      <p className={`text-[11px] md:text-xs mt-1 italic truncate ${msg.unread ? 'font-bold text-zinc-900' : 'text-slate-400'}`}>{msg.preview}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (activeTab === 'billing') {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 p-4 md:p-10 space-y-6 md:space-y-10">
        <div className="space-y-2 px-1">
          <p className="text-[9px] font-bold text-[#E31B23] uppercase tracking-[0.3em] italic leading-none">FINANCIAL COMMAND</p>
          <h2 className="text-2xl md:text-4xl font-bold text-black uppercase tracking-tight italic leading-none">Billing Center</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Pending Payouts', val: '$12,450', icon: <DollarSign />, color: 'text-blue-500' },
            { label: 'Settled Today', val: '$4,150', icon: <CheckCircle />, color: 'text-green-500' },
            { label: 'Audit Variance', val: '$1,200', icon: <AlertTriangle />, color: 'text-[#E31B23]' },
          ].map((stat, i) => (
            <Card key={i} className="p-6 md:p-8 rounded-3xl border-none shadow-xl bg-white flex flex-col justify-between">
              <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center ${stat.color} mb-6 shadow-inner`}>{stat.icon}</div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-black italic uppercase tracking-tight">{stat.val}</p>
              </div>
            </Card>
          ))}
        </div>
        <Card className="rounded-[32px] border-none shadow-xl bg-white p-6 md:p-10">
          <h3 className="text-lg font-bold text-black uppercase tracking-tight italic mb-8">Recent Ledger Entries</h3>
          <div className="space-y-4">
            {claimsQueue.filter(c => c.insurancePaid || c.negotiationPending).map(c => (
              <div key={c.id} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-bold italic">{c.id.slice(0, 2)}</div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{c.id}</p>
                    <p className="text-sm font-bold text-black uppercase italic">{c.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-black italic">{c.amount}</p>
                  <Badge status={c.insurancePaid ? 'success' : 'critical'} className="mt-1 text-[7px] px-2 py-0.5 rounded-md uppercase">{c.insurancePaid ? 'DISBURSED' : 'PENDING'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (activeTab === 'policies') {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 p-4 md:p-10 space-y-6 md:space-y-10">
        <div className="space-y-2 px-1">
          <p className="text-[9px] font-bold text-[#E31B23] uppercase tracking-[0.3em] italic leading-none">REGULATORY HUB</p>
          <h2 className="text-2xl md:text-4xl font-bold text-black uppercase tracking-tight italic leading-none">Policy Hub</h2>
        </div>
        <Card className="rounded-[32px] border-none shadow-xl bg-white p-6 md:p-10 space-y-8">
          <div className="flex bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 items-center gap-4 shadow-inner">
            <Search size={20} className="text-zinc-300" />
            <input className="text-sm font-bold uppercase tracking-widest outline-none w-full italic bg-transparent" placeholder="SEARCH POLICY REGISTRY..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { id: 'ND-GOLD-9921', holder: 'John Doe', status: 'ACTIVE', tier: 'GOLD' },
              { id: 'ND-SILVER-4401', holder: 'Mary W.', status: 'ACTIVE', tier: 'SILVER' },
              { id: 'ND-BRONZE-1102', holder: 'Mark Thompson', status: 'EXPIRED', tier: 'BRONZE' },
            ].map(p => (
              <div key={p.id} className="p-6 border-2 border-slate-100 rounded-2xl hover:border-black transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <Badge status={p.status === 'ACTIVE' ? 'success' : 'critical'} className="text-[8px] font-bold px-3 py-0.5 rounded-md uppercase">{p.status}</Badge>
                  <span className="text-[10px] font-black text-[#E31B23] italic">{p.tier}</span>
                </div>
                <h4 className="text-lg font-black text-black uppercase italic tracking-tight">{p.holder}</h4>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{p.id}</p>
                <Button variant="ghost" className="mt-6 w-full h-12 border-t border-slate-50 text-[9px] font-black group-hover:bg-black group-hover:text-white">VIEW FULL DOSSIER</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (activeTab === 'claims') {
    // Claims Engine - Advanced list
    return (
      <div className="flex flex-col min-h-full bg-slate-50 p-4 md:p-10 space-y-6 md:space-y-10">
        <div className="space-y-2 px-1">
          <p className="text-[9px] font-bold text-[#E31B23] uppercase tracking-[0.3em] italic leading-none">OPERATIONAL CORE</p>
          <h2 className="text-2xl md:text-4xl font-bold text-black uppercase tracking-tight italic leading-none">Claims Engine</h2>
        </div>
        <Card className="rounded-[32px] border-none shadow-xl bg-white p-6 md:p-10 space-y-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 items-center gap-4 shadow-inner flex-1 w-full lg:w-auto">
              <Search size={20} className="text-zinc-300" />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm font-bold uppercase tracking-widest outline-none w-full italic bg-transparent" 
                placeholder="SEARCH BY NAME, ID, OR VEHICLE..." 
              />
            </div>
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
              {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(p => (
                <button 
                  key={p} 
                  onClick={() => setPriorityFilter(p as any)}
                  className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${priorityFilter === p ? 'bg-black text-white shadow-lg' : 'bg-slate-50 text-zinc-400 hover:text-black'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {filteredClaims.map(c => (
              <div key={c.id} onClick={() => setSelectedClaimId(c.id)} className="p-6 bg-white border-2 border-slate-100 rounded-2xl hover:border-[#E31B23] transition-all cursor-pointer group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-black text-white border-none text-[8px] font-bold px-2 py-0.5 rounded-md">{c.id}</Badge>
                    <Badge status={c.priority} className="text-[8px] font-bold px-2 py-0.5 rounded-md uppercase">{c.priority}</Badge>
                  </div>
                  <h4 className="text-xl font-black text-black uppercase italic tracking-tight group-hover:text-[#E31B23] transition-colors">{c.vehicle}</h4>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{c.customer} • {c.type}</p>
                </div>
                <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest italic mb-1">Progress</p>
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#E31B23] transition-all duration-1000" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={24} className="text-zinc-200 group-hover:text-black transition-all" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 p-4 md:p-10 space-y-6 md:space-y-10">
      {!selectedClaimId ? (
        <>
          <div className="space-y-2 px-1">
            <p className="text-[9px] font-bold text-[#E31B23] uppercase tracking-[0.3em] italic leading-none">ENTERPRISE COMMAND</p>
            <h2 className="text-2xl md:text-4xl font-bold text-black uppercase tracking-tight italic leading-none">Greetings, {session.user.full_name.split(' ')[0]}</h2>
          </div>

          <Card className="rounded-2xl md:rounded-[32px] border-none shadow-xl bg-white p-4 md:p-10 space-y-6 md:space-y-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-black uppercase tracking-tight italic">Live Claims Queue</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Prioritized workflow steps</p>
              </div>
              <div className="flex bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 items-center gap-4 shadow-inner flex-1 w-full lg:max-w-md">
                <Search size={18} className="text-zinc-300" />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs font-bold uppercase tracking-widest outline-none w-full italic bg-transparent" 
                  placeholder="SEARCH BY NAME, ID, OR VEHICLE..." 
                />
              </div>
            </div>

            <div className="overflow-x-auto -mx-4 md:-mx-10">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-50">
                    <th className="px-10 py-5">CLAIM/ASSET</th>
                    <th className="px-10 py-5">STATUS</th>
                    <th className="px-10 py-5">SLA DEADLINE</th>
                    <th className="px-10 py-5">FINANCE HANDSHAKE</th>
                    <th className="px-10 py-5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredClaims.map((claim) => {
                    const deadline = getDeadlineInfo(claim.submittedAt);
                    return (
                      <tr key={claim.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-10 py-6">
                          <div className="bg-black text-white inline-block px-3 py-1 rounded text-[8px] font-bold mb-1.5 uppercase">{claim.id}</div>
                          <p className="text-sm font-bold text-[#E31B23] uppercase tracking-tight italic leading-none">{claim.vehicle}</p>
                        </td>
                        <td className="px-10 py-6">
                          <Badge status={claim.status} className="mb-1 text-[8px] font-bold px-3 py-0.5 rounded-md uppercase">{claim.status}</Badge>
                        </td>
                        <td className="px-10 py-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Clock size={12} className={deadline.isOverdue ? 'text-red-600' : deadline.isCritical ? 'text-orange-500' : 'text-slate-400'} />
                              <span className={`text-[10px] font-black italic uppercase tracking-widest ${deadline.isOverdue ? 'text-red-600' : deadline.isCritical ? 'text-orange-500' : 'text-slate-600'}`}>
                                {deadline.text}
                              </span>
                            </div>
                            <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-500 ${deadline.isOverdue ? 'bg-red-600' : deadline.isCritical ? 'bg-orange-500' : 'bg-green-500'}`} 
                                style={{ width: `${deadline.percentage}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          {claim.negotiationPending ? (
                            <div className="flex items-center gap-3 animate-pulse">
                               <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center font-black text-[9px] border border-yellow-200">
                                 $
                               </div>
                               <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest italic">Negotiation Pending</span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-bold text-zinc-300 uppercase italic">Ledger Nominal</span>
                          )}
                        </td>
                        <td className="px-10 py-6 text-right">
                          <Button onClick={() => setSelectedClaimId(claim.id)} className="bg-black text-white hover:bg-[#E31B23] px-6 py-2.5 text-[9px] rounded-xl transition-all shadow-md font-bold">PROCESS</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <div className="space-y-6 md:space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
          <Button onClick={() => { setSelectedClaimId(null); setTargetAssessorId(''); }} variant="outline" className="gap-2 md:gap-3 h-10 md:h-12 px-6 md:px-8 text-[9px] md:text-[10px] font-bold italic rounded-xl shadow-sm">
            <ArrowLeft size={16} /> BACK
          </Button>

          {selectedClaim && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
               <div className="lg:col-span-8 space-y-8">
                 <Card className="p-10 bg-black text-white rounded-[40px] border-none shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-105 transition-all duration-1000">
                     <UserCog size={320} />
                   </div>
                   
                   <div className="relative z-10 space-y-10">
                     <div className="space-y-4">
                       <Badge status="info" className="text-[9px] font-bold bg-[#E31B23] border-none px-4 py-1.5 rounded-lg shadow-md uppercase tracking-widest italic">LIFECYCLE HUB</Badge>
                       <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight italic leading-none">{selectedClaim.customer}</h2>
                       <p className="text-lg md:text-xl font-bold text-zinc-500 italic mt-2 tracking-tight">{selectedClaim.vehicle} • {selectedClaim.id}</p>
                     </div>

                     {/* Negotiation Block */}
                     {selectedClaim.negotiationPending && (
                       <div className="bg-zinc-900 border border-yellow-500/20 p-8 rounded-3xl space-y-8 animate-in zoom-in-95">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-yellow-500 text-black rounded-xl shadow-xl"><Landmark size={20} /></div>
                             <h3 className="text-xs font-black uppercase tracking-widest italic text-white">Financial Request Handshake</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="p-6 bg-black border border-white/5 rounded-2xl space-y-3">
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">AIMS Original Budget</p>
                                <p className="text-3xl font-black italic text-zinc-400">${selectedClaim.rawAmount.toLocaleString()}</p>
                             </div>
                             <div className="p-6 bg-[#FFD700]/5 border border-[#FFD700]/10 rounded-2xl space-y-3 ring-2 ring-[#FFD700]/20">
                                <p className="text-[9px] font-black text-[#FFD700] uppercase tracking-widest italic">Repairer Proposal</p>
                                <p className="text-3xl font-black italic text-[#FFD700]">${selectedClaim.requestedAmount?.toLocaleString()}</p>
                             </div>
                          </div>
                          <div className="flex gap-4">
                             <Button onClick={approveNegotiation} className="flex-1 h-14 bg-[#FFD700] text-black text-[10px] font-black rounded-xl hover:bg-[#FFC700] transition-colors shadow-lg">APPROVE LEDGER ADJUSTMENT</Button>
                             <Button onClick={requestCounter} variant="outline" className="flex-1 h-14 border-zinc-800 text-white text-[10px] font-black rounded-xl hover:bg-white hover:text-black transition-all">ISSUE COUNTER</Button>
                          </div>
                       </div>
                     )}

                     {/* Assessor Findings */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/10">
                        <div className="bg-zinc-900/50 p-8 rounded-3xl space-y-6">
                           <div className="flex items-center gap-3 text-[#E31B23]">
                              <Scale size={18} />
                              <h3 className="text-xs font-black uppercase tracking-widest italic text-white">Field Handshake</h3>
                           </div>
                           <p className="text-5xl font-black italic tracking-tighter text-white">{selectedClaim.consistencyIndex || 0}%</p>
                        </div>
                        <div className="bg-zinc-900/50 p-8 rounded-3xl space-y-6">
                           <div className="flex items-center gap-3 text-[#E31B23]">
                              <Brain size={18} />
                              <h3 className="text-xs font-black uppercase tracking-widest italic text-white">Neural Logic</h3>
                           </div>
                           <p className="text-[11px] font-medium italic text-zinc-400 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                             "{selectedClaim.assessorFindings || "No assessment logic linked yet."}"
                           </p>
                        </div>
                     </div>
                   </div>
                 </Card>

                 {/* Photo Verification Block */}
                 <Card className="p-10 bg-white border-none shadow-xl rounded-[40px] space-y-8">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-zinc-50 rounded-xl text-black"><ImageIcon size={22} /></div>
                          <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Completion Audit Evidence</h3>
                       </div>
                       <Badge className="bg-green-50 text-green-600 border-none font-bold text-[9px] px-4 py-1.5 rounded-lg">RESTORED</Badge>
                    </div>
                    {selectedClaim.completionPhotos && selectedClaim.completionPhotos.length > 0 ? (
                       <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                          {selectedClaim.completionPhotos.map((p, i) => (
                             <div key={i} className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 group relative">
                                <img src={p} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                   <CheckCircle2 size={32} className="text-green-400" />
                                </div>
                             </div>
                          ))}
                       </div>
                    ) : (
                       <div className="py-12 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center space-y-4 opacity-40">
                          <FileCheck size={48} className="text-zinc-400" />
                          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Awaiting completion frames from {selectedClaim.repairer}</p>
                       </div>
                    )}
                 </Card>
               </div>

               <div className="lg:col-span-4 space-y-8">
                  <Card className="p-8 bg-zinc-950 text-white rounded-[32px] border-none shadow-xl space-y-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><DollarSign size={180} /></div>
                    <div className="relative z-10 space-y-8">
                      <div className="space-y-4">
                         <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 italic text-zinc-400"><Landmark size={18} className="text-[#E31B23]" /> Financial Command</h3>
                         <div className="p-6 bg-black border border-white/5 rounded-2xl space-y-4 shadow-inner">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase italic">
                               <span className="text-zinc-500">Coverage Limit</span>
                               <span className="text-white">{selectedClaim.policyLimit}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase italic">
                               <span className="text-zinc-500">Authorized Sum</span>
                               <span className="text-white">${selectedClaim.coverage.toLocaleString()}</span>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase italic">
                               <span className="text-[#E31B23]">Liability Status</span>
                               <span className="text-white">{selectedClaim.insurancePaid ? 'DISBURSED' : 'HOLDING'}</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button 
                          disabled={selectedClaim.insurancePaid || selectedClaim.negotiationPending || selectedClaim.status === 'Settled'}
                          onClick={() => setShowPaymentBridge(true)}
                          className={`w-full h-18 text-[10px] font-black italic rounded-2xl shadow-xl transition-all ${selectedClaim.status === 'Approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#635bff] hover:bg-[#5851e0]'} text-white`}
                        >
                          {selectedClaim.status === 'Settled' ? 'AUDIT ARCHIVED' : selectedClaim.status === 'Approved' ? 'PROCESS PAYOUT' : `DISBURSE $${selectedClaim.coverage.toLocaleString()}`}
                        </Button>
                        
                        {!selectedClaim.insurancePaid && selectedClaim.status !== 'Settled' && (
                          <Button 
                            variant="outline"
                            onClick={() => {
                              // For demo, we'll just trigger the same bridge but with a different title/amount
                              setShowPaymentBridge(true);
                            }}
                            className="w-full h-12 text-[9px] font-black italic rounded-xl border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
                          >
                            TOP-UP / PAY DEDUCTIBLE
                          </Button>
                        )}
                      </div>
                      {selectedClaim.negotiationPending && (
                        <p className="text-[8px] font-bold text-yellow-500 uppercase text-center tracking-widest animate-pulse italic">Locked: Awaiting Finance Handshake</p>
                      )}
                    </div>
                  </Card>

                  <Card className="p-8 bg-white border-zinc-100 rounded-[32px] space-y-6 shadow-xl">
                    <h3 className="text-[9px] font-black uppercase text-zinc-400 flex items-center gap-3 tracking-widest italic"><UserCog size={18} className="text-[#E31B23]" /> Repair Partner Node</h3>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white text-xl font-black italic shadow-md">RP</div>
                        <div>
                          <p className="text-base font-black uppercase italic leading-none tracking-tight text-black">{selectedClaim.repairer}</p>
                          <p className="text-[9px] font-bold text-green-500 uppercase tracking-widest mt-1.5 italic">Reputation: 4.9/5.0</p>
                        </div>
                    </div>
                    <div className="pt-6 border-t border-zinc-50">
                       <a href={`tel:${selectedClaim.customerPhone}`} className="h-14 w-full bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-center gap-3 text-[#E31B23] hover:bg-black hover:text-white transition-all shadow-sm">
                         <Phone size={18} /> <span className="text-[10px] font-black uppercase tracking-widest italic">Direct Liaison</span>
                       </a>
                    </div>
                  </Card>

                  <Card className="p-8 bg-white border-zinc-100 rounded-[32px] space-y-6 shadow-xl">
                    <div className="flex justify-between items-center">
                      <h3 className="text-[9px] font-black uppercase text-zinc-400 flex items-center gap-3 tracking-widest italic"><ClipboardList size={18} className="text-[#E31B23]" /> Internal Dossier Notes</h3>
                    </div>
                    
                    <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {selectedClaim.notes && selectedClaim.notes.length > 0 ? (
                        selectedClaim.notes.map((note) => (
                          <div key={note.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-bold text-zinc-400 uppercase">{note.timestamp}</span>
                              {note.visibleToRepairer && (
                                <Badge status="info" className="text-[7px] px-1.5 py-0.5">SHARED</Badge>
                              )}
                            </div>
                            <p className="text-[10px] font-medium text-zinc-700 italic leading-relaxed">{note.text}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-[9px] font-bold text-zinc-300 uppercase text-center py-4 italic">No internal notes recorded</p>
                      )}
                    </div>

                    <div className="pt-6 border-t border-zinc-50 space-y-4">
                      <textarea 
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Input internal advisory..."
                        className="w-full h-24 bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-[10px] font-medium italic outline-none focus:border-black transition-all resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={isNoteVisibleToRepairer}
                            onChange={(e) => setIsNoteVisibleToRepairer(e.target.checked)}
                            className="hidden"
                          />
                          <div className={`w-8 h-4 rounded-full transition-all relative ${isNoteVisibleToRepairer ? 'bg-green-500' : 'bg-zinc-200'}`}>
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isNoteVisibleToRepairer ? 'left-4' : 'left-0.5'}`} />
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-black transition-colors italic">Share with Partner</span>
                        </label>
                        <Button 
                          onClick={handleAddNote}
                          disabled={isSavingNote || !newNoteText.trim()}
                          className="h-10 px-6 bg-black text-white text-[9px] font-black rounded-lg shadow-lg"
                        >
                          {isSavingNote ? <Loader2 size={14} className="animate-spin" /> : 'SAVE NOTE'}
                        </Button>
                      </div>
                    </div>
                  </Card>
               </div>
            </div>
          )}
        </div>
      )}
      
      <LiveChat session={session} context={selectedClaim ? `Support Handshake for Claim ${selectedClaim.id}` : "Fleet support console"} />
      
      {showPaymentBridge && selectedClaim && (
        <PaymentBridge 
          amount={`$${selectedClaim.coverage.toLocaleString()}`} 
          to={selectedClaim.repairer} 
          claimId={selectedClaim.id}
          customerName={selectedClaim.customer}
          onSuccess={handleProcessPayout} 
          onCancel={() => setShowPaymentBridge(false)} 
          title="Claim Settlement"
        />
      )}
    </div>
  );
};

interface SupportDashboardProps {
  session: AuthSession;
  activeTab: 'main' | 'inbox' | 'claims' | 'billing' | 'policies';
  onTabChange: (tab: any) => void;
  addNotification: (n: Notification) => void;
  onLogout: () => void;
}

export default SupportDashboard;
