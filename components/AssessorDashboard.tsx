
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, Button, Badge, NeuralFeed, QRCodeUI } from './Shared';
import { 
  Target, Search, Filter, Clock, MapPin, Camera, Brain, User, 
  ShieldAlert, CheckCircle, Trash2, Eye, Plus, 
  Zap, Info, Calendar, Phone, Smartphone, MessageSquare, Send, Mail,
  LogOut, Building2, Star, Navigation, Factory, Check, ArrowLeft,
  ClipboardList, AlertCircle, FileText, ChevronRight, Link2, X, SmartphoneNfc, Cpu, RefreshCw, ShieldCheck, Key,
  Loader2, Activity, FileWarning, QrCode, AlertTriangle, Fingerprint, Shield, Layers, Layout, ListChecks, Scale,
  MessageCircle, Construction
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

import type { Notification } from './Shared';

interface AssessorDashboardProps {
  onLogout: () => void;
  // Added optional session for QR generation
  sessionEmail?: string;
  addNotification?: (n: Notification) => void;
}

type SyncStep = 'choice' | 'phone' | 'otp' | 'qr' | 'handshake' | 'success';

interface ChatMessage {
  id: string;
  sender: 'Assessor' | 'Customer';
  text: string;
  time: string;
}

interface PrivateNote {
  id: string;
  text: string;
  timestamp: string;
  visibleToRepairer: boolean;
}

const VehicleDamageMap: React.FC<{ 
  selectedParts: Set<string>, 
  togglePart: (part: string) => void,
  disabled?: boolean 
}> = ({ selectedParts, togglePart, disabled }) => {
  const parts = [
    { id: 'front', label: 'Front Fascia', cx: '50%', cy: '15%' },
    { id: 'hood', label: 'Hood / Bonnet', cx: '50%', cy: '35%' },
    { id: 'windshield', label: 'Glass / Windshield', cx: '50%', cy: '48%' },
    { id: 'roof', label: 'Roof Structure', cx: '50%', cy: '60%' },
    { id: 'left_front', label: 'L Front Wing', cx: '25%', cy: '30%' },
    { id: 'right_front', label: 'R Front Wing', cx: '75%', cy: '30%' },
    { id: 'left_rear', label: 'L Rear Quarter', cx: '25%', cy: '75%' },
    { id: 'right_rear', label: 'R Rear Quarter', cx: '75%', cy: '75%' },
    { id: 'rear', label: 'Rear Bumper', cx: '50%', cy: '90%' },
  ];

  return (
    <div className="relative w-full aspect-[2/3] max-w-[300px] mx-auto bg-zinc-50 rounded-3xl border-2 border-slate-100 p-8 shadow-inner overflow-hidden">
      <svg viewBox="0 0 100 150" className="w-full h-full drop-shadow-2xl">
        <path 
          d="M30,10 Q50,5 70,10 L80,30 L85,60 L85,110 L80,140 Q50,145 20,140 L15,110 L15,60 L20,30 Z" 
          fill="#FFFFFF" 
          stroke="#E2E8F0" 
          strokeWidth="2"
        />
        {parts.map(p => (
          <circle 
            key={p.id}
            cx={p.cx} 
            cy={p.cy} 
            r="6" 
            className={`cursor-pointer transition-all duration-300 ${
              selectedParts.has(p.id) ? 'fill-[#E31B23] stroke-white stroke-2 scale-125' : 'fill-slate-200 hover:fill-slate-400'
            } ${disabled ? 'pointer-events-none' : ''}`}
            onClick={() => togglePart(p.id)}
          >
            <title>{p.label}</title>
          </circle>
        ))}
      </svg>
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[7px] font-black uppercase text-zinc-400 tracking-[0.2em] italic">Interactive Structural Map</p>
      </div>
    </div>
  );
};

const AssessorDashboard: React.FC<AssessorDashboardProps> = ({ onLogout, sessionEmail, addNotification }) => {
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'audit' | 'shop' | 'schedule' | 'comms'>('audit');
  
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isOmniSynced, setIsOmniSynced] = useState(false);
  const [isSyncingAIMS, setIsSyncingAIMS] = useState(false);
  const [syncStep, setSyncStep] = useState<SyncStep>('choice');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [inspectionPhotos, setInspectionPhotos] = useState<string[]>([]);
  const [verificationMatch, setVerificationMatch] = useState<'identical' | 'variance' | 'discrepancy' | null>(null);
  const [damageReason, setDamageReason] = useState('');
  const [damagedParts, setDamagedParts] = useState<Set<string>>(new Set());
  const [statementAgreement, setStatementAgreement] = useState<Record<number, boolean>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [syncedClaimIds, setSyncedClaimIds] = useState<Set<string>>(new Set());
  const [privateNotes, setPrivateNotes] = useState<string>('');
  const [noteVisibleToRepairer, setNoteVisibleToRepairer] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  
  const [aiEstimate, setAiEstimate] = useState<any>(null);
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [neuralSummary, setNeuralSummary] = useState<string | null>(null);

  // Chat specific state
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [claimChats, setClaimChats] = useState<Record<string, ChatMessage[]>>({
    'CLM-1021': [
      { id: '1', sender: 'Customer', text: 'Hello, I received your assignment. When can you come view the Mercedes?', time: '08:45 AM' }
    ],
    'CLM-1022': [
      { id: '1', sender: 'Customer', text: 'Good morning. The Toyota is parked at Avondale Shopping Center near the pharmacy.', time: '09:12 AM' }
    ]
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>(["Assessor node ready.", "AIMS ledger link stable."]);

  const [claimsQueue, setClaimsQueue] = useState([
    { 
      id: 'CLM-1021', 
      car: 'MERCEDES GLC', 
      owner: 'JOHN DOE', 
      priority: 'URGENT', 
      status: 'PENDING_INSPECTION',
      time: '10:00 AM', 
      distance: '1.2km', 
      userStatement: "I hit a concrete pillar in the parking lot while reversing. Rear bumper is cracked and sensors are unresponsive.", 
      regNo: 'ABC-123', 
      policyNo: 'ND-GOLD-9921',
      location: '142 Herbert Chitepo Ave', 
      phone: '0786413281',
      email: 'j.doe@firstmutual.co.zw',
      historyScore: '4.8/5.0',
      assignedTo: 'assessor@firstmutual.co.zw'
    },
    { 
      id: 'CLM-1022', 
      car: 'TOYOTA RAV4', 
      owner: 'MARY W.', 
      priority: 'STANDARD', 
      status: 'PENDING_INSPECTION',
      time: '11:30 AM', 
      distance: '4.8km', 
      userStatement: "Stones flew from a truck on the highway, shattering the windshield and damaging the hood paint.", 
      regNo: 'ZBW-110', 
      policyNo: 'ND-SILVER-4401',
      location: 'Avondale Shopping Center', 
      phone: '0786413281',
      email: 'mary.w@firstmutual.co.zw',
      historyScore: '5.0/5.0',
      assignedTo: 'assessor@firstmutual.co.zw'
    },
    { 
      id: 'CLM-1023', 
      car: 'VW GOLF 7', 
      owner: 'PETER S.', 
      priority: 'LOW', 
      status: 'AWAITING_DOCS',
      time: '02:00 PM', 
      distance: '12.5km', 
      userStatement: "Minor scratch on the door from a shopping trolley.", 
      regNo: 'VW-777', 
      policyNo: 'ND-BRONZE-1122',
      location: 'Borrowdale Village', 
      phone: '0786413281',
      email: 'peter.s@firstmutual.co.zw',
      historyScore: '4.5/5.0',
      assignedTo: 'other@firstmutual.co.zw'
    }
  ]);

  const assignedClaims = useMemo(() => {
    return claimsQueue.filter(c => c.assignedTo === (sessionEmail || 'assessor@firstmutual.co.zw'));
  }, [claimsQueue, sessionEmail]);

  const selectedClaim = claimsQueue.find(c => c.id === selectedClaimId);

  const handleRealTimeSync = async () => {
    if (!selectedClaim) return;
    setIsSyncingAIMS(true);
    
    setHandshakeLogs(prev => [...prev, `Initiating real-time sync for ${selectedClaim.id}...`]);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setHandshakeLogs(prev => [...prev, `Connection established with AIMS Central.`]);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setHandshakeLogs(prev => [...prev, `Pushing ${inspectionPhotos.length} evidence photos...`]);
    setHandshakeLogs(prev => [...prev, `Synchronizing ${((selectedClaim as any)?.notes || []).length} private assessor notes...`]);
    setHandshakeLogs(prev => [...prev, `Updating claim status: FIELD_AUDIT_ACTIVE`]);
    setHandshakeLogs(prev => [...prev, `Metadata push complete. Logs synchronized.`]);
    
    setClaimsQueue(prev => prev.map(c => 
      c.id === selectedClaimId ? { ...c, status: 'FIELD_AUDIT_ACTIVE' } : c
    ));
    
    setLastSyncedAt(new Date().toLocaleTimeString());
    setIsSyncingAIMS(false);
    setIsOmniSynced(true);
    
    if (addNotification) {
      addNotification({
        id: `sync-${Date.now()}`,
        title: "AIMS Sync Complete",
        message: `Claim ${selectedClaim.id} is now synchronized with the central ledger. Status: FIELD_AUDIT_ACTIVE`,
        type: 'success',
        timestamp: new Date(),
        isRead: false
      });
    }
  };

  const userStatementPoints = useMemo(() => {
    if (!selectedClaim) return [];
    return selectedClaim.userStatement.split('.').filter((s: string) => s.trim().length > 0);
  }, [selectedClaim]);

  useEffect(() => {
    if (activeConsoleTab === 'comms') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [claimChats, activeConsoleTab]);

  // Sync Logic: Real-time Handshake Simulation
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aims_sync_complete' && e.newValue === 'true') {
        setIsOmniSynced(true);
        setHandshakeLogs(prev => [...prev, "External device handshake successful.", "Mobile Field Mode Active."]);
        localStorage.removeItem('aims_sync_complete');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const selectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    setInspectionPhotos([]);
    setVerificationMatch(null);
    setDamageReason('');
    setDamagedParts(new Set());
    setStatementAgreement({});
    setAiEstimate(null);
    setNeuralSummary(null);
    setConsistencyScore(null);
    setPrivateNotes('');
    setNoteVisibleToRepairer(false);
    setLastSyncedAt(null);
    setIsFinalizing(false);
    setActiveConsoleTab('audit');
    setHandshakeLogs(prev => [...prev, `Claim ${claimId} initialized.`, `Loading dossier...`]);
  };

  const handleSaveNotes = () => {
    if (!selectedClaimId || !privateNotes.trim()) return;
    
    const newNote: PrivateNote = {
      id: `note-${Date.now()}`,
      text: privateNotes,
      timestamp: new Date().toLocaleString(),
      visibleToRepairer: noteVisibleToRepairer
    };

    setClaimsQueue(prev => prev.map(c => {
      if (c.id === selectedClaimId) {
        const existingNotes = (c as any).notes || [];
        return { ...c, notes: [...existingNotes, newNote] };
      }
      return c;
    }));

    setPrivateNotes('');
    setNoteVisibleToRepairer(false);

    addNotification?.({
      id: `save-notes-${Date.now()}`,
      title: "Note Added",
      message: `A new private note has been added to ${selectedClaimId}.`,
      type: 'success',
      timestamp: new Date(),
      isRead: false
    });
  };

  const togglePart = (part: string) => {
    setDamagedParts(prev => {
      const next = new Set(prev);
      if (next.has(part)) next.delete(part);
      else next.add(part);
      return next;
    });
    setHandshakeLogs(prev => [...prev, `Telemetry: Updated structural node [${part}]`]);
  };

  const calculateConsistency = async () => {
    if (!verificationMatch || !damageReason) return;
    setIsEstimating(true);
    setHandshakeLogs(prev => [...prev, "Running Consistency Handshake..."]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Compare the customer's statement: "${selectedClaim.userStatement}" 
        with the assessor's technical findings: "${damageReason}" and match level "${verificationMatch}".
        Agreed points on statement: ${JSON.stringify(statementAgreement)}.
        Provide a JSON object with: "score" (0-100 percentage consistency), "delta_summary" (1 sentence summary of discrepancies).`,
        config: { responseMimeType: "application/json" }
      });
      const result = JSON.parse(response.text || '{}');
      setConsistencyScore(result.score);
      setHandshakeLogs(prev => [...prev, `Consistency indexed at ${result.score}%.`]);
    } catch (e) {
      setHandshakeLogs(prev => [...prev, "Consistency check failed: Model timeout."]);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setInspectionPhotos(prev => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
      setHandshakeLogs(prev => [...prev, `${files.length} evidence frames synced.`]);
    }
  };

  const handleFinalizeReport = async () => {
    setIsFinalizing(true);
    setHandshakeLogs(prev => [...prev, "Drafting Neural Summary...", "Synchronizing field buffer..."]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize this vehicle audit for an insurance manager. 
        Claim: ${selectedClaim.id}, Car: ${selectedClaim.car}.
        Findings: ${damageReason}. Parts: ${Array.from(damagedParts).join(', ')}.
        Match Level: ${verificationMatch}. Consistency Score: ${consistencyScore}%.
        Keep it formal, 2-3 sentences max.`
      });
      setNeuralSummary(response.text || "Report successfully generated.");
    } catch(e) {}

    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncedClaimIds(prev => new Set(prev).add(selectedClaim.id));
    setHandshakeLogs(prev => [...prev, "Sync complete. Claim AIMS-" + selectedClaim.id + " immutable."]);
    setIsFinalizing(false);
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedClaim) return;

    const currentText = chatInput;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'Assessor',
      text: currentText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setClaimChats(prev => ({
      ...prev,
      [selectedClaim.id]: [...(prev[selectedClaim.id] || []), msg]
    }));
    setChatInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are the customer, ${selectedClaim.owner}, for claim ${selectedClaim.id} regarding your ${selectedClaim.car}.
        The assessor has just messaged you: "${currentText}".
        Respond as a helpful but slightly stressed customer. If they ask for a meeting time, suggest something between 2 PM and 4 PM today or tomorrow.
        Keep it short (1-2 sentences).`
      });

      const customerMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'Customer',
        text: response.text || "Okay, I will see you then.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setClaimChats(prev => ({
        ...prev,
        [selectedClaim.id]: [...(prev[selectedClaim.id] || []), customerMsg]
      }));
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // Generate a functional session-handover URL for the QR code
  const syncUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('mode', 'field_sync');
    params.set('claimId', selectedClaim?.id || 'pending');
    params.set('email', sessionEmail || 'assessor@firstmutual.co.zw');
    // In a real app, this would be a signed JWT. For prototype, we use a simple handover.
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, [selectedClaim?.id, sessionEmail]);

  const isDiscrepancy = verificationMatch === 'variance' || verificationMatch === 'discrepancy';
  const isAuditReady = inspectionPhotos.length > 0 && 
                       verificationMatch && 
                       damagedParts.size > 0 && 
                       (!isDiscrepancy || damageReason.trim().length > 15);
  const isClaimAlreadySynced = selectedClaim && syncedClaimIds.has(selectedClaim.id);

  return (
    <div className="flex h-full flex-col lg:flex-row bg-slate-50 overflow-hidden relative">
      {/* Sidebar - Audit Queue */}
      <aside className={`w-full lg:w-[320px] border-r border-slate-200 flex flex-col bg-white shrink-0 h-full shadow-xl z-30 ${selectedClaim ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-100 bg-black text-white">
           <p className="text-[9px] font-bold text-[#E31B23] uppercase tracking-[0.3em] mb-2 leading-none">FIELD CONSOLE</p>
           <div className="flex justify-between items-center">
             <h2 className="text-xl font-black uppercase tracking-tight italic text-white">Audit Queue</h2>
             <button onClick={onLogout} className="p-2 text-zinc-500 hover:text-[#E31B23] transition-colors"><LogOut size={16} /></button>
           </div>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-4">
           <div onClick={() => { setSyncStep('choice'); setShowSyncModal(true); }} className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border-2 ${isOmniSynced ? 'bg-green-50 border-green-500' : 'bg-zinc-950 text-white border-zinc-900 shadow-lg shadow-black/20'}`}>
              <div className="flex items-center gap-3">
                <SmartphoneNfc size={18} className={isOmniSynced ? 'text-green-600' : 'text-[#E31B23]'} />
                <span className="text-[9px] font-bold uppercase tracking-widest">{isOmniSynced ? 'Phone Connected' : 'Connect Phone'}</span>
              </div>
              {isOmniSynced && <Check size={14} className="text-green-600" />}
           </div>
           <div className="flex bg-white border border-slate-200 rounded-xl px-4 py-2.5 items-center gap-3 shadow-sm focus-within:border-black transition-colors">
              <Search size={14} className="text-zinc-300" />
              <input className="text-[10px] font-bold uppercase tracking-widest outline-none w-full italic" placeholder="FILTER QUEUE..." />
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30 custom-scrollbar">
          {assignedClaims.map((claim) => (
            <Card key={claim.id} onClick={() => selectClaim(claim.id)} className={`p-5 cursor-pointer transition-all border-l-4 hover:shadow-lg relative overflow-hidden group ${selectedClaimId === claim.id ? 'border-[#E31B23] bg-white scale-[1.02]' : 'border-zinc-200 opacity-80'}`}>
              {syncedClaimIds.has(claim.id) && (
                <div className="absolute top-0 right-0 p-2">
                  <Badge className="bg-green-500 text-white border-none text-[7px] font-black rounded-full px-2 shadow-lg">SYNCED</Badge>
                </div>
              )}
              <div className="flex justify-between items-start mb-3">
                <Badge className="bg-black text-white border-none rounded-md px-2 py-0.5 text-[8px] font-bold">{claim.id}</Badge>
                <Badge status={claim.priority} className="text-[8px] font-bold uppercase">{claim.priority}</Badge>
              </div>
              <h3 className="text-sm font-black text-black uppercase italic leading-none">{claim.car}</h3>
              <div className="flex justify-between items-end mt-2">
                <p className="text-[9px] font-bold text-zinc-400 uppercase italic tracking-wide truncate">{claim.owner} • {claim.distance}</p>
                <Badge status={claim.status} className="text-[7px] font-black uppercase tracking-widest border-none px-1.5 py-0.5 h-auto w-fit">
                  {claim.status.replace('_', ' ')}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </aside>

      {/* Workspace */}
      <main className={`flex-1 flex flex-col bg-white overflow-hidden ${selectedClaim ? 'flex' : 'hidden lg:flex'}`}>
        {selectedClaim ? (
          <div className="flex-1 flex flex-col animate-in slide-in-from-right-2 duration-500">
            <header className="px-6 py-5 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-40 gap-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedClaimId(null)} className="lg:hidden p-2 bg-zinc-100 rounded-xl"><ArrowLeft size={20} /></button>
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-none text-black">AIMS Session: {selectedClaim.id}</h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-[#E31B23] italic">Real-time Field Diagnostic Mode</p>
                    <span className="text-[8px] font-black text-zinc-300">•</span>
                    <span className={`text-[8px] font-black uppercase italic ${selectedClaim.status === 'FIELD_AUDIT_ACTIVE' ? 'text-green-500' : 'text-zinc-400'}`}>
                      {selectedClaim.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-1">
                  <Button 
                    onClick={handleRealTimeSync}
                    disabled={isSyncingAIMS || isClaimAlreadySynced}
                    className={`h-11 px-6 text-[9px] font-black rounded-xl shadow-xl transition-all flex items-center gap-2 ${isOmniSynced ? 'bg-zinc-100 text-black border border-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
                  >
                    {isSyncingAIMS ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} className={isOmniSynced ? 'text-green-500' : ''} />}
                    {isSyncingAIMS ? 'SYNCING...' : isOmniSynced ? 'AIMS CONNECTED' : 'LIVE AIMS SYNC'}
                  </Button>
                  {lastSyncedAt && (
                    <p className="text-[7px] font-bold text-zinc-400 uppercase tracking-widest italic mr-2">Last Sync: {lastSyncedAt}</p>
                  )}
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                  {['audit', 'shop', 'schedule', 'comms'].map(t => (
                    <button key={t} onClick={() => setActiveConsoleTab(t as any)} className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeConsoleTab === t ? 'bg-black text-white shadow-md' : 'text-zinc-400'}`}>
                      {t === 'audit' ? 'Assessment' : t === 'comms' ? 'Direct Chat' : t}
                    </button>
                  ))}
                </div>
                <Button 
                  disabled={isClaimAlreadySynced || isFinalizing || !isAuditReady} 
                  className={`h-11 px-6 text-[9px] font-black rounded-xl shadow-xl transition-all ${isClaimAlreadySynced ? 'bg-green-600' : 'bg-[#E31B23]'}`} 
                  onClick={handleFinalizeReport}
                >
                  {isFinalizing ? <Loader2 size={16} className="animate-spin" /> : isClaimAlreadySynced ? 'AUDIT CLOSED ✓' : 'PUSH FINAL REPORT'}
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/20 custom-scrollbar">
              <div className="max-w-6xl mx-auto space-y-8">
                {activeConsoleTab === 'audit' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <Card className="lg:col-span-8 p-8 bg-black text-white rounded-[32px] border-none shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-all duration-1000"><Smartphone size={160} /></div>
                        <div className="relative z-10 space-y-8">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div className="space-y-4">
                              <p className="text-[10px] font-bold text-[#E31B23] uppercase tracking-[0.2em] italic leading-none">Comparative Audit Deck</p>
                              <h3 className="text-3xl md:text-5xl font-black italic uppercase leading-none tracking-tighter text-white">{selectedClaim.car}</h3>
                              <div className="flex flex-wrap gap-3 mt-4">
                                <Badge className="bg-zinc-900 border-none text-zinc-300 font-bold px-4 py-1.5 text-[9px] italic uppercase tracking-widest">REG: {selectedClaim.regNo}</Badge>
                                <Badge className="bg-zinc-900 border-none text-zinc-300 font-bold italic px-4 py-1.5 text-[9px] uppercase tracking-widest">HOLDER: {selectedClaim.owner}</Badge>
                                <Badge className="bg-zinc-900 border-none text-zinc-300 font-bold px-4 py-1.5 text-[9px] italic uppercase tracking-widest">Trust: {selectedClaim.historyScore}</Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                               <Badge status={isClaimAlreadySynced ? 'completed' : 'critical'} className="px-6 py-2 text-[10px] rounded-lg shadow-lg font-black italic">
                                {isClaimAlreadySynced ? 'DATA SECURED' : 'FIELD INSPECTION'}
                               </Badge>
                               <div className="flex items-center gap-2 text-zinc-500 mr-1">
                                  <Scale size={16} />
                                  <span className="text-[8px] font-bold uppercase tracking-widest italic text-zinc-400">Comparing Statement</span>
                               </div>
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card className="lg:col-span-4 p-8 bg-zinc-50 border-2 border-slate-100 rounded-[32px] shadow-xl flex flex-col justify-between hover:border-black transition-colors">
                         <div className="space-y-6">
                            <div className="flex items-center gap-3">
                               <div className="p-2.5 bg-black text-white rounded-xl shadow-lg shadow-black/10"><MessageSquare size={18} /></div>
                               <h4 className="text-[10px] font-black uppercase tracking-widest italic text-black leading-none">Customer Narrative</h4>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 italic text-[11px] font-medium text-slate-500 leading-relaxed shadow-inner">
                               "{selectedClaim.userStatement}"
                            </div>
                         </div>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-8 space-y-8">
                        {/* Existing Audit Hotspots and Verification Node */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <Card className="p-8 border-none shadow-xl bg-white rounded-[32px] space-y-6">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-red-50 text-[#E31B23] rounded-xl shadow-sm"><Layers size={22} /></div>
                              <div>
                                <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Audit Hotspots</h3>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase italic mt-1">Select structural nodes</p>
                              </div>
                            </div>
                            <VehicleDamageMap 
                              selectedParts={damagedParts} 
                              togglePart={togglePart} 
                              disabled={isClaimAlreadySynced} 
                            />
                            {damagedParts.size > 0 && (
                              <div className="flex flex-wrap gap-2 pt-2 animate-in fade-in">
                                {Array.from(damagedParts).map((p: string) => (
                                  <Badge key={p} className="bg-black text-white border-none text-[7px] font-black uppercase rounded-lg px-2 py-1">
                                    {p.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </Card>

                          <Card className="p-8 border-none shadow-xl bg-white rounded-[32px] space-y-8">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-zinc-50 text-black rounded-xl shadow-sm"><Scale size={22} /></div>
                                <div>
                                  <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Verification Node</h3>
                                  <p className="text-[9px] font-bold text-zinc-400 uppercase italic mt-1">Status Agreement Handshake</p>
                                </div>
                             </div>
                             <div className="space-y-4">
                                {[
                                  { id: 'identical', label: 'Match Exactly', sub: 'Verified by Audit', color: 'green' },
                                  { id: 'variance', label: 'Technical Variance', sub: 'Explain discrepancies below', color: 'yellow' },
                                  { id: 'discrepancy', label: 'Audit Discrepancy', sub: 'Potential Violation', color: 'red' }
                                ].map((opt) => (
                                  <button 
                                    key={opt.id}
                                    disabled={isClaimAlreadySynced}
                                    onClick={() => setVerificationMatch(opt.id as any)}
                                    className={`p-6 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${verificationMatch === opt.id ? 'bg-black border-black text-white shadow-2xl scale-[1.02]' : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'}`}
                                  >
                                    <p className="text-[11px] font-black uppercase leading-none mb-1.5">{opt.label}</p>
                                    <p className="text-[8px] font-bold uppercase tracking-widest opacity-60 italic">{opt.sub}</p>
                                    {verificationMatch === opt.id && (
                                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <CheckCircle size={20} className={opt.color === 'green' ? 'text-green-500' : opt.color === 'yellow' ? 'text-yellow-500' : 'text-red-500'} />
                                      </div>
                                    )}
                                  </button>
                                ))}
                             </div>
                          </Card>
                        </div>

                        {isDiscrepancy && (
                          <Card className="p-8 border-none shadow-xl bg-white rounded-[32px] space-y-6 animate-in slide-in-from-top-4 duration-500 ring-2 ring-red-500/20">
                             <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-50 text-red-600 rounded-xl shadow-sm"><ListChecks size={22} /></div>
                                <div>
                                  <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Comparative Statement Matrix</h3>
                                  <p className="text-[9px] font-bold text-zinc-400 uppercase italic mt-1">Cross-match specific customer claims with audit findings</p>
                                </div>
                             </div>
                             
                             <div className="space-y-3">
                               {userStatementPoints.map((point, idx) => (
                                 <div key={idx} className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-2xl group transition-all hover:bg-white hover:shadow-md">
                                    <div className="flex-1">
                                      <p className="text-[11px] font-medium text-zinc-600 italic">"{point.trim()}."</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <button 
                                         onClick={() => setStatementAgreement(prev => ({...prev, [idx]: true}))}
                                         className={`p-2 rounded-lg border-2 transition-all ${statementAgreement[idx] === true ? 'bg-green-600 border-green-600 text-white' : 'border-zinc-200 text-zinc-300 hover:border-green-200'}`}
                                       >
                                         <Check size={14} />
                                       </button>
                                       <button 
                                         onClick={() => setStatementAgreement(prev => ({...prev, [idx]: false}))}
                                         className={`p-2 rounded-lg border-2 transition-all ${statementAgreement[idx] === false ? 'bg-red-600 border-red-600 text-white' : 'border-zinc-200 text-zinc-300 hover:border-red-200'}`}
                                       >
                                         <X size={14} />
                                       </button>
                                    </div>
                                 </div>
                               ))}
                             </div>
                          </Card>
                        )}

                        <Card className={`p-8 border-none shadow-xl bg-white rounded-[32px] space-y-6 transition-all duration-500 ${isDiscrepancy ? 'ring-2 ring-red-500/20' : ''}`}>
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl shadow-sm transition-colors ${isDiscrepancy ? 'bg-red-50 text-red-600' : 'bg-zinc-50 text-black'}`}>
                                  {isDiscrepancy ? <ShieldAlert size={20} className="animate-pulse" /> : <FileWarning size={20} />}
                                </div>
                                <div>
                                  <h3 className="text-xs font-black uppercase tracking-widest italic text-black">
                                    {isDiscrepancy ? 'Mandatory Audit Override' : 'Technical Findings'}
                                  </h3>
                                  <p className="text-[9px] font-bold text-zinc-400 uppercase italic mt-1">
                                    {isDiscrepancy ? 'Detailed justification for discrepancy required' : 'Supplemental structural notes'}
                                  </p>
                                </div>
                              </div>
                              {isDiscrepancy && damageReason.length < 15 && (
                                <Badge className="bg-red-600 text-white border-none text-[8px] animate-bounce px-3 py-1 font-black italic rounded-full">ACTION REQUIRED</Badge>
                              )}
                           </div>
                           <div className="relative">
                             <textarea 
                                value={damageReason} 
                                disabled={isClaimAlreadySynced}
                                onChange={(e) => setDamageReason(e.target.value)} 
                                placeholder={isDiscrepancy ? "Explain EXACTLY why audit differs from customer statement..." : "Describe structural findings and complexity..."} 
                                className={`w-full bg-slate-50 border-2 rounded-[24px] p-8 text-[13px] font-bold italic min-h-[200px] outline-none shadow-inner leading-relaxed transition-all placeholder:text-zinc-300 ${isDiscrepancy && damageReason.length < 15 ? 'border-red-100 focus:border-red-600 bg-red-50/10' : 'border-slate-100 focus:border-black'}`} 
                              />
                              {isDiscrepancy && damageReason.length < 15 && (
                                <div className="absolute bottom-6 right-8 text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                                  <AlertCircle size={14} /> Min 15 Characters Required
                                </div>
                              )}
                           </div>
                        </Card>

                        <Card className="p-8 border-none shadow-xl bg-white rounded-[32px] space-y-6">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-zinc-50 text-black rounded-xl shadow-sm"><Camera size={20} /></div>
                                <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Evidence Telemetry</h3>
                              </div>
                              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{inspectionPhotos.length} Frames Linked</span>
                           </div>
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                             <button 
                               disabled={isClaimAlreadySynced}
                               onClick={() => fileInputRef.current?.click()}
                               className="aspect-square bg-slate-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-black hover:bg-slate-100 transition-all group overflow-hidden disabled:opacity-50"
                             >
                               <Plus size={24} className="text-zinc-300 group-hover:text-black" />
                               <span className="text-[8px] font-black uppercase text-zinc-400 italic">Add Frame</span>
                               <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileUpload} />
                             </button>

                             {inspectionPhotos.map((photo, i) => (
                               <div key={i} className="aspect-square bg-zinc-100 rounded-2xl relative overflow-hidden group shadow-lg">
                                 <img src={photo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                               </div>
                             ))}
                           </div>
                        </Card>
                      </div>

                      <div className="lg:col-span-4 space-y-8">
                        <Card className="p-8 bg-white border-2 border-slate-100 rounded-[32px] shadow-xl space-y-8">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-zinc-50 text-black rounded-xl shadow-sm"><User size={22} /></div>
                              <div>
                                <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Customer Dossier</h3>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase italic mt-1">Direct Liaison Details</p>
                              </div>
                           </div>
                           
                           <div className="space-y-5">
                              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-black transition-all">
                                 <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#E31B23] shadow-sm"><Phone size={18} /></div>
                                 <div className="min-w-0">
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Phone Node</p>
                                    <p className="text-[11px] font-black text-black italic truncate">{selectedClaim.phone}</p>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-black transition-all">
                                 <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#E31B23] shadow-sm"><Mail size={18} /></div>
                                 <div className="min-w-0">
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Email Node</p>
                                    <p className="text-[11px] font-black text-black italic truncate">{selectedClaim.email}</p>
                                 </div>
                              </div>
                              
                              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-black transition-all">
                                 <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#E31B23] shadow-sm"><MapPin size={18} /></div>
                                 <div className="min-w-0">
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Location Node</p>
                                    <p className="text-[11px] font-black text-black italic leading-tight">{selectedClaim.location}</p>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="pt-6 border-t border-slate-100">
                              <div className="flex justify-between items-center bg-zinc-950 p-6 rounded-2xl text-white shadow-xl">
                                 <div>
                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Policy ID</p>
                                    <p className="text-[10px] font-black italic uppercase">{selectedClaim.policyNo}</p>
                                 </div>
                                 <Badge className="bg-[#E31B23] text-white border-none text-[8px] font-black italic px-3 py-1 rounded-md">GOLD TIER</Badge>
                              </div>
                           </div>
                        </Card>

                        <Card className="p-8 bg-black text-white rounded-[32px] border-none shadow-2xl space-y-8 animate-in slide-in-from-right-4 duration-700">
                          <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 italic text-zinc-400">
                              <Activity size={16} className="text-[#E31B23]" /> Comparative Shield
                            </h3>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-6 shadow-inner text-center">
                               <div className="flex flex-col items-center gap-4">
                                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest italic leading-none">Statement Consistency Index</p>
                                  <div className="relative w-32 h-32 flex items-center justify-center">
                                     <svg className="w-full h-full" viewBox="0 0 100 100">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#1F1F1F" strokeWidth="6" />
                                        <circle 
                                          cx="50" 
                                          cy="50" 
                                          r="45" 
                                          fill="none" 
                                          stroke={consistencyScore && consistencyScore > 70 ? '#10B981' : consistencyScore && consistencyScore > 40 ? '#F59E0B' : '#E31B23'} 
                                          strokeWidth="6" 
                                          strokeDasharray={`${(consistencyScore || 0) * 2.83} 283`}
                                          strokeLinecap="round"
                                          className="transition-all duration-1000 origin-center -rotate-90" 
                                        />
                                     </svg>
                                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <p className="text-3xl font-black italic tracking-tighter">{consistencyScore !== null ? `${consistencyScore}%` : '--'}</p>
                                     </div>
                                  </div>
                               </div>
                               
                               <Button 
                                 disabled={!verificationMatch || !damageReason || isEstimating}
                                 onClick={calculateConsistency}
                                 className="w-full h-12 bg-[#E31B23]/10 border-2 border-[#E31B23] text-[#E31B23] text-[9px] font-black italic rounded-xl hover:bg-[#E31B23] hover:text-white transition-all"
                                >
                                 {isEstimating ? <Loader2 size={16} className="animate-spin" /> : 'RECALCULATE CONSISTENCY'}
                               </Button>
                            </div>

                            <div className="p-6 bg-zinc-900 border border-white/5 rounded-3xl space-y-4">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
                                  <span className="text-zinc-500 tracking-wide">Agreement Status</span>
                                  <span className={verificationMatch ? (isDiscrepancy ? 'text-red-500' : 'text-green-500') : 'text-zinc-800'}>
                                    {verificationMatch?.replace('_', ' ').toUpperCase() || 'IDLE'}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
                                  <span className="text-zinc-500 tracking-wide">Dossier Accuracy</span>
                                  <span className="text-white">{selectedClaim.historyScore}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
                                  <span className="text-zinc-500 tracking-wide">Evidence Link</span>
                                  <span className={inspectionPhotos.length > 0 ? 'text-white' : 'text-zinc-800'}>{inspectionPhotos.length} FRAMES</span>
                                </div>
                                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase italic">
                                  <span className="text-[#E31B23]">Handshake Risk?</span>
                                  <span className={isDiscrepancy ? 'text-red-500' : 'text-zinc-800'}>{isDiscrepancy ? 'ELEVATED' : 'NOMINAL'}</span>
                                </div>
                            </div>

                            {neuralSummary && (
                              <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-3xl space-y-3 animate-in fade-in">
                                <h4 className="text-[9px] font-black uppercase text-green-500 tracking-widest italic flex items-center gap-2">
                                  <ShieldCheck size={14} /> Neural Summary Generated
                                </h4>
                                <p className="text-[10px] font-bold italic text-zinc-300 leading-relaxed">
                                  "{neuralSummary}"
                                </p>
                              </div>
                            )}

                            {isClaimAlreadySynced && (
                              <div className="pt-4 animate-in zoom-in-95 duration-500">
                                <div className="bg-green-600 p-5 rounded-2xl flex items-center gap-4 shadow-xl">
                                  <ShieldCheck size={24} className="text-white" />
                                  <div className="min-w-0 text-left">
                                    <p className="text-[10px] font-black uppercase text-white leading-none italic">Audit Ledger Finalized</p>
                                    <p className="text-[8px] font-bold uppercase text-green-100 mt-1.5 truncate italic">BLOCK: AIMS-AUDIT-{selectedClaim.id}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>

                        <Card className="p-8 bg-zinc-900 text-white rounded-[32px] border-none shadow-xl h-[280px] flex flex-col hover:border-zinc-700 transition-colors">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 italic text-zinc-400 mb-6 shrink-0"><Zap size={16} className="text-[#E31B23]" /> Pulse Telemetry</h3>
                          <div className="flex-1 overflow-hidden">
                             <NeuralFeed logs={handshakeLogs} />
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {activeConsoleTab === 'comms' && (
                  <div className="h-[600px] flex flex-col animate-in fade-in duration-500">
                    <div className="flex-1 flex flex-col lg:flex-row gap-8 min-h-0">
                      <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-[32px] shadow-2xl overflow-hidden relative group">
                        <div className="p-6 bg-black text-white flex items-center justify-between border-b-4 border-[#E31B23]">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center font-black text-[#E31B23] shadow-lg border border-white/5">
                              <MessageCircle size={24} />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 italic">Direct Link</p>
                              <h3 className="text-sm font-black uppercase tracking-tight italic text-white leading-none">{selectedClaim.owner}</h3>
                            </div>
                          </div>
                          <Badge className="bg-green-500/10 border-green-500/20 text-green-500 text-[8px] font-black italic rounded-lg">TUNNEL ACTIVE</Badge>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20 custom-scrollbar flex flex-col">
                          {claimChats[selectedClaim.id]?.map((msg, i) => (
                            <div key={i} className={`flex flex-col ${msg.sender === 'Assessor' ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[80%] p-5 rounded-[24px] shadow-sm text-[12px] font-bold leading-relaxed italic ${msg.sender === 'Assessor' ? 'bg-black text-white rounded-tr-none' : 'bg-white text-black border border-slate-100 rounded-tl-none'}`}>
                                {msg.text}
                              </div>
                              <span className="text-[7px] font-black text-zinc-400 uppercase mt-2 italic tracking-widest">{msg.sender.toUpperCase()} • {msg.time}</span>
                            </div>
                          ))}
                          {isTyping && (
                            <div className="flex flex-col items-start animate-in fade-in">
                              <div className="p-4 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[#E31B23] rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-[#E31B23] rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-[#E31B23] rounded-full animate-bounce [animation-delay:0.4s]" />
                              </div>
                              <span className="text-[7px] font-black text-zinc-400 uppercase mt-2 italic tracking-widest">Customer Processing...</span>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={sendChatMessage} className="p-6 bg-white border-t border-slate-100">
                          <div className="flex gap-4 bg-zinc-50 p-2 rounded-2xl border border-zinc-100 shadow-inner group-focus-within:border-black transition-all">
                            <input 
                              type="text" 
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Type message for scheduling or clarification..."
                              className="flex-1 bg-transparent border-none px-6 py-3 text-[11px] font-black italic outline-none text-black"
                            />
                            <button 
                              type="submit"
                              disabled={!chatInput.trim() || isTyping}
                              className="w-14 h-14 bg-black text-white rounded-xl flex items-center justify-center transition-all hover:bg-[#E31B23] disabled:opacity-30 shadow-xl"
                            >
                              <Send size={20} />
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="w-full lg:w-[320px] space-y-8 shrink-0">
                         <Card className="p-8 bg-zinc-50 border-2 border-slate-100 rounded-[32px] shadow-xl space-y-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Quick Dispatch</h4>
                            <div className="grid grid-cols-1 gap-3">
                               {[
                                 "I am arriving at your location in 15 mins.",
                                 "Please have the car keys and ID ready.",
                                 "Can you confirm the car is at the specified location?",
                                 "Assessment complete. Results are being synced."
                               ].map((template, i) => (
                                 <button 
                                  key={i} 
                                  onClick={() => setChatInput(template)}
                                  className="p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-black transition-all text-[9px] font-black uppercase italic leading-snug text-zinc-500 hover:text-black shadow-sm"
                                 >
                                   {template}
                                 </button>
                               ))}
                            </div>
                         </Card>
                         
                         <Card className="p-8 bg-black text-white rounded-[32px] border-none shadow-2xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-all duration-1000"><Calendar size={120} /></div>
                           <div className="relative z-10 space-y-4">
                              <p className="text-[8px] font-bold text-[#E31B23] uppercase tracking-widest italic">Scheduling Log</p>
                              <div className="p-4 bg-zinc-900/80 rounded-2xl border border-white/5 space-y-3">
                                 <div className="flex items-center gap-3">
                                    <Clock size={14} className="text-zinc-500" />
                                    <span className="text-[10px] font-black uppercase italic">ETA: 10:45 AM Today</span>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <MapPin size={14} className="text-zinc-500" />
                                    <span className="text-[10px] font-black uppercase italic truncate">{selectedClaim.location}</span>
                                 </div>
                              </div>
                           </div>
                         </Card>

                         <Card className="p-8 border-none shadow-xl bg-white rounded-[32px] space-y-6">
                            <div className="flex items-center gap-4">
                               <div className="p-3 bg-zinc-900 text-white rounded-xl shadow-sm"><FileText size={22} /></div>
                               <div>
                                 <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Private Assessor Notes</h3>
                                 <p className="text-[9px] font-bold text-zinc-400 uppercase italic mt-1">Confidential internal documentation</p>
                               </div>
                            </div>

                            {/* Existing Notes List */}
                            {((selectedClaim as any)?.notes || []).length > 0 && (
                              <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                {((selectedClaim as any).notes as PrivateNote[]).map((note) => (
                                  <div key={note.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 relative group">
                                    <div className="flex justify-between items-start">
                                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{note.timestamp}</span>
                                      {note.visibleToRepairer && (
                                        <Badge className="bg-blue-50 text-blue-600 border-none text-[7px] font-black px-2 py-0.5 rounded-md">VISIBLE TO REPAIRER</Badge>
                                      )}
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-700 italic leading-relaxed">
                                      {note.text}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="space-y-4 pt-4 border-t border-slate-100">
                              <textarea 
                                value={privateNotes}
                                onChange={(e) => setPrivateNotes(e.target.value)}
                                disabled={isClaimAlreadySynced}
                                placeholder="Enter private observations, risk assessments, or internal notes..."
                                className="w-full h-32 bg-zinc-50 border-2 border-zinc-100 rounded-2xl p-6 text-xs font-medium outline-none focus:border-black transition-all italic shadow-inner"
                              />
                              
                              <div className="flex items-center gap-3 px-2">
                                <input 
                                  type="checkbox" 
                                  id="visibleToRepairer"
                                  checked={noteVisibleToRepairer}
                                  onChange={(e) => setNoteVisibleToRepairer(e.target.checked)}
                                  disabled={isClaimAlreadySynced}
                                  className="w-4 h-4 rounded border-zinc-300 text-black focus:ring-black"
                                />
                                <label htmlFor="visibleToRepairer" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest cursor-pointer">
                                  Make visible to Repair Partner
                                </label>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                               <p className="text-[8px] font-bold text-zinc-400 uppercase italic tracking-widest">Only visible to Assessor, Repair Partner & Support</p>
                               <div className="flex items-center gap-3">
                                 {privateNotes.length > 0 && !isClaimAlreadySynced && (
                                   <div className="flex items-center gap-2 text-green-600 animate-pulse">
                                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                      <span className="text-[8px] font-black uppercase tracking-widest italic">Draft Active</span>
                                   </div>
                                 )}
                                 <Button 
                                   onClick={handleSaveNotes}
                                   disabled={isClaimAlreadySynced || !privateNotes.trim()}
                                   className="h-8 px-4 bg-black text-white text-[8px] font-black rounded-lg hover:bg-zinc-800 transition-all"
                                 >
                                   ADD NOTE
                                 </Button>
                               </div>
                            </div>
                         </Card>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Fallbacks for other tabs */}
                {activeConsoleTab === 'shop' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center">
                       <h3 className="text-xs font-black uppercase tracking-widest italic text-black">AIMS Partner Network</h3>
                       <Badge className="bg-green-50 text-green-600 border-none font-bold text-[9px] px-4 py-1.5 rounded-lg">ALL NODES ONLINE</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { name: 'City Auto Elite', rating: 4.9, load: '80%', specialty: 'Chassis/Structural' },
                        { name: 'Westside Bodywork', rating: 4.2, load: '45%', specialty: 'Paint/Finishing' },
                        { name: 'Central Motors', rating: 4.7, load: '60%', specialty: 'Mechanical/Sensors' },
                        { name: 'Elite Restorations', rating: 4.5, load: '30%', specialty: 'Luxury/Exotics' }
                      ].map((shop, i) => (
                        <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-black transition-all group cursor-pointer">
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center text-xs font-black italic">RP</div>
                            <Badge className="bg-white border-none text-[8px] font-bold text-zinc-400">{shop.load} LOAD</Badge>
                          </div>
                          <h4 className="text-sm font-black uppercase italic text-black">{shop.name}</h4>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{shop.specialty}</p>
                          <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center">
                             <div className="flex gap-1 text-yellow-500">
                               {[1,2,3,4,5].map(star => <Star key={star} size={10} fill={star <= Math.floor(shop.rating) ? "currentColor" : "none"} />)}
                             </div>
                             <span className="text-[9px] font-black text-black italic">ASSIGN NODE</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeConsoleTab === 'schedule' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center">
                       <h3 className="text-xs font-black uppercase tracking-widest italic text-black">Inspection Calendar</h3>
                       <div className="flex gap-2">
                          <Button variant="outline" className="h-10 px-4 text-[8px] font-black rounded-lg">PREV</Button>
                          <Button variant="outline" className="h-10 px-4 text-[8px] font-black rounded-lg">NEXT</Button>
                       </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => (
                        <div key={d} className="text-center text-[8px] font-black text-zinc-300 uppercase py-2">{d}</div>
                      ))}
                      {Array.from({ length: 31 }).map((_, i) => {
                        const day = i + 1;
                        const hasEvent = [15, 18, 22].includes(day);
                        return (
                          <div key={i} className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${hasEvent ? 'bg-black border-black text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-zinc-300 hover:border-zinc-300'}`}>
                            <span className="text-[10px] font-black italic">{day}</span>
                            {hasEvent && <div className="w-1 h-1 bg-[#E31B23] rounded-full" />}
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-6 bg-zinc-950 text-white rounded-3xl space-y-4 shadow-xl">
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Today's Agenda</p>
                       <div className="space-y-3">
                          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                             <div className="w-2 h-2 bg-[#E31B23] rounded-full" />
                             <div className="flex-1">
                                <p className="text-[10px] font-black uppercase italic">John Doe • BMW M3</p>
                                <p className="text-[8px] font-bold text-zinc-500 uppercase">14:00 - Field Audit</p>
                             </div>
                             <Clock size={14} className="text-zinc-600" />
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-10 animate-in fade-in duration-700 relative bg-white">
             <button onClick={onLogout} className="absolute top-8 right-8 p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-black transition-all text-[9px] font-black uppercase tracking-widest italic group">
               <span className="group-hover:mr-2 transition-all">SIGN OUT</span> <LogOut size={14} className="inline group-hover:scale-110" />
             </button>
             <div className="w-56 h-56 bg-white border-2 border-slate-100 rounded-[64px] flex items-center justify-center shadow-2xl transform hover:rotate-3 transition-all duration-1000 group cursor-pointer active:scale-95">
                <ClipboardList size={80} className="text-zinc-100 group-hover:text-[#E31B23] transition-colors" />
             </div>
             <div className="space-y-6 max-w-sm">
                <h2 className="text-4xl font-black uppercase tracking-tighter italic text-black leading-none">Ready for Audit</h2>
                <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest leading-relaxed italic">Select an inspection node to initialize the Comparative Audit Handshake protocol.</p>
             </div>
          </div>
        )}
      </main>

      {/* Sync Handshake Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <Card className="w-full max-w-sm bg-white rounded-[40px] border-none shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-8 bg-zinc-950 text-white flex justify-between items-center border-b-4 border-[#E31B23]">
                <div className="flex items-center gap-4">
                  <SmartphoneNfc size={24} className="text-[#E31B23]" />
                  <h3 className="text-[11px] font-black uppercase tracking-widest">Field Auth Sync</h3>
                </div>
                <button onClick={() => setShowSyncModal(false)} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><X size={20} /></button>
             </div>
             <div className="p-10 space-y-8">
                {syncStep === 'choice' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setSyncStep('qr')} className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-3xl flex flex-col items-center gap-6 hover:bg-zinc-100 hover:border-black transition-all group">
                        <QrCode size={40} className="text-blue-500 group-hover:scale-110 transition-transform duration-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic text-center leading-tight">Optical<br/>Sync</span>
                      </button>
                      <button onClick={() => setSyncStep('phone')} className="p-8 bg-zinc-50 border-2 border-zinc-100 rounded-3xl flex flex-col items-center gap-6 hover:bg-zinc-100 hover:border-black transition-all group">
                        <Smartphone size={40} className="text-black group-hover:scale-110 transition-transform duration-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest italic text-center leading-tight">RSA<br/>Link</span>
                      </button>
                    </div>
                  </div>
                )}
                {(syncStep === 'phone' || syncStep === 'otp') && (
                  <div className="space-y-6 text-center">
                    <p className="text-[10px] font-black uppercase text-zinc-400 italic">Standard Handshake Protocol</p>
                    <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 text-[10px] font-bold text-zinc-400 italic">
                      SMS Gateway initialized. Enter node identity to dispatch OTP.
                    </div>
                    <Button onClick={() => { setSyncStep('handshake'); setTimeout(() => { setIsOmniSynced(true); setSyncStep('success'); setTimeout(() => setShowSyncModal(false), 1500); }, 1500); }} className="w-full h-14 rounded-2xl shadow-xl italic font-black">BYPASS FOR PROTOTYPE</Button>
                  </div>
                )}
                {syncStep === 'qr' && (
                  <div className="space-y-8 text-center animate-in zoom-in-95">
                     <div className="mx-auto cursor-pointer group shadow-2xl p-2 bg-white rounded-xl">
                        <QRCodeUI value={syncUrl} label="SESSION TRANSFER" />
                     </div>
                     <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic leading-relaxed">
                       Scan with your mobile device to transfer your active session and claim dossier to the Field Assistant app.
                     </div>
                  </div>
                )}
                {syncStep === 'handshake' && (
                  <div className="py-12 flex flex-col items-center gap-8">
                    <Loader2 size={64} className="animate-spin text-[#E31B23]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 italic">Syncing Payload...</p>
                  </div>
                )}
                {syncStep === 'success' && (
                  <div className="py-12 text-center space-y-6 animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner border-2 border-green-100">
                        <ShieldCheck size={48} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-black italic">Field Link Established</p>
                  </div>
                )}
             </div>
           </Card>
        </div>
      )}
    </div>
  );
};

export default AssessorDashboard;
