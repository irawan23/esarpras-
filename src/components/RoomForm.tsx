import React, { useState, useEffect } from 'react';
import { X, Save, Camera, Trash2, Image } from 'lucide-react';
import { Room } from '../types';

interface RoomFormProps {
  roomToEdit?: Room | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoomForm({ roomToEdit, onClose, onSuccess }: RoomFormProps) {
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    pic_name: string;
    description: string;
    photo_luar: string | null;
    photo_dalam: string | null;
    photo_depan: string | null;
    photo_belakang: string | null;
  }>({
    code: '',
    name: '',
    pic_name: '',
    description: '',
    photo_luar: null,
    photo_dalam: null,
    photo_depan: null,
    photo_belakang: null
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roomToEdit) {
      setFormData({
        code: roomToEdit.code || '',
        name: roomToEdit.name || '',
        pic_name: roomToEdit.pic_name || '',
        description: roomToEdit.description || '',
        photo_luar: roomToEdit.photo_luar || null,
        photo_dalam: roomToEdit.photo_dalam || null,
        photo_depan: roomToEdit.photo_depan || null,
        photo_belakang: roomToEdit.photo_belakang || null,
      });
    }
  }, [roomToEdit]);

  const handleFileChange = (key: 'photo_luar' | 'photo_dalam' | 'photo_depan' | 'photo_belakang', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal adalah 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (key: 'photo_luar' | 'photo_dalam' | 'photo_depan' | 'photo_belakang') => {
    setFormData(prev => ({ ...prev, [key]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const url = roomToEdit ? `/api/rooms/${roomToEdit.id}` : '/api/rooms';
    const method = roomToEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      setError(data.message || 'Gagal menyimpan data ruangan.');
    }
  };

  const photoFields = [
    { key: 'photo_luar' as const, label: 'Kondisi Luar Ruangan', desc: 'Selasar, dinding luar, teras' },
    { key: 'photo_dalam' as const, label: 'Kondisi Dalam Ruangan', desc: 'Interior, plafon, lantai, meja' },
    { key: 'photo_depan' as const, label: 'Tampak Depan Ruangan', desc: 'Pintu utama, fasad depan' },
    { key: 'photo_belakang' as const, label: 'Tampak Belakang Ruangan', desc: 'Dinding belakang, area belakang' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <h3 className="text-xl font-bold text-slate-900">
            {roomToEdit ? 'Edit Ruangan & Foto Dokumentasi' : 'Tambah Ruangan Baru'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left side: Text Inputs */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                Informasi Umum Ruangan
              </h4>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Kode Ruangan</label>
                <input 
                  type="text" className="input" placeholder="LAB-01"
                  value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })}
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Nama Ruangan</label>
                <input 
                  type="text" className="input" placeholder="Laboratorium Komputer"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Penanggung Jawab (PIC)</label>
                <input 
                  type="text" className="input" placeholder="Nama Guru/Staff"
                  value={formData.pic_name} onChange={e => setFormData({ ...formData, pic_name: e.target.value })}
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Keterangan</label>
                <textarea 
                  className="input h-32 resize-none"
                  placeholder="Keterangan atau detail ruangan..."
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Right side: 4 Room Photos */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                Foto Dokumentasi Kondisi Ruang (4 Sisi)
              </h4>

              <div className="grid grid-cols-2 gap-4">
                {photoFields.map(field => (
                  <div key={field.key} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between h-[180px]">
                    <div>
                      <span className="text-[11px] font-bold text-slate-800 block truncate" title={field.label}>{field.label}</span>
                      <span className="text-[9px] text-slate-400 block truncate">{field.desc}</span>
                    </div>

                    <div className="mt-2 flex-1 flex items-center justify-center relative overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm">
                      {formData[field.key] ? (
                        <div className="absolute inset-0 group">
                          <img 
                            src={formData[field.key]!} 
                            alt={field.label} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => removePhoto(field.key)}
                              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-transform hover:scale-110 shadow"
                              title="Hapus Foto"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full p-2 text-center text-slate-400 hover:text-slate-600 transition-colors">
                          <Camera size={18} className="mb-1" />
                          <span className="text-[10px] font-semibold">Ambil / Pilih Foto</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileChange(field.key, e)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Form Actions Footer inside scroll body but at bottom */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
            <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <Save size={18} /> Simpan Ruangan
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
