import React, { useRef } from 'react';
import { 
  X, 
  Edit2, 
  Printer, 
  Building2, 
  Map, 
  User, 
  Package, 
  Clock, 
  Coins, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Tag 
} from 'lucide-react';
import { InventoryItem, ItemCategory, SchoolSettings } from '../types';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';

interface ItemDetailModalProps {
  item: InventoryItem;
  schoolSettings: SchoolSettings | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ItemDetailModal({ item, schoolSettings, canEdit, onClose, onEdit }: ItemDetailModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintLabel = useReactToPrint({
    contentRef: printRef,
  });

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case 'baik':
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl">
            <CheckCircle2 size={18} className="shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Kondisi Baik</p>
              <p className="text-[10px] text-emerald-600 font-medium">Aset dalam keadaan baik & siap digunakan</p>
            </div>
          </div>
        );
      case 'rusak_ringan':
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl">
            <AlertTriangle size={18} className="shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Rusak Ringan</p>
              <p className="text-[10px] text-amber-600 font-medium">Masih berfungsi, butuh pemeliharaan ringan</p>
            </div>
          </div>
        );
      case 'rusak_berat':
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-100 rounded-xl">
            <XCircle size={18} className="shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Rusak Berat</p>
              <p className="text-[10px] text-red-600 font-medium">Mengalami kerusakan parah / tidak layak pakai</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 border border-slate-100 rounded-xl">
            <AlertTriangle size={18} className="shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">{cond}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      {/* Hidden printable single barcode label */}
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
                {schoolSettings?.school_name || 'SMK NEGERI CONTOH'}
              </h5>
              <p className="text-[6px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">KARTU INVENTARIS ASET</p>
            </div>
            
            <div className="flex flex-col items-center justify-center py-1">
              <Barcode 
                value={item.barcode} 
                width={1.2} 
                height={35} 
                fontSize={8} 
                margin={0} 
                displayValue={true}
              />
            </div>
            
            <div className="border-t border-slate-300 pt-1 text-left leading-tight">
              <div className="flex justify-between font-bold text-[7px]">
                <span className="truncate max-w-[150px] uppercase">{item.name}</span>
                <span className="font-mono">{item.brand || '-'}</span>
              </div>
              <div className="flex justify-between text-[6px] text-slate-600 font-medium">
                <span>Ruang: <strong className="font-semibold">{item.room_name || '-'}</strong></span>
                <span>Tahun: <strong className="font-semibold">{item.year_acquired}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Informasi Detail Aset</h3>
              <p className="text-xs text-slate-500">Kode Barcode: <strong className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{item.barcode}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top layout: image and main badges */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image section */}
            <div className="w-full md:w-1/3 shrink-0">
              {item.initial_photo ? (
                <div className="w-full h-44 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden p-1 shadow-sm flex items-center justify-center">
                  <img 
                    src={item.initial_photo} 
                    alt={item.name} 
                    className="w-full h-full object-cover rounded-lg"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-full h-44 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center justify-center text-slate-300 gap-2 border-dashed">
                  <Package size={48} className="text-slate-300 stroke-1" />
                  <p className="text-xs text-slate-400 font-medium">Tidak ada foto aset</p>
                </div>
              )}
            </div>

            {/* Main name & core statuses */}
            <div className="flex-1 space-y-4">
              <div>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-100 text-indigo-700">
                  {item.category === 'umum' ? 'Inventaris Umum' : item.category === 'tanah' ? 'Inventaris Tanah' : 'Gedung / Bangunan'}
                </span>
                <h4 className="text-xl font-black text-slate-900 tracking-tight mt-1">{item.name}</h4>
                <p className="text-sm text-slate-500 font-medium">{item.brand ? `Merk: ${item.brand}` : 'Tanpa Merk/Brand'}</p>
              </div>

              {/* Damaged Status Panel (rusak atau tidak) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Kondisi Kerusakan & Kelayakan</label>
                {getConditionBadge(item.condition)}
              </div>

              {/* Location & PIC details (Keberadaan barang) */}
              {item.category === 'umum' && (
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Lokasi Ruangan</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 font-semibold text-xs">
                      <Building2 size={13} className="text-indigo-500" />
                      <span>{item.room_name || 'Tidak Ditentukan'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Penanggung Jawab (PIC)</span>
                    <div className="flex items-center gap-1.5 mt-0.5 text-slate-800 font-semibold text-xs">
                      <User size={13} className="text-indigo-500" />
                      <span className="truncate">{item.pic_name || 'Tidak Ada'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Detailed attributes bento-grid */}
          <div className="space-y-4">
            <h5 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              <span>Detail Spesifikasi & Administrasi</span>
            </h5>

            {item.category === 'umum' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tahun Perolehan</span>
                  <div className="flex items-center gap-1.5 text-slate-800 text-xs font-semibold">
                    <Clock size={14} className="text-slate-400" />
                    <span>Tahun {item.year_acquired}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sumber Dana</span>
                  <div className="flex items-center gap-1.5 text-slate-800 text-xs font-semibold">
                    <Coins size={14} className="text-slate-400" />
                    <span>{item.source_fund || '-'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Harga Perolehan</span>
                  <div className="text-slate-800 text-xs font-bold text-indigo-600">
                    {formatRupiah(item.price)}
                  </div>
                </div>
              </div>
            )}

            {/* General Description / Specifications */}
            {item.specification && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spesifikasi Lengkap</span>
                <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{item.specification}</p>
              </div>
            )}

            {/* Land-specific Attributes */}
            {item.category === 'tanah' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-indigo-50/20 border border-indigo-100/50 rounded-xl space-y-2">
                  <h6 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950">Informasi Kepemilikan</h6>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><strong>Nama Pemilik:</strong> {item.land_owner || '-'}</p>
                    <p><strong>Alas Hak:</strong> {item.land_alas_hak || '-'}</p>
                    <p><strong>No Sertifikat & Tanggal:</strong> {item.land_certificate_no_date || '-'}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/20 border border-indigo-100/50 rounded-xl space-y-2">
                  <h6 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950">Lokasi & Luas Tanah</h6>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><strong>Lokasi:</strong> {item.land_location || '-'}</p>
                    <p><strong>Luas Tanah:</strong> {item.land_area || '-'}</p>
                    <p><strong>Koordinat:</strong> {item.land_coordinates || '-'}</p>
                  </div>
                </div>

                {item.land_boundaries && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/50 rounded-xl col-span-1 sm:col-span-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Batas-Batas Tanah</span>
                    <p className="text-xs text-slate-700 font-medium whitespace-pre-wrap">{item.land_boundaries}</p>
                  </div>
                )}
              </div>
            )}

            {/* Building-specific Attributes */}
            {item.category === 'bangunan' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-indigo-50/20 border border-indigo-100/50 rounded-xl space-y-2">
                  <h6 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950">Identifikasi Bangunan</h6>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><strong>Nama Gedung:</strong> {item.building_name || '-'}</p>
                    <p><strong>Kode Gedung:</strong> {item.building_code || '-'}</p>
                    <p><strong>Sumber Dana:</strong> {item.building_source || '-'}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-50/20 border border-indigo-100/50 rounded-xl space-y-2">
                  <h6 className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-950">Dimensi & Konstruksi</h6>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p><strong>Luas Lantai:</strong> {item.building_area || '-'}</p>
                    <p><strong>Tahun Pembangunan:</strong> {item.building_year || '-'}</p>
                    <p><strong>Kondisi Fisik:</strong> {item.building_condition || '-'}</p>
                    <p><strong>Konstruksi:</strong> {item.building_construction || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {item.notes && (
              <div className="p-3 bg-amber-50/50 border border-amber-100/60 rounded-xl text-slate-700 text-xs">
                <span className="text-[9px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">Catatan Tambahan / Riwayat</span>
                <p className="font-medium">{item.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handlePrintLabel}
              className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all shadow-sm"
            >
              <Printer size={16} className="text-slate-500" />
              <span>Cetak Barcode</span>
            </button>
          </div>

          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                <Edit2 size={16} />
                <span>Ubah Data</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
