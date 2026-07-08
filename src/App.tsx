import React, { useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { 
  LayoutDashboard, 
  Package, 
  Map, 
  Building2, 
  ArrowLeftRight, 
  ClipboardCheck, 
  FileText, 
  Users, 
  LogOut,
  Plus,
  Search,
  Barcode,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  ChevronRight,
  User as UserIcon,
  Settings,
  Sparkles,
  Bell,
  Info,
  Edit,
  Trash2,
  Save,
  Printer,
  Image,
  Handshake,
  Briefcase,
  ListTodo,
  Coins,
  ShoppingCart,
  Truck,
  Calendar,
  UserCheck,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from './lib/firebase';
import { User, InventoryItem, Room, ProcurementRequest, ItemCategory, SchoolSettings } from './types';
import BarcodeComponent from 'react-barcode';
import { BarcodeScanner } from './components/BarcodeScanner';
import { InventoryForm } from './components/InventoryForm';
import { RoomForm } from './components/RoomForm';
import { MutationForm } from './components/MutationForm';
import { OpnameForm } from './components/OpnameForm';
import { ProcurementForm } from './components/ProcurementForm';
import { ReportView } from './components/ReportView';
import { Dashboard } from './components/Dashboard';
import { AIAnalyst } from './components/AIAnalyst';
import { SettingsView } from './components/SettingsView';
import { BuildingDamageAnalyst } from './components/BuildingDamageAnalyst';
import { HandoverView } from './components/HandoverView';
import { SarprasProgramView } from './components/SarprasProgramView';
import { MonthlyCompletenessView } from './components/MonthlyCompletenessView';
import { ItemDetailModal } from './components/ItemDetailModal';


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSchoolSettings(data));
  }, []);

  useEffect(() => {
    fetch('/api/permissions')
      .then(res => res.json())
      .then(data => setPermissions(data))
      .catch(err => console.error("Error fetching permissions:", err));
  }, [user]);

  useEffect(() => {
    if (user) {
      fetch('/api/reports/summary')
        .then(res => res.json())
        .then(summary => {
          const newNotifs = [];
          if (summary.procurement_pending > 0) {
            newNotifs.push({
              id: 1,
              title: 'Pengadaan Pending',
              message: `Ada ${summary.procurement_pending} pengajuan barang menunggu persetujuan.`,
              type: 'warning',
              tab: 'procurement'
            });
          }
          if (summary.total_damaged > 0) {
            newNotifs.push({
              id: 2,
              title: 'Barang Rusak',
              message: `${summary.total_damaged} barang terdeteksi rusak dan butuh perhatian.`,
              type: 'danger',
              tab: 'inventory-umum'
            });
          }
          setNotifications(newNotifs);
        });
    }
  }, [user, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setError('');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      
      const res = await fetch('/api/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setError('');
      } else {
        setError(data.message || 'Gagal masuk dengan Google');
      }
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      setError(err.message || 'Gagal autentikasi Google');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Firebase sign out failed:", e);
    }
    setUser(null);
    setActiveTab('dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
              <Building2 className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">NUCEN ESARPRAS</h1>
            <p className="text-slate-500">Sistem Informasi Sarpras Sekolah</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input 
                type="text" 
                className="input" 
                placeholder="admin"
                value={loginData.username}
                onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input 
                type="password" 
                className="input" 
                placeholder="••••••••"
                value={loginData.password}
                onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" className="btn btn-primary w-full py-3">
              Masuk ke Sistem
            </button>
          </form>

          <div className="relative my-4 flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase">atau</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            className="w-full py-3 px-4 border border-slate-200 rounded-xl text-slate-700 bg-white hover:bg-slate-50 font-medium flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.68 14.93 1 12 1 7.24 1 3.2 3.73 1.24 7.7l3.77 2.92C5.9 7.37 8.7 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.45 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.42c-.28 1.44-1.09 2.66-2.31 3.48l3.6 2.79c2.1-1.94 3.74-4.79 3.74-8.4z"
              />
              <path
                fill="#FBBC05"
                d="M5.01 14.78c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.24 7.3C.45 8.9.01 10.7.01 12.6s.44 3.7 1.23 5.3l3.77-2.92z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.6-2.79c-1.1.74-2.51 1.18-4.36 1.18-3.3 0-6.1-2.33-7.1-5.58L1.13 15.82C3.09 19.8 7.13 23 12 23z"
              />
            </svg>
            Masuk dengan Google
          </button>
          
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">© 2026 NUCEN ESARPRAS v1.0.0</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'operator', 'user', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'inventory-umum', label: 'Inventaris Umum', icon: Package, roles: ['admin', 'operator', 'user', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'inventory-tanah', label: 'Inventaris Tanah', icon: Map, roles: ['admin', 'operator', 'user', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'inventory-bangunan', label: 'Inventaris Gedung', icon: Building2, roles: ['admin', 'operator', 'user', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'building-damage-analyst', label: 'Analisis Kerusakan', icon: Wrench, roles: ['admin', 'operator', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'handovers', label: 'Serah Terima (BAST)', icon: Handshake, roles: ['admin', 'operator', 'user', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'sarpras-programs', label: 'Rencana Kerja & RAB', icon: Briefcase, roles: ['admin', 'operator', 'user', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'monthly-completeness', label: 'Kelengkapan PIC', icon: ListTodo, roles: ['admin', 'operator', 'user', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'mutasi', label: 'Mutasi Barang', icon: ArrowLeftRight, roles: ['admin', 'operator', 'waka_sarpras'] },
    { id: 'opname', label: 'Stock Opname', icon: ClipboardCheck, roles: ['admin', 'operator', 'waka_sarpras'] },
    { id: 'procurement', label: 'Pengajuan Barang', icon: Plus, roles: ['admin', 'operator', 'user', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'reports', label: 'Laporan', icon: FileText, roles: ['admin', 'operator', 'waka_kurikulum', 'waka_kesiswaan', 'waka_sarpras', 'kepala_sekolah'] },
    { id: 'rooms', label: 'Data Ruangan', icon: Users, roles: ['admin', 'operator', 'waka_sarpras'] },
    { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
    { id: 'ai-analyst', label: 'Analis AI', icon: Sparkles, roles: ['admin', 'waka_sarpras', 'kepala_sekolah'] },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (permissions && permissions[user.role]) {
      return permissions[user.role].includes(item.id);
    }
    return item.roles.includes(user.role);
  });

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-45"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isSidebarOpen ? 280 : (isMobile ? 0 : 80),
          x: (isMobile && !isSidebarOpen) ? -280 : 0
        }}
        transition={{ type: "spring", damping: 25, stiffness: 220 }}
        className={`bg-slate-900 text-slate-400 flex flex-col h-screen z-50 overflow-hidden ${
          isMobile ? 'fixed inset-y-0 left-0 shadow-2xl' : 'sticky top-0 shrink-0'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          {(isSidebarOpen || isMobile) && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Building2 className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-white tracking-tight text-sm">NUCEN ESARPRAS</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-slate-400'} />
              {(isSidebarOpen || isMobile) && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className={`flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 ${(!isSidebarOpen && !isMobile) && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
              <UserIcon size={20} />
            </div>
            {(isSidebarOpen || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{user.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={() => {
              handleLogout();
              if (isMobile) setIsSidebarOpen(false);
            }}
            className={`w-full mt-4 flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-all ${(!isSidebarOpen && !isMobile) && 'justify-center'}`}
          >
            <LogOut size={20} />
            {(isSidebarOpen || isMobile) && <span className="font-medium">Keluar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Buka Menu"
              >
                <Menu size={22} />
              </button>
            )}
            <h2 className="text-base md:text-lg font-semibold text-slate-800 truncate">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors relative"
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                      <h4 className="font-bold text-slate-900">Notifikasi</h4>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {notifications.length} Baru
                      </span>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <button 
                            key={n.id}
                            onClick={() => { setActiveTab(n.tab); setShowNotifications(false); }}
                            className="w-full p-4 text-left hover:bg-slate-50 border-b border-slate-50 transition-colors flex gap-3"
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              n.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                            }`}>
                              <Info size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{n.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-sm text-slate-400 italic">Tidak ada notifikasi baru</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari data..." 
                className="pl-10 pr-4 py-1.5 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard user={user} onNavigate={setActiveTab} schoolSettings={schoolSettings} />}
              {activeTab.startsWith('inventory-') && (
                <InventoryView 
                  category={activeTab.split('-')[1] as ItemCategory} 
                  user={user} 
                  searchQuery={searchQuery}
                  schoolSettings={schoolSettings}
                />
              )}
              {activeTab === 'mutasi' && <MutationView user={user} searchQuery={searchQuery} />}
              {activeTab === 'opname' && <OpnameView user={user} searchQuery={searchQuery} />}
              {activeTab === 'procurement' && <ProcurementView user={user} searchQuery={searchQuery} />}
              {activeTab === 'reports' && <ReportView user={user} />}
              {activeTab === 'rooms' && <RoomView user={user} searchQuery={searchQuery} />}
              {activeTab === 'settings' && <SettingsView />}
              {activeTab === 'ai-analyst' && <AIAnalyst />}
              {activeTab === 'building-damage-analyst' && <BuildingDamageAnalyst user={user} />}
              {activeTab === 'handovers' && <HandoverView currentUser={user} />}
              {activeTab === 'sarpras-programs' && <SarprasProgramView currentUser={user} />}
              {activeTab === 'monthly-completeness' && <MonthlyCompletenessView currentUser={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Sub-components (Simplified versions for now, will be detailed later)
function InventoryView({ category, user, searchQuery, schoolSettings }: { category: ItemCategory, user: User, searchQuery: string, schoolSettings: SchoolSettings | null }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  
  const [barcodeSearchInput, setBarcodeSearchInput] = useState('');
  const [barcodeSearchError, setBarcodeSearchError] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  
  const [printItem, setPrintItem] = useState<InventoryItem | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  // Bulk print state
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [bulkPrintItems, setBulkPrintItems] = useState<InventoryItem[]>([]);
  const bulkPrintRef = React.useRef<HTMLDivElement>(null);
  
  // Bulk print customizable states
  const [showBulkPrintModal, setShowBulkPrintModal] = useState(false);
  const [printCols, setPrintCols] = useState<number>(3);
  const [printGap, setPrintGap] = useState<number>(12); // gap in px
  const [labelHeight, setLabelHeight] = useState<number>(45); // label height in mm
  const [includeBorders, setIncludeBorders] = useState<boolean>(true);
  const [showFoundationName, setShowFoundationName] = useState<boolean>(true);
  const [showSchoolName, setShowSchoolName] = useState<boolean>(true);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const handleBulkPrint = useReactToPrint({
    contentRef: bulkPrintRef,
  });

  const triggerPrint = (item: InventoryItem) => {
    setPrintItem(item);
    setTimeout(() => {
      handlePrint();
    }, 150);
  };

  const triggerBulkPrint = () => {
    const selectedItems = items.filter(i => selectedItemIds.includes(i.id));
    setBulkPrintItems(selectedItems);
    setShowBulkPrintModal(true);
  };

  const fetchItems = async () => {
    const res = await fetch(`/api/inventory?category=${category}`);
    const data = await res.json();
    setItems(data);
  };

  useEffect(() => { 
    fetchItems(); 
    setSelectedItemIds([]);
  }, [category]);

  const filteredItems = items.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.barcode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.brand || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Offscreen Printable Label for Quick Print */}
      {printItem && (
        <div className="opacity-0 pointer-events-none fixed -top-full -left-full">
          <div 
            ref={printRef} 
            className="p-4 bg-white text-black font-sans text-center"
            style={{ 
              width: '80mm', 
              height: '40mm', 
              boxSizing: 'border-box',
            }}
          >
            <div className="border-2 border-slate-900 p-2 h-full flex flex-col justify-between rounded-lg">
              <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between gap-1">
                {schoolSettings?.logo_url ? (
                  <img 
                    src={schoolSettings.logo_url} 
                    alt="Logo Sekolah" 
                    className="h-6 w-6 object-contain" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400">🏫</div>
                )}
                
                <div className="flex-1 text-center min-w-0 px-0.5">
                  <p className="text-[5px] text-slate-500 font-extrabold uppercase tracking-wide leading-none truncate">
                    {schoolSettings?.foundation_name || 'YAYASAN PENDIDIKAN'}
                  </p>
                  <h5 className="text-[7px] font-black uppercase tracking-tight text-slate-900 mt-0.5 leading-tight truncate">
                    {schoolSettings?.school_name || 'SMK NEGERI CONTOH'}
                  </h5>
                  <p className="text-[4.5px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5 leading-none">
                    KARTU INVENTARIS ASET
                  </p>
                </div>

                {schoolSettings?.foundation_logo_url ? (
                  <img 
                    src={schoolSettings.foundation_logo_url} 
                    alt="Logo Yayasan" 
                    className="h-6 w-6 object-contain" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400">🛡️</div>
                )}
              </div>
              
              <div className="flex flex-col items-center justify-center py-0.5">
                <BarcodeComponent 
                  value={printItem.barcode} 
                  width={1.2} 
                  height={30} 
                  fontSize={8} 
                  margin={0} 
                  displayValue={true}
                />
              </div>
              
              <div className="border-t border-slate-300 pt-1 text-left text-[7px] leading-tight space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span className="truncate max-w-[150px] text-slate-900 uppercase">{printItem.name}</span>
                  <span className="text-slate-500 font-mono text-[6px]">{printItem.brand || '-'}</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Ruang: <strong className="text-slate-950 font-semibold">{printItem.room_name || '-'}</strong></span>
                  <span>Tahun: <strong className="text-slate-950 font-semibold">{printItem.year_acquired}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen Printable Labels for Bulk Print - Configured for Sheet Grid Layout */}
      {bulkPrintItems.length > 0 && (
        <div className="opacity-0 pointer-events-none fixed -top-full -left-full">
          <div 
            ref={bulkPrintRef} 
            className="bg-white text-black font-sans p-[10mm]"
            style={{ 
              width: '210mm',
              boxSizing: 'border-box',
              minHeight: '297mm',
              backgroundColor: '#fff'
            }}
          >
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: `repeat(${printCols}, minmax(0, 1fr))`, 
                gap: `${printGap}px`,
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {bulkPrintItems.map((item) => {
                const headSize = printCols >= 20 ? 'text-[1.5px]' : printCols >= 15 ? 'text-[2.5px]' : printCols >= 10 ? 'text-[3.5px]' : printCols >= 6 ? 'text-[5px]' : printCols >= 4 ? 'text-[6px]' : 'text-[7.5px]';
                const fSize = printCols >= 20 ? 'text-[1px]' : printCols >= 15 ? 'text-[2px]' : printCols >= 10 ? 'text-[2.5px]' : printCols >= 6 ? 'text-[4px]' : printCols >= 4 ? 'text-[4.5px]' : 'text-[5.5px]';
                const subSize = printCols >= 20 ? 'text-[1px]' : printCols >= 15 ? 'text-[2px]' : printCols >= 10 ? 'text-[2.5px]' : printCols >= 6 ? 'text-[4px]' : printCols >= 4 ? 'text-[4.5px]' : 'text-[5px]';
                
                const barcodeW = printCols >= 20 ? 0.15 : printCols >= 15 ? 0.25 : printCols >= 12 ? 0.35 : printCols >= 8 ? 0.45 : printCols >= 6 ? 0.6 : printCols === 5 ? 0.7 : printCols === 4 ? 0.9 : printCols === 3 ? 1.2 : 1.6;
                const barcodeH = printCols >= 20 ? 8 : printCols >= 15 ? 10 : printCols >= 12 ? 12 : printCols >= 8 ? 15 : printCols >= 6 ? 18 : printCols === 5 ? 20 : printCols === 4 ? 22 : printCols === 3 ? 28 : 38;
                const labelPadding = printCols >= 15 ? '2px' : printCols >= 10 ? '4px' : '8px';
                const logoClass = printCols >= 15 ? 'h-2 w-2' : printCols >= 10 ? 'h-4 w-4' : 'h-6 w-6';

                return (
                  <div 
                    key={item.id} 
                    className="flex flex-col justify-between"
                    style={{ 
                      width: '100%', 
                      height: `${labelHeight}mm`, 
                      boxSizing: 'border-box',
                      pageBreakInside: 'avoid',
                      breakInside: 'avoid',
                      backgroundColor: '#fff',
                      padding: labelPadding,
                      border: includeBorders ? '2px solid #000' : 'none',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between gap-1">
                      {schoolSettings?.logo_url ? (
                        <img 
                          src={schoolSettings.logo_url} 
                          alt="Logo Sekolah" 
                          className={`${logoClass} object-contain`} 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className={`${logoClass} bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400`}>🏫</div>
                      )}
                      
                      <div className="flex-1 text-center min-w-0 px-0.5">
                        {showFoundationName && (
                          <p className={`text-slate-500 font-extrabold uppercase tracking-wide leading-none truncate ${fSize}`}>
                            {schoolSettings?.foundation_name || 'YAYASAN PENDIDIKAN'}
                          </p>
                        )}
                        {showSchoolName && (
                          <h5 className={`font-black uppercase tracking-tight text-slate-900 mt-0.5 leading-tight truncate ${headSize}`}>
                            {schoolSettings?.school_name || 'SMK NEGERI CONTOH'}
                          </h5>
                        )}
                        <p className={`text-indigo-600 font-bold uppercase tracking-wider mt-0.5 leading-none ${subSize}`}>
                          KARTU INVENTARIS ASET
                        </p>
                      </div>

                      {schoolSettings?.foundation_logo_url ? (
                        <img 
                          src={schoolSettings.foundation_logo_url} 
                          alt="Logo Yayasan" 
                          className={`${logoClass} object-contain`} 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className={`${logoClass} bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400`}>🛡️</div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-center justify-center py-0.5">
                      <BarcodeComponent 
                        value={item.barcode} 
                        width={barcodeW} 
                        height={barcodeH} 
                        fontSize={printCols >= 15 ? 4 : printCols >= 10 ? 6 : 8} 
                        margin={0} 
                        displayValue={printCols < 18}
                      />
                    </div>
                    
                    <div className={`border-t border-slate-300 pt-1 text-left leading-tight space-y-0.5 ${printCols >= 15 ? 'text-[4px]' : 'text-[7px]'}`}>
                      <div className="flex justify-between font-bold">
                        <span className="truncate max-w-[150px] text-slate-900 uppercase">{item.name}</span>
                        <span className="text-slate-500 font-mono text-[6px]">{printCols < 15 ? (item.brand || '-') : ''}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Ruang: <strong className="text-slate-950 font-semibold">{item.room_name || '-'}</strong></span>
                        <span>{printCols < 15 && <>Tahun: <strong className="text-slate-950 font-semibold">{item.year_acquired}</strong></>}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {barcodeSearchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="font-semibold">{barcodeSearchError}</span>
          </div>
          <button onClick={() => setBarcodeSearchError('')} className="p-1 hover:bg-red-100 rounded-full transition-all">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Daftar Inventaris {category.charAt(0).toUpperCase() + category.slice(1)}
          </h3>
          <p className="text-sm text-slate-500">Kelola data aset {category} sekolah</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          {selectedItemIds.length > 0 && (
            <button 
              onClick={triggerBulkPrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-3.5 py-2 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-xs sm:text-sm animate-pulse"
              title="Cetak Barcode Terpilih"
            >
              <Printer size={16} />
              Cetak Masal ({selectedItemIds.length})
            </button>
          )}
          
          {/* Manual Barcode Search Form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!barcodeSearchInput.trim()) return;
              const found = items.find(i => i.barcode.toLowerCase() === barcodeSearchInput.trim().toLowerCase());
              if (found) {
                setDetailItem(found);
                setShowDetailModal(true);
                setBarcodeSearchInput('');
                setBarcodeSearchError('');
              } else {
                setBarcodeSearchError(`Barcode "${barcodeSearchInput}" tidak ditemukan.`);
                setTimeout(() => setBarcodeSearchError(''), 6000);
              }
            }}
            className="flex items-center gap-1 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2 py-1 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500"
          >
            <Barcode size={16} className="text-slate-400 shrink-0 ml-1" />
            <input 
              type="text"
              placeholder="Masukkan / Cari Barcode..."
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs px-2 py-1 w-36 sm:w-48 text-slate-800 placeholder-slate-400 font-mono"
              value={barcodeSearchInput}
              onChange={(e) => setBarcodeSearchInput(e.target.value)}
            />
            <button 
              type="submit"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors shrink-0"
            >
              Cari
            </button>
          </form>

          <button 
            onClick={() => setShowScanner(true)}
            className="btn btn-secondary flex items-center gap-2 text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4"
          >
            <Barcode size={16} />
            Scan Barcode
          </button>
          {(category === 'umum' || user.role === 'admin' || user.role === 'operator') && (
            <button 
              onClick={() => { setSelectedItem(null); setShowForm(true); }}
              className="btn btn-primary flex items-center gap-2 text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4"
            >
              <Plus size={16} />
              Tambah Item
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12 text-center">
                  <input 
                    type="checkbox"
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    checked={filteredItems.length > 0 && selectedItemIds.length === filteredItems.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItemIds(filteredItems.map(item => item.id));
                      } else {
                        setSelectedItemIds([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Barcode</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Barang / Spesifikasi</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ruangan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kondisi</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isSelected = selectedItemIds.includes(item.id);
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                    <td className="px-6 py-4 w-12 text-center">
                      <input 
                        type="checkbox"
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItemIds([...selectedItemIds, item.id]);
                          } else {
                            setSelectedItemIds(selectedItemIds.filter(id => id !== item.id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600">{item.barcode}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        {item.initial_photo ? (
                          <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-lg overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-sm">
                            <img 
                              src={item.initial_photo} 
                              alt={item.name} 
                              className="w-full h-full object-cover rounded"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg shrink-0 flex items-center justify-center text-slate-300">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.9 2.9m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375 0 11-.75 0 .375 0 01.75 0z" />
                            </svg>
                          </div>
                        )}
                        <div className="space-y-1 flex-1">
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500 font-medium">{item.brand || '-'}</p>
                        
                        {item.category === 'tanah' && (
                          <div className="text-[11px] text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg max-w-fit space-y-0.5">
                            <div><strong>Pemilik:</strong> {item.land_owner || '-'}</div>
                            <div><strong>Alas Hak:</strong> {item.land_alas_hak || '-'}</div>
                            <div><strong>No Hak:</strong> {item.land_certificate_no_date || '-'}</div>
                            <div className="flex gap-x-3">
                              <span><strong>Luas:</strong> {item.land_area || '-'}</span>
                              <span>•</span>
                              <span><strong>Koordinat:</strong> {item.land_coordinates || '-'}</span>
                            </div>
                          </div>
                        )}

                        {item.category === 'bangunan' && (
                          <div className="text-[11px] text-indigo-700 font-medium bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg max-w-fit space-y-0.5">
                            <div><strong>Nama Gedung:</strong> {item.building_name || '-'}</div>
                            <div><strong>Kode Gedung:</strong> {item.building_code || '-'}</div>
                            <div className="flex gap-x-3">
                              <span><strong>Luas:</strong> {item.building_area || '-'}</span>
                              <span>•</span>
                              <span><strong>Tahun:</strong> {item.building_year || '-'}</span>
                              <span>•</span>
                              <span><strong>Kondisi:</strong> {item.building_condition || '-'}</span>
                            </div>
                          </div>
                        )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.room_name || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.condition === 'baik' ? 'bg-emerald-100 text-emerald-700' :
                        item.condition === 'rusak_ringan' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.condition.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'aktif' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => { setDetailItem(item); setShowDetailModal(true); }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        >
                          Detail
                        </button>
                        <button 
                          onClick={() => triggerPrint(item)}
                          className="text-slate-500 hover:text-indigo-600 font-medium text-sm border border-slate-200 hover:border-indigo-600 px-2 py-1 rounded-md transition-all flex items-center gap-1"
                          title="Cetak Label"
                        >
                          Cetak
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <InventoryForm 
          item={selectedItem} 
          category={category}
          onClose={() => setShowForm(false)} 
          onSuccess={() => { setShowForm(false); fetchItems(); }}
        />
      )}

      {showDetailModal && detailItem && (
        <ItemDetailModal 
          item={detailItem}
          schoolSettings={schoolSettings}
          canEdit={category === 'umum' || user.role === 'admin' || user.role === 'operator'}
          onClose={() => { setShowDetailModal(false); setDetailItem(null); }}
          onEdit={() => {
            setSelectedItem(detailItem);
            setShowDetailModal(false);
            setShowForm(true);
          }}
        />
      )}

      {showScanner && (
        <BarcodeScanner 
          onScan={(code) => {
            const found = items.find(i => i.barcode.toLowerCase() === code.trim().toLowerCase());
            if (found) {
              setDetailItem(found);
              setShowDetailModal(true);
              setBarcodeSearchError('');
            } else {
              setBarcodeSearchError(`Item dengan Barcode "${code}" tidak ditemukan dalam sistem.`);
              setTimeout(() => setBarcodeSearchError(''), 6000);
            }
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Bulk Print Layout & Live Preview Modal */}
      <AnimatePresence>
        {showBulkPrintModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden border border-slate-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Printer size={22} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Pengaturan Cetak Barcode Masal</h3>
                    <p className="text-xs text-slate-500">Konfigurasi tata letak stiker barcode pada selembar kertas sebelum dicetak</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowBulkPrintModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  title="Tutup"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* Left Side: Configuration Controls */}
                <div className="w-full lg:w-96 border-r border-slate-100 p-6 overflow-y-auto space-y-6 bg-slate-50/50 shrink-0">
                  
                  {/* Information Badge */}
                  <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-950 rounded-xl text-[11px] leading-relaxed flex gap-2">
                    <span className="text-sm">💡</span>
                    <div>
                      Dukungan cetak fleksibel <strong>2 sampai 5 kolom</strong> dalam satu lembar A4. Silakan pilih susunan kolom di bawah agar pas dengan kertas stiker label Anda (misalnya jenis Tom & Jerry).
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Tata Letak (Layout 2-25 Kolom)</h4>
                    
                    {/* Columns Selector */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs font-semibold text-slate-700">Jumlah Kolom Barcode (2-25)</label>
                        <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Pilihan: {printCols} Kolom
                        </span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="range" 
                          min="2" 
                          max="25" 
                          value={printCols} 
                          onChange={(e) => setPrintCols(Number(e.target.value))}
                          className="w-full accent-indigo-600 cursor-pointer"
                        />
                        <select
                          value={printCols}
                          onChange={(e) => setPrintCols(Number(e.target.value))}
                          className="input py-1 px-2 text-xs font-bold font-mono w-24 shrink-0 bg-white border border-slate-200"
                        >
                          {Array.from({ length: 24 }, (_, idx) => idx + 2).map((cols) => (
                            <option key={cols} value={cols}>{cols} Kolom</option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                        * Menyusun barcode ke samping (di-custom hingga <strong>25 kolom</strong>) sangat hemat kertas dan sangat rapi, tidak boros satu barcode per lembar.
                      </p>
                    </div>

                    {/* Label Height Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Tinggi Stiker</span>
                        <span className="font-bold text-indigo-600 font-mono">{labelHeight} mm</span>
                      </div>
                      <input 
                        type="range" 
                        min="30" 
                        max="70" 
                        step="2"
                        value={labelHeight} 
                        onChange={(e) => setLabelHeight(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>30mm (Pendek)</span>
                        <span>70mm (Tinggi)</span>
                      </div>
                    </div>

                    {/* Gap Spacing Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>Jarak Antar Stiker (Gap)</span>
                        <span className="font-bold text-indigo-600 font-mono">{printGap} px</span>
                      </div>
                      <input 
                        type="range" 
                        min="4" 
                        max="24" 
                        value={printGap} 
                        onChange={(e) => setPrintGap(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>4px (Sangat Rapat)</span>
                        <span>24px (Renggang)</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-150" />

                  {/* Visibility Toggles */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Desain & Informasi</h4>

                    {/* Toggle Card Borders */}
                    <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={includeBorders} 
                        onChange={(e) => setIncludeBorders(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="block text-xs font-bold text-slate-700">Tampilkan Bingkai</span>
                        <span className="block text-[10px] text-slate-400">Gunakan garis tepi hitam tebal pada stiker</span>
                      </div>
                    </label>

                    {/* Toggle Foundation Name */}
                    <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showFoundationName} 
                        onChange={(e) => setShowFoundationName(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="block text-xs font-bold text-slate-700">Nama & Logo Yayasan</span>
                        <span className="block text-[10px] text-slate-400">Tampilkan header nama yayasan</span>
                      </div>
                    </label>

                    {/* Toggle School Name */}
                    <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={showSchoolName} 
                        onChange={(e) => setShowSchoolName(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer"
                      />
                      <div className="text-left">
                        <span className="block text-xs font-bold text-slate-700">Nama & Logo Sekolah</span>
                        <span className="block text-[10px] text-slate-400">Tampilkan header nama sekolah</span>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2 text-center text-[11px] text-slate-400 font-medium">
                    Total Terpilih: <strong className="text-indigo-600">{bulkPrintItems.length} barang</strong>
                  </div>

                </div>

                {/* Right Side: Scrollable Sheet Live Preview */}
                <div className="flex-1 bg-slate-200 p-4 md:p-6 overflow-y-auto flex justify-center">
                  <div className="space-y-4 max-w-[210mm] w-full">
                    <div className="flex justify-between items-center text-xs text-slate-500 font-semibold px-2">
                      <span>Preview Lembar Virtual (Skala A4)</span>
                      <span className="bg-slate-300 text-slate-700 px-2 py-0.5 rounded-full text-[10px]">A4 - 210mm</span>
                    </div>

                    {/* A4 Sheet Simulation Canvas */}
                    <div className="bg-white text-black p-[8mm] rounded-2xl shadow-xl border border-slate-300 mx-auto min-h-[297mm] w-full" style={{ boxSizing: 'border-box' }}>
                      <div 
                        className="grid" 
                        style={{ 
                          display: 'grid', 
                          gridTemplateColumns: `repeat(${printCols}, minmax(0, 1fr))`, 
                          gap: `${printGap}px`,
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      >
                         {bulkPrintItems.map((item) => {
                           const headSize = printCols >= 20 ? 'text-[1.5px]' : printCols >= 15 ? 'text-[2.5px]' : printCols >= 10 ? 'text-[3.5px]' : printCols >= 6 ? 'text-[5px]' : printCols >= 4 ? 'text-[6px]' : 'text-[7.5px]';
                           const fSize = printCols >= 20 ? 'text-[1px]' : printCols >= 15 ? 'text-[2px]' : printCols >= 10 ? 'text-[2.5px]' : printCols >= 6 ? 'text-[4px]' : printCols >= 4 ? 'text-[4.5px]' : 'text-[5.5px]';
                           const subSize = printCols >= 20 ? 'text-[1px]' : printCols >= 15 ? 'text-[2px]' : printCols >= 10 ? 'text-[2.5px]' : printCols >= 6 ? 'text-[4px]' : printCols >= 4 ? 'text-[4.5px]' : 'text-[5px]';
                           
                           const barcodeW = printCols >= 20 ? 0.15 : printCols >= 15 ? 0.25 : printCols >= 12 ? 0.35 : printCols >= 8 ? 0.45 : printCols >= 6 ? 0.6 : printCols === 5 ? 0.7 : printCols === 4 ? 0.9 : printCols === 3 ? 1.2 : 1.6;
                           const barcodeH = printCols >= 20 ? 8 : printCols >= 15 ? 10 : printCols >= 12 ? 12 : printCols >= 8 ? 15 : printCols >= 6 ? 18 : printCols === 5 ? 20 : printCols === 4 ? 22 : printCols === 3 ? 28 : 38;
                           const labelPadding = printCols >= 15 ? '2px' : printCols >= 10 ? '4px' : '8px';
                           const logoClass = printCols >= 15 ? 'h-2 w-2' : printCols >= 10 ? 'h-4 w-4' : 'h-6 w-6';

                           return (
                             <div 
                               key={item.id} 
                               className="flex flex-col justify-between"
                               style={{ 
                                 width: '100%', 
                                 height: `${labelHeight}mm`, 
                                 boxSizing: 'border-box',
                                 pageBreakInside: 'avoid',
                                 breakInside: 'avoid',
                                 backgroundColor: '#fff',
                                 padding: labelPadding,
                                 border: includeBorders ? '2px solid #000' : 'none',
                                 borderRadius: '8px',
                                 overflow: 'hidden'
                               }}
                             >
                               <div className="border-b-2 border-slate-900 pb-1 flex items-center justify-between gap-1">
                                 {schoolSettings?.logo_url ? (
                                   <img 
                                     src={schoolSettings.logo_url} 
                                     alt="Logo Sekolah" 
                                     className={`${logoClass} object-contain`} 
                                     referrerPolicy="no-referrer" 
                                   />
                                 ) : (
                                   <div className={`${logoClass} bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400`}>🏫</div>
                                 )}
                                 
                                 <div className="flex-1 text-center min-w-0 px-0.5">
                                   {showFoundationName && (
                                     <p className={`text-slate-500 font-extrabold uppercase tracking-wide leading-none truncate ${fSize}`}>
                                       {schoolSettings?.foundation_name || 'YAYASAN PENDIDIKAN'}
                                     </p>
                                   )}
                                   {showSchoolName && (
                                     <h5 className={`font-black uppercase tracking-tight text-slate-900 mt-0.5 leading-tight truncate ${headSize}`}>
                                       {schoolSettings?.school_name || 'SMK NEGERI CONTOH'}
                                     </h5>
                                   )}
                                   <p className={`text-indigo-600 font-bold uppercase tracking-wider mt-0.5 leading-none ${subSize}`}>
                                     KARTU INVENTARIS ASET
                                   </p>
                                 </div>

                                 {schoolSettings?.foundation_logo_url ? (
                                   <img 
                                     src={schoolSettings.foundation_logo_url} 
                                     alt="Logo Yayasan" 
                                     className={`${logoClass} object-contain`} 
                                     referrerPolicy="no-referrer" 
                                   />
                                 ) : (
                                   <div className={`${logoClass} bg-slate-100 rounded flex items-center justify-center text-[8px] font-bold text-slate-400`}>🛡️</div>
                                 )}
                               </div>
                               
                               <div className="flex flex-col items-center justify-center py-0.5">
                                 <BarcodeComponent 
                                   value={item.barcode} 
                                   width={barcodeW} 
                                   height={barcodeH} 
                                   fontSize={printCols >= 15 ? 4 : printCols >= 10 ? 6 : 8} 
                                   margin={0} 
                                   displayValue={printCols < 18}
                                 />
                               </div>
                               
                               <div className={`border-t border-slate-300 pt-1 text-left leading-tight space-y-0.5 ${printCols >= 15 ? 'text-[4px]' : 'text-[7px]'}`}>
                                 <div className="flex justify-between font-bold">
                                   <span className="truncate max-w-[150px] text-slate-900 uppercase">{item.name}</span>
                                   <span className="text-slate-500 font-mono text-[6px]">{printCols < 15 ? (item.brand || '-') : ''}</span>
                                 </div>
                                 <div className="flex justify-between text-slate-600 font-medium">
                                   <span>Ruang: <strong className="text-slate-950 font-semibold">{item.room_name || '-'}</strong></span>
                                   <span>{printCols < 15 && <>Tahun: <strong className="text-slate-950 font-semibold">{item.year_acquired}</strong></>}</span>
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <button 
                  type="button"
                  onClick={() => setShowBulkPrintModal(false)}
                  className="btn btn-secondary text-xs sm:text-sm px-4 py-2"
                >
                  Batal
                </button>
                
                <button 
                  type="button"
                  onClick={() => {
                    handleBulkPrint();
                  }}
                  className="btn btn-primary flex items-center gap-2 text-xs sm:text-sm px-6 py-2.5 shadow-lg shadow-indigo-600/20"
                >
                  <Printer size={18} />
                  Cetak Sekarang
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MutationView({ user, searchQuery }: { user: User, searchQuery: string }) {
  const [showForm, setShowForm] = useState(false);
  const [mutations, setMutations] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'pending'>('all');

  // Approval Modal State
  const [selectedMutation, setSelectedMutation] = useState<any | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'approved' | 'rejected'>('approved');
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  const fetchMutations = async () => {
    const res = await fetch('/api/mutations');
    const data = await res.json();
    setMutations(data);
  };

  useEffect(() => { fetchMutations(); }, []);

  const handleOpenApprovalModal = (m: any) => {
    setSelectedMutation(m);
    setApprovalStatus('approved');
    setApprovalNotes('');
  };

  const handleSaveApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMutation) return;

    try {
      const res = await fetch(`/api/mutations/${selectedMutation.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: approvalStatus,
          approved_by: `${user.name} (${user.role === 'admin' ? 'Sarpras' : user.role === 'waka_kurikulum' ? 'Kepala Sekolah (Kur)' : 'Kepala Sekolah (Kes)'})`,
          approval_notes: approvalNotes
        })
      });

      if (res.ok) {
        setSelectedMutation(null);
        fetchMutations();
      } else {
        alert('Gagal memproses persetujuan mutasi');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi');
    }
  };

  const filteredMutations = mutations.filter(m => 
    m.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.reason.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(m => {
    if (activeSubTab === 'pending') return m.status === 'pending';
    return true;
  });

  const pendingCount = mutations.filter(m => m.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Mutasi Barang</h3>
          <p className="text-slate-500">Persetujuan & riwayat perpindahan barang antar ruangan</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2 shrink-0">
          <ArrowLeftRight size={18} />
          Mutasi Baru
        </button>
      </div>

      {/* Sub-tabs for mutasi */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('all')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Semua Riwayat Mutasi
        </button>
        <button
          onClick={() => setActiveSubTab('pending')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all relative ${
            activeSubTab === 'pending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>Menunggu Persetujuan</span>
            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </div>
        </button>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-bottom border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Barang</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dari</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ke</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Alasan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status & Verifikator</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMutations.map(m => {
                const isPending = m.status === 'pending' || !m.status;
                const canApprove = ['admin', 'waka_kurikulum', 'waka_kesiswaan'].includes(user.role);

                return (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(m.mutation_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{m.item_name}</p>
                      <p className="text-xs text-slate-500 font-mono">{m.barcode}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.from_room_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-bold text-indigo-600">
                      {isPending ? (
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-normal">{m.to_room_name}</span>
                          <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">Rencana</span>
                        </div>
                      ) : m.status === 'approved' ? (
                        m.to_room_name
                      ) : (
                        <div className="line-through text-slate-400 font-normal">{m.to_room_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <p className="italic">"{m.reason}"</p>
                      <p className="text-[11px] text-slate-400 mt-1">Pengaju: {m.operator_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-700 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Menunggu Persetujuan
                          </span>
                        ) : m.status === 'approved' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Disetujui
                            </span>
                            <p className="text-xs text-slate-600 font-medium">{m.approved_by}</p>
                            {m.approval_notes && <p className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 italic">"{m.approval_notes}"</p>}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Ditolak
                            </span>
                            <p className="text-xs text-slate-600 font-medium">{m.approved_by}</p>
                            {m.approval_notes && <p className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 italic">"{m.approval_notes}"</p>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isPending && canApprove ? (
                        <button 
                          onClick={() => handleOpenApprovalModal(m)} 
                          className="btn btn-primary text-xs font-bold py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle2 size={14} /> Verifikasi
                        </button>
                      ) : isPending ? (
                        <span className="text-[11px] text-slate-400 italic">Hubungi Sarpras / Kepsek</span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Tindakan Selesai</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredMutations.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 text-sm">Tidak ada riwayat mutasi barang.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification modal sheet */}
      {selectedMutation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in-50 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Lembar Keputusan Persetujuan Mutasi</h3>
                <p className="text-xs text-slate-500">Otorisasi perpindahan ruang inventaris oleh Sarpras / Kepala Sekolah</p>
              </div>
              <button onClick={() => setSelectedMutation(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveApproval} className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Barang:</span>
                  <span className="font-bold text-slate-800">{selectedMutation.item_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Barcode / Kode:</span>
                  <span className="font-mono text-slate-800">{selectedMutation.barcode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lokasi Asal:</span>
                  <span className="font-semibold text-slate-800">{selectedMutation.from_room_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lokasi Tujuan Baru:</span>
                  <span className="font-bold text-indigo-600">{selectedMutation.to_room_name}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Alasan Mutasi:</span>
                  <span className="italic text-slate-700">"{selectedMutation.reason}"</span>
                </div>
              </div>

              <div>
                <label className="label">Keputusan Persetujuan <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setApprovalStatus('approved')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 border rounded-xl text-sm font-bold transition-all ${
                      approvalStatus === 'approved'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Setujui Mutasi
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalStatus('rejected')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 border rounded-xl text-sm font-bold transition-all ${
                      approvalStatus === 'rejected'
                        ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-200'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <XCircle size={16} className="text-rose-600" />
                    Tolak Mutasi
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Catatan / Alasan Keputusan <span className="text-red-500">*</span></label>
                <textarea 
                  className="input h-24 resize-none" 
                  placeholder={approvalStatus === 'approved' ? 'Tuliskan instruksi atau memo persetujuan...' : 'Tuliskan alasan penolakan mutasi barang...'}
                  value={approvalNotes} 
                  onChange={e => setApprovalNotes(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedMutation(null)} className="btn btn-secondary text-sm">Batal</button>
                <button type="submit" className="btn btn-primary text-sm flex items-center gap-2">
                  <Save size={16} /> Simpan & Update Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && <MutationForm user={user} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); fetchMutations(); }} />}
    </div>
  );
}

function OpnameView({ user, searchQuery }: { user: User, searchQuery: string }) {
  const [showForm, setShowForm] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'opname' | 'repair'>('opname');
  
  // Repair Progress Modal State
  const [editingRepair, setEditingRepair] = useState<any | null>(null);
  const [repairStatus, setRepairStatus] = useState<string>('pending_repair');
  const [repairNotes, setRepairNotes] = useState<string>('');
  const [repairCost, setRepairCost] = useState<number>(0);
  const [repairTechnician, setRepairTechnician] = useState<string>('');
  const [repairDate, setRepairDate] = useState<string>('');

  const fetchHistory = async () => {
    const res = await fetch('/api/opname');
    const data = await res.json();
    setHistory(data);
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleOpenRepairModal = (item: any) => {
    setEditingRepair(item);
    setRepairStatus(item.repair_status || 'pending_repair');
    setRepairNotes(item.repair_notes || '');
    setRepairCost(item.repair_cost || 0);
    setRepairTechnician(item.repair_technician || '');
    setRepairDate(item.repair_date || new Date().toISOString().split('T')[0]);
  };

  const handleSaveRepair = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRepair) return;

    try {
      const res = await fetch(`/api/opname/${editingRepair.id}/repair`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repair_status: repairStatus,
          repair_notes: repairNotes,
          repair_cost: Number(repairCost) || 0,
          repair_technician: repairTechnician,
          repair_date: repairDate
        })
      });

      if (res.ok) {
        setEditingRepair(null);
        fetchHistory();
      } else {
        alert('Gagal memperbarui status perbaikan');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi');
    }
  };

  const filteredHistory = history.filter(h => 
    h.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Damaged items tracking list (items that have condition_after as damaged or already have repair_status)
  const repairHistory = filteredHistory.filter(h => 
    h.repair_status !== null || 
    h.condition_after === 'rusak_ringan' || 
    h.condition_after === 'rusak_berat'
  );

  // Counts for the badge
  const pendingRepairsCount = history.filter(h => 
    h.repair_status === 'pending_repair' || h.repair_status === 'repairing'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Stock Opname & Pemantauan Perbaikan</h3>
          <p className="text-slate-500">Pemeriksaan fisik sarpras sekolah serta pemantauan kerusakan & proses perbaikannya</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2">
            <ClipboardCheck size={18} />
            Mulai Opname Baru
          </button>
        </div>
      </div>

      {/* Modern Inner Sub-tabs selector */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('opname')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'opname'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck size={16} />
            <span>Riwayat Opname</span>
          </div>
        </button>
        <button
          onClick={() => setActiveSubTab('repair')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all relative ${
            activeSubTab === 'repair'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wrench size={16} />
            <span>Pemantauan Kerusakan & Perbaikan</span>
            {pendingRepairsCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                {pendingRepairsCount}
              </span>
            )}
          </div>
        </button>
      </div>

      {activeSubTab === 'opname' ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-bottom border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Barang</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kondisi (Sebelum)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kondisi (Sesudah)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Perbaikan / Penanganan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Catatan</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(h.check_date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{h.item_name}</p>
                      <p className="text-xs text-slate-500 font-mono">{h.barcode}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 uppercase">{h.condition_before.replace('_', ' ')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                        h.condition_after === 'baik' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {h.condition_after.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {h.repair_status ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            h.repair_status === 'pending_repair' ? 'bg-amber-500 animate-pulse' :
                            h.repair_status === 'repairing' ? 'bg-indigo-500 animate-pulse' :
                            h.repair_status === 'repaired' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          <span className="font-medium text-slate-700 text-xs">
                            {h.repair_status === 'pending_repair' && 'Menunggu Penanganan'}
                            {h.repair_status === 'repairing' && 'Sedang Diperbaiki'}
                            {h.repair_status === 'repaired' && 'Selesai Diperbaiki'}
                            {h.repair_status === 'irreparable' && 'Tidak Bisa Diperbaiki'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 italic">"{h.notes || '-'}"</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{h.operator_name}</td>
                  </tr>
                ))}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 text-sm">Tidak ada riwayat opname ditemukan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Repair Monitoring Grid and Process Checker */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {repairHistory.map(h => {
            // Determine active step
            const status = h.repair_status || 'pending_repair';
            const costFormatted = h.repair_cost ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(h.repair_cost) : '-';

            return (
              <div key={h.id} className="card p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between bg-white rounded-2xl">
                <div>
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mb-1 ${
                        h.condition_after === 'rusak_berat' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        Kerusakan: {h.condition_after.replace('_', ' ')}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">{h.item_name}</h4>
                      <p className="text-xs text-slate-500 font-mono">{h.barcode}</p>
                    </div>
                    {/* Compact badge */}
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      status === 'pending_repair' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      status === 'repairing' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                      status === 'repaired' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {status === 'pending_repair' && 'Menunggu Tindakan'}
                      {status === 'repairing' && 'Dalam Perbaikan'}
                      {status === 'repaired' && 'Selesai'}
                      {status === 'irreparable' && 'Rusak Total'}
                    </span>
                  </div>

                  {/* Horizontal visual progress tracker */}
                  <div className="my-6">
                    <div className="relative flex justify-between items-center w-full">
                      {/* Line Background */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full" />
                      
                      {/* Active line width depending on status */}
                      <div 
                        className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 z-0 transition-all duration-500 rounded-full`}
                        style={{
                          width: status === 'pending_repair' ? '0%' :
                                 status === 'repairing' ? '50%' : '100%'
                        }}
                      />

                      {/* Step 1: Damage Reported */}
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                          ['pending_repair', 'repairing', 'repaired', 'irreparable'].includes(status)
                            ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          🚨
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 mt-1">Dilaporkan</span>
                      </div>

                      {/* Step 2: Under Repair */}
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                          ['repairing', 'repaired'].includes(status)
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                            : status === 'irreparable'
                            ? 'bg-rose-100 text-rose-600 border-rose-300'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          🛠️
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 mt-1">Diperbaiki</span>
                      </div>

                      {/* Step 3: Completed / Repaired */}
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                          status === 'repaired'
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200'
                            : status === 'irreparable'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          {status === 'irreparable' ? '❌' : '✅'}
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 mt-1">
                          {status === 'irreparable' ? 'Rusak Total' : 'Selesai'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informational specs card */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tanggal Laporan:</span>
                      <span className="font-semibold text-slate-700">{new Date(h.check_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Dilaporkan Oleh:</span>
                      <span className="font-semibold text-slate-700">{h.operator_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Teknisi / Bengkel:</span>
                      <span className="font-bold text-indigo-600">{h.repair_technician || 'Belum Ditentukan'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Estimasi / Biaya:</span>
                      <span className="font-bold text-emerald-600">{costFormatted}</span>
                    </div>
                    {h.repair_date && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tanggal Selesai:</span>
                        <span className="font-semibold text-slate-700">{new Date(h.repair_date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
                      </div>
                    )}
                    {h.notes && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 block font-semibold mb-1">Catatan Kerusakan Awal:</span>
                        <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">"{h.notes}"</p>
                      </div>
                    )}
                    {h.repair_notes && (
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 block font-semibold mb-1">Catatan Penanganan:</span>
                        <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100">"{h.repair_notes}"</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Update Button */}
                {['admin', 'operator', 'waka_kurikulum', 'waka_kesiswaan'].includes(user.role) && (
                  <button 
                    onClick={() => handleOpenRepairModal(h)}
                    className="btn btn-secondary w-full text-xs font-bold flex items-center justify-center gap-2 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    <Wrench size={14} /> Update Progress Penanganan
                  </button>
                )}
              </div>
            );
          })}
          {repairHistory.length === 0 && (
            <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 text-xl">🛡️</div>
              <h4 className="font-bold text-slate-700 mb-1">Belum Ada Pengajuan Kerusakan</h4>
              <p className="text-xs text-slate-400 max-w-sm">Barang yang diperiksa dengan kondisi "Rusak Ringan" atau "Rusak Berat" pada Stock Opname akan otomatis terdaftar di sini.</p>
            </div>
          )}
        </div>
      )}

      {/* Repair progress update modal */}
      {editingRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in-50 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Update Progress Penanganan</h3>
                <p className="text-xs text-slate-500">{editingRepair.item_name} ({editingRepair.barcode})</p>
              </div>
              <button onClick={() => setEditingRepair(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveRepair} className="p-6 space-y-4">
              <div>
                <label className="label">Status Penanganan</label>
                <select 
                  className="input"
                  value={repairStatus}
                  onChange={e => setRepairStatus(e.target.value)}
                  required
                >
                  <option value="pending_repair">Menunggu Tindakan (Dilaporkan)</option>
                  <option value="repairing">Sedang Diperbaiki / Proses</option>
                  <option value="repaired">Selesai Diperbaiki (Kondisi Kembali Baik)</option>
                  <option value="irreparable">Tidak Bisa Diperbaiki (Rusak Total / Penghapusan)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Memilih <strong>Selesai Diperbaiki</strong> otomatis mengubah kondisi inventaris barang kembali menjadi <strong>Baik</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nama Teknisi / Vendor</label>
                  <input 
                    type="text" className="input" placeholder="Misal: CV. Abadi Jaya, Pak Budi"
                    value={repairTechnician} onChange={e => setRepairTechnician(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Biaya Perbaikan (Rp)</label>
                  <input 
                    type="number" className="input" placeholder="Misal: 150000"
                    value={repairCost} onChange={e => setRepairCost(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Tanggal Pengerjaan / Selesai</label>
                <input 
                  type="date" className="input"
                  value={repairDate} onChange={e => setRepairDate(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Catatan Tindakan / Progress</label>
                <textarea 
                  className="input h-20 resize-none" 
                  placeholder="Deskripsikan tindakan yang diambil, misalnya: Ganti kabel fleksibel, Servis motherboard..."
                  value={repairNotes} onChange={e => setRepairNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingRepair(null)} className="btn btn-secondary text-sm">Batal</button>
                <button type="submit" className="btn btn-primary text-sm flex items-center gap-2">
                  <Save size={16} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && <OpnameForm user={user} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); fetchHistory(); }} />}
    </div>
  );
}

function ProcurementView({ user, searchQuery }: { user: User, searchQuery: string }) {
  const [requests, setRequests] = useState<ProcurementRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'ongoing' | 'completed' | 'rejected'>('all');

  // Tracking Modal State
  const [editingReq, setEditingReq] = useState<ProcurementRequest | null>(null);
  const [trackStatus, setTrackStatus] = useState<string>('pending');
  const [trackBudgetNotes, setTrackBudgetNotes] = useState<string>('');
  const [trackPurchaseNotes, setTrackPurchaseNotes] = useState<string>('');
  const [trackReceivedNotes, setTrackReceivedNotes] = useState<string>('');
  const [trackReceivedDate, setTrackReceivedDate] = useState<string>('');
  const [trackInvoiceNumber, setTrackInvoiceNumber] = useState<string>('');
  const [trackReceiptRecipient, setTrackReceiptRecipient] = useState<string>('');

  // Rejection reason state (used for quick rejection or in tracking modal)
  const [rejectionModalReq, setRejectionModalReq] = useState<ProcurementRequest | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  const fetchRequests = async () => {
    const res = await fetch('/api/procurement');
    const data = await res.json();
    setRequests(data);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleOpenTrackingModal = (req: ProcurementRequest) => {
    setEditingReq(req);
    setTrackStatus(req.status || 'pending');
    setTrackBudgetNotes(req.budget_notes || '');
    setTrackPurchaseNotes(req.purchase_notes || '');
    setTrackReceivedNotes(req.received_notes || '');
    setTrackReceivedDate(req.received_date || new Date().toISOString().split('T')[0]);
    setTrackInvoiceNumber(req.invoice_number || '');
    setTrackReceiptRecipient(req.receipt_recipient || user.name);
    setRejectionReasonInput(req.rejection_reason || '');
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReq) return;

    try {
      const res = await fetch(`/api/procurement/${editingReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: trackStatus,
          budget_notes: trackBudgetNotes,
          purchase_notes: trackPurchaseNotes,
          received_notes: trackReceivedNotes,
          received_date: trackReceivedDate,
          invoice_number: trackInvoiceNumber,
          receipt_recipient: trackReceiptRecipient,
          rejection_reason: trackStatus === 'rejected' ? rejectionReasonInput : null
        })
      });

      if (res.ok) {
        setEditingReq(null);
        fetchRequests();
      } else {
        alert('Gagal memperbarui alur pengadaan barang');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi');
    }
  };

  const handleSaveRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalReq) return;

    try {
      const res = await fetch(`/api/procurement/${rejectionModalReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejection_reason: rejectionReasonInput
        })
      });

      if (res.ok) {
        setRejectionModalReq(null);
        setRejectionReasonInput('');
        fetchRequests();
      } else {
        alert('Gagal menolak pengajuan barang');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi');
    }
  };

  const handleQuickStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/procurement/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.requester_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(req => {
    if (activeTabFilter === 'ongoing') {
      return ['pending', 'approved', 'budgeting', 'purchasing'].includes(req.status);
    }
    if (activeTabFilter === 'completed') {
      return ['received', 'completed'].includes(req.status);
    }
    if (activeTabFilter === 'rejected') {
      return req.status === 'rejected';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Pengajuan & Pengadaan Barang</h3>
          <p className="text-slate-500">Mulai pengajuan baru dan pantau real-time alur anggaran, pembelian, hingga penerimaan barang</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2 shrink-0">
          <Plus size={18} />
          Buat Pengajuan Baru
        </button>
      </div>

      {/* Modern Filter Subtabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTabFilter('all')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTabFilter === 'all'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Semua Pengajuan ({requests.length})
        </button>
        <button
          onClick={() => setActiveTabFilter('ongoing')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTabFilter === 'ongoing'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sedang Diproses ({requests.filter(r => ['pending', 'approved', 'budgeting', 'purchasing'].includes(r.status)).length})
        </button>
        <button
          onClick={() => setActiveTabFilter('completed')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTabFilter === 'completed'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Selesai / Diterima ({requests.filter(r => ['received', 'completed'].includes(r.status)).length})
        </button>
        <button
          onClick={() => setActiveTabFilter('rejected')}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTabFilter === 'rejected'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ditolak ({requests.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredRequests.map(req => {
          const isPending = req.status === 'pending';
          const isApproved = ['approved', 'budgeting', 'purchasing', 'received', 'completed'].includes(req.status);
          const isBudgeting = ['budgeting', 'purchasing', 'received', 'completed'].includes(req.status);
          const isPurchasing = ['purchasing', 'received', 'completed'].includes(req.status);
          const isReceived = ['received', 'completed'].includes(req.status);
          const isCompleted = req.status === 'completed';
          const isRejected = req.status === 'rejected';

          const priceFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(req.estimated_price);
          const totalPriceFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(req.estimated_price * req.quantity);

          return (
            <div key={req.id} className="card p-6 flex flex-col justify-between bg-white border border-slate-200 hover:border-indigo-100 shadow-sm hover:shadow-md transition-all rounded-2xl">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div>
                    <h4 className="font-bold text-slate-900 text-lg leading-tight">{req.item_name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Qty: <span className="font-semibold text-slate-700">{req.quantity} unit</span> &bull; {priceFormatted} / unit
                    </p>
                    <p className="text-xs font-bold text-indigo-600 mt-0.5">Total Estimasi: {totalPriceFormatted}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                    req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    req.status === 'approved' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                    req.status === 'budgeting' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    req.status === 'purchasing' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    req.status === 'received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    req.status === 'completed' ? 'bg-emerald-600 text-white' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {req.status === 'pending' && 'Menunggu Persetujuan'}
                    {req.status === 'approved' && 'Disetujui'}
                    {req.status === 'budgeting' && 'Pencairan Anggaran'}
                    {req.status === 'purchasing' && 'Pembelian Barang'}
                    {req.status === 'received' && 'Sudah Diterima'}
                    {req.status === 'completed' && 'Selesai (Arsip)'}
                    {req.status === 'rejected' && 'Ditolak'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide mb-1">Keterangan / Tujuan Penggunaan:</span>
                  <p className="text-sm text-slate-600 italic">"{req.purpose}"</p>
                </div>

                {req.status === 'rejected' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl mb-4 animate-in slide-in-from-top-1 duration-150">
                    <span className="text-[10px] font-bold text-rose-500 block uppercase tracking-wide mb-1">Alasan Penolakan:</span>
                    <p className="text-sm text-rose-700 italic font-semibold">
                      {req.rejection_reason ? `"${req.rejection_reason}"` : '(Tidak ada alasan spesifik yang dicantumkan)'}
                    </p>
                  </div>
                )}

                {/* Progressive Visual Tracker / Timeline */}
                {!isRejected && (
                  <div className="my-6">
                    <div className="relative flex justify-between items-center w-full">
                      {/* Gray Line Background */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0 rounded-full" />
                      
                      {/* Active Line Width */}
                      <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 z-0 transition-all duration-500 rounded-full"
                        style={{
                          width: isCompleted || isReceived ? '100%' :
                                 isPurchasing ? '66%' :
                                 isBudgeting ? '33%' : '0%'
                        }}
                      />

                      {/* Step 1: Diajukan & Disetujui */}
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                          isApproved
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          ✓
                        </div>
                        <span className={`text-[10px] font-semibold mt-1.5 ${isApproved ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>Persetujuan</span>
                      </div>

                      {/* Step 2: Anggaran / Pencairan */}
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                          isBudgeting
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          💵
                        </div>
                        <span className={`text-[10px] font-semibold mt-1.5 ${isBudgeting ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>Anggaran</span>
                      </div>

                      {/* Step 3: Pembelian */}
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                          isPurchasing
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          🛍️
                        </div>
                        <span className={`text-[10px] font-semibold mt-1.5 ${isPurchasing ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>Pembelian</span>
                      </div>

                      {/* Step 4: Diterima */}
                      <div className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2 ${
                          isReceived
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100'
                            : 'bg-white text-slate-400 border-slate-200'
                        }`}>
                          📥
                        </div>
                        <span className={`text-[10px] font-semibold mt-1.5 ${isReceived ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>Diterima</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informational Tracking Notes */}
                {!isRejected && (isBudgeting || isPurchasing || isReceived) && (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2 text-xs mb-4">
                    {req.budget_notes && (
                      <div className="flex items-start gap-1.5">
                        <Coins size={14} className="text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-slate-600"><strong className="text-slate-800">Anggaran:</strong> {req.budget_notes}</p>
                      </div>
                    )}
                    {req.purchase_notes && (
                      <div className="flex items-start gap-1.5">
                        <ShoppingCart size={14} className="text-purple-500 shrink-0 mt-0.5" />
                        <p className="text-slate-600">
                          <strong className="text-slate-800">Pembelian:</strong> {req.purchase_notes} 
                          {req.invoice_number && <span className="bg-purple-100 text-purple-700 text-[10px] px-1 rounded font-mono ml-1">No. Faktur: {req.invoice_number}</span>}
                        </p>
                      </div>
                    )}
                    {isReceived && (
                      <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-200">
                        <Truck size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-slate-600">
                          <p><strong className="text-slate-800">Status Penerimaan:</strong> Barang telah diterima di sekolah!</p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                            <span>📅 Tgl: {req.received_date ? new Date(req.received_date).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}</span>
                            <span>👤 Penerima: <strong className="text-slate-700">{req.receipt_recipient || '-'}</strong></span>
                          </div>
                          {req.received_notes && <p className="mt-1 bg-white p-1.5 rounded border border-slate-100 text-slate-600 italic">"{req.received_notes}"</p>}
                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                            <span>✨ <em>Barang otomatis masuk ke tab Inventaris Umum dengan kondisi Baik.</em></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-slate-400">Pengaju: <strong className="text-slate-600">{req.requester_name}</strong></p>
                    {req.requester_position && <span className="text-[10px] text-indigo-600 font-medium">Jabatan: {req.requester_position}</span>}
                  </div>
                  <span className="text-slate-400 text-[11px]">{new Date(req.request_date).toLocaleDateString('id-ID')}</span>
                </div>

                {/* Quick actions for approvals if pending */}
                {['admin', 'waka_kurikulum', 'waka_kesiswaan'].includes(user.role) && req.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => handleQuickStatus(req.id, 'approved')} 
                      className="btn flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-1.5 rounded-xl shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Setujui Pengajuan
                    </button>
                    <button 
                      onClick={() => {
                        setRejectionModalReq(req);
                        setRejectionReasonInput('');
                      }} 
                      className="btn flex-1 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 transition-all"
                    >
                      <XCircle size={14} /> Tolak Pengajuan
                    </button>
                  </div>
                )}

                {/* Tracker flow update button */}
                {['admin', 'operator', 'waka_kurikulum', 'waka_kesiswaan'].includes(user.role) && req.status !== 'pending' && req.status !== 'rejected' && (
                  <button
                    onClick={() => handleOpenTrackingModal(req)}
                    className="btn btn-secondary w-full text-xs font-bold flex items-center justify-center gap-2 py-2.5 mt-2 border border-slate-200 hover:bg-slate-50 rounded-xl"
                  >
                    <Coins size={14} /> Update Alur Pengadaan & Penerimaan
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-6 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 text-xl">📋</div>
            <h4 className="font-bold text-slate-700 mb-1">Tidak Ada Pengajuan</h4>
            <p className="text-xs text-slate-400 max-w-sm">Belum ada daftar usulan atau pengajuan barang yang sesuai dengan filter saat ini.</p>
          </div>
        )}
      </div>

      {/* Procurement tracker updates modal */}
      {editingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in-50 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Update Alur Pengadaan Barang</h3>
                <p className="text-xs text-slate-500">{editingReq.item_name} &bull; Qty: {editingReq.quantity} unit</p>
              </div>
              <button onClick={() => setEditingReq(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTracking} className="p-6 space-y-4">
              <div>
                <label className="label">Status Tahapan Pengadaan <span className="text-red-500">*</span></label>
                <select 
                  className="input"
                  value={trackStatus}
                  onChange={e => setTrackStatus(e.target.value)}
                  required
                >
                  <option value="approved">Pengajuan Disetujui (Menunggu Anggaran)</option>
                  <option value="budgeting">Pencairan Anggaran / Proses Pendanaan</option>
                  <option value="purchasing">Pembelian / Pemesanan Barang</option>
                  <option value="received">Barang Telah Diterima (Otomatis Masuk Inventaris)</option>
                  <option value="completed">Selesai (Arsip Pengadaan)</option>
                  <option value="rejected">Batal / Ditolak</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Memilih status <strong>Barang Telah Diterima</strong> atau <strong>Selesai</strong> otomatis menambahkan barang tersebut ke tab <strong>Inventaris Umum</strong> dengan kondisi <strong>Baik</strong>.
                </p>
              </div>

              {/* Step: Budgeting Details */}
              {(trackStatus === 'budgeting' || trackStatus === 'purchasing' || trackStatus === 'received' || trackStatus === 'completed') && (
                <div className="p-4 border border-blue-100 bg-blue-50/50 rounded-xl space-y-3">
                  <h5 className="font-bold text-blue-900 text-xs flex items-center gap-1">
                    <Coins size={14} /> 1. Tahap Anggaran & Pencairan Dana
                  </h5>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Catatan Pencairan / Sumber Dana</label>
                    <textarea 
                      className="input h-16 text-xs bg-white"
                      placeholder="Misal: Menggunakan anggaran BOS Tahap 1, dicairkan oleh bendahara sekolah..."
                      value={trackBudgetNotes}
                      onChange={e => setTrackBudgetNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step: Purchasing Details */}
              {(trackStatus === 'purchasing' || trackStatus === 'received' || trackStatus === 'completed') && (
                <div className="p-4 border border-purple-100 bg-purple-50/50 rounded-xl space-y-3">
                  <h5 className="font-bold text-purple-900 text-xs flex items-center gap-1">
                    <ShoppingCart size={14} /> 2. Tahap Pembelian & Pemesanan
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Nomor Kwitansi / Faktur</label>
                      <input 
                        type="text" className="input text-xs bg-white"
                        placeholder="Misal: INV/2026/0912"
                        value={trackInvoiceNumber}
                        onChange={e => setTrackInvoiceNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Keterangan Vendor / Toko</label>
                      <input 
                        type="text" className="input text-xs bg-white"
                        placeholder="Misal: CV. Sentosa Abadi, SIPlah"
                        value={trackPurchaseNotes}
                        onChange={e => setTrackPurchaseNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step: Received Details */}
              {(trackStatus === 'received' || trackStatus === 'completed') && (
                <div className="p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl space-y-3">
                  <h5 className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                    <Truck size={14} /> 3. Tahap Penerimaan Barang
                  </h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Tanggal Terima</label>
                      <input 
                        type="date" className="input text-xs bg-white"
                        value={trackReceivedDate}
                        onChange={e => setTrackReceivedDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-500 block mb-1">Petugas Penerima</label>
                      <input 
                        type="text" className="input text-xs bg-white"
                        placeholder="Nama penerima barang"
                        value={trackReceiptRecipient}
                        onChange={e => setTrackReceiptRecipient(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Catatan Penerimaan / Kondisi Fisik</label>
                    <textarea 
                      className="input h-16 text-xs bg-white"
                      placeholder="Misal: Paket tersegel rapi, semua unit menyala dengan baik..."
                      value={trackReceivedNotes}
                      onChange={e => setTrackReceivedNotes(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step: Rejection Reason in update modal */}
              {trackStatus === 'rejected' && (
                <div className="p-4 border border-rose-100 bg-rose-50/50 rounded-xl space-y-3">
                  <h5 className="font-bold text-rose-900 text-xs flex items-center gap-1">
                    <XCircle size={14} className="text-rose-600" /> Alasan Penolakan / Pembatalan <span className="text-red-500">*</span>
                  </h5>
                  <div>
                    <textarea 
                      className="input h-16 text-xs bg-white"
                      placeholder="Misal: Spesifikasi kurang memadai, anggaran tidak mencukupi, atau barang sudah tersedia..."
                      value={rejectionReasonInput}
                      onChange={e => setRejectionReasonInput(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setEditingReq(null)} className="btn btn-secondary text-sm">Batal</button>
                <button type="submit" className="btn btn-primary text-sm flex items-center gap-2">
                  <Save size={16} /> Simpan Alur Pengadaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && <ProcurementForm user={user} onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); fetchRequests(); }} />}

      {/* Quick Rejection Reason Modal */}
      {rejectionModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in-50 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-rose-900 flex items-center gap-1.5">
                  <XCircle size={20} className="text-rose-600" /> Tolak Pengajuan Barang
                </h3>
                <p className="text-xs text-slate-500 mt-1">{rejectionModalReq.item_name} &bull; Qty: {rejectionModalReq.quantity} unit</p>
              </div>
              <button onClick={() => setRejectionModalReq(null)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveRejection} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Alasan Penolakan <span className="text-red-500">*</span></label>
                <textarea 
                  className="input h-24 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl p-3"
                  placeholder="Masukkan alasan penolakan secara rinci agar pengaju dapat mengetahui kendalanya (misal: anggaran dialokasikan untuk program lain, spesifikasi tidak sesuai standar, dll)..."
                  value={rejectionReasonInput}
                  onChange={e => setRejectionReasonInput(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setRejectionModalReq(null)} className="btn btn-secondary text-sm">Batal</button>
                <button type="submit" className="btn text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm">
                  <XCircle size={16} /> Tolak Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomView({ user, searchQuery }: { user: User, searchQuery: string }) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [roomToEdit, setRoomToEdit] = useState<Room | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<{ src: string, label: string } | null>(null);

  const fetchRooms = async () => {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    setRooms(data);
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus ruangan ini?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchRooms();
      } else {
        setError(data.message || "Gagal menghapus ruangan.");
      }
    } catch (err) {
      setError("Terjadi kesalahan koneksi.");
    }
  };

  const handleEditRoom = (room: Room) => {
    setRoomToEdit(room);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setRoomToEdit(null);
  };

  const handleSuccessForm = () => {
    setShowForm(false);
    setRoomToEdit(null);
    fetchRooms();
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.pic_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Data Ruangan</h3>
          <p className="text-slate-500">Kelola lokasi penempatan barang</p>
        </div>
        {['admin', 'operator'].includes(user.role) && (
          <button onClick={() => { setRoomToEdit(null); setShowForm(true); }} className="btn btn-primary flex items-center gap-2">
            <Plus size={18} />
            Tambah Ruangan
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex justify-between items-center shadow-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold px-2">X</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map(room => (
          <div key={room.id} className="card p-6 flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                  <Building2 size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 truncate" title={room.name}>{room.name}</h4>
                  <p className="text-xs font-mono text-slate-500">{room.code}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">PIC Ruangan:</span>
                  <span className="font-semibold text-slate-800">{room.pic_name}</span>
                </div>
                {room.description && (
                  <p className="text-sm text-slate-600 italic line-clamp-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    "{room.description}"
                  </p>
                )}

                {/* 4 Conditions Photos Grid */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Dokumentasi Ruang (4 Kondisi)</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'photo_luar' as const, label: 'Luar', title: 'Kondisi Luar' },
                      { key: 'photo_dalam' as const, label: 'Dalam', title: 'Kondisi Dalam' },
                      { key: 'photo_depan' as const, label: 'Depan', title: 'Tampak Depan' },
                      { key: 'photo_belakang' as const, label: 'Blkg', title: 'Tampak Belakang' }
                    ].map(p => {
                      const photoSrc = room[p.key];
                      return (
                        <div key={p.key} className="flex flex-col items-center">
                          <div className="w-full h-14 bg-slate-50 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center relative group shadow-sm">
                            {photoSrc ? (
                              <img 
                                src={photoSrc} 
                                alt={p.title} 
                                className="w-full h-full object-cover cursor-zoom-in transition-transform duration-200 group-hover:scale-110"
                                onClick={() => setPreviewPhoto({ src: photoSrc, label: `${room.name} - ${p.title}` })}
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="text-slate-300 flex items-center justify-center h-full w-full">
                                <Image size={14} className="opacity-60" />
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">{p.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-4">
              {['admin', 'operator'].includes(user.role) && (
                <>
                  <button 
                    onClick={() => handleEditRoom(room)} 
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Edit Ruangan"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteRoom(room.id)} 
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Hapus Ruangan"
                  >
                    <Trash2 size={14} />
                    <span>Hapus</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      <AnimatePresence>
        {previewPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewPhoto(null)}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          >
            <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
              <span className="text-white text-sm font-bold bg-slate-900/80 px-4 py-2 rounded-full border border-slate-800">
                {previewPhoto.label}
              </span>
              <button 
                onClick={() => setPreviewPhoto(null)} 
                className="p-2 bg-slate-900/85 hover:bg-slate-800 text-white rounded-full transition-colors border border-slate-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[80vh] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900 flex items-center justify-center"
            >
              <img 
                src={previewPhoto.src} 
                alt={previewPhoto.label} 
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showForm && (
        <RoomForm 
          roomToEdit={roomToEdit} 
          onClose={handleCloseForm} 
          onSuccess={handleSuccessForm} 
        />
      )}
    </div>
  );
}
