
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole, AuthSession } from '../types';
import { Button, Card, Logo } from './Shared';
import { 
  User as UserIcon, Mail, Lock, 
  ChevronDown, Eye, EyeOff, 
  Loader2, Fingerprint, UserCircle, ClipboardList, Wrench, BarChart3, Users,
  Check, RefreshCw, ArrowLeft, ExternalLink, ShieldAlert, MailCheck, X as XIcon, Zap, Smartphone
} from 'lucide-react';

interface AuthProps {
  onLogin: (session: AuthSession, rememberMe: boolean) => void;
}

type AuthView = 'login' | 'signup' | 'forgotPassword' | 'phoneLogin';

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('login');
  const [role, setRole] = useState<UserRole>(UserRole.CUSTOMER);
  const [loading, setLoading] = useState(false);
  const [isRecoverySuccess, setIsRecoverySuccess] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [showVerificationSent, setShowVerificationSent] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [captchaChallenge, setCaptchaChallenge] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: 'Too Short' });
  const [requirements, setRequirements] = useState({
    length: false,
    excellent: false,
    upper: false,
    number: false,
    special: false
  });

  // Load remembered user on mount and initialize demo accounts
  useEffect(() => {
    // Initialize demo accounts if none exist
    const existingUsers = JSON.parse(localStorage.getItem('aims_registered_users') || '[]');
    if (existingUsers.length === 0) {
      const demoUsers = [
        { email: 'customer@aims.com', password: 'password123', role: UserRole.CUSTOMER, fullName: 'DEMO CUSTOMER', verified: true },
        { email: 'assessor@aims.com', password: 'password123', role: UserRole.ASSESSOR, fullName: 'DEMO ASSESSOR', verified: true },
        { email: 'support@aims.com', password: 'password123', role: UserRole.SUPPORT_STAFF, fullName: 'DEMO SUPPORT', verified: true },
        { email: 'repair@aims.com', password: 'password123', role: UserRole.REPAIR_PARTNER, fullName: 'DEMO REPAIR', verified: true },
        { email: 'manager@aims.com', password: 'password123', role: UserRole.MANAGER, fullName: 'DEMO MANAGER', verified: true },
      ];
      localStorage.setItem('aims_registered_users', JSON.stringify(demoUsers));
    }

    const saved = localStorage.getItem('aims_remembered_user');
    if (saved) {
      try {
        const { email: savedEmail, role: savedRole } = JSON.parse(saved);
        setEmail(savedEmail);
        setRole(savedRole);
        setRememberMe(true);
      } catch (e) {
        localStorage.removeItem('aims_remembered_user');
      }
    }
  }, []);

  const roleOptions = [
    { value: UserRole.CUSTOMER, label: 'Customer', icon: <UserCircle size={18} /> },
    { value: UserRole.SUPPORT_STAFF, label: 'Support Staff', icon: <Users size={18} /> },
    { value: UserRole.REPAIR_PARTNER, label: 'Repair Partner', icon: <Wrench size={18} /> },
    { value: UserRole.MANAGER, label: 'Manager', icon: <BarChart3 size={18} /> },
    { value: UserRole.ASSESSOR, label: 'Assessor', icon: <ClipboardList size={18} /> },
  ];

  const selectedRoleOption = roleOptions.find(opt => opt.value === role) || roleOptions[0];

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaChallenge(result);
    setCaptchaInput('');
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha, view]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkCapsLock = (e: React.KeyboardEvent) => {
    setIsCapsLockOn(e.getModifierState('CapsLock'));
  };

  const validatePassword = (val: string) => {
    setPassword(val);
    const reqs = {
      length: val.length >= 8,
      excellent: val.length >= 10,
      upper: /[A-Z]/.test(val),
      number: /[0-9]/.test(val),
      special: /[^A-Za-z0-9]/.test(val)
    };
    setRequirements(reqs);

    let score = 0;
    if (reqs.length) score = 1; // Weak
    if (reqs.length && (reqs.upper && reqs.number)) score = 2; // Good
    if (reqs.length && reqs.upper && reqs.number && reqs.special) score = 3; // Strong
    if (reqs.excellent && reqs.upper && reqs.number && reqs.special) score = 4; // Excellent
    
    const labels = ['', 'Weak', 'Good', 'Strong', 'Excellent'];
    setPasswordStrength({ score, label: val.length < 8 ? 'Too Short' : labels[score] });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view !== 'phoneLogin' && captchaInput.toUpperCase() !== captchaChallenge) {
      alert("Invalid CAPTCHA. Please try again.");
      generateCaptcha();
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);

    const users = JSON.parse(localStorage.getItem('aims_registered_users') || '[]');

    if (view === 'signup') {
      if (users.find((u: any) => u.email === email)) {
        alert("This email is already registered. Please login.");
        setView('login');
        return;
      }
      
      const newUser = { 
        email, 
        password, 
        role, 
        fullName, 
        verified: role !== UserRole.CUSTOMER // Auto-verify staff for demo, customers need email
      };
      users.push(newUser);
      localStorage.setItem('aims_registered_users', JSON.stringify(users));

      if (role === UserRole.CUSTOMER) {
        setShowVerificationSent(true);
      } else {
        completeLogin();
      }
      return;
    }

    if (view === 'login') {
      const existingUser = users.find((u: any) => u.email === email && u.role === role);
      
      if (!existingUser) {
        alert("Account not found for this role. Please register first.");
        setView('signup');
        return;
      }

      if (existingUser.password !== password) {
        alert("Incorrect password. Please try again.");
        return;
      }

      if (role === UserRole.CUSTOMER && !existingUser.verified) {
        setShowVerificationSent(true);
        return;
      }

      completeLogin();
      return;
    }

    if (view === 'phoneLogin') {
      const user = users.find((u: any) => u.email === email && u.role === role);
      if (!user) {
        alert("This email is not registered. Please create an account first.");
        setView('signup');
        return;
      }
      if (!otpSent) {
        setOtpSent(true);
        return;
      }
      completeLogin();
      return;
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);

    const domain = recoveryEmail.split('@')[1]?.toLowerCase();
    let url = 'https://www.google.com/search?q=webmail+login';
    if (domain) {
      if (domain.includes('gmail')) url = 'https://mail.google.com';
      else if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) url = 'https://outlook.live.com';
      else if (domain.includes('yahoo')) url = 'https://mail.yahoo.com';
      else url = `https://${domain}`;
    }

    setRedirectUrl(url);
    setIsRecoverySuccess(true);
  };

  useEffect(() => {
    let timer: number;
    if (isRecoverySuccess && countdown > 0) {
      timer = window.setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isRecoverySuccess && countdown === 0) {
      window.location.href = redirectUrl;
    }
    return () => clearInterval(timer);
  }, [isRecoverySuccess, countdown, redirectUrl]);

  const completeLogin = () => {
    // Save details if remember me is checked
    if (rememberMe) {
      localStorage.setItem('aims_remembered_user', JSON.stringify({ email: email, role }));
    } else {
      localStorage.removeItem('aims_remembered_user');
    }

    const users = JSON.parse(localStorage.getItem('aims_registered_users') || '[]');
    const user = {
      id: crypto.randomUUID(),
      email: email,
      phone: phoneNumber || '0786413281',
      full_name: fullName || email.split('@')[0].toUpperCase(),
      role: role,
      verified: role !== UserRole.CUSTOMER || (users.find((u: any) => u.email === email)?.verified || false),
      created_at: new Date().toISOString()
    };
    onLogin({ user }, rememberMe);
  };

  if (isRecoverySuccess) {
    const domainName = recoveryEmail.split('@')[1]?.split('.')[0]?.toUpperCase() || 'WEBMAIL';
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-white relative overflow-hidden">
        <Card className="w-full max-w-md p-10 text-center space-y-8 border-t-8 border-green-500 shadow-2xl relative z-10">
          <div className="mx-auto w-16 h-16 bg-green-50 rounded-full text-green-500 flex items-center justify-center">
            <MailCheck size={32} className="animate-bounce" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-[900] text-black uppercase tracking-tighter italic">Email Sent</h2>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">
              We have sent a reset link to <span className="text-black italic">{recoveryEmail}</span>.
            </p>
          </div>
          <div className="space-y-6">
            <Button onClick={() => window.location.href = redirectUrl} className="w-full h-16 bg-black text-white shadow-xl flex items-center justify-center gap-3 text-[11px]">
              <ExternalLink size={18} /> OPEN {domainName}
            </Button>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">Auto-redirecting in {countdown}s...</p>
          </div>
        </Card>
      </div>
    );
  }

  const verifyAndLogin = () => {
    const users = JSON.parse(localStorage.getItem('aims_registered_users') || '[]');
    const userIdx = users.findIndex((u: any) => u.email === email);
    if (userIdx !== -1) {
      users[userIdx].verified = true;
      localStorage.setItem('aims_registered_users', JSON.stringify(users));
    }
    setShowVerificationSent(false);
    completeLogin();
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setResendLoading(false);
    setResendSuccess(true);
    setTimeout(() => setResendSuccess(false), 3000);
  };

  if (showVerificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <Card className="w-full max-w-md p-10 text-center space-y-8 border-none shadow-[0_0_100px_rgba(227,27,35,0.1)] relative z-10">
          <div className="w-16 h-16 bg-black text-[#E31B23] border-b-4 border-[#E31B23] mx-auto flex items-center justify-center shadow-2xl">
            <MailCheck size={32} className="animate-bounce" />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-black uppercase tracking-tighter italic">Verify Your Email</h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">We've sent a verification link to {email}</p>
          </div>
          
          {resendSuccess && (
            <div className="p-4 bg-green-50 text-green-600 rounded-xl text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
              Verification email resent successfully!
            </div>
          )}

          <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100 text-[10px] font-bold text-zinc-500 italic">
            In a real system, you would click the link in your inbox. For this demo, click below to simulate verification.
          </div>
          
          <div className="space-y-4">
            <Button onClick={verifyAndLogin} className="w-full h-16 text-[11px]" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'SIMULATE EMAIL VERIFICATION'}
            </Button>
            
            <button 
              onClick={handleResendVerification} 
              disabled={resendLoading}
              className="w-full py-4 text-[9px] font-black text-zinc-400 uppercase hover:text-[#E31B23] tracking-widest flex items-center justify-center gap-2 transition-colors"
            >
              {resendLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Resend Verification Email
            </button>
          </div>

          <button onClick={() => setShowVerificationSent(false)} className="text-[9px] font-black text-zinc-400 uppercase hover:text-black tracking-widest">
            Back to Login
          </button>
        </Card>
      </div>
    );
  }

  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-black">
        <Card className="w-full max-w-md p-10 text-center space-y-8 border-none shadow-[0_0_100px_rgba(227,27,35,0.1)] relative z-10">
          <div className="w-16 h-16 bg-black text-[#E31B23] border-b-4 border-[#E31B23] mx-auto flex items-center justify-center shadow-2xl">
            <Mail size={32} />
          </div>
          <div className="space-y-3">
            <h2 className="text-xl font-black uppercase tracking-tighter italic">Verify Identity</h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Check your email for the code</p>
          </div>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5,6].map(i => (
              <input key={i} maxLength={1} className="w-8 h-12 bg-zinc-50 border-2 border-zinc-100 text-center text-xl font-black text-black outline-none focus:border-[#E31B23]" />
            ))}
          </div>
          <Button onClick={() => completeLogin()} className="w-full h-16 text-[11px]" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'SECURE ACCESS'}
          </Button>
        </Card>
      </div>
    );
  }

  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'bg-[#E31B23]'; // Weak
    if (score === 2) return 'bg-orange-500'; // Good
    if (score === 3) return 'bg-blue-500'; // Strong
    return 'bg-green-600'; // Excellent
  };

  const getStrengthTextColor = (score: number) => {
    if (score <= 1) return 'text-[#E31B23]';
    if (score === 2) return 'text-orange-600';
    if (score === 3) return 'text-blue-600';
    return 'text-green-700';
  };

  const RequirementItem = ({ met, label, highlight = false }: { met: boolean, label: string, highlight?: boolean }) => (
    <div className={`flex items-center gap-2 transition-all duration-300 ${met ? 'text-green-600' : highlight ? 'text-[#E31B23]' : 'text-zinc-400'}`}>
      <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors ${met ? 'bg-green-50 border-green-200' : highlight ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-zinc-50 border-zinc-200'}`}>
        {met ? <Check size={10} className="stroke-[3px]" /> : highlight ? <Zap size={10} className="stroke-[3px]" /> : <XIcon size={10} className="stroke-[3px]" />}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-wider italic ${met ? 'line-through opacity-50' : ''}`}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white relative overflow-hidden">
      <div className="w-full max-w-xl relative z-10 flex flex-col items-center">
        <div className="mb-8 transform hover:scale-105 transition-transform"><Logo /></div>
        <Card className="w-full p-8 sm:p-10 shadow-2xl border-t-8 border-black bg-white">
          {view === 'forgotPassword' ? (
            <form onSubmit={handleRecovery} className="space-y-8 animate-in fade-in duration-500">
               <div className="text-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black italic">Recovery</h2>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Secure Reset Flow</p>
              </div>
              <div className="space-y-5">
                <p className="text-[10px] font-bold text-zinc-500 text-center uppercase">Enter your email and we'll direct you to your inbox.</p>
                <div className="relative group">
                  <Mail className="absolute left-6 top-5 text-zinc-300 group-focus-within:text-[#E31B23]" size={20} />
                  <input required type="email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-[#E31B23] focus:bg-white py-5 pl-16 pr-10 text-[12px] font-bold outline-none" placeholder="EMAIL ADDRESS" />
                </div>
              </div>
              <div className="space-y-3">
                <Button type="submit" disabled={loading} className="w-full h-16 group text-[11px]">
                  {loading ? <Loader2 className="animate-spin" /> : 'PROCEED TO INBOX'}
                </Button>
                <button type="button" onClick={() => setView('login')} className="w-full py-4 text-[9px] font-black text-zinc-400 uppercase flex items-center justify-center gap-2 hover:text-black">
                   <ArrowLeft size={14} /> Back to Sign In
                </button>
              </div>
            </form>
          ) : view === 'phoneLogin' ? (
            <form onSubmit={handleAuth} className="space-y-8 animate-in fade-in duration-500">
               <div className="text-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black italic">Email Code</h2>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Secure Email Login</p>
              </div>
              <div className="space-y-5">
                {!otpSent ? (
                  <div className="relative group">
                    <Mail size={20} className="absolute left-6 top-5 text-zinc-300 group-focus-within:text-[#E31B23]" />
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-[#E31B23] focus:bg-white py-5 pl-16 pr-10 text-[12px] font-bold outline-none" placeholder="EMAIL ADDRESS" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-zinc-500 text-center uppercase">Enter the 6-digit code sent to {email}</p>
                    <div className="flex justify-center gap-2">
                      {[1,2,3,4,5,6].map(i => (
                        <input key={i} maxLength={1} value={otp[i-1] || ''} onChange={e => setOtp(prev => {
                          const next = prev.split('');
                          next[i-1] = e.target.value;
                          return next.join('');
                        })} className="w-8 h-12 bg-zinc-50 border-2 border-zinc-100 text-center text-xl font-black text-black outline-none focus:border-[#E31B23]" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Button type="submit" disabled={loading} className="w-full h-16 group text-[11px]">
                  {loading ? <Loader2 className="animate-spin" /> : (otpSent ? 'VERIFY & LOGIN' : 'SEND CODE')}
                </Button>
                <button type="button" onClick={() => { setView('login'); setOtpSent(false); }} className="w-full py-4 text-[9px] font-black text-zinc-400 uppercase flex items-center justify-center gap-2 hover:text-black">
                   <ArrowLeft size={14} /> Back to Login
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black italic">{view === 'login' ? 'Login' : 'Create Account'}</h2>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-2">Login Portal</p>
              </div>
              <div className="space-y-4">
                <div className="relative" ref={dropdownRef}>
                  <label className="text-[8px] font-black uppercase text-zinc-400 tracking-widest mb-1 block">Role Identity</label>
                  <button type="button" onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)} className={`w-full bg-zinc-50 border-2 py-4 pl-12 pr-10 text-[11px] font-black uppercase tracking-widest text-black outline-none transition-all flex items-center gap-3 ${isRoleDropdownOpen ? 'border-[#E31B23] bg-white' : 'border-zinc-100'}`}>
                    <div className="absolute left-4 text-[#E31B23]">{selectedRoleOption.icon}</div>
                    {selectedRoleOption.label}
                    <div className="absolute right-4 text-zinc-300"><ChevronDown size={18} /></div>
                  </button>
                  {isRoleDropdownOpen && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-black shadow-2xl z-[100] overflow-hidden">
                      {roleOptions.map((opt) => (
                        <button key={opt.value} type="button" onClick={() => { setRole(opt.value); setIsRoleDropdownOpen(false); }} className={`w-full flex items-center gap-4 px-6 py-4 text-[9px] font-black uppercase tracking-widest text-left hover:bg-zinc-50 ${role === opt.value ? 'bg-red-50 text-[#E31B23]' : 'text-zinc-600'}`}>
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {view === 'signup' && (
                  <>
                    <div className="relative group animate-in slide-in-from-top-2">
                      <UserIcon className="absolute left-6 top-5 text-zinc-300 group-focus-within:text-[#E31B23]" size={20} />
                      <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-[#E31B23] py-5 pl-16 text-[12px] font-bold outline-none" placeholder="FULL NAME" />
                    </div>
                    <div className="relative group animate-in slide-in-from-top-2">
                      <Smartphone className="absolute left-6 top-5 text-zinc-300 group-focus-within:text-[#E31B23]" size={20} />
                      <input required type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-[#E31B23] py-5 pl-16 text-[12px] font-bold outline-none" placeholder="PHONE NUMBER" />
                    </div>
                  </>
                )}

                <div className="relative group">
                  <Mail className="absolute left-6 top-5 text-zinc-300 group-focus-within:text-[#E31B23]" size={20} />
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-[#E31B23] py-5 pl-16 text-[12px] font-bold outline-none" placeholder="EMAIL ADDRESS" />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-6 top-5 text-zinc-300 group-focus-within:text-[#E31B23]" size={20} />
                  <input required type={showPassword ? 'text' : 'password'} value={password} onKeyDown={checkCapsLock} onChange={e => {
                    if (view === 'signup') validatePassword(e.target.value);
                    else setPassword(e.target.value);
                  }} className="w-full bg-zinc-50 border-2 border-zinc-100 focus:border-[#E31B23] py-5 pl-16 pr-12 text-[12px] font-bold outline-none" placeholder="PASSWORD" />
                  <div className="absolute right-4 top-5 flex items-center gap-2">
                    {isCapsLockOn && <ShieldAlert size={14} className="text-[#E31B23]" />}
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-zinc-300 hover:text-black">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {view === 'signup' && password.length > 0 && (
                  <div className="space-y-4 py-2 animate-in slide-in-from-top-1 duration-300">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest italic">SECURITY RATING</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest italic transition-all ${getStrengthTextColor(passwordStrength.score)}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="flex gap-1.5 h-1.5 px-0.5">
                        {[1, 2, 3, 4].map((step) => (
                          <div 
                            key={step} 
                            className={`flex-1 transition-all duration-500 rounded-full ${step <= passwordStrength.score ? getStrengthColor(passwordStrength.score) : 'bg-zinc-100'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-zinc-50/50 p-3 border border-zinc-100 rounded-xl">
                      <RequirementItem met={requirements.length} label="8+ Characters" />
                      <RequirementItem met={requirements.excellent} label="10+ Excellent Goal" highlight={!requirements.excellent} />
                      <RequirementItem met={requirements.upper} label="Uppercase Letter" />
                      <RequirementItem met={requirements.number} label="Number (0-9)" />
                      <RequirementItem met={requirements.special} label="Symbol (@#$)" />
                    </div>
                  </div>
                )}

                <div className="bg-zinc-50 p-4 border-2 border-zinc-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-black uppercase text-zinc-400">Security Code</span>
                    <button type="button" onClick={generateCaptcha} className="text-zinc-400 hover:text-[#E31B23]"><RefreshCw size={12}/></button>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-black text-white px-4 py-2 rounded flex items-center justify-center font-black tracking-widest italic line-through decoration-[#E31B23] text-sm">{captchaChallenge}</div>
                    <input required type="text" value={captchaInput} onChange={e => setCaptchaInput(e.target.value.toUpperCase())} placeholder="CODE" className="flex-1 bg-white border-2 border-zinc-200 px-4 text-center font-black text-sm outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {view === 'login' && (
                  <div className="flex items-center justify-between mb-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-black border-black' : 'border-zinc-200 bg-white'}`}>
                        {rememberMe && <Check size={12} className="text-white" />}
                      </div>
                      <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="hidden" />
                      <span className="text-[9px] font-black text-zinc-400 uppercase group-hover:text-black tracking-widest italic">Keep me logged in</span>
                    </label>
                    <button type="button" onClick={() => setView('forgotPassword')} className="text-[9px] font-black text-zinc-400 uppercase hover:text-[#E31B23] tracking-widest italic">Forgot Password?</button>
                  </div>
                )}
                <Button 
                  type="submit" 
                  disabled={loading || (view === 'signup' && passwordStrength.score < 2)} 
                  className="w-full h-16 text-[11px] shadow-xl"
                >
                  {loading ? <Loader2 className="animate-spin" /> : (view === 'login' ? 'SECURE LOGIN' : 'CREATE ACCOUNT')}
                </Button>
                {view === 'signup' && passwordStrength.score < 4 && password.length > 0 && (
                  <p className="text-[8px] font-black text-[#E31B23] uppercase text-center tracking-widest animate-pulse italic mt-2">
                    Aim for 'Excellent' (10+ characters) for maximum security
                  </p>
                )}
              </div>

              <div className="pt-6 text-center border-t border-zinc-100">
                <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-[9px] font-black text-zinc-400 uppercase tracking-widest hover:text-black italic underline decoration-[#E31B23]/30 decoration-2 underline-offset-4">
                  {view === 'login' ? "Create an Account" : "Back to Login"}
                </button>
                {view === 'login' && (
                  <button type="button" onClick={() => setView('phoneLogin')} className="mt-4 w-full h-14 border-2 border-zinc-100 rounded-xl flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:border-black hover:text-black transition-all">
                    <Mail size={16} /> Login with Email Code
                  </button>
                )}
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
