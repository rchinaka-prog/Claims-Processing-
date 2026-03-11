import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Card, Button, Badge, ProgressSteps, PaymentBridge, QRCodeUI, NeuralFeed } from './Shared';
import { 
  Truck, Activity, Inbox, PlusCircle, Shield, 
  DollarSign, Camera, X, Loader2, Send, 
  ScanSearch, FileText, CheckCircle, 
  History, FileCheck, ClipboardList, Info,
  ChevronRight, User, Phone, Hash, Award, MessageCircle, MessageSquare,
  ShieldCheck, Calendar, Wrench, Headset, Clock, Search,
  CreditCard, Smartphone, RefreshCw, SmartphoneNfc, Star, ArrowLeft, Trash2, AlertTriangle,
  FileImage, Zap, Terminal, ShieldAlert, Cpu, LogOut, Download, Link2, QrCode, Key,
  Plus, Image as ImageIcon, ShieldQuestion, FileUp, Car,
  BarChart, Layers
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import Markdown from 'react-markdown';
import { AuthSession } from '../types';
import { aimsApi } from '../src/services/aimsApi';

interface CustomerDashboardProps {
  session: AuthSession;
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

const VEHICLE_PARTS = [
  "Front Bumper", "Rear Bumper", "Hood", "Trunk", 
  "Left Front Door", "Right Front Door", "Left Rear Door", "Right Rear Door",
  "Left Front Fender", "Right Front Fender", "Left Rear Quarter", "Right Rear Quarter",
  "Roof", "Windshield", "Headlights", "Taillights"
];

const VehicleMap: React.FC<{ 
  selectedParts: Set<string>, 
  onTogglePart: (part: string) => void 
}> = ({ selectedParts, onTogglePart }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {VEHICLE_PARTS.map(part => (
      <button
        key={part}
        onClick={() => onTogglePart(part)}
        className={`px-3 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg border transition-all ${
          selectedParts.has(part) 
            ? 'bg-[#E31B23] text-white border-[#E31B23] shadow-lg scale-105' 
            : 'bg-white text-zinc-400 border-zinc-100 hover:border-zinc-300'
        }`}
      >
        {part}
      </button>
    ))}
  </div>
);

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
  details: { date: string, photosCount: number, estimatedCost?: string, severity?: string }
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
          {details.estimatedCost && (
            <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
              <span className="text-zinc-400">Neural Estimate</span>
              <span className="text-black">{details.estimatedCost}</span>
            </div>
          )}
          {details.severity && (
            <div className="flex justify-between items-center text-[9px] font-black uppercase italic">
              <span className="text-zinc-400">Audit Severity</span>
              <span className={`px-2 py-0.5 rounded ${
                details.severity === 'Total Loss' || details.severity === 'Severe' ? 'bg-red-500 text-white' : 
                details.severity === 'Moderate' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
              }`}>{details.severity}</span>
            </div>
          )}
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

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ session, activeTab, onTabChange, onLogout }) => {
  const [showPaymentBridge, setShowPaymentBridge] = useState(false);
  const [isTopUpPaid, setIsTopUpPaid] = useState(false);
  const [isClaimClosed, setIsClaimClosed] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  
  const [syncLogs, setSyncLogs] = useState<string[]>([
    "Connection verified.",
    "Security established.",
    "Link active."
  ]);

  useEffect(() => {
    if (activeTab !== 'track') return;
    const phrases = [
      "Verifying identity...",
      "Syncing data...",
      "Checking claim status...",
      "Verifying files...",
      "Session refreshed...",
      "Location verified."
    ];
    const interval = setInterval(() => {
      setSyncLogs(prev => {
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
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  
  const [accidentDate, setAccidentDate] = useState('');
  const [vehicleName, setVehicleName] = useState('Mercedes-Benz C200 (2022)');
  const [explanation, setExplanation] = useState('');
  const [policeReport, setPoliceReport] = useState<string | null>(null);
  const [policeReportName, setPoliceReportName] = useState<string | null>(null);
  const [registrationDoc, setRegistrationDoc] = useState<string | null>(null);
  const [registrationDocName, setRegistrationDocName] = useState<string | null>(null);
  const [damagedPhotos, setDamagedPhotos] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  
  const [isTriageAnalyzing, setIsTriageAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState<string | null>(null);
  const [triageData, setTriageData] = useState<{
    severity: 'Minor' | 'Moderate' | 'Severe' | 'Total Loss';
    estimatedCost: string;
    report: string;
  } | null>(null);

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

  const [activeClaim, setActiveClaim] = useState<any>(null);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);

  const downloadCertificate = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Insurance Certificate - ${policy.number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;700&display=swap');
          body { font-family: 'Inter', sans-serif; background: #f4f4f4; padding: 40px; }
          .certificate {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 60px;
            border: 20px solid #E31B23;
            position: relative;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          }
          .header { text-align: center; margin-bottom: 40px; }
          .brand { font-family: 'Playfair Display', serif; font-size: 42px; color: #E31B23; margin-bottom: 10px; }
          .sub-brand { font-size: 14px; text-transform: uppercase; letter-spacing: 4px; color: #000; font-weight: 700; }
          .title { font-size: 28px; font-weight: 700; margin: 40px 0; border-bottom: 2px solid #eee; padding-bottom: 20px; text-align: center; }
          .content { line-height: 1.8; color: #333; }
          .field { margin-bottom: 20px; display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding-bottom: 10px; }
          .label { font-weight: 700; color: #666; text-transform: uppercase; font-size: 12px; }
          .value { font-weight: 700; color: #000; }
          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; }
          .seal { position: absolute; bottom: 40px; right: 40px; width: 100px; height: 100px; border: 4px solid #E31B23; border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-15deg); color: #E31B23; font-weight: 900; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            <div class="brand">NICOZ DIAMOND</div>
            <div class="sub-brand">Insurance Limited</div>
          </div>
          <div class="title">CERTIFICATE OF INSURANCE</div>
          <div class="content">
            <div class="field"><span class="label">Policy Number</span><span class="value">${policy.number}</span></div>
            <div class="field"><span class="label">Policy Status</span><span class="value" style="color: #E31B23;">ACTIVE</span></div>
            <div class="field"><span class="label">Policy Holder</span><span class="value">${session.user.full_name}</span></div>
            <div class="field"><span class="label">Email Address</span><span class="value">${session.user.email}</span></div>
            <div class="field"><span class="label">Phone Number</span><span class="value">${session.user.phone || 'N/A'}</span></div>
            ${activeClaim ? `<div class="field"><span class="label">Insured Vehicle</span><span class="value">${activeClaim.vehicle}</span></div>` : ''}
            <div class="field"><span class="label">Coverage Tier</span><span class="value">${policy.tier} LEVEL</span></div>
            <div class="field"><span class="label">Liability Limit</span><span class="value">$${policy.coverageLimit.toLocaleString()}</span></div>
            <div class="field"><span class="label">Effective Date</span><span class="value">${new Date().toLocaleDateString()}</span></div>
            <div class="field"><span class="label">Expiry Date</span><span class="value">${new Date(policy.renewDate).toLocaleDateString()}</span></div>
            <div class="field"><span class="label">Verification Hash</span><span class="value" style="font-family: monospace; font-size: 10px;">${Math.random().toString(36).substring(2, 15).toUpperCase()}</span></div>
          </div>
          <div class="footer">
            <strong style="color: #000; letter-spacing: 2px;">FIRST MUTUAL GROUP HOLDINGS</strong><br/>
            This document serves as official proof of insurance coverage under the AIMS digital framework.<br/>
            Nicoz Diamond Insurance Limited is a registered insurer.
          </div>
          <div class="seal">OFFICIAL<br/>VALIDATED</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Nicoz_Diamond_Certificate_${policy.number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchActiveClaim = async () => {
      setIsLoadingClaims(true);
      try {
        const data = await aimsApi.claims.getAll();
        if (data.length > 0) {
          const claim = data[0];
          setActiveClaim({
              id: claim.id,
              status: isClaimClosed ? 'Closed' : (isTopUpPaid ? 'Restored' : (claim.status === 'Approved' ? 'Awaiting Settlement' : claim.status)),
              vehicle: claim.vehicle || claim.car,
              currentStage: isClaimClosed ? 4 : (isTopUpPaid ? 3 : (claim.status === 'Approved' ? 2 : 1)),
              steps: ["Reported", "Audit", "Approved", "Done"],
              topUpRequired: 1150,
              repairer: { name: claim.repairer || 'City Auto Elite' },
              assignedAssessor: { name: claim.assignedAssessor || 'Marcus Flint', status: 'Verified', id: 'AS-882', phone: '0786413281' },
              repairEvidence: typeof claim.repairEvidence === 'string' ? JSON.parse(claim.repairEvidence) : (claim.repairEvidence || [])
            });
          }
      } catch (error) {
        console.error("Failed to fetch active claim:", error);
      } finally {
        setIsLoadingClaims(false);
      }
    };
    fetchActiveClaim();
  }, [isTopUpPaid, isClaimClosed]);

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
    setTriageData(null);
  };

  const handleFinalSubmit = async () => {
    setShowSubmitModal(false);
    setIsTriageAnalyzing(true); // Reuse loading state for submission
    
    try {
      const newClaim = {
        owner: session.user.full_name,
        phone: session.user.phone || '0786413281',
        car: vehicleName,
        incidentDate: accidentDate,
        description: explanation,
        status: 'PENDING_INSPECTION',
        riskLevel: triageData?.severity === 'Total Loss' || triageData?.severity === 'Severe' ? 'CRITICAL' : 
                   triageData?.severity === 'Moderate' ? 'MEDIUM' : 'CRITICAL',
        coverage: 15000,
        estimatedRepairCost: triageData?.estimatedCost || 'TBD',
        location: 'Harare, Zimbabwe',
        neuralSummary: triageResult || 'No AI analysis performed.',
        damagedParts: Array.from(selectedParts) as string[],
        evidence: damagedPhotos.map((data, i) => ({
          id: `ev-${Date.now()}-${i}`,
          name: `damage_photo_${i+1}.jpg`,
          type: 'image/jpeg',
          data: data
        }))
      };
      
      await aimsApi.claims.create(newClaim);
      alert("Claim successfully transmitted to AIMS Hub."); 
      onTabChange('track');
    } catch (error) {
      console.error("Failed to submit claim:", error);
      alert("Transmission failed. Please check your secure link.");
    } finally {
      setIsTriageAnalyzing(false);
    }
  };

  const runTriageAi = async () => {
    if (damagedPhotos.length === 0) return;
    setIsTriageAnalyzing(true);
    setTriageResult(null);
    setTriageData(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      
      const parts = Array.from(selectedParts).join(", ");
      const prompt = `Act as an expert automotive insurance adjuster and forensic damage analyst. 
      The customer has reported damage to the following parts: ${parts || "Not specified"}.
      The vehicle is a ${vehicleName}.
      
      Analyze the attached vehicle damage photos and provide a comprehensive Neural Audit Report.
      
      You must provide:
      1. A detailed Markdown report.
      2. A severity assessment (Minor, Moderate, Severe, or Total Loss).
      3. A preliminary repair cost estimate (e.g., "$1,200 - $1,800").`;

      const imageParts = damagedPhotos.slice(0, 4).map(photo => ({
        inlineData: { mimeType: "image/jpeg", data: photo.split(',')[1] || "" }
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { 
          parts: [
            ...imageParts,
            { text: prompt }
          ] 
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              report: { type: Type.STRING, description: "The full Markdown report" },
              severity: { type: Type.STRING, enum: ["Minor", "Moderate", "Severe", "Total Loss"] },
              estimatedCost: { type: Type.STRING, description: "The estimated repair cost range" }
            },
            required: ["report", "severity", "estimatedCost"]
          }
        }
      });
      
      const data = JSON.parse(response.text || "{}");
      setTriageData(data);
      setTriageResult(data.report);
    } catch (e) {
      setTriageResult("### AIMS Intelligence Hub Overloaded\n\nThe neural processing unit is currently experiencing high latency. Please attempt the audit again in a few moments.");
    } finally {
      setIsTriageAnalyzing(false);
    }
  };

  const generateSyncUrl = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      mode: 'field_sync',
      email: session.user.email,
      claimId: activeClaim?.id || 'FIELD-NODE'
    });
    return `${baseUrl}/?${params.toString()}`;
  };

  const handleSendSms = async () => {
    if (!phoneNumber) return;
    setIsSendingSms(true);
    const url = generateSyncUrl();
    setGeneratedLink(url);
    
    try {
      const response = await fetch('/api/claims/send-sync-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber, url })
      });
      
      if (!response.ok) throw new Error("Failed to send SMS");
      
      console.log(`[AIMS] Real SMS Sent to ${phoneNumber}`);
    } catch (error) {
      console.error("SMS Error:", error);
      alert("Failed to send secure link via SMS. Please check your credentials.");
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleWhatsAppSync = () => {
    const url = generateSyncUrl();
    const text = encodeURIComponent(`AIMS Secure Node Link: ${url}`);
    window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${text}`, '_blank');
    startHandshake();
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

  if (isLoadingClaims) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-6 min-h-screen bg-white">
        <Loader2 size={48} className="animate-spin text-[#E31B23]" />
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">Initializing Secure Node...</p>
      </div>
    );
  }

  if (!activeClaim) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-6 min-h-screen bg-slate-50">
        <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center text-[#E31B23]">
          <Shield size={40} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tighter italic">No Active Claims</h2>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">You don't have any ongoing claims at the moment.</p>
        </div>
        <Button onClick={() => onTabChange('report')} className="bg-black text-white px-8 h-14 text-[10px]">REPORT NEW CLAIM</Button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white px-4 md:px-10 py-6 md:py-10 max-w-7xl mx-auto space-y-6 md:space-y-10 overflow-x-hidden">
      <style>{`
        .markdown-body h3 {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: white;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          font-style: italic;
          border-left: 2px solid #E31B23;
          padding-left: 8px;
        }
        .markdown-body h3:first-child {
          margin-top: 0;
        }
        .markdown-body p, .markdown-body li {
          font-size: 11px;
          line-height: 1.6;
          color: #a1a1aa;
        }
        .markdown-body ul {
          list-style-type: disc;
          padding-left: 1.25rem;
          margin-bottom: 1rem;
        }
        .markdown-body strong {
          color: white;
          font-weight: 700;
        }
      `}</style>
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
          details={{ 
            date: accidentDate, 
            photosCount: damagedPhotos.length,
            estimatedCost: triageData?.estimatedCost,
            severity: triageData?.severity
          }}
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
                     <div className="space-y-2">
                        <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Mobile Number</label>
                        <input 
                          type="tel" 
                          autoFocus 
                          value={phoneNumber} 
                          onChange={(e) => setPhoneNumber(e.target.value)} 
                          placeholder="+263..." 
                          className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-xl py-4 px-6 text-sm font-bold outline-none focus:border-[#E31B23] transition-all" 
                        />
                     </div>
                     
                     {generatedLink ? (
                       <div className="p-4 bg-green-50 border border-green-100 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-2">
                          <p className="text-[9px] font-bold text-green-700 uppercase tracking-tight">Link Generated Successfully</p>
                          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-green-200">
                             <input readOnly value={generatedLink} className="flex-1 text-[8px] font-mono text-zinc-500 bg-transparent outline-none" />
                             <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(generatedLink);
                                  alert("Link copied to clipboard!");
                                }}
                                className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
                             >
                                <Link2 size={14} className="text-zinc-400" />
                             </button>
                          </div>
                          <Button onClick={startHandshake} className="w-full h-10 text-[9px] bg-green-600 hover:bg-green-700">PROCEED TO HANDSHAKE</Button>
                       </div>
                     ) : (
                       <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setSyncStep('choice')} className="flex-1 h-12 text-[10px]">BACK</Button>
                          <Button 
                            onClick={handleSendSms} 
                            disabled={!phoneNumber || isSendingSms} 
                            className="flex-[2] h-12 text-[10px]"
                          >
                            {isSendingSms ? <Loader2 size={16} className="animate-spin" /> : 'SEND SECURE LINK'}
                          </Button>
                       </div>
                     )}
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
                     <div className="space-y-4">
                        <div className="mx-auto" onClick={startHandshake}>
                           <QRCodeUI value={generateSyncUrl()} label="Scan to Link" />
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                           <p className="text-[9px] font-bold text-zinc-400 uppercase mb-3">Quick Connect via WhatsApp</p>
                           <Button 
                              onClick={handleWhatsAppSync}
                              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white border-none h-12 text-[10px] flex items-center justify-center gap-2"
                           >
                              <MessageCircle size={18} />
                              OPEN WHATSAPP LINK
                           </Button>
                        </div>
                     </div>
                     <p className="text-[10px] font-bold text-zinc-400 uppercase">Awaiting scan or redirect...</p>
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-100 pb-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black text-[#E31B23] uppercase tracking-[0.4em] italic leading-none">AIMS SECURE</p>
            <ChevronRight size={10} className="text-zinc-600" />
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] italic leading-none">
              {activeTab === 'track' ? 'LIVE TRACKING' : 
               activeTab === 'submit' ? 'CLAIM REGISTRY' : 
               activeTab === 'inbox' ? 'MESSAGE HUB' : 'POLICY VAULT'}
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic leading-none text-black">
            {activeTab === 'track' ? 'Command Center' : 
             activeTab === 'submit' ? 'New Claim' : 
             activeTab === 'inbox' ? 'Inbox' : 'Policies'}
          </h1>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100 overflow-x-auto no-scrollbar">
            {['track', 'submit', 'inbox', 'policies'].map(tab => (
              <button 
                key={tab} 
                onClick={() => onTabChange(tab)} 
                className={`px-6 md:px-8 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-black text-white shadow-lg' : 'text-slate-400 hover:text-black'}`}
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
                  <div className="space-y-2">
                    <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 italic">Vehicle Model</label>
                    <input type="text" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} placeholder="e.g. Mercedes-Benz C200" className="w-full bg-white border border-zinc-200 rounded-xl md:rounded-2xl py-3 md:py-4 px-4 md:px-6 text-sm font-bold outline-none focus:border-black shadow-sm" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-1 italic">Account of Event</label>
                  <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Describe the incident..." className="w-full h-32 md:h-40 bg-white border border-zinc-200 rounded-2xl md:rounded-3xl p-4 md:p-6 text-sm font-medium outline-none italic focus:border-black shadow-sm resize-none" />
                </div>

                {/* Vehicle Map Selector */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-black italic flex items-center gap-2">
                      <Car size={14} className="text-[#E31B23]" /> Damage Map
                    </label>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">{selectedParts.size} Areas Flagged</span>
                  </div>
                  <VehicleMap 
                    selectedParts={selectedParts} 
                    onTogglePart={(part) => {
                      const next = new Set(selectedParts);
                      if (next.has(part)) next.delete(part);
                      else next.add(part);
                      setSelectedParts(next);
                    }} 
                  />
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
                        <span className="text-[9px] font-bold uppercase tracking-widest">{registrationDoc ? 'Doc Verified' : 'Vehicle License'}</span>
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
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-6 transition-all duration-700"><Cpu size={180} /></div>
                <div className="space-y-6 md:space-y-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 md:p-3 bg-[#E31B23] rounded-lg md:rounded-xl"><Activity size={20} /></div>
                    <h3 className="text-base md:text-lg font-bold italic tracking-tight uppercase">Neural Triage</h3>
                  </div>
                  {damagedPhotos.length > 0 ? (
                    <div className="p-4 md:p-6 bg-zinc-900 border border-white/5 rounded-xl md:rounded-2xl space-y-4 md:space-y-6 shadow-inner flex-1 flex flex-col min-h-0">
                      {triageResult ? (
                        <div className="space-y-4 animate-in fade-in flex-1 flex flex-col min-h-0">
                          {triageData && (
                            <div className="grid grid-cols-2 gap-3 shrink-0">
                              <div className="p-3 bg-zinc-800/50 border border-white/5 rounded-xl">
                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Neural Severity</p>
                                <p className={`text-xs font-black italic uppercase ${
                                  triageData.severity === 'Total Loss' || triageData.severity === 'Severe' ? 'text-red-500' : 
                                  triageData.severity === 'Moderate' ? 'text-orange-500' : 'text-green-500'
                                }`}>{triageData.severity}</p>
                              </div>
                              <div className="p-3 bg-zinc-800/50 border border-white/5 rounded-xl">
                                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Est. Repair Cost</p>
                                <p className="text-xs font-black italic text-white tracking-tight">{triageData.estimatedCost}</p>
                              </div>
                            </div>
                          )}
                          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="markdown-body prose prose-invert prose-xs text-zinc-300 italic leading-relaxed font-medium">
                              <Markdown>{triageResult}</Markdown>
                            </div>
                          </div>
                          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 md:gap-3 text-green-500 text-[8px] md:text-[10px] font-bold uppercase">
                              <ShieldCheck size={16} /> Verified by AIMS Intelligence
                            </div>
                            <Button onClick={() => { setTriageResult(null); setTriageData(null); }} variant="outline" className="h-8 md:h-10 px-4 text-[8px] border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg">
                              RE-AUDIT
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 md:space-y-6 text-center">
                           <div className="flex flex-col items-center gap-2">
                             <p className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-widest italic">{damagedPhotos.length} EVIDENCE FRAMES DETECTED</p>
                             <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Neural diagnostic available for processing</p>
                           </div>
                           <Button onClick={runTriageAi} disabled={isTriageAnalyzing} className="w-full h-12 md:h-14 text-[9px] md:text-[10px] rounded-xl md:rounded-2xl font-black italic">
                             {isTriageAnalyzing ? <Loader2 size={24} className="animate-spin" /> : 'TRIGGER NEURAL AUDIT'}
                           </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center space-y-3 md:space-y-4 opacity-30">
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                        <ScanSearch size={64} className="text-zinc-600 relative z-10" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="md:col-span-2 lg:col-span-2 p-6 md:p-8 border-zinc-100 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl md:rounded-3xl gap-6 md:gap-8 bg-white">
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
            <Card className="md:col-span-2 lg:col-span-1 p-6 md:p-8 bg-black text-white rounded-2xl md:rounded-3xl space-y-3 md:space-y-4 shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 md:p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><User size={120} /></div>
               <h3 className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest relative z-10">Policy Holder</h3>
               <div className="space-y-0.5 relative z-10">
                 <p className="text-lg md:text-xl font-bold uppercase italic leading-none tracking-tight">{policy.holderName}</p>
                 <p className="text-xs md:text-sm font-bold italic text-[#E31B23]">{policy.holderPhone}</p>
               </div>
               <Badge className="bg-zinc-900 border-none text-zinc-600 text-[8px] md:text-[9px] relative z-10 px-3 md:px-4 py-1 rounded-md md:rounded-lg italic">ENCRYPTED</Badge>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="md:col-span-1 lg:col-span-8 space-y-6 md:space-y-8">
               <Card className="p-6 md:p-10 shadow-lg rounded-[24px] md:rounded-[32px] border-zinc-100 bg-zinc-50/30">
                 {/* Corrected property access from currentStep to currentStage */}
                 <ProgressSteps steps={activeClaim.steps} currentStep={activeClaim.currentStage} />
                 {!isTopUpPaid && (
                   <div className="mt-8 md:mt-12 p-6 md:p-8 bg-zinc-950 text-white rounded-xl md:rounded-2xl flex flex-col sm:flex-row gap-4 md:gap-6 justify-between items-center shadow-2xl border border-white/5">
                     <div className="space-y-1 text-center sm:text-left">
                       <h3 className="text-base md:text-lg font-bold italic flex items-center justify-center sm:justify-start gap-3"><CreditCard size={20} className="text-[#E31B23]" /> Gap Contribution</h3>
                       <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Amount Authorized: $1,150.00</p>
                     </div>
                     <Button onClick={() => setShowPaymentBridge(true)} className="bg-white text-black h-12 text-[9px] md:text-[10px] px-6 md:px-8 w-full sm:w-auto font-bold rounded-xl hover:bg-[#635bff] hover:text-white">PAY SETTLEMENT</Button>
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
                    <div className="p-2.5 md:p-3 bg-black text-white rounded-lg md:rounded-xl shadow-md"><History size={24} /></div>
                    <h3 className="text-lg md:text-xl font-bold uppercase italic text-black">Audit Telemetry</h3>
                  </div>
                  <div className="space-y-8 md:space-y-12">
                    {activeClaim.repairEvidence.map((ev, i) => (
                      <div key={ev.id} className="flex gap-4 md:gap-8 relative group">
                        <div className="flex flex-col items-center">
                           <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-md z-10 ${i === 0 ? 'bg-red-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                             {i === 0 ? <Zap size={20} /> : <FileCheck size={20} />}
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
            <div className="md:col-span-1 lg:col-span-4 space-y-6 md:space-y-8">
              <Card className="p-6 md:p-8 bg-zinc-950 text-white rounded-[24px] md:rounded-[32px] border-none shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-6 transition-all duration-700 pointer-events-none"><Terminal size={140} /></div>
                <div className="relative z-10 space-y-4 md:space-y-6">
                  <h3 className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 italic text-zinc-400"><Zap size={16} className="text-[#E31B23]" /> Pulse</h3>
                  <NeuralFeed logs={syncLogs} />
                </div>
              </Card>
              <Card className="p-6 md:p-8 bg-white border-zinc-100 rounded-[24px] md:rounded-[32px] space-y-4 md:space-y-6 shadow-lg">
                <h3 className="text-[9px] md:text-[10px] font-bold uppercase text-zinc-400 flex items-center gap-3 tracking-widest"><User size={18} className="text-[#E31B23]" /> Expert Assigned</h3>
                <div className="flex items-center gap-4 md:gap-5 relative z-10">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-zinc-950 rounded-lg md:rounded-xl flex items-center justify-center text-white text-lg md:text-xl font-bold italic shadow-md">MF</div>
                    <div>
                      <p className="text-sm md:text-base font-bold uppercase italic leading-none tracking-tight">{activeClaim.assignedAssessor.name}</p>
                      <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5">ID: {activeClaim.assignedAssessor.id}</p>
                    </div>
                </div>
                <div className="space-y-3 md:space-y-4 pt-4 md:pt-6 border-t border-zinc-50">
                  <a href={`tel:${activeClaim.assignedAssessor.phone}`} className="h-12 md:h-14 w-full bg-zinc-50 border border-zinc-100 rounded-lg md:rounded-xl flex items-center justify-center gap-3 text-[#E31B23] hover:bg-black hover:text-white transition-all shadow-sm">
                    <Phone size={18} /> <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest">Secure Link</span>
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
              <button onClick={() => { setSyncStep('choice'); setShowSyncModal(true); }} className="px-3 md:px-4 py-2 bg-zinc-950 text-white rounded-lg md:rounded-xl flex items-center gap-2 hover:bg-[#E31B23] transition-all text-[8px] md:text-[9px] font-bold uppercase tracking-widest"><Smartphone size={14} /> Connect Phone</button>
            )}
          </div>
          <div className="flex-1 flex gap-4 md:gap-6 min-h-0">
            <Card className={`w-full lg:w-[320px] rounded-[24px] md:rounded-[32px] border-zinc-100 shadow-xl flex flex-col bg-zinc-50/30 ${selectedMsgId ? 'hidden lg:flex' : 'flex'}`}>
               <div className="p-4 md:p-6 border-b border-zinc-100 bg-white rounded-t-[24px] md:rounded-t-[32px] flex items-center gap-3">
                  <Search size={18} className="text-zinc-300" />
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
                      <button onClick={() => setSelectedMsgId(null)} className="lg:hidden p-2 bg-zinc-100 rounded-lg"><ArrowLeft size={18}/></button>
                      <div className={`p-3 md:p-4 rounded-lg md:rounded-xl text-white shadow-lg ${inboxMessages.find(m => m.id === selectedMsgId)?.sender === 'Support Staff' ? 'bg-blue-600' : 'bg-[#E31B23]'}`}>
                         {inboxMessages.find(m => m.id === selectedMsgId)?.sender === 'Support Staff' ? <Headset size={20} /> : <Wrench size={20} />}
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
                        <Send size={20} className="group-hover/send:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-10 space-y-4 md:space-y-6">
                  <MessageSquare size={80} className="text-zinc-950" />
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
             <div>
               <h2 className="text-xl md:text-2xl font-bold text-black uppercase tracking-tight italic">Coverage Portfolio</h2>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1 italic">{session.user.full_name} — {session.user.email}</p>
             </div>
             <Button onClick={downloadCertificate} variant="outline" className="text-[9px] md:text-[10px] w-full sm:w-auto h-12 md:h-14 px-6 md:px-8 rounded-xl md:rounded-2xl gap-2 md:gap-3">
               <Download size={18} /> CERTIFICATE
             </Button>
           </div>
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <Card className="p-8 md:p-10 bg-black text-white rounded-[32px] md:rounded-[40px] border-none shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 md:p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none"><ShieldCheck size={280} /></div>
                 <div className="relative z-10 space-y-8 md:space-y-10">
                    <div className="flex justify-between items-start">
                       <div className="space-y-3 md:space-y-4">
                          <Badge status="gold" className="text-[8px] md:text-[9px] px-3 md:px-4 py-1 md:py-1.5 bg-[#E31B23] border-none rounded-md md:rounded-lg uppercase font-bold tracking-widest">ACTIVE NODE</Badge>
                          <h3 className="text-2xl md:text-3xl font-bold italic uppercase tracking-tighter">{policy.number}</h3>
                       </div>
                       <div className="p-3 md:p-4 bg-[#E31B23] rounded-lg md:rounded-2xl shadow-xl"><Award size={32} className="text-white" /></div>
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
                             <CheckCircle size={14} className="text-[#E31B23]" /> {b}
                           </div>
                         ))}
                       </div>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      )}

      {showPaymentBridge && (
        <PaymentBridge 
          amount="$1,150.00" 
          to={activeClaim.repairer.name} 
          claimId={activeClaim.id}
          customerName={session.user.full_name}
          onSuccess={() => { setIsTopUpPaid(true); setShowPaymentBridge(false); }} 
          onCancel={() => setShowPaymentBridge(false)} 
          title="Gap Contribution"
        />
      )}
    </div>
  );
};

export default CustomerDashboard;