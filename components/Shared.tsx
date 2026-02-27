
import React, { useState, useEffect } from 'react';
import { X, Bell, Info, AlertCircle, CheckCircle, UserCheck, ShieldAlert, CreditCard, Lock, Loader2, ShieldCheck, Zap, QrCode, Smartphone, MessageCircle, Terminal, Activity } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with the publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Notification interface definition for system alerts and tracking
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'critical' | 'success';
  timestamp: Date;
  isRead: boolean;
}

export const Logo: React.FC<{ className?: string, iconOnly?: boolean }> = ({ className = "w-auto h-12", iconOnly = false }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="flex flex-col items-center">
      <h1 className="text-2xl sm:text-3xl font-[900] tracking-[0.15em] text-black leading-none uppercase italic" style={{ fontFamily: 'serif' }}>
        FIRST MUTUAL
      </h1>
      <div className="w-full h-[3px] bg-[#E31B23] my-1.5" />
      {!iconOnly && (
        <>
          <p className="text-[10px] font-black text-black tracking-[0.4em] uppercase leading-none">
            Holdings Limited
          </p>
          <p className="text-xs font-bold text-black tracking-tight mt-1">
            Go Beyond
          </p>
        </>
      )}
    </div>
  </div>
);

export const NeuralFeed: React.FC<{ logs: string[] }> = ({ logs }) => (
  <div className="bg-black rounded-3xl p-6 sm:p-8 font-mono text-[10px] sm:text-xs h-48 sm:h-56 overflow-y-auto custom-scrollbar border border-white/5 shadow-inner">
    <div className="flex items-center gap-2 mb-4 text-zinc-500">
      <Terminal size={14} />
      <span className="uppercase tracking-widest font-black">AIMS Live Handshake Feed</span>
    </div>
    <div className="space-y-2">
      {logs.map((log, i) => (
        <div key={i} className="flex gap-3">
          <span className="text-red-600 font-black shrink-0">[{new Date().toLocaleTimeString()}]</span>
          <span className="text-green-500/80 break-all">{log}</span>
        </div>
      ))}
      <div className="animate-pulse text-[#E31B23]">_</div>
    </div>
  </div>
);

export const QRCodeUI: React.FC<{ value: string, label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center p-6 bg-white border-4 border-black shadow-2xl space-y-5 max-w-full">
    <div className="p-4 bg-zinc-50 border-2 border-zinc-100 flex items-center justify-center min-w-[180px] min-h-[180px]">
      <img 
        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(value)}&color=000000&bgcolor=FFFFFF&margin=1`}
        alt="Verification QR Code"
        className="w-40 h-40 shadow-sm"
      />
    </div>
    <div className="space-y-1.5 text-center">
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 leading-relaxed">
        Scan to Sync
      </p>
      <p className="text-xs font-black uppercase text-black italic tracking-tighter">
        {label}
      </p>
    </div>
  </div>
);

export const PaymentBridge: React.FC<{ 
  amount: string, 
  to: string, 
  claimId: string,
  customerName: string,
  onSuccess: () => void, 
  onCancel: () => void,
  title?: string 
}> = ({ amount, to, claimId, customerName, onSuccess, onCancel, title = "Secure Payment" }) => {
  const [step, setStep] = useState<'init' | 'processing' | 'error' | 'success'>('init');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for success/cancel in URL
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const returnedClaimId = params.get('claimId');

    if (paymentStatus === 'success' && returnedClaimId === claimId) {
      setStep('success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => onSuccess(), 2000);
    } else if (paymentStatus === 'cancel' && returnedClaimId === claimId) {
      setError("Payment was cancelled by user.");
      setStep('error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [claimId, onSuccess]);

  const handleStripePayment = async () => {
    setStep('processing');
    try {
      const numericAmount = parseFloat(amount.replace(/[^0-9.]/g, ''));
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numericAmount, claimId, customerName })
      });
      const session = await res.json();
      
      if (session.url) {
        // Redirect to Stripe Checkout
        window.location.href = session.url;
      } else {
        throw new Error(session.error || "Failed to create Stripe session");
      }
    } catch (e: any) {
      setError(e.message);
      setStep('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-0 overflow-hidden border-none shadow-[0_0_100px_rgba(99,102,241,0.2)] bg-white rounded-[32px]">
        <div className="bg-[#635bff] p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Lock size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Stripe Secure Gateway</span>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full"><X size={24}/></button>
        </div>

        <div className="p-8 sm:p-12 space-y-10">
          {step === 'init' && (
            <div className="space-y-10 animate-in slide-in-from-bottom-4">
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Liability Transfer to {to}</p>
              </div>

              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Settlement Amount</p>
                <p className="text-5xl sm:text-6xl font-black text-[#635bff] tracking-tighter italic">{amount}</p>
              </div>

              <div className="space-y-6">
                <Button 
                  onClick={handleStripePayment}
                  className="w-full h-16 bg-[#635bff] hover:bg-[#5851e0] text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 group"
                >
                  <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
                  <span>Pay with Stripe</span>
                </Button>
                <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest">
                  Powered by Stripe • PCI DSS Compliant
                </p>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-20 flex flex-col items-center text-center space-y-10 animate-in zoom-in-95">
              <div className="relative">
                <div className="absolute inset-0 bg-[#635bff] blur-2xl opacity-20 animate-pulse" />
                <Loader2 size={72} className="text-[#635bff] animate-spin relative z-10" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Handshake Processing</h3>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-3">Redirecting to Stripe Gateway...</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-20 flex flex-col items-center text-center space-y-10 animate-in zoom-in-95">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center shadow-inner border-2 border-green-100">
                <CheckCircle size={56} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Payment Verified</h3>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-3">Updating Claim Records...</p>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="py-20 flex flex-col items-center text-center space-y-10 animate-in zoom-in-95">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner border-2 border-red-100">
                <ShieldAlert size={56} />
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Payment Error</h3>
                <p className="text-xs font-black text-red-600 uppercase tracking-widest italic">{error || 'Unknown error occurred'}</p>
              </div>
              <Button onClick={() => setStep('init')} variant="outline" className="w-full">Try Again</Button>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-6 flex items-center justify-center gap-3">
          <Zap size={16} className="text-[#635bff]" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Handshake v3.0 • Stripe Verified</span>
        </div>
      </Card>
    </div>
  );
};


interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-black uppercase tracking-widest rounded-none transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap text-xs';
  
  const variants = {
    primary: 'bg-[#E31B23] text-white hover:bg-red-700 shadow-lg border-none',
    secondary: 'bg-black text-white hover:bg-zinc-800 shadow-lg border-none',
    outline: 'border-2 border-black text-black hover:bg-zinc-50',
    danger: 'bg-black text-[#E31B23] hover:bg-zinc-900 border-2 border-[#E31B23]',
    ghost: 'bg-transparent text-slate-500 hover:text-black hover:bg-slate-100'
  };
  
  const sizes = {
    sm: 'px-4 py-2.5',
    md: 'px-8 py-4',
    lg: 'px-14 py-6 text-sm'
  };
  
  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden ${className}`}>
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode, status?: string, className?: string }> = ({ children, status, className = '' }) => {
  const getStatusColor = (s?: string) => {
    const v = s?.toLowerCase() || '';
    if (v.includes('completed') || v.includes('finished') || v.includes('success') || v.includes('ready') || v.includes('gold')) {
      return 'bg-green-50 text-green-700 border-green-200';
    }
    if (v.includes('progress') || v.includes('checking') || v.includes('reviewing') || v.includes('silver')) {
      return 'bg-zinc-100 text-black border-zinc-300';
    }
    if (v.includes('critical') || v.includes('urgent') || v.includes('high') || v.includes('risk') || v.includes('alert') || v.includes('bronze') || v.includes('violation')) {
      return 'bg-red-50 text-[#E31B23] border-red-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  return (
    <span className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider border flex items-center gap-2 w-fit ${getStatusColor(status)} ${className}`}>
      {children}
    </span>
  );
};

export const ProgressSteps: React.FC<{ steps: string[], currentStep: number }> = ({ steps, currentStep }) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar pb-12 pt-4 px-2">
      <div className="flex items-center min-w-[600px] sm:min-w-[800px] justify-between">
        {steps.map((step, idx) => (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center relative group">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-xs sm:text-sm font-black border-2 transition-all duration-300 ${
                idx <= currentStep ? 'bg-[#E31B23] border-[#E31B23] text-white shadow-lg' : 'bg-white border-zinc-200 text-zinc-300'
              }`}>
                {idx < currentStep ? <CheckCircle size={20} /> : idx + 1}
              </div>
              <span className={`absolute top-14 sm:top-16 whitespace-nowrap text-[10px] sm:text-xs font-black uppercase tracking-widest ${
                idx <= currentStep ? 'text-black' : 'text-zinc-300'
              }`}>
                {step}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-[3px] mx-2 transition-all duration-700 ${
                idx < currentStep ? 'bg-[#E31B23]' : 'bg-zinc-100'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  return (
    <div className={`p-6 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${notification.isRead ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-xs font-black uppercase tracking-tight">{notification.title}</h4>
        <span className="text-[10px] font-bold text-slate-400">{notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <p className="text-xs font-medium text-slate-500 italic leading-relaxed">{notification.message}</p>
    </div>
  );
};

export const Toast: React.FC<{ notification: Notification; onClose: () => void }> = ({ notification, onClose }) => {
  return (
    <div className="fixed bottom-10 left-10 z-[1000] animate-in slide-in-from-left-10 duration-500">
      <div className="bg-black text-white p-8 rounded-2xl shadow-2xl flex items-center gap-8 min-w-[360px] border-l-4 border-[#E31B23]">
        <div className="shrink-0">
          <Bell size={28} className="text-[#E31B23]" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-[#E31B23] mb-2">{notification.title}</p>
          <p className="text-sm font-bold italic leading-snug">{notification.message}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>
    </div>
  );
};
