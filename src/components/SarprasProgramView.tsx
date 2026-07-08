import React, { useState, useEffect } from 'react';
import { SarprasProgram, RabItem } from '../types';
import { 
  FileSpreadsheet, Clipboard, Calculator, Sparkles, TrendingUp, AlertTriangle, 
  CheckCircle2, Plus, Trash2, Printer, ChevronDown, ChevronUp, Edit2 
} from 'lucide-react';

interface SarprasProgramViewProps {
  currentUser: { id: number; username: string; name: string; role: string };
}

const POSITION_OPTIONS = [
  'Wali Kelas',
  'Wakil Kepala Sekolah Bidang Kesiswaan (Waka Kesiswaan)',
  'Wakil Kepala Sekolah Bidang Kurikulum (Waka Kurikulum)',
  'Wakil Kepala Sekolah Bidang Sarana Prasarana (Waka Sarpras)',
  'Kepala Urusan Tata Usaha (Kepala TU)',
  'Kepala Laboratorium / Bengkel',
  'Pembina Ekstrakurikuler',
  'Guru Mata Pelajaran',
  'Lainnya'
];

export function SarprasProgramView({ currentUser }: SarprasProgramViewProps) {
  const [programs, setPrograms] = useState<SarprasProgram[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPrintAllModal, setShowPrintAllModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<SarprasProgram | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedProgramId, setExpandedProgramId] = useState<number | null>(null);

  // Form Fields
  const [programName, setProgramName] = useState('');
  const [year, setYear] = useState(2026);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'rencana' | 'diajukan' | 'disetujui' | 'selesai'>('rencana');
  const [requesterPosition, setRequesterPosition] = useState('Wali Kelas');
  const [customPosition, setCustomPosition] = useState('');
  const [picName, setPicName] = useState(currentUser.name || '');
  const [realizationMonth, setRealizationMonth] = useState('Januari');
  const [realizationDate, setRealizationDate] = useState(new Date().toISOString().split('T')[0]);

  // Interactive Priority Score sliders
  const [urgency, setUrgency] = useState(3); // 1-5
  const [kbmImpact, setKbmImpact] = useState(3); // 1-5
  const [existingDeficit, setExistingDeficit] = useState(3); // 1-5
  const [priorityAnalysis, setPriorityAnalysis] = useState('');

  // Interactive RAB lines
  const [rabLines, setRabLines] = useState<RabItem[]>([]);
  const [newRabItem, setNewRabItem] = useState('');
  const [newRabQty, setNewRabQty] = useState(1);
  const [newRabUnit, setNewRabUnit] = useState('Unit');
  const [newRabPrice, setNewRabPrice] = useState(100000);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sarpras-programs');
      const data = await res.json();
      setPrograms(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  // Compute Priority Score and Level dynamically
  const computedScore = urgency + kbmImpact + existingDeficit;
  const getPriorityLevel = (score: number): 'Tinggi' | 'Sedang' | 'Rendah' => {
    if (score >= 12) return 'Tinggi';
    if (score >= 8) return 'Sedang';
    return 'Rendah';
  };
  const priorityLevel = getPriorityLevel(computedScore);

  // Generate automated analysis logic text
  useEffect(() => {
    if (!editingProgram) {
      const levelText = priorityLevel === 'Tinggi' ? 'Sangat Mendesak' : (priorityLevel === 'Sedang' ? 'Penting (Menengah)' : 'Rendah/Penunjang');
      setPriorityAnalysis(
        `Skor Prioritas: ${computedScore}/15 (${levelText}). Program ini dinilai berdasarkan tingkat urgensi (${urgency}/5), dampak KBM (${kbmImpact}/5), dan kelangkaan fasilitas eksisting (${existingDeficit}/5). Rekomendasi: ${
          priorityLevel === 'Tinggi' 
            ? 'Harus segera dianggarkan di APBS karena berdampak langsung pada kelancaran pendidikan sekolah.'
            : priorityLevel === 'Sedang'
            ? 'Diusulkan pada anggaran perubahan atau jika ada sisa dana sarana prasarana utama.'
            : 'Sifatnya penunjang sekunder, bisa ditunda atau dialihkan menggunakan sumber pendanaan komite mandiri.'
        }`
      );
    }
  }, [urgency, kbmImpact, existingDeficit, priorityLevel, computedScore, editingProgram]);

  // RAB management functions
  const handleAddRabLine = () => {
    if (!newRabItem.trim()) return;
    const subtotal = newRabQty * newRabPrice;
    const newLine: RabItem = {
      id: Date.now().toString(),
      item: newRabItem,
      qty: newRabQty,
      unit: newRabUnit,
      price: newRabPrice,
      total: subtotal
    };
    setRabLines([...rabLines, newLine]);
    // reset item input
    setNewRabItem('');
    setNewRabQty(1);
    setNewRabPrice(100000);
  };

  const handleRemoveRabLine = (id: string) => {
    setRabLines(rabLines.filter(line => line.id !== id));
  };

  const totalBudget = rabLines.reduce((sum, line) => sum + line.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!programName.trim()) {
      setError('Nama program kerja harus diisi.');
      return;
    }

    if (rabLines.length === 0) {
      setError('Minimal harus menambahkan satu baris item RAB pengajuan.');
      return;
    }

    const finalPosition = requesterPosition === 'Lainnya' ? customPosition : requesterPosition;

    const payload = {
      program_name: programName,
      year: parseInt(year as any),
      description,
      priority_level: priorityLevel,
      priority_analysis: priorityAnalysis,
      total_budget: totalBudget,
      rab_json: JSON.stringify(rabLines),
      status,
      requester_position: finalPosition || 'Lainnya',
      pic_name: picName,
      realization_month: realizationMonth,
      realization_date: realizationDate
    };

    try {
      let url = '/api/sarpras-programs';
      let method = 'POST';

      if (editingProgram) {
        url = `/api/sarpras-programs/${editingProgram.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(editingProgram ? 'Program berhasil diperbarui!' : 'Program baru dan RAB berhasil diajukan!');
        setProgramName('');
        setDescription('');
        setRabLines([]);
        setRequesterPosition('Wali Kelas');
        setCustomPosition('');
        setPicName(currentUser.name || '');
        setRealizationMonth('Januari');
        setRealizationDate(new Date().toISOString().split('T')[0]);
        setShowForm(false);
        setEditingProgram(null);
        fetchPrograms();
      } else {
        setError(data.message || 'Gagal menyimpan rencana kerja.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    }
  };

  const handleEdit = (p: SarprasProgram) => {
    setEditingProgram(p);
    setProgramName(p.program_name);
    setYear(p.year);
    setDescription(p.description);
    setPriorityAnalysis(p.priority_analysis);
    setStatus(p.status);
    setPicName(p.pic_name || currentUser.name || '');
    setRealizationMonth(p.realization_month || 'Januari');
    setRealizationDate(p.realization_date || new Date().toISOString().split('T')[0]);
    
    const pos = p.requester_position || 'Wali Kelas';
    if (POSITION_OPTIONS.includes(pos)) {
      setRequesterPosition(pos);
      setCustomPosition('');
    } else {
      setRequesterPosition('Lainnya');
      setCustomPosition(pos);
    }

    try {
      setRabLines(JSON.parse(p.rab_json));
    } catch (err) {
      setRabLines([]);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus program kerja dan pengajuan RAB ini?')) return;
    try {
      const res = await fetch(`/api/sarpras-programs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchPrograms();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  return (
    <div className="p-8 space-y-6">
      
      {/* Overview Card */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Program & Rencana Kerja Sarpras</h3>
          <p className="text-sm text-slate-500 font-medium">Analisis prioritas, pemetaan anggaran kerja (RAB), dan pengajuan kebutuhan barang sekolah</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowPrintAllModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-all border border-slate-200"
          >
            <Printer size={16} /> Cetak Semua Pengajuan
          </button>
          
          <button
            onClick={() => {
              setEditingProgram(null);
              setProgramName('');
              setDescription('');
              setRabLines([]);
              setPicName(currentUser.name || '');
              setRealizationMonth('Januari');
              setRealizationDate(new Date().toISOString().split('T')[0]);
              setShowForm(!showForm);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10"
          >
            <Plus size={16} /> Rencanakan Program
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* Program Creator and Editor Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="text-lg font-bold text-slate-900">
              {editingProgram ? 'Edit Rencana Program Sarpras' : 'Buat Program Sarpras & Anggaran RAB'}
            </h4>
            <button 
              onClick={() => { setShowForm(false); setEditingProgram(null); }} 
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Row 1: General Specs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Program Kerja <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="input text-sm" 
                  placeholder="Contoh: Pengadaan 10 Komputer Client untuk Lab Komputer Baru"
                  value={programName}
                  onChange={e => setProgramName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tahun Anggaran</label>
                <select 
                  className="input text-sm"
                  value={year}
                  onChange={e => setYear(parseInt(e.target.value))}
                >
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                  <option value={2029}>2029</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Deskripsi & Latar Belakang Masalah</label>
              <textarea 
                className="input h-20 resize-none text-sm"
                placeholder="Tuliskan latar belakang masalah mengapa program sarpras ini diusulkan..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Realization & PIC information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama PIC Penanggung Jawab <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="input text-sm h-9" 
                  placeholder="Masukkan Nama Lengkap PIC"
                  value={picName}
                  onChange={e => setPicName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bulan Pengajuan / Realisasi</label>
                <select 
                  className="input text-sm h-9"
                  value={realizationMonth}
                  onChange={e => setRealizationMonth(e.target.value)}
                >
                  {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tanggal Pengajuan / Realisasi</label>
                <input 
                  type="date" 
                  className="input text-sm h-9" 
                  value={realizationDate}
                  onChange={e => setRealizationDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pihak / Jabatan Pengaju</label>
                <select 
                  className="input text-sm"
                  value={requesterPosition}
                  onChange={e => setRequesterPosition(e.target.value)}
                  required
                >
                  {POSITION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {requesterPosition === 'Lainnya' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tuliskan Jabatan Pengaju Custom <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    className="input text-sm" 
                    placeholder="Misal: Staf Perpustakaan, Kepala Bengkel Otomotif"
                    value={customPosition}
                    onChange={e => setCustomPosition(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            {/* Row 2: Interactive Priority Evaluation Calculator */}
            <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Calculator size={18} />
                <span>Kalkulator Analisis Prioritas Kebutuhan</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Sliders */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">1. Tingkat Urgensi</span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">{urgency}/5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    className="w-full accent-indigo-600 cursor-pointer"
                    value={urgency}
                    onChange={e => setUrgency(parseInt(e.target.value))}
                  />
                  <p className="text-[10px] text-slate-400 italic">5 = Sangat darurat/kritis; 1 = Bisa ditunda jangka panjang</p>
                </div>

                <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">2. Dampak KBM / Siswa</span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">{kbmImpact}/5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    className="w-full accent-indigo-600 cursor-pointer"
                    value={kbmImpact}
                    onChange={e => setKbmImpact(parseInt(e.target.value))}
                  />
                  <p className="text-[10px] text-slate-400 italic">5 = Digunakan harian oleh siswa; 1 = Kemanfaatan tidak langsung</p>
                </div>

                <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-50 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">3. Kelangkaan / Defisit</span>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">{existingDeficit}/5</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" 
                    className="w-full accent-indigo-600 cursor-pointer"
                    value={existingDeficit}
                    onChange={e => setExistingDeficit(parseInt(e.target.value))}
                  />
                  <p className="text-[10px] text-slate-400 italic">5 = Tidak ada alternatif sama sekali; 1 = Masih ada barang pengganti</p>
                </div>

              </div>

              {/* Dynamic Priority Result Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 items-center">
                <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Skor Prioritas</span>
                  <span className="text-3xl font-extrabold text-indigo-400 mt-1">{computedScore} <span className="text-xs text-slate-400">/ 15</span></span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase mt-2 ${
                    priorityLevel === 'Tinggi' ? 'bg-rose-500 text-white' : (priorityLevel === 'Sedang' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white')
                  }`}>
                    Prioritas {priorityLevel}
                  </span>
                </div>

                <div className="md:col-span-3 bg-white p-4 rounded-xl border border-indigo-100 flex flex-col justify-between h-full">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Justifikasi Hasil Analisis Kebutuhan</span>
                  <textarea 
                    className="text-xs text-slate-600 italic bg-slate-50 border-none rounded-lg p-2 mt-2 h-16 w-full resize-none focus:outline-none"
                    value={priorityAnalysis}
                    onChange={e => setPriorityAnalysis(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: RAB Budget Builder */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <FileSpreadsheet size={18} className="text-indigo-600" />
                  <span>Penyusunan RAB Anggaran Detail Barang</span>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl">
                  Total RAB: {formatIDR(totalBudget)}
                </span>
              </div>

              {/* Input for new RAB Line */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Spesifikasi Item Barang</label>
                  <input 
                    type="text" 
                    className="input text-xs" 
                    placeholder="Contoh: PC core i5 RAM 8GB SSD 256GB"
                    value={newRabItem}
                    onChange={e => setNewRabItem(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Jumlah (Qty)</label>
                  <input 
                    type="number" 
                    className="input text-xs font-mono" 
                    value={newRabQty}
                    onChange={e => setNewRabQty(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Satuan</label>
                  <input 
                    type="text" 
                    className="input text-xs" 
                    placeholder="Pcs/Unit/Set"
                    value={newRabUnit}
                    onChange={e => setNewRabUnit(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Harga Satuan (Rp)</label>
                  <input 
                    type="number" 
                    className="input text-xs font-mono" 
                    value={newRabPrice}
                    onChange={e => setNewRabPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                </div>

                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddRabLine}
                    className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center transition-all shadow-sm shadow-indigo-600/10"
                    title="Tambah item ke RAB"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* RAB Lines Table */}
              {rabLines.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 italic bg-slate-50/50 rounded-xl">Belum ada item barang yang diinputkan dalam RAB ini.</p>
              ) : (
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <th className="p-2.5 font-bold">Nama Item</th>
                        <th className="p-2.5 font-bold text-center">Qty</th>
                        <th className="p-2.5 font-bold">Satuan</th>
                        <th className="p-2.5 font-bold text-right">Harga Satuan</th>
                        <th className="p-2.5 font-bold text-right">Subtotal</th>
                        <th className="p-2.5 font-bold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rabLines.map(line => (
                        <tr key={line.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-semibold">{line.item}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-indigo-600">{line.qty}</td>
                          <td className="p-2.5 text-slate-500">{line.unit}</td>
                          <td className="p-2.5 text-right font-mono">{formatIDR(line.price)}</td>
                          <td className="p-2.5 text-right font-mono font-bold">{formatIDR(line.total)}</td>
                          <td className="p-2.5 text-center">
                            <button 
                              type="button" 
                              onClick={() => handleRemoveRabLine(line.id)}
                              className="p-1 text-slate-400 hover:text-red-600 rounded"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Submit & Meta Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 mr-4">
                  Status Pengajuan:
                  <select 
                    className="bg-slate-100 border-none text-xs rounded-lg py-1 px-2.5 font-bold text-indigo-700 focus:ring-0 cursor-pointer"
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                  >
                    <option value="rencana">Rencana (Draft)</option>
                    <option value="diajukan">Diajukan</option>
                    {['admin', 'kepala_sekolah', 'waka_sarpras'].includes(currentUser.role) && (
                      <>
                        <option value="disetujui">Disetujui</option>
                        <option value="selesai">Selesai/Realisasi</option>
                      </>
                    )}
                  </select>
                </label>
                {!['admin', 'kepala_sekolah', 'waka_sarpras'].includes(currentUser.role) && (
                  <span className="text-[10px] text-slate-400 font-semibold italic block mt-1">* Persetujuan hanya dapat disahkan oleh Kepala Sekolah / Waka Sarpras / Admin</span>
                )}
              </div>

              {error && (
                <span className="text-red-500 text-xs font-semibold">{error}</span>
              )}

              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); setEditingProgram(null); }} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10"
                >
                  {editingProgram ? 'Simpan Perubahan' : 'Ajukan Program & RAB'}
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* Program list dashboard */}
      <div className="space-y-4">
        {programs.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <Clipboard size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Belum ada program kerja sarpras yang direncanakan</p>
            <p className="text-xs text-slate-400 mt-1">Daftarkan rencana kegiatan sarpras Anda untuk dilakukan kalkulasi prioritas.</p>
          </div>
        ) : (
          programs.map(p => {
            const isExpanded = expandedProgramId === p.id;
            let rab: RabItem[] = [];
            try {
              rab = JSON.parse(p.rab_json);
            } catch (err) {}

            return (
              <div 
                key={p.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all overflow-hidden"
              >
                {/* Header info */}
                <div 
                  className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedProgramId(isExpanded ? null : p.id)}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Tahun {p.year}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        p.priority_level === 'Tinggi' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : p.priority_level === 'Sedang'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        Prioritas {p.priority_level}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        p.status === 'disetujui' ? 'bg-indigo-100 text-indigo-800' :
                        p.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' :
                        p.status === 'diajukan' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {p.status}
                      </span>
                      {p.requester_position && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          Pengaju: {p.requester_position}
                        </span>
                      )}
                      {p.pic_name && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                          PIC: {p.pic_name}
                        </span>
                      )}
                      {p.realization_month && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                          Bulan Pengajuan: {p.realization_month}
                        </span>
                      )}
                      {p.realization_date && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100 font-mono">
                          Realisasi: {p.realization_date}
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-slate-800 text-base truncate" title={p.program_name}>
                      {p.program_name}
                    </h4>

                    {p.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-slate-50 pt-3 md:pt-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Total RAB Anggaran</p>
                      <p className="font-extrabold text-indigo-600 text-base">{formatIDR(p.total_budget)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {true && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                      <div className="p-1 text-slate-400">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details section */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/40 space-y-4 pt-4 animate-in fade-in duration-200">
                    
                    {/* Priority justification analysis print */}
                    <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-sm">
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <TrendingUp size={12} className="text-indigo-500" /> Hasil Analisis Prioritas & Kelayakan
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                        {p.priority_analysis}
                      </p>
                    </div>

                    {/* RAB Lines Print List */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">Rincian Rencana Anggaran Biaya (RAB)</span>
                        <button
                          onClick={() => window.print()}
                          className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                        >
                          <Printer size={12} /> Cetak RAB
                        </button>
                      </div>

                      <div className="p-3 text-xs">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400">
                              <th className="pb-2">Nama Barang</th>
                              <th className="pb-2 text-center">Volume</th>
                              <th className="pb-2">Satuan</th>
                              <th className="pb-2 text-right">Harga Satuan</th>
                              <th className="pb-2 text-right">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 text-slate-700">
                            {rab.map((r, i) => (
                              <tr key={r.id || i} className="hover:bg-slate-50/50">
                                <td className="py-2.5 font-medium">{r.item}</td>
                                <td className="py-2.5 text-center font-bold font-mono text-indigo-600">{r.qty}</td>
                                <td className="py-2.5 text-slate-500">{r.unit}</td>
                                <td className="py-2.5 text-right font-mono">{formatIDR(r.price)}</td>
                                <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatIDR(r.total)}</td>
                              </tr>
                            ))}
                            <tr className="border-t border-slate-200 font-bold bg-slate-50/30">
                              <td colSpan={4} className="py-3 text-right text-slate-600 uppercase tracking-wider font-bold">Jumlah Total Pengajuan RAB:</td>
                              <td className="py-3 text-right font-mono text-indigo-700 text-sm font-extrabold">{formatIDR(p.total_budget)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showPrintAllModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print:absolute print:inset-0 print:bg-white print:p-0">
          <div className="bg-white rounded-2xl max-w-5xl w-full p-8 shadow-2xl space-y-6 print:shadow-none print:p-0">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 print:hidden">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cetak Laporan Semua Pengajuan Program & RAB</h3>
                <p className="text-xs text-slate-500 font-medium">Laporan rekapitulasi rencana kerja dan realisasi sarana prasarana sekolah</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Printer size={14} /> Cetak Sekarang
                </button>
                <button
                  onClick={() => setShowPrintAllModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div className="space-y-6">
              {/* Header Kop Surat */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900">
                <h1 className="text-lg font-extrabold tracking-wide uppercase text-slate-900">LAPORAN REKAPITULASI PENGAJUAN PROGRAM & ANGGARAN RAB</h1>
                <p className="text-xs font-bold text-slate-700 uppercase">NUCEN ESARPRAS - SISTEM INFORMASI SARPRAS SEKOLAH</p>
                <p className="text-[10px] text-slate-500 font-mono">Dibuat Otomatis pada: {new Date().toLocaleString('id-ID')}</p>
              </div>

              {/* Table list */}
              <table className="w-full text-left border-collapse border border-slate-300 text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300 font-bold uppercase text-[9px] text-slate-700">
                    <th className="p-2 border border-slate-300">No</th>
                    <th className="p-2 border border-slate-300">Nama Program</th>
                    <th className="p-2 border border-slate-300">Pengaju / PIC</th>
                    <th className="p-2 border border-slate-300 text-center">Tahun</th>
                    <th className="p-2 border border-slate-300">Bulan / Realisasi</th>
                    <th className="p-2 border border-slate-300 text-center">Prioritas</th>
                    <th className="p-2 border border-slate-300 text-center">Status</th>
                    <th className="p-2 border border-slate-300 text-right">Total Anggaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {programs.map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50/30">
                      <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-bold">{p.program_name}</td>
                      <td className="p-2 border border-slate-300">
                        <p className="font-semibold">{p.pic_name || '-'}</p>
                        <span className="text-[10px] text-slate-500">{p.requester_position}</span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono">{p.year}</td>
                      <td className="p-2 border border-slate-300">
                        <p className="font-semibold">{p.realization_month || '-'}</p>
                        <span className="text-[10px] text-slate-500 font-mono">{p.realization_date || '-'}</span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          p.priority_level === 'Tinggi' ? 'bg-red-50 text-red-700' : (p.priority_level === 'Sedang' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700')
                        }`}>
                          {p.priority_level}
                        </span>
                      </td>
                      <td className="p-2 border border-slate-300 text-center uppercase font-bold text-[9px]">{p.status}</td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold text-slate-900">{formatIDR(p.total_budget)}</td>
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={7} className="p-2.5 border border-slate-300 text-right uppercase">Total Seluruh Anggaran Pengajuan:</td>
                    <td className="p-2.5 border border-slate-300 text-right font-mono text-indigo-700 text-sm">
                      {formatIDR(programs.reduce((sum, p) => sum + p.total_budget, 0))}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signature lines for approvals */}
              <div className="pt-12 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-900">Mengetahui,</p>
                  <p className="font-bold text-slate-900">Kepala Sekolah</p>
                  <div className="h-20 flex items-end justify-center">
                    <span className="border-b border-slate-800 w-40 font-bold">....................................</span>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Diverifikasi Oleh,</p>
                  <p className="font-bold text-slate-900">Wakil Kepala Sekolah Sarpras</p>
                  <div className="h-20 flex items-end justify-center">
                    <span className="border-b border-slate-800 w-40 font-bold">....................................</span>
                  </div>
                </div>

                <div>
                  <p className="font-bold text-slate-900">Dibuat Oleh,</p>
                  <p className="font-bold text-slate-900">Petugas Sarana Prasarana</p>
                  <div className="h-20 flex items-end justify-center">
                    <span className="border-b border-slate-800 w-40 font-bold">{currentUser.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
