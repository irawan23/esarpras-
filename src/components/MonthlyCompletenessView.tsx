import React, { useState, useEffect } from 'react';
import { Room, InventoryItem, MonthlyCompletenessReport, MonthlyCompletenessItem } from '../types';
import { 
  ClipboardCheck, Calendar, MapPin, CheckCircle, AlertTriangle, 
  Trash2, Plus, Info, Check, X, RefreshCw, Eye, ShieldCheck, UserCheck, 
  TrendingUp, AlertCircle, Sparkles, Printer, FileSpreadsheet, Building2,
  Search, Barcode
} from 'lucide-react';

interface MonthlyCompletenessViewProps {
  currentUser: { id: number; username: string; name: string; role: string };
}

export function MonthlyCompletenessView({ currentUser }: MonthlyCompletenessViewProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [reports, setReports] = useState<MonthlyCompletenessReport[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [roomCondition, setRoomCondition] = useState<'sangat_baik' | 'baik' | 'cukup' | 'buruk_rusak'>('baik');
  const [reportMonth, setReportMonth] = useState(() => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${month}`; // YYYY-MM
  });
  const [checkedDate, setCheckedDate] = useState(new Date().toISOString().split('T')[0]);
  const [generalNotes, setGeneralNotes] = useState('');
  
  // checklist state
  const [checklistItems, setChecklistItems] = useState<MonthlyCompletenessItem[]>([]);
  const [selectedReport, setSelectedReport] = useState<MonthlyCompletenessReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // States for enhanced checklist search, filter, and scanner
  const [checklistSearch, setChecklistSearch] = useState('');
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'present' | 'missing' | 'damaged'>('all');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedMessage, setScannedMessage] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<number | null>(null);

  // Auditing form fields inside the detail modal
  const [sarprasStatus, setSarprasStatus] = useState<'approved' | 'rejected'>('approved');
  const [sarprasNotes, setSarprasNotes] = useState('');
  const [kepsekStatus, setKepsekStatus] = useState<'approved' | 'rejected'>('approved');
  const [kepsekNotes, setKepsekNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const roomsRes = await fetch('/api/rooms');
      const roomsData = await roomsRes.json();
      setRooms(roomsData);

      const itemsRes = await fetch('/api/inventory');
      const itemsData = await itemsRes.json();
      setInventoryItems(itemsData);

      const reportsRes = await fetch('/api/monthly-reports');
      const reportsData = await reportsRes.json();
      setReports(reportsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Allow all users to see and select all rooms so anyone can fill reports, while still highlighting their PIC rooms
  const filteredRooms = rooms;

  // When room is selected, load its assets to form the initial checklist state
  useEffect(() => {
    if (selectedRoomId) {
      const roomAssets = inventoryItems.filter(i => i.room_id === selectedRoomId);
      const initialChecklist = roomAssets.map(asset => ({
        item_id: asset.id,
        item_name: asset.name,
        barcode: asset.barcode || 'NO-BARCODE',
        is_present: true,
        condition: asset.condition as 'baik' | 'rusak_ringan' | 'rusak_berat',
        notes: ''
      }));
      setChecklistItems(initialChecklist);
    } else {
      setChecklistItems([]);
    }
  }, [selectedRoomId, inventoryItems]);

  const handleTogglePresence = (itemId: number) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.item_id === itemId) {
        return { ...item, is_present: !item.is_present };
      }
      return item;
    }));
  };

  const handleConditionChange = (itemId: number, cond: 'baik' | 'rusak_ringan' | 'rusak_berat') => {
    setChecklistItems(prev => prev.map(item => {
      if (item.item_id === itemId) {
        return { ...item, condition: cond };
      }
      return item;
    }));
  };

  const handleItemNoteChange = (itemId: number, txt: string) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.item_id === itemId) {
        return { ...item, notes: txt };
      }
      return item;
    }));
  };

  const handleUpdateDamageDesc = (itemId: number, txt: string) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.item_id === itemId) return { ...item, damage_desc: txt };
      return item;
    }));
  };

  const handleUpdatePhotoDamage = (itemId: number, base64: string) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.item_id === itemId) return { ...item, photo_damage: base64 };
      return item;
    }));
  };

  const handleUpdateLossDesc = (itemId: number, txt: string) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.item_id === itemId) return { ...item, loss_desc: txt };
      return item;
    }));
  };

  const handleUpdateLossDay = (itemId: number, day: string) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.item_id === itemId) return { ...item, loss_day: day };
      return item;
    }));
  };

  const handleUpdateLossDate = (itemId: number, date: string) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.item_id === itemId) return { ...item, loss_date: date };
      return item;
    }));
  };

  const handleUpdateLossTime = (itemId: number, time: string) => {
    setChecklistItems(prev => prev.map(item => {
      if (item.item_id === itemId) return { ...item, loss_time: time };
      return item;
    }));
  };

  const handleMarkAllPresent = () => {
    setChecklistItems(prev => prev.map(item => ({ ...item, is_present: true })));
  };

  const handleMarkAllGood = () => {
    setChecklistItems(prev => prev.map(item => ({ ...item, condition: 'baik' })));
  };

  const handleResetChecklist = () => {
    if (selectedRoomId) {
      const roomAssets = inventoryItems.filter(i => i.room_id === selectedRoomId);
      const initialChecklist = roomAssets.map(asset => ({
        item_id: asset.id,
        item_name: asset.name,
        barcode: asset.barcode || 'NO-BARCODE',
        is_present: true,
        condition: asset.condition as 'baik' | 'rusak_ringan' | 'rusak_berat',
        notes: ''
      }));
      setChecklistItems(initialChecklist);
      setChecklistSearch('');
      setChecklistFilter('all');
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const targetBarcode = barcodeInput.trim().toLowerCase();
    const matchedItem = checklistItems.find(item => 
      item.barcode.toLowerCase() === targetBarcode ||
      item.item_name.toLowerCase().includes(targetBarcode)
    );

    if (matchedItem) {
      setChecklistItems(prev => prev.map(item => {
        if (item.item_id === matchedItem.item_id) {
          return { ...item, is_present: true };
        }
        return item;
      }));
      
      setHighlightedItemId(matchedItem.item_id);
      setScannedMessage(`Aset "${matchedItem.item_name}" ter-scan & ditandai Ada!`);
      setBarcodeInput('');
      
      // Clear highlighted style after 2s
      setTimeout(() => {
        setHighlightedItemId(null);
      }, 2000);

      setTimeout(() => {
        setScannedMessage(null);
      }, 4000);
    } else {
      alert(`Barang dengan barcode/nama "${barcodeInput}" tidak ditemukan di ruangan ini.`);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedRoomId) {
      setError('Silakan pilih ruangan terlebih dahulu.');
      return;
    }
    if (checklistItems.length === 0) {
      setError('Tidak ada barang di ruangan ini untuk di-checklist.');
      return;
    }

    // Determine overall status based on checklist
    let missingCount = 0;
    let brokenCount = 0;
    checklistItems.forEach(item => {
      if (!item.is_present) missingCount++;
      if (item.condition !== 'baik') brokenCount++;
    });

    let overallStatus: 'Lengkap' | 'Kurang' | 'Rusak Sebagian' = 'Lengkap';
    if (missingCount > 0) {
      overallStatus = 'Kurang';
    } else if (brokenCount > 0) {
      overallStatus = 'Rusak Sebagian';
    }

    const payload = {
      room_id: selectedRoomId,
      pic_name: currentUser.name,
      report_month: reportMonth,
      checked_date: checkedDate,
      status: overallStatus,
      items_status_json: JSON.stringify(checklistItems),
      notes: generalNotes,
      room_condition: roomCondition
    };

    try {
      const res = await fetch('/api/monthly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Laporan kelengkapan bulanan berhasil dikirimkan!');
        setSelectedRoomId(null);
        setGeneralNotes('');
        setRoomCondition('baik');
        setShowForm(false);
        fetchData();
      } else {
        setError(data.message || 'Gagal menyimpan laporan kelengkapan.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    }
  };

  // Audit submission by Sarpras / Waka
  const handleAuditSarpras = async (reportId: number) => {
    try {
      const res = await fetch(`/api/monthly-reports/${reportId}/audit-sarpras`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: sarprasStatus, notes: sarprasNotes })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Laporan berhasil diperiksa dan diverifikasi oleh Sarpras!');
        setSelectedReport(null);
        fetchData();
      } else {
        alert(data.message || 'Gagal menyimpan audit Sarpras.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Audit submission by Kepala Sekolah
  const handleAuditKepsek = async (reportId: number) => {
    try {
      const res = await fetch(`/api/monthly-reports/${reportId}/audit-kepsek`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: kepsekStatus, notes: kepsekNotes })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Laporan berhasil disetujui dan diverifikasi oleh Kepala Sekolah!');
        setSelectedReport(null);
        fetchData();
      } else {
        alert(data.message || 'Gagal menyimpan audit Kepala Sekolah.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReport = async (id: number) => {
    if (!confirm('Hapus laporan kelengkapan bulanan ini?')) return;
    try {
      const res = await fetch(`/api/monthly-reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatMonth = (m: string) => {
    if (!m) return '';
    const [year, month] = m.split('-');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${months[parseInt(month) - 1]} ${year}`;
  };

  // Statistics Calculation
  const totalReportsThisMonth = reports.length;
  const reportsPendingAuditSarpras = reports.filter(r => r.audited_by_sarpras === 'pending').length;
  const reportsPendingAuditKepsek = reports.filter(r => r.audited_by_kepsek === 'pending').length;

  let totalItemsMissing = 0;
  let totalItemsBroken = 0;

  reports.forEach(r => {
    try {
      const items: MonthlyCompletenessItem[] = JSON.parse(r.items_status_json);
      items.forEach(it => {
        if (!it.is_present) totalItemsMissing++;
        if (it.condition !== 'baik') totalItemsBroken++;
      });
    } catch (e) {}
  });

  return (
    <div className="p-8 space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Kelengkapan Bulanan & Audit PIC</h3>
          <p className="text-sm text-slate-500 font-medium">Laporan audit kelengkapan, kondisi fisik ruang, kondisi barang harian / bulanan oleh PIC serta verifikasi Sarpras & Kepala Sekolah</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          {filteredRooms.length > 0 && (
            <button
              onClick={() => {
                setSelectedRoomId(null);
                setShowForm(!showForm);
              }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Buat Laporan PIC
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Laporan PIC</span>
            <span className="text-2xl font-black text-slate-800">{totalReportsThisMonth}</span>
            <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Seluruh ruangan kelas & lab</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-700 rounded-xl">
            <AlertCircle size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Barang Hilang / Kurang</span>
            <span className="text-2xl font-black text-rose-600">{totalItemsMissing}</span>
            <span className="text-[10px] text-rose-400 block font-medium mt-0.5">Dilaporkan dalam audit PIC</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 text-amber-700 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Aset Rusak Fisik</span>
            <span className="text-2xl font-black text-amber-600">{totalItemsBroken}</span>
            <span className="text-[10px] text-amber-400 block font-medium mt-0.5">Memerlukan pemeliharaan</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Audit Kepala Sekolah</span>
            <span className="text-2xl font-black text-emerald-600">
              {reports.filter(r => r.audited_by_kepsek === 'approved').length}
              <span className="text-xs text-slate-400 font-normal"> / {totalReportsThisMonth} Verified</span>
            </span>
            <span className="text-[10px] text-slate-400 block font-medium mt-0.5">{reportsPendingAuditKepsek} Laporan Menunggu</span>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle className="text-emerald-600 shrink-0" size={20} />
          <span className="text-sm font-semibold">{success}</span>
        </div>
      )}

      {/* Main Checklist Audit Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={20} />
              <span>Formulir Pemeriksaan Kelengkapan PIC</span>
            </h4>
            <button 
              onClick={() => { setShowForm(false); setSelectedRoomId(null); }} 
              className="text-slate-400 hover:text-slate-600 text-sm font-bold"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-6">
            
            {/* Meta selections */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ruang Kelas / Lab <span className="text-red-500">*</span>
                </label>
                <select 
                  className="input text-sm"
                  onChange={e => setSelectedRoomId(e.target.value ? parseInt(e.target.value) : null)}
                  value={selectedRoomId || ""}
                  required
                >
                  <option value="">-- Pilih Ruangan --</option>
                  {filteredRooms.map(r => {
                    const isUserPic = r.pic_name?.toLowerCase().includes(currentUser.name?.toLowerCase()) || 
                                      r.pic_name?.toLowerCase().includes(currentUser.username?.toLowerCase());
                    return (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code}){isUserPic ? ' ⭐ (PIC Anda)' : ''}
                      </option>
                    );
                  })}
                </select>
                {selectedRoomId && (
                  <span className="text-[10px] text-indigo-600 font-bold block mt-1">
                    Penanggung Jawab: {rooms.find(rm => rm.id === selectedRoomId)?.pic_name || 'Tidak ada'}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kondisi Fisik Ruangan <span className="text-red-500">*</span>
                </label>
                <select 
                  className="input text-sm"
                  value={roomCondition}
                  onChange={e => setRoomCondition(e.target.value as any)}
                  required
                >
                  <option value="sangat_baik">✨ Sangat Baik (Bersih, Rapi, Fasilitas Utuh)</option>
                  <option value="baik">✓ Baik (Normal, Ada Aus Minor)</option>
                  <option value="cukup">⚠ Cukup (Aus, Perlu Pembersihan Ekstra)</option>
                  <option value="buruk_rusak">✗ Rusak / Kotor (Ada Komponen Rusak / Bocor)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Bulan Pelaporan <span className="text-red-500">*</span></label>
                <input 
                  type="month" 
                  className="input text-sm"
                  value={reportMonth}
                  onChange={e => setReportMonth(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Tanggal Audit</label>
                <input 
                  type="date" 
                  className="input text-sm"
                  value={checkedDate}
                  onChange={e => setCheckedDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Checklist table */}
            {selectedRoomId && (() => {
              const selectedRoomObj = rooms.find(rm => rm.id === selectedRoomId);
              const filteredChecklistItems = checklistItems.filter(item => {
                const matchesSearch = item.item_name.toLowerCase().includes(checklistSearch.toLowerCase()) || 
                                      item.barcode.toLowerCase().includes(checklistSearch.toLowerCase());
                if (checklistFilter === 'present') return matchesSearch && item.is_present;
                if (checklistFilter === 'missing') return matchesSearch && !item.is_present;
                if (checklistFilter === 'damaged') return matchesSearch && item.condition !== 'baik';
                return matchesSearch;
              });

              return (
                <div className="space-y-4">
                  
                  {/* Room Info Card & Quick Actions */}
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ruangan Dipilih</span>
                      <h5 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 mt-0.5">
                        <MapPin size={16} className="text-indigo-600" />
                        {selectedRoomObj?.name} ({selectedRoomObj?.code})
                      </h5>
                      <p className="text-xs text-slate-500 font-medium mt-1">
                        Deskripsi: {selectedRoomObj?.description || 'Tidak ada deskripsi'}
                      </p>
                      <p className="text-xs text-indigo-700 font-bold mt-0.5">
                        PIC Ruangan: {selectedRoomObj?.pic_name || 'Belum diatur'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aksi Cepat Checklist</span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={handleMarkAllPresent}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-1"
                        >
                          ✓ Semua Ada
                        </button>
                        <button
                          type="button"
                          onClick={handleMarkAllGood}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-1"
                        >
                          ✨ Semua Baik
                        </button>
                        <button
                          type="button"
                          onClick={handleResetChecklist}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center gap-1"
                        >
                          ↺ Atur Ulang
                        </button>
                      </div>
                    </div>

                    {/* Simulating scanner input */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pindai / Cari via Barcode</span>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            placeholder="Ketik/Scan barcode..."
                            className="input text-xs pl-8 pr-3 h-9"
                            value={barcodeInput}
                            onChange={e => setBarcodeInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const ev = { preventDefault: () => {} };
                                handleBarcodeSubmit(ev as any);
                              }
                            }}
                          />
                          <Barcode className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const ev = { preventDefault: () => {} };
                            handleBarcodeSubmit(ev as any);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-colors"
                        >
                          Pindai
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Scanned Message notification banner */}
                  {scannedMessage && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-lg font-bold flex items-center gap-2 animate-bounce">
                      <Sparkles size={14} className="text-indigo-600 shrink-0" />
                      <span>{scannedMessage}</span>
                    </div>
                  )}

                  {/* Search and Filters Toolbar */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-3 rounded-xl border border-slate-200">
                    <div className="relative w-full sm:max-w-xs">
                      <input
                        type="text"
                        placeholder="Cari barang atau barcode..."
                        className="input text-xs pl-8 pr-3 h-8"
                        value={checklistSearch}
                        onChange={e => setChecklistSearch(e.target.value)}
                      />
                      <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
                    </div>

                    <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { k: 'all' as const, l: 'Semua' },
                        { k: 'present' as const, l: 'Ada' },
                        { k: 'missing' as const, l: 'Hilang / Kurang' },
                        { k: 'damaged' as const, l: 'Kondisi Bermasalah' }
                      ].map(fOpt => (
                        <button
                          key={fOpt.k}
                          type="button"
                          onClick={() => setChecklistFilter(fOpt.k)}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all border shrink-0 ${
                            checklistFilter === fOpt.k
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {fOpt.l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredChecklistItems.length === 0 ? (
                    <div className="p-8 text-center text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <AlertTriangle className="text-amber-500 mx-auto mb-2" size={24} />
                      <p className="font-bold text-slate-700">Tidak ada barang yang cocok</p>
                      <p className="text-slate-500 mt-1">Coba ubah kata kunci pencarian atau ganti filter status di atas.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs shadow-sm bg-white">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                            <th className="p-3">Nama Aset / Barcode</th>
                            <th className="p-3 text-center">Kehadiran (Ada?)</th>
                            <th className="p-3">Kondisi Fisik Barang</th>
                            <th className="p-3">Keterangan Khusus / Temuan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredChecklistItems.map(item => {
                            const isHighlighted = highlightedItemId === item.item_id;
                            return (
                              <React.Fragment key={item.item_id}>
                                <tr 
                                  className={`transition-colors ${
                                    isHighlighted 
                                      ? 'bg-yellow-50/80 border-y-2 border-yellow-300 font-bold' 
                                      : 'hover:bg-slate-50/50'
                                  }`}
                                >
                                  <td className="p-3">
                                    <p className="font-bold text-slate-800">{item.item_name}</p>
                                    <span className="font-mono text-[9px] text-slate-400 block mt-0.5">Barcode: {item.barcode}</span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleTogglePresence(item.item_id)}
                                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 mx-auto ${
                                        item.is_present 
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                          : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                      }`}
                                    >
                                      {item.is_present ? (
                                        <>
                                          <Check size={12} /> Ada
                                        </>
                                      ) : (
                                        <>
                                          <X size={12} /> Hilang / Kurang
                                        </>
                                      )}
                                    </button>
                                  </td>
                                  <td className="p-3">
                                    <div className="flex gap-1">
                                      {[
                                        { k: 'baik' as const, l: 'Baik', c: 'hover:bg-emerald-50 text-emerald-700 border-emerald-200', activeC: 'bg-emerald-600 text-white' },
                                        { k: 'rusak_ringan' as const, l: 'Ringan', c: 'hover:bg-amber-50 text-amber-700 border-amber-200', activeC: 'bg-amber-500 text-slate-900' },
                                        { k: 'rusak_berat' as const, l: 'Berat', c: 'hover:bg-rose-50 text-rose-700 border-rose-200', activeC: 'bg-rose-600 text-white' }
                                      ].map(cOpt => (
                                        <button
                                          key={cOpt.k}
                                          type="button"
                                          onClick={() => handleConditionChange(item.item_id, cOpt.k)}
                                          className={`px-2 py-1 rounded-md border text-[9px] font-bold uppercase tracking-wider transition-all ${
                                            item.condition === cOpt.k 
                                              ? cOpt.activeC
                                              : `bg-white text-slate-600 ${cOpt.c}`
                                          }`}
                                        >
                                          {cOpt.l}
                                        </button>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-3">
                                    <input 
                                      type="text" 
                                      className="input h-8 text-[11px] font-medium"
                                      placeholder="Ketik keterangan (opsional)"
                                      value={item.notes}
                                      onChange={e => handleItemNoteChange(item.item_id, e.target.value)}
                                    />
                                  </td>
                                </tr>

                                {/* Additional Inputs for Damage or Loss details */}
                                {(!item.is_present || item.condition !== 'baik') && (
                                  <tr className="bg-slate-50/50">
                                    <td colSpan={4} className="p-3">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        
                                        {/* If Damaged */}
                                        {item.condition !== 'baik' && (
                                          <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
                                            <p className="font-bold text-amber-800 text-[10px] uppercase tracking-wider flex items-center gap-1">⚠️ Detail Kerusakan Barang</p>
                                            
                                            <div>
                                              <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Keterangan Kerusakan <span className="text-red-500">*</span></label>
                                              <input
                                                type="text"
                                                className="input h-7 text-xs bg-white"
                                                placeholder="Sebutkan detail kerusakan..."
                                                value={item.damage_desc || ''}
                                                onChange={e => handleUpdateDamageDesc(item.item_id, e.target.value)}
                                                required
                                              />
                                            </div>

                                            <div>
                                              <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Foto Bukti Kerusakan</label>
                                              <div className="flex gap-2">
                                                <input
                                                  type="text"
                                                  className="input h-7 text-[10px] bg-white flex-1"
                                                  placeholder="Format data:image atau URL..."
                                                  value={item.photo_damage || ''}
                                                  onChange={e => handleUpdatePhotoDamage(item.item_id, e.target.value)}
                                                />
                                                <input 
                                                  type="file" 
                                                  accept="image/*"
                                                  onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                      const reader = new FileReader();
                                                      reader.onloadend = () => {
                                                        handleUpdatePhotoDamage(item.item_id, reader.result as string);
                                                      };
                                                      reader.readAsDataURL(file);
                                                    }
                                                  }}
                                                  className="hidden" 
                                                  id={`file-damage-${item.item_id}`}
                                                />
                                                <label 
                                                  htmlFor={`file-damage-${item.item_id}`}
                                                  className="px-2 h-7 bg-amber-600 hover:bg-amber-700 text-white rounded text-[9px] font-bold uppercase flex items-center justify-center cursor-pointer shrink-0"
                                                >
                                                  Pilih File
                                                </label>
                                              </div>
                                              {item.photo_damage && (
                                                <div className="mt-1 flex items-center gap-2">
                                                  <img src={item.photo_damage} className="h-8 w-12 object-cover rounded border border-slate-200" alt="Preview" />
                                                  <button
                                                    type="button"
                                                    onClick={() => handleUpdatePhotoDamage(item.item_id, '')}
                                                    className="text-[9px] text-red-600 font-bold hover:underline"
                                                  >
                                                    Hapus Foto
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}

                                        {/* If Missing */}
                                        {!item.is_present && (
                                          <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg space-y-2">
                                            <p className="font-bold text-rose-800 text-[10px] uppercase tracking-wider">🚨 Keterangan Barang Hilang</p>
                                            
                                            <div>
                                              <label className="block text-[9px] font-bold text-slate-600 mb-0.5">Kronologi Kehilangan <span className="text-red-500">*</span></label>
                                              <input
                                                type="text"
                                                className="input h-7 text-xs bg-white"
                                                placeholder="Kronologi / sebab hilangnya barang..."
                                                value={item.loss_desc || ''}
                                                onChange={e => handleUpdateLossDesc(item.item_id, e.target.value)}
                                                required
                                              />
                                            </div>

                                            <div className="grid grid-cols-3 gap-1.5">
                                              <div>
                                                <label className="block text-[8px] font-bold text-slate-500 mb-0.5">Hari</label>
                                                <select
                                                  className="input h-7 text-[10px] py-0.5 bg-white"
                                                  value={item.loss_day || 'Senin'}
                                                  onChange={e => handleUpdateLossDay(item.item_id, e.target.value)}
                                                >
                                                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(day => (
                                                    <option key={day} value={day}>{day}</option>
                                                  ))}
                                                </select>
                                              </div>
                                              <div>
                                                <label className="block text-[8px] font-bold text-slate-500 mb-0.5">Tanggal</label>
                                                <input
                                                  type="date"
                                                  className="input h-7 text-[10px] px-1 bg-white"
                                                  value={item.loss_date || ''}
                                                  onChange={e => handleUpdateLossDate(item.item_id, e.target.value)}
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-[8px] font-bold text-slate-500 mb-0.5">Estimasi Jam</label>
                                                <input
                                                  type="time"
                                                  className="input h-7 text-[10px] px-1 bg-white"
                                                  value={item.loss_time || ''}
                                                  onChange={e => handleUpdateLossTime(item.item_id, e.target.value)}
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })()}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Catatan Tambahan Masalah Sarpras Ruang</label>
              <textarea 
                className="input h-16 resize-none text-sm"
                placeholder="Tuliskan jika ada temuan khusus sarpras ruangan, misal: Atap bocor di sudut kanan, jendela kaca retak, atau AC tidak dingin..."
                value={generalNotes}
                onChange={e => setGeneralNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setSelectedRoomId(null); }} 
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Batal
              </button>
              <button 
                type="submit" 
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10"
              >
                Kirim Laporan Kelengkapan
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Reports history table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h4 className="font-extrabold text-slate-800 text-base">Hasil Pemantauan & Verifikasi Bulanan</h4>
            <p className="text-xs text-slate-500 font-medium">Seluruh laporan PIC beserta status verifikasi Waka Sarpras & Kepala Sekolah</p>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold">Total Terdata: {reports.length} Laporan</span>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ClipboardCheck size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Belum ada laporan kelengkapan bulanan</p>
            <p className="text-xs text-slate-400 mt-1">Belum ada ruangan yang dikirimkan pemeriksaannya oleh PIC ruang kelas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wider font-bold">
                  <th className="px-6 py-3.5">Bulan & Ruangan</th>
                  <th className="px-6 py-3.5">Kondisi Ruangan</th>
                  <th className="px-6 py-3.5">Penanggung Jawab PIC</th>
                  <th className="px-6 py-3.5">Status Barang</th>
                  <th className="px-6 py-3.5 text-center">Audit Sarpras</th>
                  <th className="px-6 py-3.5 text-center">Audit Kepsek</th>
                  <th className="px-6 py-3.5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {reports.map(r => {
                  let conditionBadge = '';
                  let conditionText = '';
                  if (r.room_condition === 'sangat_baik') {
                    conditionBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    conditionText = '✨ Sangat Baik';
                  } else if (r.room_condition === 'baik') {
                    conditionBadge = 'bg-blue-50 text-blue-700 border-blue-100';
                    conditionText = '✓ Baik';
                  } else if (r.room_condition === 'cukup') {
                    conditionBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                    conditionText = '⚠ Cukup';
                  } else if (r.room_condition === 'buruk_rusak') {
                    conditionBadge = 'bg-rose-50 text-rose-700 border-rose-100';
                    conditionText = '✗ Rusak/Kotor';
                  } else {
                    conditionBadge = 'bg-slate-50 text-slate-700 border-slate-100';
                    conditionText = '✓ Normal';
                  }

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-extrabold text-slate-900">{formatMonth(r.report_month)}</p>
                        <p className="text-xs text-indigo-700 font-bold flex items-center gap-1 mt-0.5">
                          <MapPin size={12} /> {r.room_name} ({r.room_code})
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${conditionBadge}`}>
                          {conditionText}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 text-xs">
                        {r.pic_name}
                        <span className="block text-[10px] text-slate-400 font-mono font-normal mt-0.5">Checked: {r.checked_date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          r.status === 'Lengkap' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : r.status === 'Kurang'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {r.status === 'Kurang' ? '⚠ Kurang / Hilang' : r.status === 'Rusak Sebagian' ? '🛠 Rusak Sebagian' : '✓ Lengkap'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.audited_by_sarpras === 'approved' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : r.audited_by_sarpras === 'rejected' 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {r.audited_by_sarpras === 'approved' ? '✓ Disetujui' : r.audited_by_sarpras === 'rejected' ? '✗ Ditolak' : '⌛ Menunggu'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.audited_by_kepsek === 'approved' 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : r.audited_by_kepsek === 'rejected' 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {r.audited_by_kepsek === 'approved' ? '✓ Sah / Ok' : r.audited_by_kepsek === 'rejected' ? '✗ Ditolak' : '⌛ Menunggu'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setSelectedReport(r);
                              setSarprasStatus(r.audited_by_sarpras === 'rejected' ? 'rejected' : 'approved');
                              setSarprasNotes(r.sarpras_audit_notes || '');
                              setKepsekStatus(r.audited_by_kepsek === 'rejected' ? 'rejected' : 'approved');
                              setKepsekNotes(r.kepsek_audit_notes || '');
                            }}
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold"
                            title="Detail / Audit Laporan"
                          >
                            <Eye size={13} /> Detail & Audit
                          </button>
                          {['admin', 'operator'].includes(currentUser.role) && (
                            <button
                              onClick={() => handleDeleteReport(r.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Checklist & Monthly Verification PopUp Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Pemantauan & Audit Kelengkapan Bulanan</h4>
                <p className="text-[10px] text-slate-500 font-semibold">{selectedReport.room_name} ({selectedReport.room_code}) - {formatMonth(selectedReport.report_month)}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                Tutup
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Report General Meta Data Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-slate-400 font-bold uppercase">Pemeriksa / PIC Ruang</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedReport.pic_name}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase">Tanggal Dilaksanakan</p>
                  <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{selectedReport.checked_date}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold uppercase">Kondisi Ruang Fisik</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {selectedReport.room_condition === 'sangat_baik' ? '✨ Sangat Baik' :
                     selectedReport.room_condition === 'baik' ? '✓ Baik' :
                     selectedReport.room_condition === 'cukup' ? '⚠ Cukup' : '✗ Rusak / Kotor'}
                  </p>
                </div>
              </div>

              {/* Checklist Aset Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                  <FileSpreadsheet size={13} className="text-indigo-600" /> Daftar Item & Kondisi Barang Ter-checklist
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 text-[10px] uppercase">
                        <th className="p-2.5">Nama Barang / Barcode</th>
                        <th className="p-2.5 text-center">Status</th>
                        <th className="p-2.5 text-center">Kondisi</th>
                        <th className="p-2.5">Temuan / Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(JSON.parse(selectedReport.items_status_json) as MonthlyCompletenessItem[]).map((itm, i) => (
                        <React.Fragment key={itm.item_id || i}>
                          <tr className="hover:bg-slate-50/50 font-medium">
                            <td className="p-2.5">
                              <p className="font-bold text-slate-800">{itm.item_name}</p>
                              <span className="font-mono text-[9px] text-slate-400 block mt-0.5">Barcode: {itm.barcode}</span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                itm.is_present 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {itm.is_present ? '✓ Ada' : '✗ Hilang'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-bold text-[9px] uppercase">
                              <span className={`inline-block px-2 py-0.5 rounded ${
                                itm.condition === 'baik' 
                                  ? 'bg-emerald-50 text-emerald-700' 
                                  : itm.condition === 'rusak_ringan' 
                                  ? 'bg-amber-50 text-amber-700' 
                                  : 'bg-rose-50 text-rose-700'
                              }`}>
                                {itm.condition.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500 italic">
                              {itm.notes ? `"${itm.notes}"` : '-'}
                            </td>
                          </tr>

                          {/* Detail panel if damaged or missing */}
                          {(!itm.is_present || itm.condition !== 'baik') && (
                            <tr className="bg-slate-50/40 border-b border-slate-100">
                              <td colSpan={4} className="p-3 pl-6 text-xs text-slate-600">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {itm.condition !== 'baik' && (
                                    <div className="bg-amber-50/30 border border-amber-100 rounded p-2.5 space-y-1.5">
                                      <p className="font-bold text-amber-800 text-[10px] uppercase tracking-wider">⚠️ Detail Kerusakan</p>
                                      <p className="font-semibold text-slate-800">Keterangan: <span className="font-medium text-slate-700">{itm.damage_desc || '-'}</span></p>
                                      {itm.photo_damage && (
                                        <div className="mt-1">
                                          <p className="font-semibold text-slate-500 text-[9px] mb-1">Foto Kerusakan:</p>
                                          <img 
                                            src={itm.photo_damage} 
                                            className="h-20 w-32 object-cover rounded border border-slate-200 shadow-sm cursor-pointer hover:opacity-90" 
                                            alt="Foto Kerusakan" 
                                            onClick={() => {
                                              const newWin = window.open('', '_blank');
                                              if (newWin) {
                                                newWin.document.write(`
                                                  <html>
                                                    <head><title>Foto Kerusakan</title></head>
                                                    <body style="margin:0; background:#000; display:flex; align-items:center; justify-content:center; height:100vh;">
                                                      <img src="${itm.photo_damage}" style="max-width:100%; max-height:100%; object-fit:contain;"/>
                                                    </body>
                                                  </html>
                                                `);
                                              }
                                            }}
                                            title="Klik untuk perbesar"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {!itm.is_present && (
                                    <div className="bg-rose-50/30 border border-rose-100 rounded p-2.5 space-y-1.5">
                                      <p className="font-bold text-rose-800 text-[10px] uppercase tracking-wider">🚨 Keterangan Hilang</p>
                                      <p className="font-semibold text-slate-800 font-medium">Kronologi Kejadian: <span className="font-medium text-slate-700">{itm.loss_desc || '-'}</span></p>
                                      <p className="font-semibold text-slate-800 font-medium">Hari / Tanggal / Jam: <span className="font-mono text-slate-700 font-medium">{itm.loss_day || '-'}, {itm.loss_date || '-'} pukul {itm.loss_time || '-'}</span></p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* General Room Notes */}
              {selectedReport.notes && (
                <div className="text-xs space-y-1 bg-slate-50 p-3.5 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Catatan Tambahan Temuan PIC:</span>
                  <p className="text-slate-700 font-medium italic">"{selectedReport.notes}"</p>
                </div>
              )}

              {/* Verified Status Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase">
                    <UserCheck className="text-emerald-600 animate-pulse" size={16} />
                    <span>Verifikasi Waka Sarpras</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">
                      Status: <span className={`font-bold uppercase ${selectedReport.audited_by_sarpras === 'approved' ? 'text-emerald-700' : (selectedReport.audited_by_sarpras === 'rejected' ? 'text-rose-600' : 'text-slate-500')}`}>
                        {selectedReport.audited_by_sarpras === 'approved' ? 'Disetujui' : (selectedReport.audited_by_sarpras === 'rejected' ? 'Ditolak' : 'Menunggu Pemeriksaan')}
                      </span>
                    </p>
                    <p className="text-slate-600 italic">
                      Catatan Sarpras: {selectedReport.sarpras_audit_notes ? `"${selectedReport.sarpras_audit_notes}"` : '-'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs uppercase">
                    <ShieldCheck className="text-indigo-600" size={16} />
                    <span>Verifikasi Kepala Sekolah</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">
                      Status: <span className={`font-bold uppercase ${selectedReport.audited_by_kepsek === 'approved' ? 'text-indigo-700' : (selectedReport.audited_by_kepsek === 'rejected' ? 'text-rose-600' : 'text-slate-500')}`}>
                        {selectedReport.audited_by_kepsek === 'approved' ? 'Disetujui & Sah' : (selectedReport.audited_by_kepsek === 'rejected' ? 'Ditolak' : 'Menunggu Pemeriksaan')}
                      </span>
                    </p>
                    <p className="text-slate-600 italic">
                      Catatan Kepsek: {selectedReport.kepsek_audit_notes ? `"${selectedReport.kepsek_audit_notes}"` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Audit Panels based on roles */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                
                {/* 1. Sarpras Audit Section */}
                {['admin', 'operator', 'waka_sarpras', 'waka_kurikulum', 'waka_kesiswaan'].includes(currentUser.role) && (
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs uppercase">
                      <UserCheck size={16} />
                      <span>Panel Audit Waka Sarpras (Verifikator 1)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Tindakan Sarpras</label>
                        <select 
                          className="input text-xs"
                          value={sarprasStatus}
                          onChange={e => setSarprasStatus(e.target.value as any)}
                        >
                          <option value="approved">Disetujui (Ok)</option>
                          <option value="rejected">Ditolak / Koreksi</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Catatan Evaluasi / Tindak Lanjut</label>
                        <input 
                          type="text" 
                          className="input h-9 text-xs" 
                          placeholder="Masukkan instruksi perbaikan atau catatan tindak lanjut..."
                          value={sarprasNotes}
                          onChange={e => setSarprasNotes(e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <button
                          type="button"
                          onClick={() => handleAuditSarpras(selectedReport.id)}
                          className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm"
                        >
                          Simpan Audit Sarpras
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Kepala Sekolah Audit Section */}
                {['admin', 'kepala_sekolah', 'waka_kurikulum', 'waka_kesiswaan'].includes(currentUser.role) && (
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs uppercase">
                      <ShieldCheck size={16} />
                      <span>Panel Audit Kepala Sekolah (Verifikator Akhir)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                      <div className="sm:col-span-1">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Tindakan Kepsek</label>
                        <select 
                          className="input text-xs"
                          value={kepsekStatus}
                          onChange={e => setKepsekStatus(e.target.value as any)}
                        >
                          <option value="approved">Disetujui & Sahkan</option>
                          <option value="rejected">Tolak</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Catatan Kepala Sekolah</label>
                        <input 
                          type="text" 
                          className="input h-9 text-xs" 
                          placeholder="Masukkan arahan atau disposisi dari Kepala Sekolah..."
                          value={kepsekNotes}
                          onChange={e => setKepsekNotes(e.target.value)}
                        />
                      </div>

                      <div className="sm:col-span-1">
                        <button
                          type="button"
                          onClick={() => handleAuditKepsek(selectedReport.id)}
                          className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition-all shadow-sm"
                        >
                          Sahkan Audit Kepsek
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Print buttons */}
              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                >
                  <Printer size={14} /> Cetak Bukti Audit Laporan Bulanan
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
