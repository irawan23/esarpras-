import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';

// 1. Users
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').unique(), // Firebase Auth UID (optional for backward compatibility of existing local users)
  email: text('email'),      // Firebase Auth Email
  username: text('username').unique(),
  password: text('password'),
  name: text('name'),
  role: text('role'), // 'admin', 'operator', 'user', 'waka_kurikulum', 'waka_kesiswaan'
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. School Settings
export const schoolSettings = pgTable('school_settings', {
  id: serial('id').primaryKey(), // id will be 1
  schoolName: text('school_name'),
  foundationName: text('foundation_name'),
  address: text('address'),
  phone: text('phone'),
  logoUrl: text('logo_url'),
  foundationLogoUrl: text('foundation_logo_url'),
  principalName: text('principal_name'),
  principalNip: text('principal_nip'),
  wakaSarprasName: text('waka_sarpras_name'),
  wakaSarprasNip: text('waka_sarpras_nip'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Rooms
export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  code: text('code').unique(),
  name: text('name'),
  picName: text('pic_name'),
  description: text('description'),
  photoLuar: text('photo_luar'),
  photoDalam: text('photo_dalam'),
  photoDepan: text('photo_depan'),
  photoBelakang: text('photo_belakang'),
});

// 4. Inventory Items
export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  barcode: text('barcode').unique(),
  name: text('name'),
  category: text('category'), // 'umum', 'tanah', 'bangunan'
  brand: text('brand'),
  specification: text('specification'),
  yearAcquired: integer('year_acquired'),
  sourceFund: text('source_fund'),
  price: doublePrecision('price'),
  condition: text('condition'), // 'baik', 'rusak_ringan', 'rusak_berat'
  status: text('status').default('aktif'), // 'aktif', 'non-aktif'
  roomId: integer('room_id').references(() => rooms.id),
  picName: text('pic_name'),
  notes: text('notes'),
  initialPhoto: text('initial_photo'),
  createdAt: timestamp('created_at').defaultNow(),
  
  // Land-specific
  landOwner: text('land_owner'),
  landAlasHak: text('land_alas_hak'),
  landCertificateNoDate: text('land_certificate_no_date'),
  landAcquisitionHistory: text('land_acquisition_history'),
  landLocation: text('land_location'),
  landArea: text('land_area'),
  landBoundaries: text('land_boundaries'),
  landCoordinates: text('land_coordinates'),
  
  // Building-specific
  buildingName: text('building_name'),
  buildingCode: text('building_code'),
  buildingArea: text('building_area'),
  buildingSource: text('building_source'),
  buildingYear: integer('building_year'),
  buildingCondition: text('building_condition'),
  buildingConstruction: text('building_construction'),
});

// 5. Mutations
export const mutations = pgTable('mutations', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => inventoryItems.id),
  fromRoomId: integer('from_room_id').references(() => rooms.id),
  toRoomId: integer('to_room_id').references(() => rooms.id),
  mutationDate: timestamp('mutation_date').defaultNow(),
  reason: text('reason'),
  operatorId: integer('operator_id').references(() => users.id),
  status: text('status').default('pending'), // 'pending', 'approved', 'rejected'
  approvedBy: text('approved_by'),
  approvalDate: text('approval_date'),
  approvalNotes: text('approval_notes'),
});

// 6. Procurement Requests
export const procurementRequests = pgTable('procurement_requests', {
  id: serial('id').primaryKey(),
  itemName: text('item_name'),
  quantity: integer('quantity'),
  estimatedPrice: doublePrecision('estimated_price'),
  purpose: text('purpose'),
  status: text('status').default('pending'), // 'pending', 'approved', etc.
  requesterId: integer('requester_id').references(() => users.id),
  requesterPosition: text('requester_position'),
  requestDate: timestamp('request_date').defaultNow(),
  budgetNotes: text('budget_notes'),
  purchaseNotes: text('purchase_notes'),
  receivedNotes: text('received_notes'),
  receivedDate: text('received_date'),
  invoiceNumber: text('invoice_number'),
  receiptRecipient: text('receipt_recipient'),
  rejectionReason: text('rejection_reason'),
});

// 7. Stock Opname
export const stockOpname = pgTable('stock_opname', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => inventoryItems.id),
  checkDate: timestamp('check_date').defaultNow(),
  conditionBefore: text('condition_before'),
  conditionAfter: text('condition_after'),
  notes: text('notes'),
  operatorId: integer('operator_id').references(() => users.id),
  repairStatus: text('repair_status'), // 'pending_repair', 'repairing', 'repaired', 'irreparable'
  repairNotes: text('repair_notes'),
  repairCost: doublePrecision('repair_cost'),
  repairTechnician: text('repair_technician'),
  repairDate: text('repair_date'),
});

// 8. Building Assessments
export const buildingAssessments = pgTable('building_assessments', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => inventoryItems.id),
  assessDate: timestamp('assess_date').defaultNow(),
  assessorName: text('assessor_name'),
  pondasiPct: doublePrecision('pondasi_pct').default(0),
  kolomBalokPct: doublePrecision('kolom_balok_pct').default(0),
  pelatLantaiPct: doublePrecision('pelat_lantai_pct').default(0),
  rangkaAtapPct: doublePrecision('rangka_atap_pct').default(0),
  dindingPct: doublePrecision('dinding_pct').default(0),
  plafonPct: doublePrecision('plafon_pct').default(0),
  lantaiPct: doublePrecision('lantai_pct').default(0),
  utilitasPct: doublePrecision('utilitas_pct').default(0),
  totalDamagePct: doublePrecision('total_damage_pct').default(0),
  classification: text('classification'),
  notes: text('notes'),
  aiRecommendation: text('ai_recommendation'),
  photosJson: text('photos_json'),
});

// 9. Handovers
export const handovers = pgTable('handovers', {
  id: serial('id').primaryKey(),
  itemId: integer('item_id').references(() => inventoryItems.id),
  itemName: text('item_name'),
  recipientName: text('recipient_name'),
  giverName: text('giver_name'),
  handoverDate: text('handover_date'),
  condition: text('condition'),
  notes: text('notes'),
  handoverDocNo: text('handover_doc_no'),
  signaturePenerima: text('signature_penerima'),
  signaturePenyerah: text('signature_penyerah'),
});

// 10. Sarpras Programs
export const sarprasPrograms = pgTable('sarpras_programs', {
  id: serial('id').primaryKey(),
  programName: text('program_name'),
  year: integer('year'),
  description: text('description'),
  priorityLevel: text('priority_level'),
  priorityAnalysis: text('priority_analysis'),
  totalBudget: doublePrecision('total_budget'),
  rabJson: text('rab_json'),
  status: text('status').default('rencana'),
  requesterPosition: text('requester_position'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 11. Monthly Completeness Reports
export const monthlyCompletenessReports = pgTable('monthly_completeness_reports', {
  id: serial('id').primaryKey(),
  roomId: integer('room_id').references(() => rooms.id),
  picName: text('pic_name'),
  reportMonth: text('report_month'),
  checkedDate: text('checked_date'),
  status: text('status'),
  itemsStatusJson: text('items_status_json'),
  notes: text('notes'),
  roomCondition: text('room_condition'),
  auditedBySarpras: text('audited_by_sarpras').default('pending'),
  sarprasAuditNotes: text('sarpras_audit_notes'),
  auditedByKepsek: text('audited_by_kepsek').default('pending'),
  kepsekAuditNotes: text('kepsek_audit_notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Role Permissions
export const rolePermissions = pgTable('role_permissions', {
  role: text('role').primaryKey(),
  allowedMenus: text('allowed_menus'),
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  mutations: many(mutations),
  procurementRequests: many(procurementRequests),
  stockOpnames: many(stockOpname),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  items: many(inventoryItems),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  room: one(rooms, {
    fields: [inventoryItems.roomId],
    references: [rooms.id],
  }),
  mutations: many(mutations),
  stockOpnames: many(stockOpname),
  buildingAssessments: many(buildingAssessments),
  handovers: many(handovers),
}));
