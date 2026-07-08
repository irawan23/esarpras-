import React, { useState, useEffect } from 'react';
import { X, Save, Search, Barcode } from 'lucide-react';
import { User, InventoryItem, Room } from '../types';
import { BarcodeScanner } from './BarcodeScanner';

interface MutationFormProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export function MutationForm({ user, onClose, onSuccess }: MutationFormProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    to_room_id: 0,
    reason: '',
  });

  useEffect(() => {
    fetch('/api/inventory').then(res => res.json()).then(setItems);
    fetch('/api/rooms').then(res => res.json()).then(setRooms);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    const res = await fetch('/api/mutations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: selectedItem.id,
        to_room_id: formData.to_room_id,
        reason: formData.reason,
        operator_id: user.id
      })
    });
    
    if (res.ok) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Proses Mutasi Barang</h3>
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
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-indigo-600 font-medium">Barang Terpilih:</span>
                  <span className="text-sm font-bold text-indigo-900">{selectedItem.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-indigo-600 font-medium">Lokasi Saat Ini:</span>
                  <span className="text-sm font-bold text-indigo-900">{selectedItem.room_name || 'Belum diatur'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Pindahkan Ke Ruangan</label>
              <select 
                className="input"
                value={formData.to_room_id}
                onChange={e => setFormData({ ...formData, to_room_id: parseInt(e.target.value) })}
                required
              >
                <option value={0}>Pilih Ruangan Tujuan...</option>
                {rooms.filter(r => r.id !== selectedItem?.room_id).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Alasan Mutasi</label>
              <input 
                type="text" className="input" placeholder="Misal: Perbaikan, Kebutuhan Lab"
                value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={!selectedItem}>
              <Save size={18} /> Proses Mutasi
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
