import React, { useState, useEffect } from 'react';
import { X, Save, Search, Barcode } from 'lucide-react';
import { User, InventoryItem, ItemCondition } from '../types';
import { BarcodeScanner } from './BarcodeScanner';

interface OpnameFormProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function OpnameForm({ user, onClose, onSuccess }: OpnameFormProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    condition_after: 'baik' as ItemCondition,
    notes: '',
  });

  useEffect(() => {
    fetch('/api/inventory').then(res => res.json()).then(setItems);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    const res = await fetch('/api/opname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: selectedItem.id,
        condition_after: formData.condition_after,
        notes: formData.notes,
        operator_id: user.id
      })
    });
    
    if (res.ok) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Stock Opname (Cek Kondisi)</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select 
                  className="input pl-10"
                  value={selectedItem?.id || 0}
                  onChange={e => setSelectedItem(items.find(i => i.id === parseInt(e.target.value)) || null)}
                >
                  <option value={0}>Cari Barang...</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.barcode})</option>)}
                </select>
              </div>
              <button 
                type="button" 
                onClick={() => setShowScanner(true)}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Barcode size={18} /> Scan
              </button>
            </div>

            {selectedItem && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-amber-600 font-medium">Barang Terpilih:</span>
                    <span className="text-sm font-bold text-amber-900">{selectedItem.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-amber-600 font-medium">Kondisi Terakhir:</span>
                    <span className={`text-sm font-bold uppercase ${
                      selectedItem.condition === 'baik' ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {selectedItem.condition.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-amber-600 font-medium">Kode Barcode:</span>
                    <span className="text-sm font-mono text-slate-600">{selectedItem.barcode}</span>
                  </div>
                  {selectedItem.brand && (
                    <div className="flex justify-between">
                      <span className="text-sm text-amber-600 font-medium">Merk / Brand:</span>
                      <span className="text-sm font-semibold text-slate-700">{selectedItem.brand}</span>
                    </div>
                  )}
                </div>
                {selectedItem.initial_photo && (
                  <div className="w-28 h-28 bg-white border border-amber-200 rounded-lg overflow-hidden shrink-0 flex flex-col items-center justify-center p-1.5 shadow-sm">
                    <img 
                      src={selectedItem.initial_photo} 
                      alt="Kondisi Awal" 
                      className="w-full h-20 object-contain rounded"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Kondisi Awal</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Kondisi Saat Ini</label>
              <select 
                className="input"
                value={formData.condition_after}
                onChange={e => setFormData({ ...formData, condition_after: e.target.value as ItemCondition })}
                required
              >
                <option value="baik">Baik</option>
                <option value="rusak_ringan">Rusak Ringan</option>
                <option value="rusak_berat">Rusak Berat</option>
              </select>
            </div>

            {formData.condition_after !== 'baik' && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 font-medium animate-in fade-in-50 duration-200">
                <span className="text-base leading-none">⚠️</span>
                <div>
                  <strong className="block text-rose-800 mb-0.5">Pelaporan Kerusakan Terdeteksi</strong>
                  Silakan tulis catatan detail mengenai bagian yang rusak di bawah ini agar petugas sarpras/teknisi dapat memahami tingkat kerusakan dengan jelas.
                </div>
              </div>
            )}

            <div>
              <label className="label font-semibold">
                {formData.condition_after !== 'baik' ? 'Catatan Detail Kerusakan Barang' : 'Catatan Pemeriksaan'}
              </label>
              <textarea 
                className="input h-24 resize-none" 
                placeholder={formData.condition_after !== 'baik' ? "Contoh: Layar LCD pecah, engsel kiri patah, atau adaptor daya tidak dapat menyala..." : "Contoh: Kondisi fisik bersih, semua tombol berfungsi normal..."}
                value={formData.notes} 
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                required={formData.condition_after !== 'baik'}
              />
              {formData.condition_after !== 'baik' && !formData.notes && (
                <p className="text-[10px] text-rose-600 mt-1 font-semibold">* Keterangan kerusakan wajib diisi agar laporan dapat diproses</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={!selectedItem}>
              <Save size={18} /> Simpan Hasil Cek
            </button>
          </div>
        </form>
      </div>

      {showScanner && (
        <BarcodeScanner 
          onScan={(code) => {
            const found = items.find(i => i.barcode === code);
            if (found) setSelectedItem(found);
            else alert('Barang tidak ditemukan');
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
