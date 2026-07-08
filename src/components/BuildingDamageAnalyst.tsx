import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Wrench, 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  Printer, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  HelpCircle,
  PlusCircle,
  Calendar,
  UserCheck,
  Camera,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { useReactToPrint } from 'react-to-print';
import { InventoryItem, SchoolSettings, BuildingAssessment, User } from '../types';

interface BuildingDamageAnalystProps {
  user: User;
}

const COMPONENT_METADATA = [
  { key: 'pondasi', label: '1. Pondasi', weight: 10, desc: 'Kondisi pondasi, kestabilan tanah, penurunan, retak tiang pancang/sloof.' },
  { key: 'kolom_balok', label: '2. Struktur Kolom & Balok', weight: 30, desc: 'Pilar beton, ring balk, keretakan beton struktural, selimut beton pecah, baja terlihat.' },
  { key: 'pelat_lantai', label: '3. Pelat Lantai (Slab)', weight: 10, desc: 'Retak pelat beton, lendutan lantai atas, rembesan air di bawah pelat lantai.' },
  { key: 'rangka_atap', label: '4. Rangka Atap', weight: 10, desc: 'Kuda-kuda kayu lapuk/rangka baja ringan korosi, reng/gording melendut, gording bergeser.' },
  { key: 'dinding', label: '5. Dinding Pasangan', weight: 15, desc: 'Retak tembok, dinding miring, plesteran lepas, bata rontok.' },
  { key: 'plafon', label: '6. Langit-langit (Plafon)', weight: 10, desc: 'Rangka plafon rapuh, lembar plafon jebol, bernoda basah akibat kebocoran.' },
  { key: 'lantai', label: '7. Lantai (Finishing)', weight: 5, desc: 'Keramik pecah, keramik terangkat (popping), amblas permukaan lantai.' },
  { key: 'utilitas', label: '8. Utilitas & Finishing', weight: 10, desc: 'Sanitasi (pipa air/kloset), kelistrikan (kabel/saklar), pintu/jendela kusen keropos.' }
];

export function BuildingDamageAnalyst({ user }: BuildingDamageAnalystProps) {
  const [activeTab, setActiveTab] = useState<'assess' | 'history'>('assess');
  const [buildings, setBuildings] = useState<InventoryItem[]>([]);
  const [history, setHistory] = useState<BuildingAssessment[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  // Form State
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [assessorName, setAssessorName] = useState<string>(user.name || '');
  const [notes, setNotes] = useState<string>('');
  
  // Manual Damage states (percentages 0-100)
  const [manualDamageValues, setManualDamageValues] = useState<Record<string, number>>({
    pondasi: 0,
    kolom_balok: 0,
    pelat_lantai: 0,
    rangka_atap: 0,
    dinding: 0,
    plafon: 0,
    lantai: 0,
    utilitas: 0
  });

  // AI Damage states (percentages 0-100)
  const [aiDamageValues, setAiDamageValues] = useState<Record<string, number>>({
    pondasi: 0,
    kolom_balok: 0,
    pelat_lantai: 0,
    rangka_atap: 0,
    dinding: 0,
    plafon: 0,
    lantai: 0,
    utilitas: 0
  });

  // Current mode / source selected for final verification and storage
  const [selectedSource, setSelectedSource] = useState<'manual' | 'ai' | 'average'>('manual');

  // AI Symptoms field
  const [symptoms, setSymptoms] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiAssessment, setAiAssessment] = useState<string>('');
  
  // Submission & deletion state
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Selected audit for printing preview / modal
  const [selectedAuditForPrint, setSelectedAuditForPrint] = useState<BuildingAssessment | null>(null);

  // Component photos state
  const [componentPhotos, setComponentPhotos] = useState<Record<string, string>>({});

  // Expandable assessment list row
  const [expandedAuditId, setExpandedAuditId] = useState<number | null>(null);

  const handlePhotoUpload = (key: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setComponentPhotos(prev => ({
        ...prev,
        [key]: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (key: string) => {
    setComponentPhotos(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // Printing Ref
  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  // Fetch Buildings, History, Settings on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch buildings (items with category 'bangunan')
      const bRes = await fetch('/api/inventory?category=bangunan');
      const bData = await bRes.json();
      setBuildings(bData);

      // Fetch history
      const hRes = await fetch('/api/building-assessments');
      const hData = await hRes.json();
      setHistory(hData);

      // Fetch settings
      const sRes = await fetch('/api/settings');
      const sData = await sRes.json();
      setSettings(sData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  // Live calculation of weighted damage
  const calculateWeightedDamage = (values: Record<string, number>) => {
    let total = 0;
    COMPONENT_METADATA.forEach(comp => {
      const inputVal = values[comp.key] || 0;
      total += (comp.weight * (inputVal / 100));
    });
    return parseFloat(total.toFixed(2));
  };

  const manualTotalDamage = calculateWeightedDamage(manualDamageValues);
  const aiTotalDamage = calculateWeightedDamage(aiDamageValues);

  // Derive final values to be stored based on selectedSource
  const getFinalDamageValues = () => {
    const finalVals: Record<string, number> = {};
    COMPONENT_METADATA.forEach(comp => {
      const mVal = manualDamageValues[comp.key] || 0;
      const aVal = aiDamageValues[comp.key] || 0;
      if (selectedSource === 'manual') {
        finalVals[comp.key] = mVal;
      } else if (selectedSource === 'ai') {
        finalVals[comp.key] = aVal;
      } else {
        finalVals[comp.key] = Math.round((mVal + aVal) / 2);
      }
    });
    return finalVals;
  };

  const finalDamageValues = getFinalDamageValues();
  const totalDamage = calculateWeightedDamage(finalDamageValues);

  // Determine DPUPR Classification
  const getClassification = (score: number) => {
    if (score <= 30) return 'Kerusakan Ringan';
    if (score <= 45) return 'Kerusakan Sedang';
    return 'Kerusakan Berat';
  };

  const currentClassification = getClassification(totalDamage);

  const getClassificationStyles = (classification: string) => {
    switch (classification) {
      case 'Kerusakan Ringan':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          gaugeColor: '#10b981',
          desc: 'Kerusakan pada komponen non-struktural saja seperti plafon, lantai, penutup atap, atau dinding partisi. Struktur utama (fondasi, kolom, balok) tetap stabil.'
        };
      case 'Kerusakan Sedang':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          gaugeColor: '#f59e0b',
          desc: 'Kerusakan pada sebagian komponen non-struktural dan/atau beberapa komponen struktural utama seperti keretakan rambut pada kolom beton atau balok.'
        };
      default:
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          gaugeColor: '#f43f5e',
          desc: 'Kerusakan parah pada sebagian besar komponen bangunan, baik struktural maupun non-struktural. Sebagian kolom patah, lantai amblas parah, atau rangka atap runtuh.'
        };
    }
  };

  // Copy AI values to Manual sliders
  const handleCopyAiToManual = () => {
    setManualDamageValues({ ...aiDamageValues });
  };

  // Reset manual values to zero
  const handleResetManual = () => {
    setManualDamageValues({
      pondasi: 0,
      kolom_balok: 0,
      pelat_lantai: 0,
      rangka_atap: 0,
      dinding: 0,
      plafon: 0,
      lantai: 0,
      utilitas: 0
    });
  };

  // AI Symptoms analyzer handler
  const handleAIAnalyze = async () => {
    if (!symptoms.trim()) {
      alert("Masukkan gejala fisik bangunan terlebih dahulu.");
      return;
    }

    setAiLoading(true);
    setAiAssessment('');
    try {
      const res = await fetch('/api/gemini/analyze-building-damage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms })
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        const { data } = resData;
        
        // Update percentages for AI evaluation
        setAiDamageValues({
          pondasi: data.pondasi_pct ?? 0,
          kolom_balok: data.kolom_balok_pct ?? 0,
          pelat_lantai: data.pelat_lantai_pct ?? 0,
          rangka_atap: data.rangka_atap_pct ?? 0,
          dinding: data.dinding_pct ?? 0,
          plafon: data.plafon_pct ?? 0,
          lantai: data.lantai_pct ?? 0,
          utilitas: data.utilitas_pct ?? 0
        });

        setAiAssessment(data.narrative_assessment || '');
        // Default select to combinations or manual depending on choice
        setSelectedSource('average');
      } else {
        alert("Gagal menganalisis gejala kerusakan.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan koneksi saat melakukan analisis AI.");
    } finally {
      setAiLoading(false);
    }
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuildingId) {
      setErrorMsg("Pilih gedung yang akan dianalisis.");
      return;
    }
    if (!assessorName.trim()) {
      setErrorMsg("Nama Pemeriksa / Auditor harus diisi.");
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Append a clear comparative notes breakdown to notes
      const compNotes = `[METODE VERIFIKASI: ${selectedSource === 'manual' ? 'Pemeriksaan Manual Murni' : selectedSource === 'ai' ? 'Estimasi AI Murni' : 'Kombinasi Manual & AI'}]\n- Hasil Survei Lapangan Manual: ${manualTotalDamage}%\n- Hasil Estimasi Gejala AI: ${aiTotalDamage}%\n\n${notes}`;

      const payload = {
        item_id: parseInt(selectedBuildingId),
        assessor_name: assessorName,
        pondasi_pct: finalDamageValues.pondasi,
        kolom_balok_pct: finalDamageValues.kolom_balok,
        pelat_lantai_pct: finalDamageValues.pelat_lantai,
        rangka_atap_pct: finalDamageValues.rangka_atap,
        dinding_pct: finalDamageValues.dinding,
        plafon_pct: finalDamageValues.plafon,
        lantai_pct: finalDamageValues.lantai,
        utilitas_pct: finalDamageValues.utilitas,
        total_damage_pct: totalDamage,
        classification: currentClassification,
        notes: compNotes,
        ai_recommendation: aiAssessment || null,
        photos_json: JSON.stringify(componentPhotos)
      };

      const res = await fetch('/api/building-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Laporan analisis kerusakan gedung berhasil disimpan ke dalam database!");
        // Reset states
        setSelectedBuildingId('');
        setNotes('');
        setSymptoms('');
        setAiAssessment('');
        setComponentPhotos({});
        setManualDamageValues({
          pondasi: 0,
          kolom_balok: 0,
          pelat_lantai: 0,
          rangka_atap: 0,
          dinding: 0,
          plafon: 0,
          lantai: 0,
          utilitas: 0
        });
        setAiDamageValues({
          pondasi: 0,
          kolom_balok: 0,
          pelat_lantai: 0,
          rangka_atap: 0,
          dinding: 0,
          plafon: 0,
          lantai: 0,
          utilitas: 0
        });
        setSelectedSource('manual');
        fetchData();
        // Switch to history tab
        setTimeout(() => {
          setActiveTab('history');
          setSuccessMsg('');
        }, 1500);
      } else {
        setErrorMsg(data.message || "Gagal menyimpan laporan.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Gagal menghubungi server.");
    } finally {
      setSaving(false);
    }
  };

  // Delete assessment history handler
  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan analisis kerusakan ini?")) return;

    try {
      const res = await fetch(`/api/building-assessments/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setHistory(prev => prev.filter(h => h.id !== id));
      } else {
        alert("Gagal menghapus.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger printable view
  const triggerPrintAudit = (audit: BuildingAssessment) => {
    setSelectedAuditForPrint(audit);
    setTimeout(() => {
      handlePrint();
    }, 200);
  };

  // Style details for currently calculated values
  const currentStyles = getClassificationStyles(currentClassification);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={26} />
            Analisis Kerusakan Gedung (DPUPR)
          </h1>
          <p className="text-slate-500 text-sm">
            Modul audit standar Dinas Pekerjaan Umum & Penataan Ruang (PUPR) untuk pengajuan rehabilitasi sarana prasarana sekolah.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('assess')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'assess'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench size={14} />
            Evaluasi Kerusakan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText size={14} />
            Daftar & Riwayat Laporan ({history.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'assess' ? (
          <motion.div
            key="assess-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left Column: Form & Sliders */}
            <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-6">
              <div className="card bg-white p-6 shadow-md border border-slate-200/80 space-y-6">
                <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <UserCheck className="text-indigo-600" size={18} />
                  Informasi Gedung & Pemeriksa
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Pilih Gedung / Bangunan <span className="text-rose-500">*</span></label>
                    <select
                      className="select w-full"
                      value={selectedBuildingId}
                      onChange={e => setSelectedBuildingId(e.target.value)}
                      required
                    >
                      <option value="">-- Pilih Bangunan yang Dievaluasi --</option>
                      {buildings.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.building_code ? `[${b.building_code}]` : ''} - Luas: {b.building_area || '-'}m²
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Nama Pemeriksa / Auditor <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Contoh: Waka Sarpras / Dinas PUPR"
                      value={assessorName}
                      onChange={e => setAssessorName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <HelpCircle size={15} className="text-indigo-600 shrink-0" />
                  <span>Isi persentase kerusakan tiap komponen fisik bangunan di bawah ini berdasarkan temuan di lapangan, atau gunakan asisten AI untuk estimasi instan.</span>
                </div>
              </div>

              {/* Asisten Gejala AI */}
              <div className="card bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 shadow-xl border border-indigo-950 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                    <Sparkles size={16} className="text-yellow-400" />
                    Asisten Analisis Kerusakan AI (DPUPR Standard)
                  </h3>
                  <span className="text-[10px] bg-indigo-800 text-indigo-200 font-bold px-2 py-0.5 rounded-full">Gemini Advanced</span>
                </div>

                <p className="text-xs text-indigo-100 leading-relaxed">
                  Ceritakan deskripsi kondisi kerusakan gedung (misal: "tembok ruang kelas miring dan retak lebar, air merembes dari dak beton lantai atas, genteng banyak bocor hingga kayu reng lapuk"). AI akan mendeteksi bobot kerusakan komponen secara otomatis.
                </p>

                <div className="space-y-3">
                  <textarea
                    className="w-full h-24 p-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Tulis gejala fisik bangunan secara spesifik di sini..."
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAIAnalyze}
                      disabled={aiLoading}
                      className="btn bg-white hover:bg-slate-100 text-indigo-950 font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 shadow-md border-none transition-all"
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Menganalisis Gejala PUPR...
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                          Estimasi & Analisis AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {aiAssessment && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 max-h-60 overflow-y-auto text-xs"
                  >
                    <div className="font-bold text-indigo-300 border-b border-white/10 pb-1 flex items-center gap-1">
                      <CheckCircle size={14} className="text-emerald-400" />
                      Narasi Rekomendasi Teknis AI:
                    </div>
                    <div className="prose prose-invert max-w-none text-[11px] leading-relaxed">
                      <Markdown>{aiAssessment}</Markdown>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sliders Grid with Manual vs AI Comparison columns */}
              <div className="card bg-white p-6 shadow-md border border-slate-200/80 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Wrench className="text-indigo-600" size={18} />
                    Bobot & Komparasi Kerusakan (Manual vs AI)
                  </h3>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAiToManual}
                      disabled={aiTotalDamage === 0}
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 border border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Gunakan nilai AI sebagai dasar pemeriksaan manual"
                    >
                      <Sparkles size={11} />
                      Salin Estimasi AI ke Manual
                    </button>
                    <button
                      type="button"
                      onClick={handleResetManual}
                      className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold transition-all border border-slate-200"
                    >
                      Reset Manual
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {COMPONENT_METADATA.map((comp) => {
                    const manualVal = manualDamageValues[comp.key] || 0;
                    const aiVal = aiDamageValues[comp.key] || 0;
                    const delta = manualVal - aiVal;

                    return (
                      <div key={comp.key} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 transition-all space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-bold text-slate-800">{comp.label}</span>
                            <span className="text-[10px] text-slate-400 block font-medium">Bobot Max: {comp.weight}%</span>
                          </div>
                          
                          {/* Dual Value Pill */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded" title="Manual">
                              M: {manualVal}%
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Estimasi AI">
                              <Sparkles size={9} />
                              AI: {aiVal}%
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-500 leading-tight">
                          {comp.desc}
                        </p>

                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            className="w-full accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            value={manualVal}
                            onChange={(e) => {
                              setManualDamageValues({
                                ...manualDamageValues,
                                [comp.key]: parseInt(e.target.value)
                              });
                            }}
                          />
                        </div>

                        {/* Delta indicators */}
                        <div className="flex justify-between items-center text-[9px] font-semibold">
                          <span className="text-slate-400 uppercase text-[8px]">Geser untuk Manual</span>
                          {aiVal > 0 && (
                            <span className={`px-1.5 py-0.5 rounded font-bold ${
                              delta === 0 
                                ? 'text-emerald-700 bg-emerald-50' 
                                : delta > 0 
                                  ? 'text-rose-700 bg-rose-50' 
                                  : 'text-amber-700 bg-amber-50'
                            }`}>
                              {delta === 0 ? 'Cocok' : delta > 0 ? `Manual +${delta}%` : `Manual ${delta}%`}
                            </span>
                          )}
                        </div>

                        {/* Photo Upload Section */}
                        <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {componentPhotos[comp.key] ? (
                              <div className="relative group w-9 h-9 rounded border border-slate-200 overflow-hidden bg-slate-100 shadow-sm shrink-0">
                                <img 
                                  src={componentPhotos[comp.key]} 
                                  alt={`Foto ${comp.label}`} 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(comp.key)}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                  title="Hapus foto"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ) : (
                              <div className="w-9 h-9 rounded border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 shrink-0">
                                <Camera size={13} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-[9px] font-bold text-slate-700 block truncate">
                                {componentPhotos[comp.key] ? 'Foto Terunggah' : 'Belum Ada Foto'}
                              </span>
                              <span className="text-[8px] text-slate-400 block">Bukti visual kerusakan</span>
                            </div>
                          </div>

                          <div>
                            <label className="cursor-pointer px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded text-[9px] font-bold transition-all inline-flex items-center gap-1">
                              <Upload size={10} />
                              Pilih Foto
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePhotoUpload(comp.key, file);
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <label className="label">Catatan Rekomendasi Tambahan (Opsional)</label>
                  <textarea
                    className="textarea w-full"
                    placeholder="Masukkan catatan pendukung evaluasi struktur, kerusakan spesifik ruangan, dsb."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 font-medium">
                    <XCircle size={16} />
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2 font-medium animate-pulse">
                    <CheckCircle size={16} />
                    {successMsg}
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary bg-gradient-to-r from-indigo-600 to-violet-600 border-none px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-100 font-bold text-xs flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="animate-spin" size={15} />
                        Menyimpan Analisis...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={15} />
                        Simpan Analisis Kerusakan ({selectedSource === 'manual' ? 'Manual' : selectedSource === 'ai' ? 'AI' : 'Rata-rata'})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Right Column: Live Result Indicator */}
            <div className="lg:col-span-4 space-y-6">
              <div className="sticky top-6 space-y-6">
                
                {/* Comparatives Selector & Gauges */}
                <div className="card bg-white p-6 shadow-md border border-slate-200/80 text-center space-y-6">
                  
                  {/* Gauge Section: Side-by-Side Mini Dials */}
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-3">HASIL KOMPARASI INDEKS</h3>
                    <div className="grid grid-cols-2 gap-4">
                      
                      {/* Manual Gauge */}
                      <div className="p-2 bg-slate-50/50 rounded-xl border border-slate-100 flex flex-col items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Hasil Manual</span>
                        <div className="relative w-20 h-20 mt-2 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="#e2e8f0" strokeWidth="6" fill="transparent" />
                            <circle cx="40" cy="40" r="34" stroke="#475569" strokeWidth="6" fill="transparent" strokeDasharray={213} strokeDashoffset={213 - (213 * manualTotalDamage) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                          </svg>
                          <span className="absolute text-xs font-black text-slate-700">{manualTotalDamage}%</span>
                        </div>
                        <span className="text-[8px] font-extrabold text-slate-500 mt-1 uppercase truncate max-w-full">
                          {getClassification(manualTotalDamage)}
                        </span>
                      </div>

                      {/* AI Gauge */}
                      <div className="p-2 bg-indigo-50/30 rounded-xl border border-indigo-100 flex flex-col items-center">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-tight flex items-center gap-0.5">
                          <Sparkles size={8} /> Estimasi AI
                        </span>
                        <div className="relative w-20 h-20 mt-2 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="#e0e7ff" strokeWidth="6" fill="transparent" />
                            <circle cx="40" cy="40" r="34" stroke="#6366f1" strokeWidth="6" fill="transparent" strokeDasharray={213} strokeDashoffset={213 - (213 * aiTotalDamage) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                          </svg>
                          <span className="absolute text-xs font-black text-indigo-700">{aiTotalDamage}%</span>
                        </div>
                        <span className="text-[8px] font-extrabold text-indigo-600 mt-1 uppercase truncate max-w-full">
                          {aiTotalDamage === 0 ? 'Belum Ada' : getClassification(aiTotalDamage)}
                        </span>
                      </div>

                    </div>
                  </div>

                  {/* Decision Panel */}
                  <div className="text-left space-y-3">
                    <h3 className="text-xs uppercase tracking-widest text-slate-400 font-bold">METODE DATA RESMI (FINAL)</h3>
                    <p className="text-[10px] text-slate-500 leading-normal">
                      Pilih metode evaluasi mana yang akan disimpan secara resmi ke dalam basis data inventaris sekolah.
                    </p>

                    <div className="space-y-2">
                      {/* Option 1: Manual */}
                      <label 
                        onClick={() => setSelectedSource('manual')}
                        className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          selectedSource === 'manual' 
                            ? 'bg-slate-50 border-slate-700' 
                            : 'border-slate-150 hover:bg-slate-50/30'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-800">1. Hasil Manual</span>
                          <span className="text-[9px] text-slate-400 block">Sesuai survei pemeriksa lapangan</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-800">{manualTotalDamage}%</span>
                          <span className="text-[8px] block font-semibold text-slate-500">{getClassification(manualTotalDamage)}</span>
                        </div>
                      </label>

                      {/* Option 2: AI */}
                      <label 
                        onClick={() => {
                          if (aiTotalDamage === 0) {
                            alert("Jalankan analisis asisten AI terlebih dahulu dengan mengisi gejala kerusakan.");
                            return;
                          }
                          setSelectedSource('ai');
                        }}
                        className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          aiTotalDamage === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          selectedSource === 'ai' 
                            ? 'bg-indigo-50/50 border-indigo-600' 
                            : 'border-slate-150 hover:bg-slate-50/30'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                            <Sparkles size={11} className="text-indigo-600" />
                            2. Hasil AI
                          </span>
                          <span className="text-[9px] text-slate-400 block">Berdasarkan data gejala fisik</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-indigo-700">{aiTotalDamage}%</span>
                          <span className="text-[8px] block font-semibold text-indigo-500">
                            {aiTotalDamage === 0 ? '-' : getClassification(aiTotalDamage)}
                          </span>
                        </div>
                      </label>

                      {/* Option 3: Average */}
                      <label 
                        onClick={() => {
                          if (aiTotalDamage === 0) {
                            alert("Jalankan analisis asisten AI terlebih dahulu agar nilai rata-rata dapat dihitung.");
                            return;
                          }
                          setSelectedSource('average');
                        }}
                        className={`p-3 rounded-xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                          aiTotalDamage === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        } ${
                          selectedSource === 'average' 
                            ? 'bg-violet-50/50 border-violet-600' 
                            : 'border-slate-150 hover:bg-slate-50/30'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-violet-950">3. Kombinasi Rata-rata</span>
                          <span className="text-[9px] text-slate-400 block">Menyeimbangkan manual & AI</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-violet-700">
                            {Math.round((manualTotalDamage + aiTotalDamage) / (aiTotalDamage === 0 ? 1 : 2))}%
                          </span>
                          <span className="text-[8px] block font-semibold text-violet-500">
                            {getClassification(Math.round((manualTotalDamage + aiTotalDamage) / (aiTotalDamage === 0 ? 1 : 2)))}
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Chosen Final Indicator Card */}
                  <div className={`p-4 rounded-xl border ${currentStyles.bg} space-y-2`}>
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">STATUS AKHIR VERIFIKASI</div>
                    <div className="flex items-center justify-center gap-1.5 font-black text-sm uppercase tracking-tight">
                      {totalDamage > 45 ? (
                        <XCircle size={16} className="text-rose-600 shrink-0" />
                      ) : totalDamage > 30 ? (
                        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                      ) : (
                        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                      )}
                      {currentClassification} ({totalDamage}%)
                    </div>
                    <p className="text-[10px] leading-relaxed text-left text-slate-600">
                      {currentStyles.desc}
                    </p>
                  </div>

                  {/* Technical Guidelines Table */}
                  <div className="text-left space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <TrendingUp size={14} className="text-indigo-600" />
                      Kriteria Klasifikasi PUPR
                    </h4>
                    <div className="text-[10px] space-y-2 font-medium">
                      <div className="flex justify-between items-center p-2 rounded-lg bg-emerald-50 text-emerald-800">
                        <span>Kerusakan Ringan</span>
                        <span className="font-bold">&le; 30%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-amber-50 text-amber-800">
                        <span>Kerusakan Sedang</span>
                        <span className="font-bold">30.1% - 45%</span>
                      </div>
                      <div className="flex justify-between items-center p-2 rounded-lg bg-rose-50 text-rose-800">
                        <span>Kerusakan Berat</span>
                        <span className="font-bold">&gt; 45%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="card bg-white shadow-md border border-slate-200/80 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Evaluasi</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Bangunan</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pemeriksa / Auditor</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Skor Kerusakan</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Klasifikasi PUPR</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                        Belum ada riwayat laporan analisis kerusakan gedung yang tersimpan.
                      </td>
                    </tr>
                  ) : (
                    history.map((h) => {
                      const hStyles = getClassificationStyles(h.classification);
                      const isExpanded = expandedAuditId === h.id;
                      return (
                        <React.Fragment key={h.id}>
                          <tr className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-xs text-slate-600 font-mono">
                              {new Date(h.assess_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-slate-900">{h.building_name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">Kode: {h.building_code || '-'} | Luas: {h.building_area || '-'} m²</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-700 font-semibold">
                              {h.assessor_name}
                            </td>
                            <td className="px-6 py-4 font-black text-sm text-slate-800">
                              {h.total_damage_pct}%
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider ${hStyles.badge}`}>
                                {h.classification}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setExpandedAuditId(isExpanded ? null : h.id)}
                                  className="text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1"
                                  title="Detail Laporan"
                                >
                                  {isExpanded ? <EyeOff size={11} /> : <Eye size={11} />}
                                  {isExpanded ? 'Tutup' : 'Detail'}
                                </button>
                                <button
                                  onClick={() => triggerPrintAudit(h)}
                                  className="text-indigo-600 hover:text-indigo-800 border border-slate-200 hover:border-indigo-600 bg-white hover:bg-indigo-50/20 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1"
                                  title="Cetak Laporan Formal PUPR"
                                >
                                  <Printer size={12} />
                                  Cetak
                                </button>
                                <button
                                  onClick={() => handleDelete(h.id)}
                                  className="text-rose-600 hover:text-rose-800 border border-slate-200 hover:border-rose-100 bg-white hover:bg-rose-50/20 px-2 py-1 rounded-md text-[10px] font-bold transition-all flex items-center gap-1"
                                  title="Hapus Laporan"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50/50">
                              <td colSpan={6} className="px-6 py-4 border-b border-slate-200">
                                <motion.div 
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-4 text-xs text-slate-700"
                                >
                                  {/* Component breakdown */}
                                  <div>
                                    <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2">Rincian Persentase Kerusakan Komponen:</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      {COMPONENT_METADATA.map(comp => {
                                        const pct = (h as any)[`${comp.key}_pct`] ?? 0;
                                        return (
                                          <div key={comp.key} className="bg-white p-2.5 rounded-xl border border-slate-250/60 flex flex-col justify-between">
                                            <span className="font-bold text-slate-700 text-[10px] leading-tight mb-1">{comp.label.replace(/^\d+\.\s*/, '')}</span>
                                            <div className="flex justify-between items-baseline mt-1">
                                              <span className="text-[9px] text-slate-400">Bobot: {comp.weight}%</span>
                                              <span className="font-black text-slate-800">{pct}%</span>
                                            </div>
                                            {/* Small progress bar */}
                                            <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Notes and AI */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {h.notes && (
                                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1 shadow-sm">
                                        <h5 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider text-slate-500">Catatan Pemeriksaan:</h5>
                                        <p className="text-slate-600 whitespace-pre-wrap leading-relaxed text-[11px] font-medium">{h.notes}</p>
                                      </div>
                                    )}
                                    {h.ai_recommendation && (
                                      <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1 shadow-sm">
                                        <h5 className="font-bold text-indigo-950 text-[10px] uppercase tracking-wider flex items-center gap-1 text-slate-500">
                                          <Sparkles size={11} className="text-indigo-600" />
                                          Analisis & Rekomendasi AI:
                                        </h5>
                                        <div className="prose max-w-none text-[10px] leading-relaxed text-slate-600 max-h-40 overflow-y-auto">
                                          <Markdown>{h.ai_recommendation}</Markdown>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Photo Gallery inside detail panel */}
                                  {(() => {
                                    try {
                                      if (!h.photos_json) return null;
                                      const photos = JSON.parse(h.photos_json);
                                      const activeKeys = Object.keys(photos).filter(k => photos[k]);
                                      if (activeKeys.length === 0) return null;

                                      return (
                                        <div className="space-y-2">
                                          <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">Foto Dokumentasi Kerusakan Lapangan:</h4>
                                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                                            {activeKeys.map(key => {
                                              const comp = COMPONENT_METADATA.find(c => c.key === key);
                                              return (
                                                <div key={key} className="bg-white p-2 rounded-xl border border-slate-200 text-center flex flex-col justify-between shadow-sm">
                                                  <div className="w-full h-16 bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                                                    <img 
                                                      src={photos[key]} 
                                                      alt={comp?.label || key} 
                                                      className="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-200"
                                                      onClick={() => {
                                                        const win = window.open();
                                                        if (win) {
                                                          win.document.write(`<img src="${photos[key]}" style="max-width:100%; max-height:100%; display:block; margin:auto;" />`);
                                                        }
                                                      }}
                                                      referrerPolicy="no-referrer"
                                                    />
                                                  </div>
                                                  <span className="text-[8px] font-bold text-slate-600 block mt-1.5 truncate uppercase">
                                                    {comp?.label.replace(/^\d+\.\s*/, '') || key}
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      );
                                    } catch (e) {
                                      return null;
                                    }
                                  })()}
                                </motion.div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OFFSCREEN PRINTABLE DOCUMENT CONTAINER */}
      <div className="hidden">
        {selectedAuditForPrint && (
          <div ref={componentRef} className="p-10 bg-white text-slate-950 font-sans print:p-8" style={{ width: '210mm', minHeight: '297mm', color: '#090d16' }}>
            
            {/* Kop Surat (School Official Letterhead) */}
            <div className="text-center mb-6 border-b-4 border-double border-slate-900 pb-4 flex items-center justify-between gap-6">
              {settings?.foundation_logo_url ? (
                <img src={settings.foundation_logo_url} alt="Logo Yayasan" className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 shrink-0">No Logo</div>
              )}
              
              <div className="flex-1 text-center">
                <h1 className="text-xs font-extrabold uppercase tracking-tight leading-tight text-slate-900">
                  {settings?.foundation_name || 'YAYASAN PENDIDIKAN CONTOH'}
                </h1>
                <h2 className="text-sm font-black uppercase tracking-tight leading-tight text-slate-900 mt-0.5">
                  {settings?.school_name || 'SMK NEGERI CONTOH JAKARTA'}
                </h2>
                <p className="text-[10px] text-slate-600 mt-1 italic font-medium">
                  {settings?.address} {settings?.phone ? `| Telp: ${settings.phone}` : ''}
                </p>
              </div>

              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo Sekolah" className="w-16 h-16 object-contain shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center text-[8px] text-slate-400 shrink-0">No Logo</div>
              )}
            </div>

            {/* Document Title Header */}
            <div className="text-center mb-6">
              <h3 className="text-sm font-extrabold tracking-tight text-slate-900 uppercase underline">
                LAPORAN ANALISIS TINGKAT KERUSAKAN BANGUNAN (STANDAR DPUPR)
              </h3>
              <p className="text-[9px] text-slate-500 font-mono mt-1">
                Nomor Dokumen: SMKN/AUDIT-PUPR/{new Date(selectedAuditForPrint.assess_date).getFullYear()}/{selectedAuditForPrint.id}
              </p>
              <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                Tanggal Evaluasi: {new Date(selectedAuditForPrint.assess_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Metadata Table / Information Grid */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-300 mb-6 text-xs text-slate-700">
              <div className="space-y-1">
                <div className="flex"><span className="w-28 font-semibold text-slate-500">Nama Gedung:</span><span className="font-bold text-slate-900">{selectedAuditForPrint.building_name}</span></div>
                <div className="flex"><span className="w-28 font-semibold text-slate-500">Kode Gedung:</span><span className="font-medium text-slate-900">{selectedAuditForPrint.building_code || '-'}</span></div>
                <div className="flex"><span className="w-28 font-semibold text-slate-500">Luas Bangunan:</span><span className="font-medium text-slate-900">{selectedAuditForPrint.building_area || '-'} m²</span></div>
                <div className="flex"><span className="w-28 font-semibold text-slate-500">Tahun Dibangun:</span><span className="font-medium text-slate-900">{selectedAuditForPrint.building_year || '-'}</span></div>
              </div>
              <div className="space-y-1">
                <div className="flex"><span className="w-28 font-semibold text-slate-500">Auditor Utama:</span><span className="font-bold text-indigo-700">{selectedAuditForPrint.assessor_name}</span></div>
                <div className="flex"><span className="w-28 font-semibold text-slate-500">Skor Kerusakan:</span><span className="font-extrabold text-slate-900 text-sm">{selectedAuditForPrint.total_damage_pct}%</span></div>
                <div className="flex"><span className="w-28 font-semibold text-slate-500">Status DPUPR:</span><span className="font-extrabold text-indigo-800">{selectedAuditForPrint.classification}</span></div>
                <div className="flex"><span className="w-28 font-semibold text-slate-500">Tahun Anggaran:</span><span className="font-medium text-slate-900">{new Date(selectedAuditForPrint.assess_date).getFullYear()} / {new Date(selectedAuditForPrint.assess_date).getFullYear() + 1}</span></div>
              </div>
            </div>

            {/* PUPR Table Calculation Breakdown */}
            <table className="w-full text-left border-collapse border border-slate-400 text-[10px] mb-6">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-400">
                  <th className="p-2 border-r border-slate-400 font-bold w-12 text-center">No</th>
                  <th className="p-2 border-r border-slate-400 font-bold">Komponen Fisik Gedung</th>
                  <th className="p-2 border-r border-slate-400 font-bold text-center w-24">Bobot Max (%)</th>
                  <th className="p-2 border-r border-slate-400 font-bold text-center w-24">Tingkat Rusak (%)</th>
                  <th className="p-2 font-bold text-center w-28">Nilai Tertimbang (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="p-2 border-r border-slate-400 text-center">1</td>
                  <td className="p-2 border-r border-slate-400 font-medium">Pondasi & Sloof</td>
                  <td className="p-2 border-r border-slate-400 text-center">10%</td>
                  <td className="p-2 border-r border-slate-400 text-center">{selectedAuditForPrint.pondasi_pct}%</td>
                  <td className="p-2 text-center font-bold">{(10 * selectedAuditForPrint.pondasi_pct / 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-400 text-center">2</td>
                  <td className="p-2 border-r border-slate-400 font-medium">Struktur Kolom & Balok</td>
                  <td className="p-2 border-r border-slate-400 text-center">30%</td>
                  <td className="p-2 border-r border-slate-400 text-center">{selectedAuditForPrint.kolom_balok_pct}%</td>
                  <td className="p-2 text-center font-bold">{(30 * selectedAuditForPrint.kolom_balok_pct / 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-400 text-center">3</td>
                  <td className="p-2 border-r border-slate-400 font-medium">Struktur Pelat Lantai (Slab)</td>
                  <td className="p-2 border-r border-slate-400 text-center">10%</td>
                  <td className="p-2 border-r border-slate-400 text-center">{selectedAuditForPrint.pelat_lantai_pct}%</td>
                  <td className="p-2 text-center font-bold">{(10 * selectedAuditForPrint.pelat_lantai_pct / 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-400 text-center">4</td>
                  <td className="p-2 border-r border-slate-400 font-medium">Rangka Atap (Kuda-kuda/Gording)</td>
                  <td className="p-2 border-r border-slate-400 text-center">10%</td>
                  <td className="p-2 border-r border-slate-400 text-center">{selectedAuditForPrint.rangka_atap_pct}%</td>
                  <td className="p-2 text-center font-bold">{(10 * selectedAuditForPrint.rangka_atap_pct / 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-400 text-center">5</td>
                  <td className="p-2 border-r border-slate-400 font-medium">Dinding Pasangan Bata</td>
                  <td className="p-2 border-r border-slate-400 text-center">15%</td>
                  <td className="p-2 border-r border-slate-400 text-center">{selectedAuditForPrint.dinding_pct}%</td>
                  <td className="p-2 text-center font-bold">{(15 * selectedAuditForPrint.dinding_pct / 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-400 text-center">6</td>
                  <td className="p-2 border-r border-slate-400 font-medium">Langit-langit (Plafon)</td>
                  <td className="p-2 border-r border-slate-400 text-center">10%</td>
                  <td className="p-2 border-r border-slate-400 text-center">{selectedAuditForPrint.plafon_pct}%</td>
                  <td className="p-2 text-center font-bold">{(10 * selectedAuditForPrint.plafon_pct / 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-400 text-center">7</td>
                  <td className="p-2 border-r border-slate-400 font-medium">Lantai Finishing</td>
                  <td className="p-2 border-r border-slate-400 text-center">5%</td>
                  <td className="p-2 border-r border-slate-400 text-center">{selectedAuditForPrint.lantai_pct}%</td>
                  <td className="p-2 text-center font-bold">{(5 * selectedAuditForPrint.lantai_pct / 100).toFixed(2)}%</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-slate-400 text-center">8</td>
                  <td className="p-2 border-r border-slate-400 font-medium">Utilitas (Air, Listrik, Kusen)</td>
                  <td className="p-2 border-r border-slate-400 text-center">10%</td>
                  <td className="p-2 border-r border-slate-400 text-center">{selectedAuditForPrint.utilitas_pct}%</td>
                  <td className="p-2 text-center font-bold">{(10 * selectedAuditForPrint.utilitas_pct / 100).toFixed(2)}%</td>
                </tr>
                <tr className="bg-slate-50 font-bold border-t border-slate-400">
                  <td colSpan={2} className="p-2 border-r border-slate-400 text-right uppercase">Total Kerusakan Kumulatif (Bobot Terboboti)</td>
                  <td className="p-2 border-r border-slate-400 text-center">100%</td>
                  <td className="p-2 border-r border-slate-400 text-center">-</td>
                  <td className="p-2 text-center font-black text-xs text-indigo-900">{selectedAuditForPrint.total_damage_pct}%</td>
                </tr>
              </tbody>
            </table>

            {/* AI Technical Recommendation / Analysis */}
            {selectedAuditForPrint.ai_recommendation && (
              <div className="mb-6 border border-slate-300 rounded-lg p-4 bg-slate-50/50">
                <h4 className="text-[11px] font-bold text-slate-900 border-b border-slate-300 pb-1 uppercase tracking-tight mb-2">
                  Rencana Rehabilitasi Teknis (Rekomendasi Ahli AI):
                </h4>
                <div className="prose text-[10px] leading-relaxed text-slate-800">
                  <Markdown>{selectedAuditForPrint.ai_recommendation}</Markdown>
                </div>
              </div>
            )}

            {/* Regular notes */}
            {selectedAuditForPrint.notes && (
              <div className="mb-6 text-[10px] text-slate-700">
                <strong>Catatan Tambahan Lapangan:</strong> {selectedAuditForPrint.notes}
              </div>
            )}

            {/* Foto Dokumentasi Lampiran */}
            {(() => {
              try {
                if (!selectedAuditForPrint.photos_json) return null;
                const photosObj = JSON.parse(selectedAuditForPrint.photos_json);
                const keysWithPhotos = Object.keys(photosObj).filter(k => photosObj[k]);
                if (keysWithPhotos.length === 0) return null;

                return (
                  <div className="mb-6 border border-slate-300 rounded-lg p-4 bg-slate-50/50 print:break-before-page">
                    <h4 className="text-[11px] font-bold text-slate-900 border-b border-slate-300 pb-1.5 uppercase tracking-tight mb-3">
                      Lampiran Foto Dokumentasi Kerusakan Fisik Bangunan:
                    </h4>
                    <div className="grid grid-cols-4 gap-4">
                      {keysWithPhotos.map(key => {
                        const comp = COMPONENT_METADATA.find(c => c.key === key);
                        return (
                          <div key={key} className="border border-slate-300 bg-white p-2 rounded-lg flex flex-col items-center justify-between text-center shadow-sm">
                            <div className="w-full h-24 bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                              <img 
                                src={photosObj[key]} 
                                alt={comp?.label || key} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[8px] font-black text-slate-700 block mt-2 uppercase leading-tight">
                              {comp?.label.replace(/^\d+\.\s*/, '') || key}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              } catch (e) {
                return null;
              }
            })()}

            {/* Formal DPUPR Signatures */}
            <div className="mt-12 grid grid-cols-3 gap-6 text-[10px] text-center">
              <div>
                <p className="text-slate-600 font-semibold">Mengetahui,</p>
                <p className="font-extrabold uppercase text-slate-900 mt-0.5">Kepala Sekolah</p>
                <div className="h-16" /> {/* Spacer */}
                <p className="font-bold underline uppercase text-slate-900">{settings?.principal_name || '.......................................'}</p>
                <p className="text-slate-500 mt-0.5">NIP. {settings?.principal_nip || '.......................................'}</p>
              </div>

              <div>
                <p className="text-slate-600 font-semibold">Pemeriksa Teknis,</p>
                <p className="font-extrabold uppercase text-slate-900 mt-0.5">Waka Bidang Sarpras</p>
                <div className="h-16" /> {/* Spacer */}
                <p className="font-bold underline uppercase text-slate-900">{settings?.waka_sarpras_name || '.......................................'}</p>
                <p className="text-slate-500 mt-0.5">NIP. {settings?.waka_sarpras_nip || '.......................................'}</p>
              </div>

              <div>
                <p className="text-slate-600 font-semibold">
                  {settings?.address?.split(',')[0] || 'Jakarta'}, {new Date(selectedAuditForPrint.assess_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="font-extrabold uppercase text-slate-900 mt-0.5">Verifikator Dinas PUPR</p>
                <div className="h-16" /> {/* Spacer */}
                <p className="font-bold underline uppercase text-slate-900">......................................................</p>
                <p className="text-slate-500 mt-0.5">NIP. .....................................................</p>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
