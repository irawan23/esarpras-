import React, { useState, useEffect } from 'react';
import { SchoolSettings, User, UserRole } from '../types';
import { Save, UserPlus, Trash2, Shield, School, MapPin, Phone, Image as ImageIcon, Upload } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [dragActiveLogo, setDragActiveLogo] = useState(false);
  const [dragActiveFoundation, setDragActiveFoundation] = useState(false);

  // New User Form State
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'user' as UserRole
  });

  // Permissions State for Access Levels
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);

  const availableMenus = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inventory-umum', label: 'Inventaris Umum' },
    { id: 'inventory-tanah', label: 'Inventaris Tanah' },
    { id: 'inventory-bangunan', label: 'Inventaris Gedung' },
    { id: 'building-damage-analyst', label: 'Analisis Kerusakan' },
    { id: 'handovers', label: 'Serah Terima (BAST)' },
    { id: 'sarpras-programs', label: 'Rencana Kerja & RAB' },
    { id: 'monthly-completeness', label: 'Kelengkapan PIC' },
    { id: 'mutasi', label: 'Mutasi Barang' },
    { id: 'opname', label: 'Stock Opname' },
    { id: 'procurement', label: 'Pengajuan Barang' },
    { id: 'reports', label: 'Laporan' },
    { id: 'rooms', label: 'Data Ruangan' },
    { id: 'settings', label: 'Pengaturan' },
    { id: 'ai-analyst', label: 'Analis AI' },
  ];

  const fetchPermissions = async () => {
    try {
      const res = await fetch('/api/permissions');
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
        if (data[selectedRole]) {
          setSelectedMenus(data[selectedRole]);
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (permissions[selectedRole]) {
      setSelectedMenus(permissions[selectedRole]);
    } else {
      setSelectedMenus([]);
    }
  }, [selectedRole, permissions]);

  const handleToggleMenu = (menuId: string) => {
    setSelectedMenus(prev => 
      prev.includes(menuId) ? prev.filter(m => m !== menuId) : [...prev, menuId]
    );
  };

  const handleSavePermissions = async () => {
    try {
      const res = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, allowed_menus: selectedMenus })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Hak akses menu untuk ${selectedRole.replace('_', ' ').toUpperCase()} berhasil disimpan. Perubahan akan segera diterapkan.` });
        setPermissions(prev => ({ ...prev, [selectedRole]: selectedMenus }));
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ type: 'error', text: 'Gagal menyimpan hak akses menu' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menyimpan hak akses menu' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [settingsRes, usersRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/users')
      ]);
      const settingsData = await settingsRes.json();
      const usersData = await usersRes.json();
      setSettings(settingsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo_url' | 'foundation_logo_url') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(s => s ? { ...s, [field]: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, field: 'logo_url' | 'foundation_logo_url', setActive: (active: boolean) => void) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(s => s ? { ...s, [field]: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengaturan sekolah berhasil diperbarui' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memperbarui pengaturan' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengguna baru berhasil ditambahkan' });
        setNewUser({ username: '', password: '', name: '', role: 'user' });
        fetchData();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.message || 'Gagal menambahkan pengguna' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menambahkan pengguna' });
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengguna berhasil dihapus' });
        fetchData();
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal menghapus pengguna' });
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat pengaturan...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Pengaturan Sistem</h1>
        <p className="text-slate-500">Kelola informasi sekolah dan hak akses pengguna</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* School Information */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <School size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Informasi Sekolah</h2>
          </div>

          <form onSubmit={handleUpdateSettings} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label>
              <div className="relative">
                <School className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  className="input pl-10"
                  value={settings?.school_name || ''}
                  onChange={e => setSettings(s => s ? { ...s, school_name: e.target.value } : null)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Yayasan</label>
              <input
                type="text"
                className="input"
                value={settings?.foundation_name || ''}
                onChange={e => setSettings(s => s ? { ...s, foundation_name: e.target.value } : null)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Telepon Sekolah</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  className="input pl-10"
                  value={settings?.phone || ''}
                  onChange={e => setSettings(s => s ? { ...s, phone: e.target.value } : null)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                <textarea
                  className="input pl-10 min-h-[80px]"
                  value={settings?.address || ''}
                  onChange={e => setSettings(s => s ? { ...s, address: e.target.value } : null)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* Logo Sekolah */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">Logo Sekolah (Upload Manual)</label>
                
                <div 
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer min-h-[140px] text-center ${
                    dragActiveLogo 
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                      : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                  }`}
                  onDragEnter={(e) => { handleDrag(e); setDragActiveLogo(true); }}
                  onDragOver={(e) => { handleDrag(e); setDragActiveLogo(true); }}
                  onDragLeave={(e) => { handleDrag(e); setDragActiveLogo(false); }}
                  onDrop={(e) => handleDrop(e, 'logo_url', setDragActiveLogo)}
                  onClick={() => document.getElementById('logo-upload-input')?.click()}
                >
                  <input
                    id="logo-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo_url')}
                    className="hidden"
                  />
                  
                  {settings?.logo_url ? (
                    <div className="flex flex-col items-center gap-3">
                      <img 
                        src={settings.logo_url} 
                        alt="Logo Sekolah" 
                        className="h-20 w-auto object-contain bg-white border border-slate-200 rounded-lg p-2 shadow-sm"
                        referrerPolicy="no-referrer" 
                      />
                      <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <Upload size={12} /> Ganti Logo Baru
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                        <Upload size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Tarik & lepas Logo Sekolah di sini</p>
                      <p className="text-[10px] text-slate-400">atau klik untuk memilih file dari komputer</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Atau masukkan URL Logo:</label>
                  <input
                    type="text"
                    placeholder="Contoh: https://example.com/logo.png"
                    className="input text-xs py-1.5"
                    value={settings?.logo_url || ''}
                    onChange={e => setSettings(s => s ? { ...s, logo_url: e.target.value } : null)}
                  />
                </div>
              </div>

              {/* Logo Yayasan */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800">Logo Yayasan (Upload Manual)</label>
                
                <div 
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer min-h-[140px] text-center ${
                    dragActiveFoundation 
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' 
                      : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                  }`}
                  onDragEnter={(e) => { handleDrag(e); setDragActiveFoundation(true); }}
                  onDragOver={(e) => { handleDrag(e); setDragActiveFoundation(true); }}
                  onDragLeave={(e) => { handleDrag(e); setDragActiveFoundation(false); }}
                  onDrop={(e) => handleDrop(e, 'foundation_logo_url', setDragActiveFoundation)}
                  onClick={() => document.getElementById('foundation-upload-input')?.click()}
                >
                  <input
                    id="foundation-upload-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'foundation_logo_url')}
                    className="hidden"
                  />
                  
                  {settings?.foundation_logo_url ? (
                    <div className="flex flex-col items-center gap-3">
                      <img 
                        src={settings.foundation_logo_url} 
                        alt="Logo Yayasan" 
                        className="h-20 w-auto object-contain bg-white border border-slate-200 rounded-lg p-2 shadow-sm"
                        referrerPolicy="no-referrer" 
                      />
                      <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                        <Upload size={12} /> Ganti Logo Baru
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-100 rounded-full text-slate-500">
                        <Upload size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Tarik & lepas Logo Yayasan di sini</p>
                      <p className="text-[10px] text-slate-400">atau klik untuk memilih file dari komputer</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Atau masukkan URL Logo:</label>
                  <input
                    type="text"
                    placeholder="Contoh: https://example.com/logo-yayasan.png"
                    className="input text-xs py-1.5"
                    value={settings?.foundation_logo_url || ''}
                    onChange={e => setSettings(s => s ? { ...s, foundation_logo_url: e.target.value } : null)}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Pejabat Penandatangan Laporan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <p className="text-xs font-bold text-indigo-600 uppercase">Kepala Sekolah</p>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      className="input"
                      value={settings?.principal_name || ''}
                      onChange={e => setSettings(s => s ? { ...s, principal_name: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">NIP</label>
                    <input
                      type="text"
                      className="input"
                      value={settings?.principal_nip || ''}
                      onChange={e => setSettings(s => s ? { ...s, principal_nip: e.target.value } : null)}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-indigo-600 uppercase">Waka Sarpras</p>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      className="input"
                      value={settings?.waka_sarpras_name || ''}
                      onChange={e => setSettings(s => s ? { ...s, waka_sarpras_name: e.target.value } : null)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">NIP</label>
                    <input
                      type="text"
                      className="input"
                      value={settings?.waka_sarpras_nip || ''}
                      onChange={e => setSettings(s => s ? { ...s, waka_sarpras_nip: e.target.value } : null)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Save size={18} /> Simpan Perubahan
            </button>
          </form>
        </div>

        {/* User Management */}
        <div className="space-y-8">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <UserPlus size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Tambah Pengguna</h2>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input
                    type="text"
                    className="input"
                    value={newUser.username}
                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    className="input"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  className="input"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Level Akses</label>
                <select
                  className="input"
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="operator">Operator (Input Data)</option>
                  <option value="waka_kurikulum">Waka Kurikulum</option>
                  <option value="waka_kesiswaan">Waka Kesiswaan</option>
                  <option value="user">User (View Only)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
                <UserPlus size={18} /> Tambah Pengguna
              </button>
            </form>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                <Shield size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Daftar Pengguna</h2>
            </div>

            <div className="space-y-3">
              {users.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">@{user.username}</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase">
                        {user.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {user.id !== 1 && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Manual Access Level Permissions Configurator */}
          <div className="card p-6 border border-slate-200 shadow-sm bg-white rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Shield size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Hak Akses Menu (Manual)</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Level Akses (Role)</label>
                <select
                  className="input"
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value as UserRole)}
                >
                  <option value="admin">Administrator (Full Access)</option>
                  <option value="operator">Operator (Input Data)</option>
                  <option value="waka_kurikulum">Waka Kurikulum</option>
                  <option value="waka_kesiswaan">Waka Kesiswaan</option>
                  <option value="user">User (View Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Daftar Menu yang Diizinkan:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {availableMenus.map(menu => {
                    const isChecked = selectedMenus.includes(menu.id);
                    return (
                      <label 
                        key={menu.id} 
                        className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                          isChecked 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-medium' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                          checked={isChecked}
                          onChange={() => handleToggleMenu(menu.id)}
                        />
                        <span className="text-xs">{menu.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleSavePermissions}
                className="btn btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                <Save size={18} /> Simpan Hak Akses {selectedRole.replace('_', ' ').toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
