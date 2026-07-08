export type UserRole = 'admin' | 'operator' | 'user' | 'waka_kurikulum' | 'waka_kesiswaan' | 'kepala_sekolah' | 'waka_sarpras';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
}

export interface Room {
  id: number;
  code: string;
  name: string;
  pic_name: string;
  description: string;
  photo_luar?: string | null;
  photo_dalam?: string | null;
  photo_depan?: string | null;
  photo_belakang?: string | null;
}

export type ItemCategory = 'umum' | 'tanah' | 'bangunan';
export type ItemCondition = 'baik' | 'rusak_ringan' | 'rusak_berat';
export type ItemStatus = 'aktif' | 'non-aktif';

export interface InventoryItem {
  id: number;
  barcode: string;
  name: string;
  category: ItemCategory;
  brand: string;
  specification: string;
  year_acquired: number;
  source_fund: string;
  price: number;
  condition: ItemCondition;
  status: ItemStatus;
  room_id: number;
  room_name?: string;
  pic_name: string;
  notes: string;
  created_at: string;
  land_owner?: string;
  land_alas_hak?: string;
  land_certificate_no_date?: string;
  land_acquisition_history?: string;
  land_location?: string;
  land_area?: string;
  land_boundaries?: string;
  land_coordinates?: string;
  building_name?: string;
  building_code?: string;
  building_area?: string;
  building_source?: string;
  building_year?: number;
  building_condition?: string;
  building_construction?: string;
  initial_photo?: string | null;
}

export interface ProcurementRequest {
  id: number;
  item_name: string;
  quantity: number;
  estimated_price: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected' | 'budgeting' | 'purchasing' | 'received' | 'completed';
  requester_id: number;
  requester_name?: string;
  requester_position?: string;
  request_date: string;
  budget_notes?: string | null;
  purchase_notes?: string | null;
  received_notes?: string | null;
  received_date?: string | null;
  invoice_number?: string | null;
  receipt_recipient?: string | null;
  rejection_reason?: string | null;
}

export interface Mutation {
  id: number;
  item_id: number;
  item_name?: string;
  barcode?: string;
  from_room_id: number;
  from_room_name?: string;
  to_room_id: number;
  to_room_name?: string;
  mutation_date: string;
  reason: string;
  operator_id: number;
  operator_name?: string;
  status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approval_date?: string | null;
  approval_notes?: string | null;
}

export interface StockOpname {
  id: number;
  item_id: number;
  item_name?: string;
  barcode?: string;
  check_date: string;
  condition_before: string;
  condition_after: string;
  notes: string;
  operator_id: number;
  operator_name?: string;
  repair_status?: 'pending_repair' | 'repairing' | 'repaired' | 'irreparable' | null;
  repair_notes?: string | null;
  repair_cost?: number | null;
  repair_technician?: string | null;
  repair_date?: string | null;
}

export interface SchoolSettings {
  id: number;
  school_name: string;
  foundation_name: string;
  address: string;
  phone: string;
  logo_url: string;
  foundation_logo_url?: string;
  principal_name?: string;
  principal_nip?: string;
  waka_sarpras_name?: string;
  waka_sarpras_nip?: string;
  updated_at: string;
}

export interface BuildingAssessment {
  id: number;
  item_id: number;
  building_name?: string;
  building_code?: string;
  building_area?: string;
  building_year?: number;
  assess_date: string;
  assessor_name: string;
  pondasi_pct: number;
  kolom_balok_pct: number;
  pelat_lantai_pct: number;
  rangka_atap_pct: number;
  dinding_pct: number;
  plafon_pct: number;
  lantai_pct: number;
  utilitas_pct: number;
  total_damage_pct: number;
  classification: string;
  notes: string | null;
  ai_recommendation: string | null;
  photos_json?: string | null;
}

export interface Handover {
  id: number;
  item_id: number | null;
  item_name: string;
  recipient_name: string;
  giver_name: string;
  handover_date: string;
  condition: string;
  notes: string;
  handover_doc_no: string | null;
  signature_penerima: string | null;
  signature_penyerah: string | null;
  // Join fields
  real_item_name?: string;
  item_barcode?: string;
  room_name?: string;
}

export interface RabItem {
  id: string;
  item: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
}

export interface SarprasProgram {
  id: number;
  program_name: string;
  year: number;
  description: string;
  priority_level: 'Tinggi' | 'Sedang' | 'Rendah';
  priority_analysis: string;
  total_budget: number;
  rab_json: string; // JSON representing RabItem[]
  status: 'rencana' | 'diajukan' | 'disetujui' | 'selesai';
  requester_position?: string;
  pic_name?: string; // PIC name for program
  realization_month?: string; // bulan realisasi/pengajuan
  realization_date?: string; // tanggal realisasi/pengajuan
  created_at: string;
}

export interface MonthlyCompletenessItem {
  item_id: number;
  item_name: string;
  barcode: string;
  is_present: boolean;
  condition: 'baik' | 'rusak_ringan' | 'rusak_berat';
  notes: string;
  photo_damage?: string; // base64 / url foto kerusakan
  damage_desc?: string;  // keterangan kerusakan
  loss_desc?: string;    // keterangan hilangnya barang
  loss_date?: string;    // tanggal kehilangan
  loss_day?: string;     // hari kehilangan
  loss_time?: string;    // perkiraan jam kehilangan
}

export interface MonthlyCompletenessReport {
  id: number;
  room_id: number;
  pic_name: string;
  report_month: string;
  checked_date: string;
  status: 'Lengkap' | 'Kurang' | 'Rusak Sebagian';
  items_status_json: string; // JSON representing MonthlyCompletenessItem[]
  notes: string;
  created_at: string;
  room_condition?: 'sangat_baik' | 'baik' | 'cukup' | 'buruk_rusak';
  audited_by_sarpras?: 'pending' | 'approved' | 'rejected';
  sarpras_audit_notes?: string;
  audited_by_kepsek?: 'pending' | 'approved' | 'rejected';
  kepsek_audit_notes?: string;
  // Join fields
  room_name?: string;
  room_code?: string;
}

