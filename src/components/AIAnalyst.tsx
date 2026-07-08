import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Loader2, 
  BrainCircuit, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  DollarSign, 
  ShoppingCart, 
  ExternalLink, 
  FileText, 
  ChevronRight,
  Info,
  Printer
} from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import { useReactToPrint } from 'react-to-print';
import { SchoolSettings } from '../types';

interface ComparedItem {
  store: string;
  price: string;
  numericPrice: number;
  title: string;
  url?: string;
  notes?: string;
}

interface PriceComparisonData {
  itemName: string;
  recommendation: string;
  analysis: string;
  items: ComparedItem[];
}

interface GroundingSource {
  title: string;
  uri: string;
}

export function AIAnalyst() {
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'compare'>('compare'); // Default to the requested new feature
  
  // School Settings State
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Ref for Printing
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  // Fetch school settings on mount
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(err => console.error("Error fetching settings:", err));
  }, []);

  // CFO Audit State
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Price Compare State
  const [compareForm, setCompareForm] = useState({
    itemName: '',
    brand: '',
    specification: ''
  });
  const [compareResult, setCompareResult] = useState<PriceComparisonData | null>(null);
  const [compareSources, setCompareSources] = useState<GroundingSource[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Run CFO Audit
  const runAnalysis = async () => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const [summaryRes, inventoryRes, procurementRes, opnameRes, mutationRes] = await Promise.all([
        fetch('/api/reports/summary'),
        fetch('/api/inventory'),
        fetch('/api/procurement'),
        fetch('/api/opname'),
        fetch('/api/mutations')
      ]);

      const summary = await summaryRes.json();
      const inventory = await inventoryRes.json();
      const procurement = await procurementRes.json();
      const opname = await opnameRes.json();
      const mutations = await mutationRes.json();

      const response = await fetch('/api/gemini/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          inventory,
          procurement,
          opname,
          mutations
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setAnalysis(resData.analysis);
      } else {
        throw new Error(resData.message || "Gagal menghasilkan analisis.");
      }
    } catch (err: any) {
      console.error(err);
      setAuditError(err.message || "Terjadi kesalahan saat menghubungi AI. Pastikan API Key sudah terkonfigurasi.");
    } finally {
      setAuditLoading(false);
    }
  };

  // Run Price Comparison
  const handlePriceComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compareForm.itemName.trim()) return;

    setCompareLoading(true);
    setCompareError(null);
    setCompareResult(null);
    setCompareSources([]);

    try {
      const response = await fetch('/api/gemini/compare-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compareForm)
      });

      const resData = await response.json();
      if (resData.success) {
        setCompareResult(resData.data);
        setCompareSources(resData.sources || []);
      } else {
        throw new Error(resData.message || "Gagal memproses perbandingan harga.");
      }
    } catch (err: any) {
      console.error(err);
      setCompareError(err.message || "Gagal melakukan pencarian harga online. Pastikan API Key sudah terkonfigurasi.");
    } finally {
      setCompareLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="text-indigo-600" />
            Asisten AI & Analis Harga
          </h3>
          <p className="text-slate-500">Gunakan kecerdasan buatan untuk mengaudit aset sekolah dan membandingkan harga pasar secara online.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto border border-slate-200">
          <button
            onClick={() => setActiveSubTab('compare')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'compare'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart size={14} />
            Bandingkan Harga Online
          </button>
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'audit'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BrainCircuit size={14} />
            Audit Strategis CFO
          </button>
        </div>
      </div>

      {/* PRICE COMPARISON TAB */}
      {activeSubTab === 'compare' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Form Column */}
            <div className="lg:col-span-1">
              <div className="card p-6 bg-white shadow-sm border border-slate-200/80 sticky top-20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Search size={18} />
                  </div>
                  <h4 className="font-bold text-slate-900">Formulir Cari Barang</h4>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Masukkan nama barang yang diusulkan atau ingin dibeli untuk membandingkannya secara langsung dengan harga pasar online Indonesia teraktual (Tokopedia, Shopee, dll).
                </p>

                <form onSubmit={handlePriceComparison} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="input text-sm w-full"
                      placeholder="Contoh: Laptop ASUS ExpertBook Core i5"
                      value={compareForm.itemName}
                      onChange={e => setCompareForm({ ...compareForm, itemName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Merek / Pabrikan (Opsional)</label>
                    <input
                      type="text"
                      className="input text-sm w-full"
                      placeholder="Contoh: ASUS"
                      value={compareForm.brand}
                      onChange={e => setCompareForm({ ...compareForm, brand: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Spesifikasi Tambahan (Opsional)</label>
                    <textarea
                      className="input text-sm w-full min-h-[80px]"
                      placeholder="Contoh: RAM 16GB, SSD 512GB, Windows 11 Pro"
                      value={compareForm.specification}
                      onChange={e => setCompareForm({ ...compareForm, specification: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={compareLoading}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 border-none py-2.5 shadow-md hover:shadow-indigo-200"
                  >
                    {compareLoading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
                    {compareLoading ? 'Mencari Online...' : 'Bandingkan Harga AI'}
                  </button>
                </form>
              </div>
            </div>

            {/* Comparison Results Column */}
            <div className="lg:col-span-2">
              {compareLoading && (
                <div className="card p-16 flex flex-col items-center justify-center text-center space-y-4 bg-white border border-slate-200">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
                    <BrainCircuit size={32} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-lg">AI Sedang Menelusuri Web...</h5>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
                      Membaca data live dari Tokopedia, Shopee, dan distributor Indonesia untuk membandingkan spesifikasi dan harga terbaik. Mohon tunggu beberapa detik.
                    </p>
                  </div>
                  <div className="w-48 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 10, ease: "easeInOut" }}
                      className="bg-indigo-600 h-full"
                    />
                  </div>
                </div>
              )}

              {compareError && (
                <div className="card p-6 border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <div>
                    <h5 className="font-bold text-red-800">Gagal Memproses</h5>
                    <p className="text-sm mt-1">{compareError}</p>
                  </div>
                </div>
              )}

              {!compareResult && !compareLoading && !compareError && (
                <div className="card p-12 text-center space-y-4 bg-white border border-slate-200">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <ShoppingCart size={32} />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-lg font-bold text-slate-900">Belum Ada Pencarian Perbandingan</h4>
                    <p className="text-slate-500 text-sm">
                      Gunakan formulir di sebelah kiri untuk memasukkan nama barang. AI akan secara otomatis menelusuri internet dan mengompilasikan laporan harga pasar terpercaya untuk Anda.
                    </p>
                  </div>
                </div>
              )}

              {compareResult && !compareLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Summary Callout Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Hasil Rekomendasi AI</p>
                        <p className="text-sm text-slate-800 font-medium mt-1 leading-relaxed">
                          {compareResult.recommendation}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Analisis Pasar & Kewajaran</p>
                        <p className="text-sm text-slate-800 font-medium mt-1 leading-relaxed">
                          {compareResult.analysis}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Compared Table */}
                  <div className="card overflow-hidden border border-slate-200">
                    <div className="p-4 bg-slate-950 text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-indigo-400" size={16} />
                        <span className="font-bold text-sm">Perbandingan Marketplace Terpercaya</span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/20">
                        Live Data Grounding
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Marketplace</th>
                            <th className="px-4 py-3">Nama Produk di Toko</th>
                            <th className="px-4 py-3 text-right">Harga</th>
                            <th className="px-4 py-3">Info / Garansi / Reputasi</th>
                            <th className="px-4 py-3 text-center">Tautan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {compareResult.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-3.5 font-bold">
                                <span className={`inline-block px-2 py-1 rounded text-xs uppercase ${
                                  item.store.toLowerCase().includes('tokopedia') ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                  item.store.toLowerCase().includes('shopee') ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                                  'bg-slate-100 text-slate-800 border border-slate-200'
                                }`}>
                                  {item.store}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-slate-900 font-medium max-w-xs truncate" title={item.title}>
                                {item.title}
                              </td>
                              <td className="px-4 py-3.5 text-right font-bold text-indigo-600 font-mono">
                                {item.price}
                              </td>
                              <td className="px-4 py-3.5 text-xs text-slate-500">
                                {item.notes || '-'}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                {item.url ? (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg inline-flex items-center gap-1 transition-colors"
                                  >
                                    <ExternalLink size={16} />
                                  </a>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Source Links from Google Search Grounding */}
                  {compareSources.length > 0 && (
                    <div className="card p-5 bg-slate-50 border border-slate-200">
                      <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Info size={14} className="text-indigo-500" />
                        Sumber Data Referensi Google Search
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {compareSources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <span className="truncate max-w-[200px]" title={src.title}>{src.title || 'Sumber Google'}</span>
                            <ExternalLink size={10} className="shrink-0 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STRATEGIC ROADMAP TAB */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <div className="card p-6 bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-2xl">
              <h4 className="font-bold text-slate-900 text-lg">Audit Kesehatan & Strategi Sarpras Sekolah</h4>
              <p className="text-slate-500 text-sm mt-1">
                AI akan membaca seluruh database (inventaris aktif, usulan pengadaan, riwayat pemeliharaan, serta mutasi logistik) dan menyusun analisis strategis mirip laporan akuntan senior/CFO.
              </p>
            </div>
            <button 
              onClick={runAnalysis} 
              disabled={auditLoading}
              className="btn btn-primary self-start md:self-auto flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 border-none shadow-lg shadow-indigo-200/50 shrink-0 py-2.5 px-5 text-sm"
            >
              {auditLoading ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
              {auditLoading ? 'Memproses Audit...' : 'Mulai Audit Strategis'}
            </button>
          </div>

          {!analysis && !auditLoading && !auditError && (
            <div className="card p-12 text-center space-y-4 bg-gradient-to-b from-white to-slate-50 border border-slate-200">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto text-indigo-600">
                <Sparkles size={32} />
              </div>
              <div className="max-w-md mx-auto">
                <h4 className="text-lg font-bold text-slate-900">Siap Mengaudit Sarpras Sekolah?</h4>
                <p className="text-slate-500 text-sm">Klik tombol di atas untuk menjalankan analisis audit AI yang komprehensif, mencakup kelayakan anggaran, analisis vendor, dan mitigasi risiko operasional.</p>
              </div>
            </div>
          )}

          {auditLoading && (
            <div className="card p-20 flex flex-col items-center justify-center space-y-6 bg-white border border-slate-200">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="text-indigo-600"
              >
                <BrainCircuit size={60} />
              </motion.div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-slate-900">AI sedang memproses data...</h4>
                <p className="text-slate-500 text-sm max-w-sm mt-1">Mengaudit database inventarisasi, riwayat depresiasi, dan anggaran pengadaan.</p>
              </div>
              <div className="w-full max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15 }}
                  className="bg-indigo-600 h-full"
                />
              </div>
            </div>
          )}

          {auditError && (
            <div className="card p-6 border-red-200 bg-red-50 text-red-700 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-red-800">Gagal Audit</h5>
                <p className="text-sm mt-1">{auditError}</p>
              </div>
            </div>
          )}

          {analysis && !auditLoading && (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
                <span className="text-sm font-medium text-slate-500">Laporan selesai diproses. Klik tombol untuk mencetak format resmi:</span>
                <button 
                  onClick={() => handlePrint()} 
                  className="btn btn-primary flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 border-none shadow-md shadow-indigo-100 py-2 px-5 text-xs font-bold rounded-lg transition-all"
                >
                  <Printer size={15} />
                  Cetak Laporan Resmi
                </button>
              </div>

              {/* The printable document card */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden"
              >
                {/* Visual indicator in-app only */}
                <div className="p-4 bg-slate-900 text-slate-100 flex justify-between items-center px-6 border-b border-slate-800 print:hidden">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-yellow-400" size={16} />
                    <span className="font-bold text-xs uppercase tracking-wider">Pratinjau Dokumen Cetak Resmi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-3 py-1 rounded-full border border-slate-700">
                      Format Kertas A4 / F4
                    </span>
                  </div>
                </div>

                {/* This is the division that react-to-print will select to print */}
                <div ref={componentRef} className="p-8 md:p-16 bg-white text-slate-950 font-sans print:p-8">
                  
                  {/* Kop Surat (School Official Letterhead) */}
                  <div className="text-center mb-8 border-b-4 border-double border-slate-900 pb-5 flex items-center justify-between gap-6">
                    {settings?.foundation_logo_url ? (
                      <img src={settings.foundation_logo_url} alt="Logo Yayasan" className="w-20 h-20 object-contain shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[9px] text-slate-400 shrink-0">No Logo</div>
                    )}
                    
                    <div className="flex-1 text-center">
                      <h1 className="text-base font-black uppercase tracking-tight leading-tight text-slate-900">
                        {settings?.foundation_name || 'YAYASAN PENDIDIKAN CONTOH'}
                      </h1>
                      <h2 className="text-lg font-bold uppercase tracking-tight leading-tight text-slate-900 mt-0.5">
                        {settings?.school_name || 'SMK NEGERI CONTOH JAKARTA'}
                      </h2>
                      <p className="text-[11px] text-slate-600 mt-1 italic font-medium">
                        {settings?.address} {settings?.phone ? `| Telp: ${settings.phone}` : ''}
                      </p>
                    </div>

                    {settings?.logo_url ? (
                      <img src={settings.logo_url} alt="Logo Sekolah" className="w-20 h-20 object-contain shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[9px] text-slate-400 shrink-0">No Logo</div>
                    )}
                  </div>

                  {/* Document Title Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-base font-bold tracking-tight text-slate-900 uppercase underline">
                      LAPORAN HASIL AUDIT STRATEGIS & ROADMAP SARANA PRASARANA
                    </h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Nomor Dokumen: SMKN/SARPRAS-AUDIT/AI/{new Date().getFullYear()}/{Math.floor(Math.random() * 900) + 100}
                    </p>
                    <p className="text-xs text-slate-600 font-semibold mt-0.5">
                      Tanggal Evaluasi: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Metadata Table / Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-8 text-xs text-slate-700 print:bg-slate-50 print:border-slate-300">
                    <div className="space-y-1">
                      <div className="flex"><span className="w-28 font-semibold text-slate-500">Instansi / Sekolah:</span><span className="font-bold text-slate-900">{settings?.school_name || 'SMK Negeri'}</span></div>
                      <div className="flex"><span className="w-28 font-semibold text-slate-500">Metode Analisis:</span><span className="font-medium text-slate-900">Analis Cerdas AI & Live Database Integration</span></div>
                      <div className="flex"><span className="w-28 font-semibold text-slate-500">Auditor Utama:</span><span className="font-medium text-indigo-700 flex items-center gap-1 font-semibold">Gemini Advanced AI (CFO Agent)</span></div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex"><span className="w-28 font-semibold text-slate-500">Status Laporan:</span><span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold border border-emerald-200 print:bg-emerald-50">TERVERIFIKASI & AKTIF</span></div>
                      <div className="flex"><span className="w-28 font-semibold text-slate-500">Fokus Evaluasi:</span><span className="font-medium text-slate-900">Efisiensi Anggaran, Audit Kelayakan, Manajemen Risiko</span></div>
                      <div className="flex"><span className="w-28 font-semibold text-slate-500">Tahun Anggaran:</span><span className="font-bold text-slate-900">{new Date().getFullYear()} / {new Date().getFullYear() + 1}</span></div>
                    </div>
                  </div>

                  {/* Markdown content container */}
                  <div className="prose prose-slate max-w-none text-slate-900 text-sm leading-relaxed mb-12 print:text-xs">
                    <div className="markdown-body">
                      <Markdown>{analysis}</Markdown>
                    </div>
                  </div>

                  {/* Signatures section */}
                  <div className="mt-16 grid grid-cols-2 gap-12 text-xs">
                    <div className="text-center">
                      <p className="text-slate-600 font-medium">Mengetahui,</p>
                      <p className="font-bold uppercase text-slate-900 mt-1">Kepala Sekolah</p>
                      <div className="h-20" /> {/* Space for signature */}
                      <p className="font-bold underline uppercase text-slate-900">{settings?.principal_name || '.......................................'}</p>
                      <p className="text-slate-500 mt-0.5">NIP. {settings?.principal_nip || '.......................................'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-600 font-medium">
                        {settings?.address?.split(',')[0] || 'Jakarta'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="font-bold uppercase text-slate-900 mt-1">Waka Sarana Prasarana</p>
                      <div className="h-20" /> {/* Space for signature */}
                      <p className="font-bold underline uppercase text-slate-900">{settings?.waka_sarpras_name || '.......................................'}</p>
                      <p className="text-slate-500 mt-0.5">NIP. {settings?.waka_sarpras_nip || '.......................................'}</p>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
