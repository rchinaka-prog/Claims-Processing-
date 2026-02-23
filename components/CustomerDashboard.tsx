import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, Button, Badge, ProgressSteps, PayPalSecureBridge, QRCodeUI, NeuralFeed } from './Shared';
import { 
  Truck, Activity, Inbox, PlusCircle, Shield, 
  DollarSign, Camera, X, Loader2, Send, 
  ScanSearch, FileText, CheckCircle, 
  History, FileCheck, ClipboardList, Info,
  ChevronRight, User, Phone, Hash, Award, MessageCircle, MessageSquare,
  ShieldCheck, Calendar, Wrench, Headset, Clock, Search,
  CreditCard, Smartphone, RefreshCw, SmartphoneNfc, Star, ArrowLeft, Trash2, AlertTriangle,
  FileImage, Zap, Terminal, ShieldAlert, Cpu, LogOut, Download, Link2, QrCode, Key,
  Plus, Image as ImageIcon, ShieldQuestion, FileUp
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface CustomerDashboardProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onLogout: () => void;
}

interface Message {
  id: string;
  sender: 'Support Staff' | 'Repair Shop';
  senderName: string;
  content: string;
  timestamp: string;
  date: Date;
  isRead: boolean;
  type: 'update' | 'query' | 'alert';
}

type SyncStep = 'choice' | 'phone' | 'otp' | 'qr' | 'handshake' | 'success';

const DeleteConfirmationModal: React.FC<{ 
  onClose: () => void, 
  onConfirm: () => void 
}> = ({ onClose, onConfirm }) => (
  <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
    <Card className="w-full max-w-sm p-8 bg-white rounded-3xl border-none shadow-2xl space-y-6 text-center animate-in zoom-in-95">
      <div className="w-16 h-16 bg-red-50 text-[#E31B23] rounded-full flex items-center justify-center mx-auto mb-2">
        <AlertTriangle size={32} />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-black uppercase tracking-tight">Confirm Purge</h3>
        <p className="text-xs font-medium text-slate-500 leading-relaxed italic">
          This thread will be permanently expunged from your secure record.
        </p>
      </div>
      <div className="flex gap-4 pt-2">
        <Button variant="outline" onClick={onClose} className="flex-1 h-12 text-[10px]">CANCEL</Button>
        <Button onClick={onConfirm} className="flex-1 h-12 bg-black text-white text-[10px]">PURGE</Button>
      </div>
    </Card>
  </div>
);

const SubmitConfirmationModal: React.FC<{ 
  onClose: () => void, 
  onConfirm: () => void,
  details: { date: string, photosCount: number }
}> = ({ onClose, onConfirm, details }) => (
  <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
    <Card className="w-full max-w-md p-10 bg-white rounded-[40px] border-none shadow-2xl space-y-8 animate-in zoom-in-95">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-zinc-950 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3 shadow-xl">
          <ShieldQuestion size={32} className="text-[#E31B23]" />
        </div>
        <h3 className="text-2xl font-black text-black uppercase tracking-tighter italic">Confirm Transmission?</h3>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] italic">Electronic Signature Required</p>
      </div>

      <div className="space-y-4">
        <div className="p-5 bg-zinc-50 border border-zinc-100 rounded-2xl space-y-3">
          <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
            <span className="text-zinc-400">Incident Date</span>
            <span className="text-black">{details.date || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
            <span className="text-zinc-400">Evidence Frames</span>
            <span className="text-[#E31B23]">{details.photosCount} Captured</span>
          </div>
          <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
            <span className="text-zinc-400">Tunnel Protocol</span>
            <span className="text-green-600">Encrypted</span>
          </div>
        </div>
        <p className="text-[9px] font-medium text-zinc-400 leading-relaxed text-center italic">
          By clicking transmit, you verify that the information provided is accurate and consent to the digital audit process.
        </p>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" onClick={onClose} className="flex-1 h-14 text-[10px] rounded-2xl">REVISE</Button>
        <Button onClick={onConfirm} className="flex-1 h-14 bg-black text-white text-[10px] rounded-2xl shadow-xl">TRANSMIT NOW</Button>
      </div>
    </Card>
  </div>
);

const RatingModal: React.FC<{ 
  onClose: () => void, 
  onSubmit: (data: any) => void,
  assessorName: string,
  repairerName: string
}> = ({ onClose, onSubmit, assessorName, repairerName }) => {
  const [assessorRating, setAssessorRating] = useState(0);
  const [repairerRating, setRepairerRating] = useState(0);
  const [comment, setComment] = useState('');

  const StarRating = ({ rating, setRating, label }: { rating: number, setRating: (r: number) => void, label: string }) => (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`transition-all ${star <= rating ? 'text-[#ffcc00] scale-110' : 'text-zinc-200 hover:text-zinc-300'}`}
          >
            <Star size={28} fill={star <= rating ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-10 bg-white rounded-[32px] border-none shadow-2xl space-y-8 animate-in zoom-in-95">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-black uppercase tracking-tight">Claim Successful</h2>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest italic">Help us improve our service network</p>
        </div>

        <div className="space-y-8">
          <StarRating rating={assessorRating} setRating={setAssessorRating} label={`Assigned Expert: ${assessorName}`} />
          <StarRating rating={repairerRating} setRating={setRepairerRating} label={`Repair Partner: ${repairerName}`} />
          
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Experience Notes</p>
            <textarea 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Your feedback..."
              className="w-full h-24 bg-zinc-50 border border-zinc-100 rounded-2xl p-4 text-xs font-medium outline-none italic focus:border-[#E31B23] transition-all resize-none shadow-inner"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-14 text-[10px]">SKIP</Button>
          <Button disabled={assessorRating === 0 || repairerRating === 0} onClick={() => onSubmit({ assessorRating, repairerRating, comment })} className="flex-1 h-14 text-[10px]">SUBMIT FEEDBACK</Button>
        </div>
      </Card>
    </div>
  );
};

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ activeTab, onTabChange, onLogout }) => {
  const [showPayPalBridge, setShowPayPalBridge] = useState(false);
  const [isTopUpPaid, setIsTopUpPaid] = useState(false);
  const [isClaimClosed, setIsClaimClosed] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([
    "Handshake verified.",
    "Keys established.",
    "Link active."
  ]);

  useEffect(() => {
    if (activeTab !== 'track') return;
    const phrases = [
      "Verifying signature...",
      "Syncing nodes...",
      "Neural audit cycle...",
      "Packet verification...",
      "Token refreshed...",
      "Asset geolocation verified."
    ];
    const interval = setInterval(() => {
      setHandshakeLogs(prev => {
        const next = [...prev, phrases[Math.floor(Math.random() * phrases.length)]];
        if (next.length > 20) return next.slice(next.length - 20);
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const [isOmniSynced, setIsOmniSynced] = useState(false);
  const [syncStep, setSyncStep] = useState<SyncStep>('choice');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [handshakeProgress, setHandshakeProgress] = useState(0);
  const [handshakeText, setHandshakeText] = useState('Initializing...');
  
  const [accidentDate, setAccidentDate] = useState('');
  const [explanation, setExplanation] = useState('');
  const [policeReport, setPoliceReport] = useState<string | null>(null);
  const [policeReportName, setPoliceReportName] = useState<string | null>(null);
  const [registrationDoc, setRegistrationDoc] = useState<string | null>(null);
  const [registrationDocName, setRegistrationDocName] = useState<string | null>(null);
  const [damagedPhotos, setDamagedPhotos] = useState<string[]>([]);
  
  const [isTriageAnalyzing, setIsTriageAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState<string | null>(null);

  const policeInputRef = useRef<HTMLInputElement>(null);
  const regInputRef = useRef<HTMLInputElement>(null);
  const photosInputRef = useRef<HTMLInputElement>(null);

  const [inboxMessages, setInboxMessages] = useState<Message[]>([
    { id: 'm1', sender: 'Support Staff', senderName: 'Nicoz Support', content: 'We received your claim. Expect an assessor within 24h.', timestamp: '10:30 AM', date: new Date(Date.now() - 3600000), isRead: false, type: 'update' },
    { id: 'm2', sender: 'Repair Shop', senderName: 'City Auto Elite', content: 'Finalized parts procurement for BMW M3.', timestamp: 'Yesterday', date: new Date(Date.now() - 86400000), isRead: true, type: 'update' },
    { id: 'm3', sender: 'Support Staff', senderName: 'Billing Hub', content: 'Valuation approved. Settle gap to unlock repair.', timestamp: '2 days ago', date: new Date(Date.now() - 172800000), isRead: true, type: 'query' }
  ]);

  const sortedMessages = useMemo(() => {
    return [...inboxMessages].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [inboxMessages]);

  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null);

  const policy = {
    number: 'ND-88291-GOLD',
    tier: 'GOLD',
    status: 'Active',
    coverageLimit: 15000,
    renewDate: '2025-01-12',
    benefits: ['Zero-Excess Repair', 'Courtesy Car Access', '24/7 Roadside Assist'],
    holderName: 'John D. Customer',
    holderPhone: '0786413281',
    holderEmail: 'john.doe@firstmutual.co.zw'
  };

  const activeClaim = {
    id: 'CLM-9901',
    status: isClaimClosed ? 'Closed' : (isTopUpPaid ? 'Restored' : 'Awaiting Settlement'),
    vehicle: '2022 BMW M3',
    currentStage: isClaimClosed ? 4 : (isTopUpPaid ? 3 : 2),
    steps: ["Reported", "Audit", "Approved", "Done"],
    topUpRequired: 1150,
    repairer: { name: 'City Auto Elite' },
    assignedAssessor: { name: 'Marcus Flint', status: 'Verified', id: 'AS-882', phone: '0786413281' },
    repairEvidence: [
      { id: 'ev1', title: 'Teardown', description: 'Chassis alignment verified.', date: '2h ago', photos: [] },
      { id: 'ev2', title: 'Parts', description: 'OEM Front Radiator verified.', date: '5h ago', photos: [] }
    ]
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: (val: string) => void,
    nameSetter?: (name: string) => void
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (nameSetter) nameSetter(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setDamagedPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setDamagedPhotos(prev => prev.filter((_, i) => i !== index));
    setTriageResult(null);
  };

  const handleFinalSubmit = () => {
    setShowSubmitModal(false);
    alert("Transmitted to Hub."); 
    onTabChange('track');
  };

  const runTriageAi = async () => {
    if (damagedPhotos.length === 0) return;
    setIsTriageAnalyzing(true);
    setTriageResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { mimeType: "image/jpeg", data: damagedPhotos[0].split(',')[1] || "" } }, { text: "Analyze damage. Provide 3 bullet points severity and cost range." }] }
      });
      setTriageResult(response.text || "Analysis complete.");
    } catch (e) {
      setTriageResult("AIMS Intelligence Hub overloaded.");
    } finally {
      setIsTriageAnalyzing(false);
    }
  };

  const startHandshake = () => {
    setSyncStep('handshake');
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress >= 100) {
        setHandshakeProgress(100);
        clearInterval(interval);
        setTimeout(() => { setIsOmniSynced(true); setSyncStep('success'); setTimeout(() => setShowSyncModal(false), 2000); }, 1000);
      } else {
        setHandshakeProgress(progress);
        setHandshakeText(progress < 50 ? 'Generating RSA...' : 'Syncing Ledger...');
      }
    }, 200);
  };

  const handleSelectMessage = (id: string) => {
    setSelectedMsgId(id);
    setInboxMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
  };

  const isSubmitReady = explanation.length > 20 && accidentDate !== '' && policeReport && registrationDoc && damagedPhotos.length > 0;

  return (
    <div className="min-h-full bg-white px-4 md:px-10 py-6 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-10 overflow-x-hidden">
      {showRatingModal && (
        <RatingModal 
          onClose={() => { setIsClaimClosed(true); setShowRatingModal(false); }} 
          onSubmit={() => { setIsClaimClosed(true); setShowRatingModal(false); }}
          assessorName={activeClaim.assignedAssessor.name}
          repairerName={activeClaim.repairer.name}
        />
      )}

      {showSubmitModal && (
        <SubmitConfirmationModal 
          onClose={() => setShowSubmitModal(false)}
          onConfirm={handleFinalSubmit}
          details={{ date: accidentDate, photosCount: damagedPhotos.length }}
        />
      )}

      {messageToDelete && (
        <DeleteConfirmationModal onClose={() => setMessageToDelete(null)} onConfirm={() => {
          setInboxMessages(prev => prev.filter(m => m.id !== messageToDelete));
          if (selectedMsgId === messageToDelete) setSelectedMsgId(null);
          setMessageToDelete(null);
        }} />
      )}

      {/* Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <Card className="w-full max-w-sm bg-white rounded-3xl border-none shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="p-6 bg-zinc-950 text-white flex justify-between items-center border-b-2 border-[#E31B23]">
                <div className="flex items-center gap-3">
                  <SmartphoneNfc size={20} className="text-[#E31B23]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Mobile Link</h3>
                </div>
                <button onClick={() => setShowSyncModal(false)} className="p-1 hover:bg-white/10 rounded-full"><X size={20} /></button>
             </div>
             <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                {syncStep === 'choice' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setSyncStep('qr')} className="p-4 md:p-6 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col items-center gap-3 md:gap-4 hover:bg-zinc-100 transition-all">
                        <MessageCircle size={28} className="text-green-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">WhatsApp</span>
                      </button>
                      <button onClick={() => setSyncStep('phone')} className="p-4 md:p-6 bg-zinc-50 border border-zinc-100 rounded-2xl flex flex-col items-center gap-3 md:gap-4 hover:bg-zinc-100 transition-all">
                        <Smartphone size={28} className="text-black" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">SMS</span>
                      </button>
                    </div>
                  </div>
                )}
                {syncStep === 'phone' && (
                  <div className="space-y-6">
                     <input type="tel" autoFocus value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+263..." className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl py-4 px-6 text-sm font-bold outline-none" />
                     <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setSyncStep('choice')} className="flex-1 h-12 text-[10px]">BACK</Button>
                        <Button onClick={() => setSyncStep('otp')} className="flex-[2] h-12 text-[10px]">NEXT</Button>
                     </div>
                  </div>
                )}
                {syncStep === 'otp' && (
                  <div className="space-y-6">
                    <input type="text" maxLength={6} autoFocus value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="000000" className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl py-4 px-6 text-xl font-bold text-center tracking-widest outline-none" />
                    <Button onClick={startHandshake} className="w-full h-12 text-[10px]">VERIFY</Button>
                  </div>
                )}
                {syncStep === 'qr' && (
                  <div className="space-y-6 text-center">
                     <div className="mx-auto" onClick={startHandshake}>
                        <QRCodeUI value="sync" label="Scan to Link" />
                     </div>
                     <p className="text-[10px] font-bold text-zinc-400 uppercase">Awaiting scan...</p>
                  </div>
                )}
                {syncStep === 'handshake' && (
                  <div className="py-10 flex flex-col items-center gap-6">
                    <Loader2 size={40} className="animate-spin text-[#E31B23]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{handshakeText}</p>
                  </div>
                )}
                {syncStep === 'success' && (
                  <div className="py-10 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <ShieldCheck size={32} />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">Node Locked</p>
                  </div>
                )}
             </div>
           </Card>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-zinc-100 pb-6 md:pb-8">
        <div className="flex items-center gap-4 md:gap-5">
          <div className="p-3 md:p-4 bg-black text-white shadow-xl rounded-2xl shrink-0"><Truck size={20} md:size={24} /></div>
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-black tracking-tight uppercase leading-none">Command Center</h1>
            <p className="text-[#E31B23] font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em] mt-1.5 italic">Secure Node Connection Active</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-zinc-50 p-1 rounded-xl border border-zinc-100 overflow-x-auto no-scrollbar">
            {['track', 'submit', 'inbox', 'policies'].map(tab => (
              <button 
                key={tab} 
                onClick={() => onTabChange(tab)} 
                className={`px-4 md:px-6 py-2 md:py-2.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-lg md:rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-black text-white shadow-lg' : 'text-slate-400 hover:text-black'}`}
              >
                {tab === 'submit' ? 'New Claim' : tab === 'track' ? 'Live Track' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'submit' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg md:text-xl font-bold text-black uppercase tracking-tight">Register New Claim</h2>
            <Badge status="info" className="text-[9px] md:text-[10px] px-3 md:px-4 py-1.5 rounded-lg font-bold">DRAFT</Badge>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <Card className="p-6 md:p-8 bg-zinc-50/50 border-zinc-100 rounded-3xl space-y-6 md:space-y-10 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 italic">Incident Date</label>
                    <input type="date" value={accidentDate} onChange={(e) => setAccidentDate(e.target.value)} className="w-full bg-white border border-zinc-200 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-6 text-sm font-bold outline-none focus:border-black shadow-sm" />
                  </div>
                  <div className="space-y-2 opacity-60">
                    <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 italic">Network ID</label>
                    <div className="w-full bg-zinc-100 border border-zinc-200 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-6 text-sm font-bold text-zinc-400">AUTO-GEN</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 italic">Account of Event</label>
                  <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Describe the incident..." className="w-full h-32 md:h-40 bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-4 md:p-6 text-sm font-medium outline-none italic focus:border-black shadow-sm resize-none" />
                </div>

                {/* Refined Damage Photo Upload Area */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-black italic flex items-center gap-2">
                      <Camera size={14} className="text-[#E31B23]" /> Vehicle Evidence
                    </label>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">{damagedPhotos.length} Frames Linked</span>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 md:gap-4">
                    <button 
                      onClick={() => photosInputRef.current?.click()}
                      className="aspect-square bg-white border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-black hover:bg-slate-50 transition-all group shadow-sm"
                    >
                      <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-red-50 group-hover:text-[#E31B23] transition-colors">
                        <Plus size={20} />
                      </div>
                      <span className="text-[8px] font-black uppercase text-zinc-400 group-hover:text-black">Add Frame</span>
                      <input 
                        type="file" 
                        ref={photosInputRef} 
                        className="hidden" 
                        multiple 
                        accept="image/*" 
                        onChange={handleMultipleFileUpload} 
                      />
                    </button>

                    {damagedPhotos.map((photo, i) => (
                      <div key={i} className="aspect-square bg-white border border-zinc-100 rounded-2xl relative overflow-hidden group shadow-sm">
                        <img src={photo} alt={`Damage ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                           <button onClick={() => removePhoto(i)} className="p-2 bg-red-600 text-white rounded-lg shadow-lg hover:scale-110 transition-all active:scale-95">
                             <Trash2 size={14}/>
                           </button>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-md italic">
                          Frame {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 italic">Legal Documents</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <button onClick={() => policeInputRef.current?.click()} className={`w-full p-5 md:p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-3 shadow-sm ${policeReport ? 'bg-green-50 border-green-500' : 'bg-white border-zinc-200 hover:border-black'}`}>
                        <FileText size={20} className={policeReport ? 'text-green-500' : 'text-slate-300'} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{policeReport ? 'Abstract Linked' : 'Police Abstract'}</span>
                        <input type="file" ref={policeInputRef} className="hidden" onChange={(e) => handleFileUpload(e, setPoliceReport, setPoliceReportName)} />
                      </button>
                      {policeReportName && (
                        <p className="text-[8px] font-bold text-center text-zinc-400 uppercase italic truncate px-2">{policeReportName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <button onClick={() => regInputRef.current?.click()} className={`w-full p-5 md:p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center gap-3 shadow-sm ${registrationDoc ? 'bg-green-50 border-green-500' : 'bg-white border-zinc-200 hover:border-black'}`}>
                        <Shield size={20} className={registrationDoc ? 'text-green-500' : 'text-slate-300'} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{registrationDoc ? 'Doc Verified' : 'Registration'}</span>
                        <input type="file" ref={regInputRef} className="hidden" onChange={(e) => handleFileUpload(e, setRegistrationDoc, setRegistrationDocName)} />
                      </button>
                      {registrationDocName && (
                        <p className="text-[8px] font-bold text-center text-zinc-400 uppercase italic truncate px-2">{registrationDocName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="lg:col-span-5">
              <Card className="p-6 md:p-8 bg-black text-white rounded-[24px] md:rounded-[32px] min-h-[400px] flex flex-col justify-between shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-6 transition-all duration-700"><Cpu size={160} md:size={180} /></div>
                <div className="space-y-6 md:space-y-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 md:p-3 bg-[#E31B23] rounded-lg md:rounded-xl"><Activity size={18} md:size={20} /></div>
                    <h3 className="text-base md:text-lg font-bold italic tracking-tight uppercase">Neural Triage</h3>
                  </div>
                  {damagedPhotos.length > 0 ? (
                    <div className="p-4 md:p-6 bg-zinc-900 border border-white/5 rounded-xl md:rounded-2xl space-y-4 md:space-y-6 shadow-inner">
                      {triageResult ? (
                        <div className="space-y-3 md:space-y-4 animate-in fade-in">
                          <p className="text-[11px] md:text-xs text-zinc-300 italic leading-relaxed whitespace-pre-line font-medium">{triageResult}</p>
                          <div className="flex items-center gap-2 md:gap-3 text-green-500 text-[8px] md:text-[10px] font-bold uppercase">
                            <ShieldCheck size={14} md:size={16} /> Verified by AIMS Intelligence
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 md:space-y-6 text-center">
                           <div className="flex flex-col items-center gap-2">
                             <p className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest italic">{damagedPhotos.length} EVIDENCE FRAMES DETECTED</p>
                             <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Neural diagnostic available for processing</p>
                           </div>
                           <Button onClick={runTriageAi} disabled={isTriageAnalyzing} className="w-full h-12 md:h-14 text-[9px] md:text-[10px] rounded-xl md:rounded-2xl font-black italic">
                             {isTriageAnalyzing ? <Loader2 size={20} md:size={24} className="animate-spin" /> : 'TRIGGER NEURAL AUDIT'}
                           </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center space-y-3 md:space-y-4 opacity-30">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                        <ScanSearch size={48} md:size={64} className="text-zinc-600 relative z-10" />
                      </div>
                      <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] italic">Awaiting Evidence Sync</p>
                    </div>
                  )}
                </div>
                <div className="mt-8 md:mt-10 relative z-10">
                   <Button disabled={!isSubmitReady} className="w-full h-16 md:h-18 text-[10px] md:text-[11px] rounded-xl md:rounded-2xl shadow-xl font-black italic" onClick={() => setShowSubmitModal(true)}>SUBMIT SECURE CLAIM</Button>
                   {!isSubmitReady && (
                     <p className="text-[7px] text-zinc-500 text-center mt-3 uppercase font-bold tracking-widest italic opacity-50">Requires: Narrative, Documents & Photo Evidence</p>
                   )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'track' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="lg:col-span-2 p-6 md:p-8 border-zinc-100 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl md:rounded-3xl gap-6 md:gap-8 bg-white">
              <div className="space-y-1.5">
                <Badge status={isClaimClosed ? 'completed' : 'gold'} className="text-[8px] md:text-[10px] px-3 md:px-4 py-1 rounded-md md:rounded-lg uppercase font-bold mb-1">{isClaimClosed ? 'ARCHIVED' : 'GOLD TIER'}</Badge>
                <h2 className="text-2xl md:text-3xl font-bold text-black uppercase italic leading-none tracking-tight">{activeClaim.vehicle}</h2>
                <div className="flex items-center gap-3 md:gap-4 mt-1.5">
                  <p className="text-xs md:text-sm font-bold text-[#E31B23] italic">{activeClaim.id}</p>
                  <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full" />
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase italic">{activeClaim.status}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest italic mb-0.5">Restoration Node</p>
                <p className="text-lg md:text-xl font-bold italic text-black uppercase tracking-tight">{activeClaim.repairer.name}</p>
              </div>
            </Card>
            <Card className="p-6 md:p-8 bg-black text-white rounded-2xl md:rounded-3xl space-y-3 md:space-y-4 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><User size={100} md:size={120} /></div>
               <h3 className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest relative z-10">Policy Holder</h3>
               <div className="space-y-0.5 relative z-10">
                 <p className="text-lg md:text-xl font-bold uppercase italic leading-none tracking-tight">{policy.holderName}</p>
                 <p className="text-xs md:text-sm font-bold italic text-[#E31B23]">{policy.holderPhone}</p>
               </div>
               <Badge className="bg-zinc-900 border-none text-zinc-600 text-[8px] md:text-[9px] relative z-10 px-3 md:px-4 py-1 rounded-md md:rounded-lg italic">ENCRYPTED</Badge>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8 space-y-6 md:space-y-8">
               <Card className="p-6 md:p-10 shadow-lg rounded-[24px] md:rounded-[32px] border-zinc-100 bg-zinc-50/30">
                 {/* Corrected property access from currentStep to currentStage */}
                 <ProgressSteps steps={activeClaim.steps} currentStep={activeClaim.currentStage} />
                 {!isTopUpPaid && (
                   <div className="mt-8 md:mt-12 p-6 md:p-8 bg-zinc-950 text-white rounded-xl md:rounded-2xl flex flex-col sm:flex-row gap-4 md:gap-6 justify-between items-center shadow-2xl border border-white/5">
                     <div className="space-y-1 text-center sm:text-left">
                       <h3 className="text-base md:text-lg font-bold italic flex items-center justify-center sm:justify-start gap-3"><CreditCard size={18} md:size={20} className="text-[#E31B23]" /> Gap Contribution</h3>
                       <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount Authorized: $1,150.00</p>
                     </div>
                     <Button onClick={() => setShowPayPalBridge(true)} className="bg-white text-black h-12 text-[9px] md:text-[10px] px-6 md:px-8 w-full sm:w-auto font-bold rounded-xl hover:bg-[#0070ba] hover:text-white">PAY SETTLEMENT</Button>
                   </div>
                 )}
                 {isTopUpPaid && !isClaimClosed && (
                   <div className="mt-8 md:mt-12 p-6 md:p-8 bg-green-600 text-white rounded-xl md:rounded-2xl flex flex-col sm:flex-row gap-4 md:gap-6 justify-between items-center shadow-lg">
                     <div className="space-y-1 text-center sm:text-left">
                       <h3 className="text-base md:text-lg font-bold italic">Restoration Cycle Complete</h3>
                       <p className="text-[9px] md:text-[10px] font-bold text-green-100 uppercase tracking-widest">Verify restoration to archive file</p>
                     </div>
                     <Button onClick={() => setShowRatingModal(true)} className="bg-black text-white h-12 text-[9px] md:text-[10px] px-6 md:px-8 w-full sm:w-auto font-bold rounded-xl">VERIFY & ARCHIVE</Button>
                   </div>
                 )}
               </Card>
               <Card className="p-6 md:p-10 shadow-lg rounded-[24px] md:rounded-[32px] border-zinc-100 bg-white space-y-8 md:space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 md:p-3 bg-black text-white rounded-lg md:rounded-xl shadow-md"><History size={20} md:size={24} /></div>
                    <h3 className="text-lg md:text-xl font-bold uppercase italic text-black">Audit Telemetry</h3>
                  </div>
                  <div className="space-y-8 md:space-y-12">
                    {activeClaim.repairEvidence.map((ev, i) => (
                      <div key={ev.id} className="flex gap-4 md:gap-8 relative group">
                        <div className="flex flex-col items-center">
                           <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-md z-10 ${i === 0 ? 'bg-red-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                             {i === 0 ? <Zap size={16} md:size={20} /> : <FileCheck size={16} md:size={20} />}
                           </div>
                           {i !== activeClaim.repairEvidence.length - 1 && <div className="w-1 flex-1 bg-zinc-50 my-2 rounded-full" />}
                        </div>
                        <div className="flex-1 space-y-2 md:space-y-3 pb-6 md:pb-8">
                           <div className="flex justify-between items-start">
                             <h4 className="text-base md:text-lg font-bold uppercase italic text-black leading-none">{ev.title}</h4>
                             <span className="text-[8px] md:text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">{ev.date}</span>
                           </div>
                           <p className="text-[11px] md:text-xs font-medium text-zinc-500 italic leading-relaxed">{ev.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </Card>
            </div>
            <div className="lg:col-span-4 space-y-6 md:space-y-8">
              <Card className="p-6 md:p-8 bg-zinc-950 text-white rounded-[24px] md:rounded-[32px] border-none shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-6 transition-all duration-700 pointer-events-none"><Terminal size={120} md:size={140} /></div>
                <div className="relative z-10 space-y-4 md:space-y-6">
                  <h3 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 italic text-zinc-400"><Zap size={14} md:size={16} className="text-[#E31B23]" /> Pulse</h3>
                  <NeuralFeed logs={handshakeLogs} />
                </div>
              </Card>
              <Card className="p-6 md:p-8 bg-white border-zinc-100 rounded-[24px] md:rounded-[32px] space-y-4 md:space-y-6 shadow-lg">
                <h3 className="text-[9px] md:text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-3 tracking-widest"><User size={16} md:size={18} className="text-[#E31B23]" /> Expert Assigned</h3>
                <div className="flex items-center gap-4 md:gap-5 relative z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-zinc-950 rounded-lg md:rounded-xl flex items-center justify-center text-white text-lg md:text-xl font-bold italic shadow-md">MF</div>
                    <div>
                      <p className="text-sm md:text-base font-bold uppercase italic leading-none tracking-tight">{activeClaim.assignedAssessor.name}</p>
                      <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">ID: {activeClaim.assignedAssessor.id}</p>
                    </div>
                </div>
                <div className="space-y-3 md:space-y-4 pt-4 md:pt-6 border-t border-zinc-50">
                  <a href={`tel:${activeClaim.assignedAssessor.phone}`} className="h-12 md:h-14 w-full bg-zinc-50 border border-zinc-100 rounded-lg md:rounded-xl flex items-center justify-center gap-3 text-[#E31B23] hover:bg-black hover:text-white transition-all shadow-sm">
                    <Phone size={16} md:size={18} /> <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Secure Link</span>
                  </a>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="space-y-6 md:space-y-8 animate-in fade-in h-[500px] md:h-[600px] flex flex-col">
          <div className="flex justify-between items-end px-1 shrink-0">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-black uppercase tracking-tight italic leading-none">Messaging</h2>
              <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">Cryptographically Secured Correspondence</p>
            </div>
            {isOmniSynced ? (
              <Badge status="success" className="px-3 md:px-4 py-1.5 rounded-lg md:rounded-xl font-bold text-[8px] md:text-[9px]">SYNCED</Badge>
            ) : (
              <button onClick={() => { setSyncStep('choice'); setShowSyncModal(true); }} className="px-3 md:px-4 py-2 bg-zinc-950 text-white rounded-lg md:rounded-xl flex items-center gap-2 hover:bg-[#E31B23] transition-all text-[8px] md:text-[9px] font-bold uppercase tracking-widest"><Smartphone size={12} md:size={14} /> Connect Phone</button>
            )}
          </div>
          <div className="flex-1 flex gap-4 md:gap-6 min-h-0">
            <Card className={`w-full lg:w-[320px] rounded-[24px] md:rounded-[32px] border-zinc-100 shadow-xl flex flex-col bg-zinc-50/30 ${selectedMsgId ? 'hidden lg:flex' : 'flex'}`}>
               <div className="p-4 md:p-6 border-b border-zinc-100 bg-white rounded-t-[24px] md:rounded-t-[32px] flex items-center gap-3">
                  <Search size={16} md:size={18} className="text-zinc-300" />
                  <input type="text" placeholder="FILTER THREADS..." className="bg-transparent text-[9px] md:text-[10px] font-bold uppercase tracking-widest outline-none w-full italic" />
               </div>
               <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 custom-scrollbar">
                  {sortedMessages.map(msg => (
                    <div key={msg.id} onClick={() => handleSelectMessage(msg.id)} className={`p-4 md:p-6 rounded-xl md:rounded-2xl cursor-pointer transition-all border-l-[6px] md:border-l-8 relative ${selectedMsgId === msg.id ? 'bg-white shadow-md border-[#E31B23] scale-[1.01] md:scale-[1.02]' : 'bg-white/40 border-zinc-100 hover:bg-white'}`}>
                      {!msg.isRead && <div className="absolute top-4 md:top-6 right-4 md:right-6 w-2 md:w-2.5 h-2 md:h-2.5 bg-[#E31B23] rounded-full animate-pulse" />}
                      <div className="flex justify-between items-start mb-2 md:mb-3">
                        <Badge status={msg.sender === 'Support Staff' ? 'info' : 'critical'} className="text-[7px] md:text-[8px] py-0.5 md:py-1 px-2 md:px-3 rounded-md font-bold uppercase">{msg.sender.split(' ')[0]}</Badge>
                        <span className="text-[7px] md:text-[8px] font-bold text-zinc-300 uppercase tracking-widest">{msg.timestamp}</span>
                      </div>
                      <h4 className={`text-xs md:text-sm uppercase truncate italic leading-none font-bold ${!msg.isRead ? 'text-black' : 'text-zinc-400'}`}>{msg.senderName}</h4>
                      <p className={`text-[9px] md:text-[10px] mt-1.5 md:mt-2 line-clamp-1 italic leading-relaxed ${!msg.isRead ? 'font-bold text-zinc-600' : 'text-zinc-400'}`}>{msg.content}</p>
                    </div>
                  ))}
               </div>
            </Card>
            <Card className={`flex-1 rounded-[24px] md:rounded-[32px] border-zinc-100 shadow-xl flex flex-col bg-white overflow-hidden ${!selectedMsgId ? 'hidden lg:flex' : 'flex'}`}>
              {selectedMsgId ? (
                <>
                  <div className="p-6 md:p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/10">
                    <div className="flex items-center gap-4 md:gap-5">
                      <button onClick={() => setSelectedMsgId(null)} className="lg:hidden p-2 bg-zinc-100 rounded-lg"><ArrowLeft size={16} md:size={18}/></button>
                      <div className={`p-3 md:p-4 rounded-lg md:rounded-xl text-white shadow-lg ${inboxMessages.find(m => m.id === selectedMsgId)?.sender === 'Support Staff' ? 'bg-blue-600' : 'bg-[#E31B23]'}`}>
                         {inboxMessages.find(m => m.id === selectedMsgId)?.sender === 'Support Staff' ? <Headset size={18} md:size={20} /> : <Wrench size={18} md:size={20} />}
                      </div>
                      <div>
                        <h3 className="text-base md:text-lg font-bold uppercase italic leading-none tracking-tight">{inboxMessages.find(m => m.id === selectedMsgId)?.senderName}</h3>
                        <p className="text-[7px] md:text-[8px] font-bold text-green-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-1 flex items-center gap-1.5 italic">
                          <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-green-500 rounded-full animate-pulse" /> TUNNEL SECURE
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar italic text-[13px] md:text-sm font-medium text-zinc-700 leading-relaxed">
                     <div className="bg-zinc-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-zinc-100 max-w-full sm:max-w-[90%] shadow-inner">
                        {inboxMessages.find(m => m.id === selectedMsgId)?.content}
                     </div>
                  </div>
                  <div className="p-4 md:p-6 border-t border-zinc-50 bg-zinc-50/20">
                    <div className="flex gap-2 md:gap-4 bg-white p-2 rounded-xl md:rounded-2xl border border-zinc-100 shadow-sm">
                      <input type="text" placeholder="Respond..." className="flex-1 px-4 md:px-6 py-2.5 md:py-3 text-[11px] md:text-xs font-medium italic outline-none bg-transparent" />
                      <button className="p-3 md:p-4 bg-black text-white rounded-lg md:rounded-xl hover:bg-[#E31B23] transition-all group/send">
                        <Send size={18} md:size={20} className="group-hover/send:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-10 space-y-4 md:space-y-6">
                  <MessageSquare size={64} md:size={80} className="text-zinc-950" />
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] text-zinc-950">Select Thread</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
      
      {activeTab === 'policies' && (
        <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 md:gap-6 px-1">
             <h2 className="text-xl md:text-2xl font-bold text-black uppercase tracking-tight italic">Coverage Portfolio</h2>
             <Button onClick={() => {}} variant="outline" className="text-[9px] md:text-[10px] w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl gap-2 md:gap-3">
               <Download size={16} md:size={18} /> CERTIFICATE
             </Button>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <Card className="p-8 md:p-10 bg-black text-white rounded-[32px] md:rounded-[40px] border-none shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 md:p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"><ShieldCheck size={200} md:size={280} /></div>
                 <div className="relative z-10 space-y-8 md:space-y-10">
                    <div className="flex justify-between items-start">
                       <div className="space-y-3 md:space-y-4">
                          <Badge status="gold" className="text-[8px] md:text-[9px] px-3 md:px-4 py-1 md:py-1.5 bg-[#E31B23] border-none rounded-md md:rounded-lg uppercase font-bold tracking-widest">ACTIVE NODE</Badge>
                          <h3 className="text-2xl md:text-3xl font-bold italic uppercase tracking-tighter">{policy.number}</h3>
                       </div>
                       <div className="p-3 md:p-4 bg-[#E31B23] rounded-lg md:rounded-2xl shadow-xl"><Award size={24} md:size={32} className="text-white" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:gap-8 pt-6 md:pt-8 border-t border-white/10">
                       <div className="space-y-1">
                         <p className="text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic">Tier</p>
                         <p className="text-base md:text-xl font-bold italic uppercase leading-none">{policy.tier} LEVEL</p>
                       </div>
                       <div className="space-y-1">
                         <p className="text-[8px] md:text-[9px] font-bold text-zinc-500 uppercase tracking-widest italic">Liability Cap</p>
                         <p className="text-base md:text-xl font-bold italic leading-none">${policy.coverageLimit.toLocaleString()}</p>
                       </div>
                    </div>
                    <div className="bg-zinc-900/80 p-5 md:p-6 rounded-xl md:rounded-2xl space-y-3 md:space-y-4 shadow-inner">
                       <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 uppercase tracking-widest italic">Network Benefits</p>
                       <div className="flex flex-wrap gap-3 md:gap-4">
                         {policy.benefits.map((b, i) => (
                           <div key={i} className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[9px] font-bold uppercase text-zinc-300 italic">
                             <CheckCircle size={12} md:size={14} className="text-[#E31B23]" /> {b}
                           </div>
                         ))}
                       </div>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      )}

      {showPayPalBridge && <PayPalSecureBridge amount="$1,150.00" to={activeClaim.repairer.name} onSuccess={() => { setIsTopUpPaid(true); setShowPayPalBridge(false); }} onCancel={() => setShowPayPalBridge(false)} />}
    </div>
  );
};

export default CustomerDashboard;