import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Printer } from 'lucide-react';
import { InventoryItem, Room, ItemCategory, ItemCondition, ItemStatus, SchoolSettings } from '../types';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';

interface InventoryFormProps {
  item: InventoryItem | null;
  category: ItemCategory;
  onClose: () => void;
  onSuccess: () => void;
}

export function InventoryForm({ item, category, onClose, onSuccess }: InventoryFormProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const printRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    barcode: item?.barcode || `BRC-${Date.now()}`,
    name: item?.name || '',
    category: category,
    brand: item?.brand || '',
    specification: item?.specification || '',
    year_acquired: item?.year_acquired || new Date().getFullYear(),
    source_fund: item?.source_fund || '',
    price: item?.price || 0,
    condition: item?.condition || 'baik' as ItemCondition,
    status: item?.status || 'aktif' as ItemStatus,
    room_id: item?.room_id || 0,
    pic_name: item?.pic_name || '',
    notes: item?.notes || '',
    initial_photo: item?.initial_photo || null,
    // land fields
    land_owner: item?.land_owner || '',
    land_alas_hak: item?.land_alas_hak || '',
    land_certificate_no_date: item?.land_certificate_no_date || '',
    land_acquisition_history: item?.land_acquisition_history || '',
    land_location: item?.land_location || '',
    land_area: item?.land_area || '',
    land_boundaries: item?.land_boundaries || '',
    land_coordinates: item?.land_coordinates || '',
    // building fields
    building_name: item?.building_name || '',
    building_code: item?.building_code || '',
    building_area: item?.building_area || '',
    building_source: item?.building_source || '',
    building_year: item?.building_year || new Date().getFullYear(),
    building_condition: item?.building_condition || 'Baik',
    building_construction: item?.building_construction || ''
  });

  useEffect(() => {
    fetch('/api/rooms').then(res => res.json()).then(setRooms);
    fetch('/api/settings').then(res => res.json()).then(setSettings);
  }, []);

  const handlePrintLabel = useReactToPrint({
    contentRef: printRef,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Auto-populate required fields for specialized categories to satisfy database constraints and look beautiful
    const finalFormData = { ...formData };
    if (category === 'tanah') {
      finalFormData.name = formData.land_owner ? `Tanah - ${formData.land_owner}` : 'Tanah';
      finalFormData.condition = 'baik';
      finalFormData.year_acquired = new Date().getFullYear();
      finalFormData.status = 'aktif';
      finalFormData.room_id = null as any;
    } else if (category === 'bangunan') {
      finalFormData.name = formData.building_name ? `Gedung - ${formData.building_name}` : 'Gedung/Bangunan';
      
      const cond = formData.building_condition.toLowerCase();
      if (cond.includes('sangat baik') || cond === 'baik') {
        finalFormData.condition = 'baik';
      } else if (cond.includes('ringan')) {
        finalFormData.condition = 'rusak_ringan';
      } else {
        finalFormData.condition = 'rusak_berat';
      }
      finalFormData.year_acquired = formData.building_year;
      finalFormData.status = 'aktif';
      finalFormData.room_id = null as any;
    } else {
      // For general inventory, make sure a room is selected
      if (!formData.room_id || formData.room_id === 0) {
        setError('Silakan pilih lokasi ruangan untuk barang inventaris umum.');
        return;
      }
    }

    const url = item ? `/api/inventory/${item.id}` : '/api/inventory';
    const method = item ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalFormData)
      });
      
      if (res.ok) {
        if (autoPrint) {
          setFormData(finalFormData);
          setTimeout(() => {
            handlePrintLabel();
            setTimeout(() => {
              onSuccess();
            }, 1500);
          }, 150);
        } else {
          onSuccess();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'Gagal menyimpan data ke server.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan jaringan saat menyimpan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Printable Label Section */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', opacity: 0, pointerEvents: 'none', zIndex: -999 }}>
        <div 
          ref={printRef} 
          className="p-4 bg-white text-black font-sans text-center"
          style={{ 
            width: '80mm', 
            height: '40mm', 
            boxSizing: 'border-box',
          }}
        >
          <div className="border-2 border-slate-900 p-2 h-full flex flex-col justify-between rounded-lg">
            <div className="border-b border-slate-300 pb-1 text-center">
              <h5 className="text-[9px] font-black uppercase tracking-tight text-slate-800 leading-none">
                {settings?.school_name || 'SMK NEGERI CONTOH'}
              </h5>
              <p className="text-[6px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">KARTU INVENTARIS ASET</p>
            </div>
            
            <div className="flex flex-col items-center justify-center py-1">
              <Barcode 
                value={formData.barcode} 
                width={1.2} 
                height={35} 
                fontSize={8} 
                margin={0} 
                displayValue={true}
              />
            </div>
            
            <div className="border-t border-slate-200 pt-1 text-left text-[7px] leading-tight space-y-0.5">
              <div className="flex justify-between font-bold">
                <span className="truncate max-w-[150px] text-slate-900 uppercase">
                  {category === 'tanah' 
                    ? `Tanah - ${formData.land_owner || 'Tanpa Nama Pemilik'}` 
                    : category === 'bangunan' 
                      ? `Gedung - ${formData.building_name || 'Tanpa Nama Gedung'}` 
                      : formData.name}
                </span>
                <span className="text-slate-500 font-mono text-[6px]">
                  {category === 'tanah' ? (formData.land_area || '-') : category === 'bangunan' ? (formData.building_code || '-') : (formData.brand || '-')}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 font-medium">
                <span>
                  {category === 'tanah' ? 'Lokasi: ' : 'Ruang: '}
                  <strong className="text-slate-950 font-semibold">
                    {category === 'tanah' 
                      ? (formData.land_location || '-') 
                      : category === 'bangunan' 
                        ? (formData.building_name || '-') 
                        : (rooms.find(r => r.id === formData.room_id)?.name || '-')}
                  </strong>
                </span>
                <span>Tahun: <strong className="text-slate-950 font-semibold">{category === 'bangunan' ? formData.building_year : formData.year_acquired}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {item ? 'Detail / Edit Inventaris' : 'Tambah Inventaris Baru'}
              </h3>
              <p className="text-xs text-slate-500 font-semibold capitalize mt-1">Kategori: {category}</p>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              title="Tutup"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Body - Scrollable */}
          <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
          {error && (
            <div className="md:col-span-2 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-700 text-sm font-semibold flex items-center gap-2">
              <span className="shrink-0 flex items-center justify-center w-5 h-5 bg-red-500 text-white rounded-full text-xs">!</span>
              <div>{error}</div>
            </div>
          )}
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
              <Barcode value={formData.barcode} width={1.5} height={50} fontSize={12} />
              <p className="mt-2 text-xs font-mono text-slate-500">{formData.barcode}</p>
              
              <div className="flex flex-col items-center gap-3 mt-4 w-full">
                <button 
                  type="button" 
                  onClick={() => handlePrintLabel()}
                  className="text-indigo-600 text-sm font-bold flex items-center justify-center gap-1.5 hover:underline bg-white border border-indigo-200 hover:border-indigo-600 px-4 py-2 rounded-xl shadow-sm transition-all w-full"
                >
                  <Printer size={16} /> Cetak Label Sekarang
                </button>
                
                <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-100 hover:bg-slate-200/60 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 w-full transition-all">
                  <input 
                    type="checkbox" 
                    checked={autoPrint} 
                    onChange={e => setAutoPrint(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-semibold text-left">Cetak label otomatis setelah simpan</span>
                </label>
              </div>
            </div>

            {/* Foto Barang Kondisi Awal Section */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Foto Barang (Kondisi Awal)</span>
              
              {formData.initial_photo ? (
                <div className="relative group rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm flex flex-col items-center justify-center p-2">
                  <img 
                    src={formData.initial_photo} 
                    alt="Foto barang kondisi awal" 
                    className="w-full max-h-48 object-contain rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, initial_photo: null })}
                    className="absolute top-4 right-4 bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-full shadow-lg transition-all flex items-center justify-center"
                    title="Hapus foto"
                  >
                    <Trash2 size={16} />
                  </button>
                  <span className="text-[10px] text-slate-500 mt-2 font-mono">Terunggah</span>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white p-8 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">Ambil atau Unggah Foto</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Format JPG/PNG, maksimal 5MB</span>
                  </div>
                  <label className="cursor-pointer px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                    Pilih File Foto
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({ ...prev, initial_photo: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              )}
            </div>

            {category === 'umum' && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="label">Nama Barang</label>
                  <input 
                    type="text" className="input" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Merk / Brand</label>
                    <input 
                      type="text" className="input" 
                      value={formData.brand} 
                      onChange={e => setFormData({ ...formData, brand: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="label">Tahun Perolehan</label>
                    <input 
                      type="number" className="input" 
                      value={formData.year_acquired} 
                      onChange={e => setFormData({ ...formData, year_acquired: parseInt(e.target.value) || new Date().getFullYear() })} 
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Spesifikasi</label>
                  <textarea 
                    className="input h-24 resize-none" 
                    value={formData.specification} 
                    onChange={e => setFormData({ ...formData, specification: e.target.value })} 
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {category === 'umum' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Sumber Dana</label>
                    <input 
                      type="text" className="input" 
                      value={formData.source_fund} 
                      onChange={e => setFormData({ ...formData, source_fund: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="label">Harga Satuan</label>
                    <input 
                      type="number" className="input" 
                      value={formData.price} 
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Kondisi</label>
                    <select 
                      className="input" 
                      value={formData.condition} 
                      onChange={e => setFormData({ ...formData, condition: e.target.value as ItemCondition })}
                    >
                      <option value="baik">Baik</option>
                      <option value="rusak_ringan">Rusak Ringan</option>
                      <option value="rusak_berat">Rusak Berat</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select 
                      className="input" 
                      value={formData.status} 
                      onChange={e => setFormData({ ...formData, status: e.target.value as ItemStatus })}
                    >
                      <option value="aktif">Aktif</option>
                      <option value="non-aktif">Non-Aktif</option>
                    </select>
                  </div>
                </div>

                {formData.condition !== 'baik' && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2.5 font-medium animate-in fade-in-50 duration-200">
                    <span className="text-base leading-none">⚠️</span>
                    <div>
                      <strong className="block text-rose-800 mb-0.5">Pelaporan Kerusakan Terdeteksi</strong>
                      Harap berikan rincian bagian yang rusak pada kolom <strong>Catatan Detail Kerusakan</strong> di bawah agar terdokumentasi dengan akurat.
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Lokasi Ruangan</label>
                  <select 
                    className="input" 
                    value={formData.room_id || ''} 
                    onChange={e => {
                      const selectedRoomId = parseInt(e.target.value) || 0;
                      const selectedRoom = rooms.find(r => r.id === selectedRoomId);
                      setFormData(prev => ({ 
                        ...prev, 
                        room_id: selectedRoomId,
                        pic_name: (!item && selectedRoom?.pic_name) ? selectedRoom.pic_name : prev.pic_name
                      }));
                    }}
                    required
                  >
                    <option value="">Pilih Ruangan...</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">Penanggung Jawab (PIC)</label>
                  <input 
                    type="text" className="input" 
                    value={formData.pic_name} 
                    onChange={e => setFormData({ ...formData, pic_name: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="label font-semibold">
                    {formData.condition !== 'baik' ? 'Catatan Detail Kerusakan Barang' : 'Catatan Tambahan'}
                  </label>
                  <textarea 
                    className="input h-24 resize-none" 
                    placeholder={formData.condition !== 'baik' ? "Contoh: LCD pecah di pojok kanan bawah, baterai kembung tidak bisa di-charge, atau engsel patah..." : "Tulis catatan tambahan di sini jika ada..."}
                    value={formData.notes} 
                    onChange={e => setFormData({ ...formData, notes: e.target.value })} 
                    required={formData.condition !== 'baik'}
                  />
                  {formData.condition !== 'baik' && !formData.notes && (
                    <p className="text-[10px] text-rose-600 mt-1 font-semibold">* Deskripsi detail kerusakan wajib ditulis</p>
                  )}
                </div>
              </>
            )}
          </div>

          {category === 'tanah' && (
            <div className="md:col-span-2 border-t border-slate-200 pt-6 mt-4">
              <h4 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                Atribut Spesifik Inventaris Tanah
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nama Pemilik / Pemegang Hak</label>
                  <input 
                    type="text" className="input" 
                    value={formData.land_owner} 
                    onChange={e => setFormData({ ...formData, land_owner: e.target.value })} 
                    placeholder="Contoh: Pemerintah Daerah / Provinsi / Yayasan"
                  />
                </div>
                <div>
                  <label className="label">Penguasaan / Alas Hak</label>
                  <input 
                    type="text" className="input" 
                    value={formData.land_alas_hak} 
                    onChange={e => setFormData({ ...formData, land_alas_hak: e.target.value })} 
                    placeholder="Contoh: Sertifikat / Hak Pakai / Akta Hibah"
                  />
                </div>
                <div>
                  <label className="label">Nomor Hak & Tanggal Terbit</label>
                  <input 
                    type="text" className="input" 
                    value={formData.land_certificate_no_date} 
                    onChange={e => setFormData({ ...formData, land_certificate_no_date: e.target.value })} 
                    placeholder="Contoh: HP No. 12 Tahun 1999"
                  />
                </div>
                <div>
                  <label className="label">Riwayat Perolehan</label>
                  <input 
                    type="text" className="input" 
                    value={formData.land_acquisition_history} 
                    onChange={e => setFormData({ ...formData, land_acquisition_history: e.target.value })} 
                    placeholder="Contoh: Pembelian APBD 2010 / Hibah Yayasan"
                  />
                </div>
                <div>
                  <label className="label">Luas Tanah</label>
                  <input 
                    type="text" className="input" 
                    value={formData.land_area} 
                    onChange={e => setFormData({ ...formData, land_area: e.target.value })} 
                    placeholder="Contoh: 1.500 m²"
                  />
                </div>
                <div>
                  <label className="label">Koordinat Geografis</label>
                  <input 
                    type="text" className="input" 
                    value={formData.land_coordinates} 
                    onChange={e => setFormData({ ...formData, land_coordinates: e.target.value })} 
                    placeholder="Contoh: -6.2088, 106.8456"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Letak / Alamat Tanah</label>
                  <input 
                    type="text" className="input" 
                    value={formData.land_location} 
                    onChange={e => setFormData({ ...formData, land_location: e.target.value })} 
                    placeholder="Alamat lengkap lokasi tanah"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="label">Batas-batas Tanah</label>
                  <textarea 
                    className="input h-20 resize-none" 
                    value={formData.land_boundaries} 
                    onChange={e => setFormData({ ...formData, land_boundaries: e.target.value })} 
                    placeholder="Contoh: Utara: Jl. Raya, Selatan: Perumahan, Timur: Sungai, Barat: Kebun"
                  />
                </div>
              </div>
            </div>
          )}

          {category === 'bangunan' && (
            <div className="md:col-span-2 border-t border-slate-200 pt-6 mt-4">
              <h4 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                Atribut Spesifik Inventaris Gedung & Bangunan
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nama Gedung</label>
                  <input 
                    type="text" className="input" 
                    value={formData.building_name} 
                    onChange={e => setFormData({ ...formData, building_name: e.target.value })} 
                    placeholder="Contoh: Gedung A / Ruang Kelas Utama"
                  />
                </div>
                <div>
                  <label className="label">Kode Gedung</label>
                  <input 
                    type="text" className="input" 
                    value={formData.building_code} 
                    onChange={e => setFormData({ ...formData, building_code: e.target.value })} 
                    placeholder="Contoh: GDG-01"
                  />
                </div>
                <div>
                  <label className="label">Luas Gedung</label>
                  <input 
                    type="text" className="input" 
                    value={formData.building_area} 
                    onChange={e => setFormData({ ...formData, building_area: e.target.value })} 
                    placeholder="Contoh: 450 m²"
                  />
                </div>
                <div>
                  <label className="label">Asal Gedung</label>
                  <input 
                    type="text" className="input" 
                    value={formData.building_source} 
                    onChange={e => setFormData({ ...formData, building_source: e.target.value })} 
                    placeholder="Contoh: Pembangunan Komite / Bantuan Kemdikbud"
                  />
                </div>
                <div>
                  <label className="label">Tahun Pembuatan</label>
                  <input 
                    type="number" className="input" 
                    value={formData.building_year} 
                    onChange={e => setFormData({ ...formData, building_year: parseInt(e.target.value) || new Date().getFullYear() })} 
                  />
                </div>
                <div>
                  <label className="label">Kondisi Bangunan</label>
                  <select 
                    className="input" 
                    value={formData.building_condition} 
                    onChange={e => setFormData({ ...formData, building_condition: e.target.value })}
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Sedang">Rusak Sedang</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Konstruksi Bangunan</label>
                  <input 
                    type="text" className="input" 
                    value={formData.building_construction} 
                    onChange={e => setFormData({ ...formData, building_construction: e.target.value })} 
                    placeholder="Contoh: Beton Bertulang / Atap Genteng / Dinding Bata"
                  />
                </div>
              </div>
            </div>
          )}

          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" className="btn btn-primary flex items-center gap-2">
              <Save size={18} />
              Simpan Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
