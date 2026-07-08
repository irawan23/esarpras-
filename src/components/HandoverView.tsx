import React, { useState, useEffect, useRef } from 'react';
import { Handover, InventoryItem } from '../types';
import { Calendar, User, FileText, Plus, Trash2, Printer, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';

function SignaturePad({ 
  label, 
  onSave, 
  onClear, 
  value 
}: { 
  label: string; 
  onSave: (dataUrl: string) => void; 
  onClear: () => void; 
  value: string; 
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#1e293b'; // slate-800
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    
    // Prevent scrolling when drawing on touch screens
    if (e.cancelable) e.preventDefault();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    if (e.cancelable) e.preventDefault();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // Account for styling size vs real canvas coordinate resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onClear();
      }
    }
  };

  return (
    <div className="border border-slate-200 bg-white p-3 rounded-xl space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <button type="button" onClick={clear} className="text-[10px] text-rose-600 hover:text-rose-800 font-bold uppercase tracking-wider">Hapus</button>
      </div>
      {value && value.startsWith('data:') ? (
        <div className="border border-dashed border-emerald-200 bg-emerald-50/30 rounded-lg p-2 flex justify-center items-center h-[120px] relative">
          <img src={value} alt="Tanda tangan" className="max-h-full object-contain" />
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/5 opacity-0 hover:opacity-100 transition-opacity rounded-lg cursor-pointer" onClick={clear}>
            <span className="bg-slate-800 text-white text-[9px] font-bold px-2 py-1 rounded">Klik untuk Gambar Ulang</span>
          </div>
        </div>
      ) : (
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={400}
            height={150}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="border border-slate-200 bg-slate-50 rounded-lg cursor-crosshair w-full h-[120px]"
          />
          <div className="absolute bottom-1 right-1 text-[8px] text-slate-400 font-bold uppercase select-none pointer-events-none px-1 bg-white/80 rounded">Goreskan Tanda Tangan Disini</div>
        </div>
      )}
    </div>
  );
}

interface HandoverViewProps {
  currentUser: { id: number; username: string; name: string; role: string };
}

export function HandoverView({ currentUser }: HandoverViewProps) {
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<Handover | null>(null);

  // Form states
  const [itemId, setItemId] = useState<number | null>(null);
  const [itemNameManual, setItemNameManual] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [giverName, setGiverName] = useState(currentUser.name || '');
  const [handoverDate, setHandoverDate] = useState(new Date().toISOString().split('T')[0]);
  const [condition, setCondition] = useState('baik');
  const [notes, setNotes] = useState('');
  const [docNo, setDocNo] = useState('');
  const [signPenerima, setSignPenerima] = useState('');
  const [signPenyerah, setSignPenyerah] = useState('');
  const [drawnPenyerah, setDrawnPenyerah] = useState('');
  const [drawnPenerima, setDrawnPenerima] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchHandovers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/handovers');
      const data = await res.json();
      setHandovers(data);
    } catch (e) {
      console.error('Failed to fetch handovers', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error('Failed to fetch items', e);
    }
  };

  useEffect(() => {
    fetchHandovers();
    fetchItems();
  }, []);

  const handleItemSelect = (id: number) => {
    setItemId(id);
    const selected = items.find(i => i.id === id);
    if (selected) {
      setItemNameManual(selected.name);
      setCondition(selected.condition);
    }
  };

  const generateDocNo = () => {
    const date = new Date();
    const prefix = 'BAST';
    const num = Math.floor(1000 + Math.random() * 9000);
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const month = romanMonths[date.getMonth()];
    const year = date.getFullYear();
    setDocNo(`${prefix}/${num}/SMK-CONTOH/${month}/${year}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!itemNameManual.trim()) {
      setError('Nama barang harus diisi.');
      return;
    }
    if (!recipientName.trim()) {
      setError('Nama penerima harus diisi.');
      return;
    }
    if (!giverName.trim()) {
      setError('Nama penyerah harus diisi.');
      return;
    }
    if (!signPenerima.trim() || !signPenyerah.trim()) {
      setError('Konfirmasi nama lengkap penyerah dan penerima harus diisi.');
      return;
    }

    try {
      const res = await fetch('/api/handovers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          item_name: itemNameManual,
          recipient_name: recipientName,
          giver_name: giverName,
          handover_date: handoverDate,
          condition,
          notes,
          handover_doc_no: docNo || `BAST/${Date.now().toString().slice(-6)}`,
          signature_penerima: drawnPenerima || signPenerima,
          signature_penyerah: drawnPenyerah || signPenyerah
        })
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Berita Acara Serah Terima (BAST) berhasil disimpan dan tercatat di inventaris!');
        // Reset states
        setItemId(null);
        setItemNameManual('');
        setRecipientName('');
        setGiverName(currentUser.name || '');
        setNotes('');
        setDocNo('');
        setSignPenerima('');
        setSignPenyerah('');
        setDrawnPenyerah('');
        setDrawnPenerima('');
        setShowForm(false);
        fetchHandovers();
        fetchItems(); // refresh item PICs
      } else {
        setError(data.message || 'Gagal menyimpan serah terima.');
      }
    } catch (err: any) {
      setError('Terjadi kesalahan koneksi.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data serah terima ini?')) return;
    try {
      const res = await fetch(`/api/handovers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchHandovers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-8 space-y-6">
      
      {/* Upper header action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Serah Terima Barang (BAST)</h3>
          <p className="text-sm text-slate-500">Pencatatan mutasi penanggung jawab barang dan serah terima aset baru</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={fetchHandovers}
            className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors"
            title="Muat Ulang"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          {['admin', 'operator'].includes(currentUser.role) && (
            <button
              onClick={() => { setShowForm(!showForm); generateDocNo(); }}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={18} /> Buat BAST Baru
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="text-emerald-600 shrink-0" size={20} />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Handover Form Dialog/Section */}
      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="text-lg font-bold text-slate-900">Formulir Berita Acara Serah Terima</h4>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">Batal</button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Handover Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Pilih Aset Sekolah (Dari Inventaris)
                </label>
                <select 
                  className="input text-sm"
                  onChange={e => {
                    const val = e.target.value;
                    if (val === "") {
                      setItemId(null);
                      setItemNameManual('');
                    } else {
                      handleItemSelect(parseInt(val));
                    }
                  }}
                  value={itemId || ""}
                >
                  <option value="">-- Buat serah terima manual / barang baru --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      [{i.barcode || 'NO-BARCODE'}] {i.name} - (PIC saat ini: {i.pic_name || 'Tidak ada'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Contoh: Laptop Lenovo ThinkPad E14"
                  value={itemNameManual}
                  onChange={e => setItemNameManual(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. Berita Acara <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="input" 
                      placeholder="BAST/.../..."
                      value={docNo}
                      onChange={e => setDocNo(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Penyerahan <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="input"
                    value={handoverDate}
                    onChange={e => setHandoverDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pihak I (Penyerah) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Nama Penyerah / Pengelola"
                    value={giverName}
                    onChange={e => setGiverName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Pihak II (Penerima) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Nama Penerima / PIC Baru"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Conditions, Signatures & Remarks */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kondisi Barang Saat Diserahkan</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'baik', label: 'Baik', color: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
                    { val: 'rusak_ringan', label: 'Rusak Ringan', color: 'border-amber-200 text-amber-700 bg-amber-50' },
                    { val: 'rusak_berat', label: 'Rusak Berat', color: 'border-rose-200 text-rose-700 bg-rose-50' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setCondition(opt.val)}
                      className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all ${
                        condition === opt.val 
                          ? `${opt.color} ring-2 ring-indigo-500` 
                          : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Catatan Tambahan / Keperluan</label>
                <textarea 
                  className="input h-20 resize-none text-sm"
                  placeholder="Keterangan serah terima, misal: Untuk inventaris ruang kelas baru, atau mutasi karena penggantian PIC..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Digital Sign Confirmation */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Protokol Konfirmasi Tanda Tangan Digital (BAST)
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Nama Terang Penyerah <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className="input text-xs font-semibold h-9"
                        placeholder="Ketik Nama Anda"
                        value={signPenyerah}
                        onChange={e => setSignPenyerah(e.target.value)}
                        required
                      />
                    </div>
                    <SignaturePad 
                      label="Tanda Tangan Basah Penyerah (Goreskan)"
                      value={drawnPenyerah}
                      onSave={(dataUrl) => setDrawnPenyerah(dataUrl)}
                      onClear={() => setDrawnPenyerah('')}
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1 uppercase tracking-wider">Nama Terang Penerima <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        className="input text-xs font-semibold h-9"
                        placeholder="Ketik Nama Penerima"
                        value={signPenerima}
                        onChange={e => setSignPenerima(e.target.value)}
                        required
                      />
                    </div>
                    <SignaturePad 
                      label="Tanda Tangan Basah Penerima (Goreskan)"
                      value={drawnPenerima}
                      onSave={(dataUrl) => setDrawnPenerima(dataUrl)}
                      onClear={() => setDrawnPenerima('')}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/10"
                >
                  Simpan & Sahkan BAST
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* Main Table List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="font-bold text-slate-800">Riwayat Berita Acara Serah Terima</h4>
          <span className="text-xs text-slate-500 font-medium">Total BAST: {handovers.length}</span>
        </div>

        {handovers.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-600">Belum ada serah terima yang tercatat</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol "Buat BAST Baru" di atas untuk mencatat serah terima.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">No. Dokumen / Tanggal</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Aset Barang</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Pihak Penyerah</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Pihak Penerima</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Kondisi</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {handovers.map(h => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 font-mono text-xs">{h.handover_doc_no}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={12} /> {h.handover_date}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{h.item_name}</p>
                      {h.item_barcode && (
                        <span className="inline-block bg-slate-100 text-slate-600 font-mono text-[10px] px-1.5 py-0.5 rounded border border-slate-200 mt-1">
                          Barcode: {h.item_barcode}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-800 flex items-center gap-1">
                        <User size={13} className="text-slate-400" /> {h.giver_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-indigo-700 flex items-center gap-1">
                        <User size={13} className="text-indigo-400" /> {h.recipient_name}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        h.condition === 'baik' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : h.condition === 'rusak_ringan'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {h.condition.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setSelectedHandover(h)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all flex items-center gap-1 text-xs font-semibold"
                          title="Cetak Berita Acara"
                        >
                          <Printer size={13} /> Cetak
                        </button>
                        {['admin', 'operator'].includes(currentUser.role) && (
                          <button
                            onClick={() => handleDelete(h.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all"
                            title="Hapus"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Berita Acara Modal */}
      {selectedHandover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Action Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500">Pratinjau Dokumen BAST Resmi</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Printer size={14} /> Cetak BAST
                </button>
                <button
                  onClick={() => setSelectedHandover(null)}
                  className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 flex-1 overflow-y-auto bg-white text-slate-800 space-y-6 printable-document">
              
              {/* Document Header */}
              <div className="text-center border-b-2 border-slate-950 pb-4 space-y-1">
                <h2 className="text-md font-bold tracking-widest text-slate-950 uppercase">BERITA ACARA SERAH TERIMA BARANG</h2>
                <h3 className="text-sm font-semibold text-slate-900 font-mono">{selectedHandover.handover_doc_no}</h3>
                <p className="text-xs text-slate-500 italic">SMK NEGERI CONTOH JAKARTA</p>
              </div>

              {/* Opening sentence */}
              <div className="text-xs leading-relaxed space-y-2 text-justify">
                <p>
                  Pada hari ini, tanggal <strong>{selectedHandover.handover_date}</strong>, kami yang bertanda tangan di bawah ini telah melakukan serah terima aset/barang inventaris sekolah dengan rincian sebagai berikut:
                </p>
              </div>

              {/* Parties Details */}
              <div className="space-y-4 text-xs">
                {/* Party 1 */}
                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                  <p className="font-bold text-slate-950 border-b border-slate-100 pb-1 mb-1.5 uppercase tracking-wider text-[10px]">Pihak I (Penyerah):</p>
                  <div className="grid grid-cols-3 gap-y-1">
                    <span className="text-slate-500">Nama Lengkap</span>
                    <span className="col-span-2">: <strong>{selectedHandover.giver_name}</strong></span>
                    <span className="text-slate-500">Jabatan/PIC</span>
                    <span className="col-span-2">: Pengelola Sarana & Prasarana</span>
                  </div>
                </div>

                {/* Party 2 */}
                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                  <p className="font-bold text-slate-950 border-b border-slate-100 pb-1 mb-1.5 uppercase tracking-wider text-[10px]">Pihak II (Penerima):</p>
                  <div className="grid grid-cols-3 gap-y-1">
                    <span className="text-slate-500">Nama Lengkap</span>
                    <span className="col-span-2">: <strong>{selectedHandover.recipient_name}</strong></span>
                    <span className="text-slate-500">Jabatan/PIC</span>
                    <span className="col-span-2">: Penanggung Jawab (PIC) Ruang</span>
                  </div>
                </div>
              </div>

              {/* Item details */}
              <div className="space-y-2 text-xs">
                <p className="font-bold text-slate-950 uppercase tracking-wider text-[10px]">Spesifikasi Aset Barang:</p>
                <table className="w-full text-left border border-slate-300">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-300">
                      <th className="p-2 border-r border-slate-300 font-bold">Deskripsi Barang</th>
                      <th className="p-2 border-r border-slate-300 font-bold">Nomor Barcode</th>
                      <th className="p-2 border-r border-slate-300 font-bold text-center">Kondisi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="p-2 border-r border-slate-300 font-semibold">{selectedHandover.item_name}</td>
                      <td className="p-2 border-r border-slate-300 font-mono">{selectedHandover.item_barcode || '- (Serah terima manual)'}</td>
                      <td className="p-2 border-r border-slate-300 text-center font-bold uppercase">{selectedHandover.condition}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Notes */}
              {selectedHandover.notes && (
                <div className="text-xs space-y-1">
                  <p className="font-bold text-slate-950 uppercase tracking-wider text-[10px]">Catatan / Keterangan Tambahan:</p>
                  <p className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg italic text-slate-600">
                    "{selectedHandover.notes}"
                  </p>
                </div>
              )}

              {/* Signatures block */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="flex flex-col justify-between h-44">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Pihak I (Penyerah)</p>
                    <p className="text-[10px] text-slate-400">Telah menyerahkan barang</p>
                  </div>
                  <div className="flex flex-col items-center justify-end flex-1 pb-2">
                    {selectedHandover.signature_penyerah && selectedHandover.signature_penyerah.startsWith('data:') ? (
                      <img src={selectedHandover.signature_penyerah} alt="Ttd Penyerah" className="h-16 object-contain" />
                    ) : (
                      <span className="font-mono text-sm underline font-bold">{selectedHandover.signature_penyerah || selectedHandover.giver_name}</span>
                    )}
                    {selectedHandover.signature_penyerah && selectedHandover.signature_penyerah.startsWith('data:') && (
                      <span className="font-semibold text-slate-800 mt-1">{selectedHandover.giver_name}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 italic border-t border-slate-200 pt-1">Nama Terang & Ttd Elektronik</p>
                </div>

                <div className="flex flex-col justify-between h-44">
                  <div>
                    <p className="font-bold text-indigo-900 text-sm">Pihak II (Penerima)</p>
                    <p className="text-[10px] text-slate-400">Telah memeriksa & menerima barang</p>
                  </div>
                  <div className="flex flex-col items-center justify-end flex-1 pb-2">
                    {selectedHandover.signature_penerima && selectedHandover.signature_penerima.startsWith('data:') ? (
                      <img src={selectedHandover.signature_penerima} alt="Ttd Penerima" className="h-16 object-contain" />
                    ) : (
                      <span className="font-mono text-sm underline font-bold text-indigo-900">{selectedHandover.signature_penerima || selectedHandover.recipient_name}</span>
                    )}
                    {selectedHandover.signature_penerima && selectedHandover.signature_penerima.startsWith('data:') && (
                      <span className="font-semibold text-indigo-900 mt-1">{selectedHandover.recipient_name}</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 italic border-t border-slate-200 pt-1">Nama Terang & Ttd Elektronik</p>
                </div>
              </div>

              {/* Footer text */}
              <div className="text-center pt-8 text-[9px] text-slate-400 border-t border-slate-100 italic">
                NUCEN ESARPRAS - Sistem Informasi Sarpras Sekolah
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
