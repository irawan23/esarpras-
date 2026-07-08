import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Map, 
  Building2, 
  AlertTriangle, 
  PlusCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ClipboardCheck,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { User, SchoolSettings } from '../types';

export function Dashboard({ user, onNavigate, schoolSettings }: { user: User, onNavigate: (tab: string) => void, schoolSettings: SchoolSettings | null }) {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetch('/api/reports/summary').then(res => res.json()).then(setSummary);
  }, []);

  if (!summary) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
    </div>
  </div>;

  const stats = [
    { label: 'Total Inventaris', value: summary.total_items, icon: Package, color: 'bg-indigo-500', trend: '+12%' },
    { label: 'Aset Tanah', value: summary.total_land, icon: Map, color: 'bg-emerald-500', trend: '0%' },
    { label: 'Aset Bangunan', value: summary.total_building, icon: Building2, color: 'bg-blue-500', trend: '+2' },
    { label: 'Barang Rusak', value: summary.total_damaged, icon: AlertTriangle, color: 'bg-red-500', trend: '-5%' },
  ];

  const chartData = [
    { name: 'Umum', value: summary.total_items - summary.total_land - summary.total_building },
    { name: 'Tanah', value: summary.total_land },
    { name: 'Bangunan', value: summary.total_building },
  ];

  const COLORS = ['#6366f1', '#10b981', '#3b82f6'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold uppercase rounded-full tracking-wider">Dashboard Aktif</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sistem Online</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Selamat Datang, {user.name}</h2>
          <p className="text-slate-500">Berikut adalah ringkasan status sarana prasarana {schoolSettings?.school_name || 'sekolah'} hari ini.</p>
        </div>
        <div className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="text-center px-4 border-r border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Aset Aktif</p>
            <p className="text-lg font-bold text-slate-900">{summary.total_items - summary.total_damaged}</p>
          </div>
          <div className="text-center px-4 border-r border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Perlu Tinjauan</p>
            <p className="text-lg font-bold text-amber-600">{summary.procurement_pending}</p>
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Kondisi Rusak</p>
            <p className="text-lg font-bold text-red-600">{summary.total_damaged}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx} 
            whileHover={{ y: -5 }}
            className="card p-6 flex items-center gap-4 group cursor-default"
          >
            <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <h4 className="text-3xl font-bold text-slate-900">{stat.value}</h4>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                  {stat.trend}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Distribusi Aset Sekolah</h3>
              <p className="text-sm text-slate-500">Perbandingan jumlah barang berdasarkan kategori utama</p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-xs font-medium text-slate-500">Umum</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-slate-500">Tanah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs font-medium text-slate-500">Bangunan</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card p-8 bg-indigo-600 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Butuh Analisis?</h3>
              <p className="text-indigo-100 text-sm mb-6">Gunakan kecerdasan buatan untuk mengaudit seluruh aset sekolah Anda secara otomatis.</p>
              <button 
                onClick={() => onNavigate('ai-analyst')}
                className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Buka Analis AI
              </button>
            </div>
            <Sparkles className="absolute -right-4 -bottom-4 text-white/10 w-32 h-32 rotate-12" />
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => onNavigate('inventory-umum')}
                className="p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all flex flex-col items-center gap-2 border border-slate-100"
              >
                <PlusCircle size={24} />
                <span className="text-xs font-bold uppercase">Item Baru</span>
              </button>
              <button 
                onClick={() => onNavigate('opname')}
                className="p-4 bg-slate-50 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all flex flex-col items-center gap-2 border border-slate-100"
              >
                <ClipboardCheck size={24} />
                <span className="text-xs font-bold uppercase">Opname</span>
              </button>
              <button 
                onClick={() => onNavigate('mutasi')}
                className="p-4 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all flex flex-col items-center gap-2 border border-slate-100"
              >
                <ArrowUpRight size={24} />
                <span className="text-xs font-bold uppercase">Mutasi</span>
              </button>
              <button 
                onClick={() => onNavigate('reports')}
                className="p-4 bg-slate-50 rounded-xl hover:bg-amber-50 hover:text-amber-600 transition-all flex flex-col items-center gap-2 border border-slate-100"
              >
                <FileText size={24} />
                <span className="text-xs font-bold uppercase">Laporan</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Pengajuan Barang Terbaru</h3>
            <button 
              onClick={() => onNavigate('procurement')}
              className="text-indigo-600 text-sm font-bold hover:underline"
            >
              Lihat Semua
            </button>
          </div>
          <div className="space-y-4">
            {summary.procurement_pending > 0 ? (
              <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white">
                  <PlusCircle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900">Ada {summary.procurement_pending} pengajuan baru</p>
                  <p className="text-xs text-amber-700">Segera tinjau pengajuan barang dari staff.</p>
                </div>
                <ArrowUpRight className="text-amber-500" size={20} />
              </div>
            ) : (
              <p className="text-center text-slate-400 py-8 italic">Tidak ada pengajuan pending.</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Status Kerusakan</h3>
            <button 
              onClick={() => onNavigate('inventory-umum')}
              className="text-red-600 text-sm font-bold hover:underline"
            >
              Detail Aset
            </button>
          </div>
          <div className="space-y-4">
            {summary.total_damaged > 0 ? (
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900">{summary.total_damaged} Barang Rusak</p>
                  <p className="text-xs text-red-700">Butuh pengecekan atau perbaikan segera.</p>
                </div>
                <ArrowUpRight className="text-red-500" size={20} />
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                  <CheckCircle2 size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-900">Semua Aset Baik</p>
                  <p className="text-xs text-emerald-700">Tidak ada laporan kerusakan aktif.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
