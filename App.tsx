
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, AuthSession } from './types';
import { supabase } from './lib/supabase';
import { signOutUser } from './lib/auth';
import CustomerDashboard from './components/CustomerDashboard';
import AssessorDashboard from './components/AssessorDashboard';
import RepairPartnerDashboard from './components/RepairPartnerDashboard';
import SupportDashboard from './components/SupportDashboard';
import ManagementDashboard from './components/ManagementDashboard';
import Auth from './components/Auth';
import LiveChat from './components/LiveChat';
import { Toast, NotificationItem, Logo, Card, Button, Badge } from './components/Shared';
import type { Notification } from './components/Shared';
import { ROLE_CONFIG } from './constants';
import { 
  LogOut, Bell, User as UserIcon, Menu,
  PlusCircle, Inbox, FileText, History, 
  Wrench, List, Activity, BarChart3, ShieldCheck, UserCog, ClipboardList, TrendingUp, Search, Shield, CreditCard, DollarSign,
  Truck, X, LayoutDashboard, SmartphoneNfc, Camera, MessageCircle, Send, Zap, Loader2
} from 'lucide-react';

const AssessorMobileView: React.FC<{ 
  claimId: string, 
  onLogout: () => void 
}> = ({ claimId, onLogout }) => {
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSyncing(false);
      // Notify any listeners on the same domain (for demo purposes)
      localStorage.setItem('aims_sync_complete', 'true');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center space-y-10">
         <div className="relative">
           <div className="absolute inset-0 bg-[#E31B23] blur-3xl opacity-20 animate-pulse" />
           <SmartphoneNfc size={80} className="text-[#E31B23] relative z-10 animate-bounce" />
         </div>
         <div className="space-y-4">
           <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Establishing Secure Link</h2>
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] italic">Syncing AIMS Ledger Dossier...</p>
         </div>
         <Loader2 size={32} className="animate-spin text-zinc-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col animate-in fade-in duration-700">
       <header className="p-6 bg-black text-white flex items-center justify-between border-b-4 border-[#E31B23] sticky top-0 z-50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-[#E31B23] border border-white/5">
                <Zap size={20} />
             </div>
             <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">FIELD ASSISTANT</p>
                <h1 className="text-sm font-black uppercase italic tracking-tight">{claimId}</h1>
             </div>
          </div>
          <button onClick={onLogout} className="p-2 text-zinc-500 hover:text-white"><LogOut size={20}/></button>
       </header>

       <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <Card className="p-6 bg-white border-none shadow-xl rounded-3xl space-y-4">
             <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-50 text-green-600 rounded-xl"><ShieldCheck size={20}/></div>
                <h3 className="text-xs font-black uppercase tracking-widest italic">Live Handshake Status</h3>
             </div>
             <p className="text-[11px] font-medium text-zinc-500 italic leading-relaxed">
                Mobile node synchronized with desktop session. Captured evidence and chat logs will propagate to the hub in real-time.
             </p>
          </Card>

          <div className="grid grid-cols-2 gap-4">
             <button className="aspect-square bg-black text-white rounded-[40px] flex flex-col items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all group">
                <Camera size={32} className="group-hover:rotate-12 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">CAPTURE</span>
             </button>
             <button className="aspect-square bg-white border-2 border-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-4 shadow-xl active:scale-95 transition-all group">
                <MessageCircle size={32} className="text-[#E31B23]" />
                <span className="text-[10px] font-black uppercase tracking-widest">CHATS</span>
             </button>
          </div>

          <Card className="p-6 bg-zinc-950 text-white rounded-[32px] space-y-6 border-none shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={80}/></div>
             <div className="relative z-10 space-y-4">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Incoming Comms</p>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 italic text-[11px] font-medium leading-relaxed">
                   "Please confirm when you've reached the vehicle location."
                </div>
                <div className="flex gap-2">
                   <input className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-[11px] font-bold italic outline-none focus:border-[#E31B23]" placeholder="Response..." />
                   <button className="p-3 bg-[#E31B23] text-white rounded-xl shadow-lg"><Send size={18}/></button>
                </div>
             </div>
          </Card>
       </main>

       <footer className="p-6 bg-white border-t border-slate-100">
          <p className="text-[9px] font-black text-center text-zinc-400 uppercase tracking-[0.2em] italic leading-none">
             RSA Session Secured — Nicoz Diamond Network
          </p>
       </footer>
    </div>
  );
};

const App: React.FC = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<string>('track');
  const [fieldSyncMode, setFieldSyncMode] = useState<{ active: boolean, claimId: string }>({ active: false, claimId: '' });

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for "Direct Link" / Field Sync Handover
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'field_sync') {
        const email = params.get('email') || 'assessor@firstmutual.co.zw';
        const claimId = params.get('claimId') || 'FIELD-NODE';

        // Auto-provision session for field sync
        setSession({
          user: {
            id: `field-node-${Date.now()}`,
            email: email,
            phone: '0786413281',
            full_name: 'FIELD OPERATOR',
            role: UserRole.ASSESSOR,
            created_at: new Date().toISOString()
          }
        });
        setFieldSyncMode({ active: true, claimId });
        // Clear URL params without reloading
        window.history.replaceState({}, '', window.location.pathname);
      } else {
        // Check Supabase auth state
        const { data: { session: authSession } } = await supabase.auth.getSession();

        if (authSession?.user) {
          // Fetch user data from database
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', authSession.user.id)
            .maybeSingle();

          if (userData) {
            setSession({
              user: {
                id: userData.id,
                email: userData.email,
                phone: userData.phone,
                full_name: userData.full_name,
                role: userData.role as UserRole,
                created_at: userData.created_at,
              }
            });
          }
        } else {
          // Try localStorage as fallback
          const saved = localStorage.getItem('autoclaim_session');
          if (saved) {
            try {
              setSession(JSON.parse(saved));
            } catch (e) {
              localStorage.removeItem('autoclaim_session');
            }
          }
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if (!authSession) {
        setSession(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const addNotification = (n: Notification) => {
    setNotifications(prev => [n, ...prev]);
    setActiveToast(n);
    setTimeout(() => setActiveToast(curr => curr?.id === n.id ? null : curr), 6000);
  };

  useEffect(() => {
    if (!session) return;

    if (session.user.role === UserRole.CUSTOMER) setActiveTab('track');
    else if (session.user.role === UserRole.SUPPORT_STAFF) setActiveTab('main');
    else if (session.user.role === UserRole.MANAGER) setActiveTab('overview');
    else setActiveTab('main');

    const generateNotification = () => {
      if (session.user.role === UserRole.SUPPORT_STAFF || fieldSyncMode.active) return;

      const id = Math.random().toString(36).substr(2, 9);
      let title = "Update";
      let message = "Something changed on your account.";
      let type: 'info' | 'critical' | 'success' = 'info';

      switch (session.user.role) {
        case UserRole.CUSTOMER:
          title = "Repair Price Ready";
          message = "We finished the repair price for your car. Please check it.";
          type = 'success';
          break;
        case UserRole.ASSESSOR:
          title = "New Inspection";
          message = "You have a new car to check. It's critical.";
          type = 'critical';
          break;
        case UserRole.REPAIR_PARTNER:
          title = "New Job";
          message = "A new repair job is ready near you.";
          type = 'success';
          break;
        case UserRole.MANAGER:
          title = "Delay Found";
          message = "A repair is taking too long. See the details.";
          type = 'critical';
          break;
      }

      const newNotif: Notification = {
        id,
        title,
        message,
        type,
        timestamp: new Date(),
        isRead: false
      };

      addNotification(newNotif);
    };

    const initialTimer = setTimeout(generateNotification, 8000);
    const interval = setInterval(generateNotification, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [session?.user.role, fieldSyncMode.active]);

  const handleLogin = (newSession: AuthSession, rememberMe: boolean) => {
    setSession(newSession);
    if (rememberMe) {
      localStorage.setItem('aims_remembered_user', JSON.stringify({
        email: newSession.user.email,
        role: newSession.user.role
      }));
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    setSession(null);
    setFieldSyncMode({ active: false, claimId: '' });
    localStorage.removeItem('autoclaim_session');
    setSidebarOpen(false);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const renderDashboard = () => {
    if (!session) return null;
    
    // If we are in special "Field Sync" mobile mode
    if (fieldSyncMode.active) {
      return <AssessorMobileView claimId={fieldSyncMode.claimId} onLogout={handleLogout} />;
    }

    switch (session.user.role) {
      case UserRole.CUSTOMER: 
        return <CustomerDashboard activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />;
      case UserRole.ASSESSOR: 
        return <AssessorDashboard onLogout={handleLogout} sessionEmail={session.user.email} addNotification={addNotification} />;
      case UserRole.REPAIR_PARTNER: 
        return <RepairPartnerDashboard onLogout={handleLogout} />;
      case UserRole.SUPPORT_STAFF: 
        return <SupportDashboard session={session} activeTab={activeTab as any} onTabChange={setActiveTab as any} addNotification={addNotification} onLogout={handleLogout} />;
      case UserRole.MANAGER: 
        return <ManagementDashboard onLogout={handleLogout} />;
      default: 
        return <CustomerDashboard activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />;
    }
  };

  if (!session) return <Auth onLogin={handleLogin} />;

  // Special full-screen layout for mobile field sync
  if (fieldSyncMode.active) {
    return (
      <div className="h-screen bg-zinc-50 overflow-hidden">
        {renderDashboard()}
      </div>
    );
  }

  const role = session.user.role;
  const config = ROLE_CONFIG[role];

  const navLinks = (() => {
    switch (role) {
      case UserRole.CUSTOMER:
        return [
          { id: 'track', label: 'Tracking', icon: <Activity size={20} /> },
          { id: 'inbox', label: 'Inbox', icon: <Inbox size={20} /> },
          { id: 'submit', label: 'New Claim', icon: <PlusCircle size={20} /> },
          { id: 'history', label: 'History', icon: <History size={20} /> },
          { id: 'policies', label: 'Policies', icon: <Shield size={20} /> },
        ];
      case UserRole.ASSESSOR:
        return [
          { id: 'visits', label: 'Field Ops', icon: <ClipboardList size={20} /> },
        ];
      case UserRole.REPAIR_PARTNER:
        return [
          { id: 'shop', label: 'My Bay', icon: <Wrench size={20} /> },
          { id: 'jobs', label: 'Marketplace', icon: <List size={20} /> },
          { id: 'history', label: 'Past Jobs', icon: <History size={20} /> },
        ];
      case UserRole.SUPPORT_STAFF:
        return [
          { id: 'main', label: 'Console Home', icon: <LayoutDashboard size={20} /> },
          { id: 'claims', label: 'Claims Engine', icon: <Truck size={20} /> },
          { id: 'inbox', label: 'Inbox', icon: <Inbox size={20} /> },
          { id: 'billing', label: 'Billing Center', icon: <DollarSign size={20} /> },
          { id: 'policies', label: 'Policy Hub', icon: <Shield size={20} /> },
        ];
      case UserRole.MANAGER:
        return [
          { id: 'overview', label: 'Executive Deck', icon: <BarChart3 size={20} /> },
        ];
      default:
        return [];
    }
  })();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[60] lg:hidden backdrop-blur-md transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-72 transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${config.sidebarBg} border-r ${config.borderColor} flex flex-col shadow-2xl lg:shadow-none`}>
        <div className="p-6 md:p-8 border-b border-inherit">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#E31B23] rounded-xl flex items-center justify-center text-white font-black italic text-lg shadow-lg">CP</div>
             <div>
               <h1 className="text-lg font-black text-black leading-none tracking-tighter uppercase italic">ClaimsPro</h1>
               <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Digital Engine</p>
             </div>
           </div>
        </div>

        <div className="p-6 md:p-8 pb-4">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Operations Hub</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 md:px-6 space-y-1.5 no-scrollbar">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveTab(link.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group ${activeTab === link.id ? `bg-[#E31B23] text-white shadow-lg` : `${config.sidebarText} opacity-60 hover:opacity-100 hover:bg-slate-100`}`}
            >
              <span className={activeTab === link.id ? 'text-white' : config.accentColor}>{link.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-widest">{link.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 md:p-8 border-t border-inherit space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-9 h-9 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-black text-xs">FM</div>
             <div>
                <p className="text-[10px] font-black text-black uppercase leading-none italic">FirstMutual</p>
                <p className="text-[7px] font-bold text-slate-400 uppercase">Group Holdings</p>
             </div>
          </div>
          <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest text-center italic">v3.1.2 — Production Build</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-12 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
              <Menu size={22} />
            </button>
            <div className="hidden md:flex items-center gap-4 bg-slate-100 px-6 py-2.5 rounded-2xl border border-slate-200">
              <Activity size={16} className="text-[#E31B23]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">AIMS Session: <span className="text-black italic font-sans">{session.user.id.slice(0, 8)}</span></span>
            </div>
            {/* Mobile-only logo indicator */}
            <div className="md:hidden flex items-center gap-2">
               <div className="w-8 h-8 bg-[#E31B23] rounded-lg flex items-center justify-center text-white font-black italic text-xs shadow-md">CP</div>
               <span className="text-[10px] font-black uppercase tracking-tighter">ClaimsPro</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative">
              <button 
                onClick={() => setNotificationPanelOpen(!isNotificationPanelOpen)}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border flex items-center justify-center relative transition-all ${notifications.filter(n => !n.isRead).length > 0 ? 'bg-red-50 border-red-100 text-[#E31B23]' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
              >
                <Bell size={18} md:size={20} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-[#E31B23] text-white text-[8px] md:text-[10px] font-black rounded-full border-2 border-white flex items-center justify-center">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {isNotificationPanelOpen && (
                <div className="absolute top-14 md:top-16 right-0 w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-[10px] font-black uppercase tracking-widest">Alerts</h3>
                    <button onClick={markAllAsRead} className="text-[9px] font-black text-[#E31B23] uppercase">Clear All</button>
                  </div>
                  <div className="overflow-y-auto max-h-[300px] md:max-h-[400px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center"><p className="text-[10px] font-bold text-slate-400 uppercase italic">No Pending Alerts</p></div>
                    ) : (
                      notifications.map(n => <NotificationItem key={n.id} notification={n} />)
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l border-slate-100 group cursor-pointer" onClick={handleLogout}>
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-black text-black uppercase group-hover:text-[#E31B23] transition-colors truncate max-w-[120px]">{session.user.full_name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">{session.user.role.replace('_', ' ')}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-black text-white flex items-center justify-center font-black italic shadow-lg hover:bg-[#E31B23] transition-colors">
                <LogOut size={18} md:size={20} />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 custom-scrollbar">
          {renderDashboard()}
        </main>
      </div>

      {session.user.role !== UserRole.SUPPORT_STAFF && (
        <LiveChat session={session} />
      )}
      
      {activeToast && <Toast notification={activeToast} onClose={() => setActiveToast(null)} />}
    </div>
  );
};

export default App;
