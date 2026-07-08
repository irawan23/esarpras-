import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { User } from '../types';

interface ProcurementFormProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
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

export function ProcurementForm({ user, onClose, onSuccess }: ProcurementFormProps) {
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: 1,
    estimated_price: 0,
    purpose: '',
  });

  const [selectedOpt, setSelectedOpt] = useState('Wali Kelas');
  const [customPosition, setCustomPosition] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPosition = selectedOpt === 'Lainnya' ? customPosition : selectedOpt;
    const res = await fetch('/api/procurement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        requester_position: finalPosition || 'Lainnya',
        requester_id: user.id
      })
    });
    if (res.ok) onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">Pengajuan Barang Baru</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nama Barang yang Diajukan</label>
            <input 
              type="text" className="input" placeholder="Misal: Proyektor Epson EB-X400"
              value={formData.item_name} onChange={e => setFormData({ ...formData, item_name: e.target.value })}
              required 
            />
          </div>
          
          <div>
            <label className="label">Kategori / Jabatan Pengaju</label>
            <select 
              className="input"
              value={selectedOpt} 
              onChange={e => setSelectedOpt(e.target.value)}
              required
            >
              {POSITION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {selectedOpt === 'Lainnya' && (
            <div>
              <label className="label">Tuliskan Jabatan Pengaju Custom</label>
              <input 
                type="text" className="input" placeholder="Misal: Staf Perpustakaan"
                value={customPosition} onChange={e => setCustomPosition(e.target.value)}
                required 
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Jumlah (Qty)</label>
              <input 
                type="number" className="input" min="1"
                value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                required 
              />
            </div>
            <div>
              <label className="label">Estimasi Harga (Rp)</label>
              <input 
                type="number" className="input"
                value={formData.estimated_price} onChange={e => setFormData({ ...formData, estimated_price: parseFloat(e.target.value) || 0 })}
                required 
              />
            </div>
          </div>
          <div>
            <label className="label">Tujuan Pengadaan</label>
            <textarea 
              className="input h-24 resize-none" placeholder="Jelaskan alasan kebutuhan barang ini..."
              value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <Save size={18} /> Kirim Pengajuan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
