import React, { useState, useEffect } from 'react';
import { X, Shield, Plus, Trash2, Edit2, Eye, EyeOff, Check } from 'lucide-react';

export default function ProxyModal({ isOpen, onClose, proxyProfiles = [], onSaveProxyProfiles }) {
  const [profiles, setProfiles] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    proxyType: 'jump',
    host: '',
    port: '22',
    username: '',
    proxyPassword: '',
    keyPath: '',
  });

  useEffect(() => {
    setProfiles(proxyProfiles || []);
  }, [proxyProfiles, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.host.trim()) return;

    let updatedList;
    if (editingId) {
      updatedList = profiles.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: formData.name.trim(),
              proxyType: formData.proxyType || 'jump',
              host: formData.host.trim(),
              port: formData.port ? parseInt(formData.port) : 22,
              username: formData.username.trim(),
              proxyPassword: formData.proxyPassword.trim(),
              keyPath: formData.keyPath.trim(),
            }
          : p
      );
    } else {
      const newProfile = {
        id: String(Date.now()),
        name: formData.name.trim(),
        proxyType: formData.proxyType || 'jump',
        host: formData.host.trim(),
        port: formData.port ? parseInt(formData.port) : 22,
        username: formData.username.trim(),
        proxyPassword: formData.proxyPassword.trim(),
        keyPath: formData.keyPath.trim(),
      };
      updatedList = [...profiles, newProfile];
    }

    setProfiles(updatedList);
    onSaveProxyProfiles(updatedList);

    setFormData({
      name: '',
      proxyType: 'jump',
      host: '',
      port: '22',
      username: '',
      proxyPassword: '',
      keyPath: '',
    });
    setEditingId(null);
    setShowAddForm(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      name: p.name || '',
      proxyType: p.proxyType || 'jump',
      host: p.host || '',
      port: p.port ? String(p.port) : '22',
      username: p.username || '',
      proxyPassword: p.proxyPassword || '',
      keyPath: p.keyPath || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    const updated = profiles.filter((p) => p.id !== id);
    setProfiles(updated);
    onSaveProxyProfiles(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Reverse Proxy Profiles</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          <div className="flex items-center justify-between">
            <p className="text-slate-400 text-[11px]">
              Save reusable Bastion Jump Hosts, SSH Tunnels, or SOCKS5 Proxies to select when adding servers.
            </p>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    proxyType: 'jump',
                    host: '',
                    port: '22',
                    username: '',
                    proxyPassword: '',
                    keyPath: '',
                  });
                  setShowAddForm(true);
                }}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-md shadow-cyan-600/30 flex-shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Proxy</span>
              </button>
            )}
          </div>

          {/* Add / Edit Profile Form */}
          {showAddForm && (
            <form onSubmit={handleSaveProfile} className="p-4 rounded-xl bg-slate-800/80 border border-cyan-500/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-cyan-400">
                  {editingId ? 'Edit Reverse Proxy Profile' : 'New Reverse Proxy Profile'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Profile Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Primary Bastion Host"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Proxy Type</label>
                  <select
                    value={formData.proxyType}
                    onChange={(e) => setFormData({ ...formData, proxyType: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="jump">SSH Jump Host (-J)</option>
                    <option value="tunnel">SSH Local Tunnel (-L)</option>
                    <option value="socks5">SOCKS5 Proxy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Proxy Host or IP *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10.0.0.50 or bastion.company.com"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Proxy Port</label>
                  <input
                    type="number"
                    placeholder="22"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Proxy Username</label>
                  <input
                    type="text"
                    placeholder="e.g. proxyuser"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Proxy Password */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Proxy Password</span>
                    <span className="text-[10px] text-cyan-400 font-normal">Optional</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Proxy password"
                      value={formData.proxyPassword}
                      onChange={(e) => setFormData({ ...formData, proxyPassword: e.target.value })}
                      className="w-full pl-2.5 pr-8 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Proxy Key Path (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ~/.ssh/bastion.pem or C:\keys\bastion.pem"
                  value={formData.keyPath}
                  onChange={(e) => setFormData({ ...formData, keyPath: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-600/30"
                >
                  {editingId ? 'Save Changes' : 'Create Proxy Profile'}
                </button>
              </div>
            </form>
          )}

          {/* Profiles List */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-300 block">Saved Profiles ({profiles.length})</span>
            {profiles.length === 0 ? (
              <div className="text-center py-6 text-slate-500 italic bg-slate-800/30 rounded-xl border border-dashed border-white/10">
                No reverse proxy profiles added yet. Click "+ Add Proxy" above to create one.
              </div>
            ) : (
              profiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-slate-800/60 border border-white/10 rounded-xl hover:border-cyan-500/30 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{p.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                        {p.proxyType || 'jump'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {p.username ? `${p.username}@` : ''}
                      {p.host}:{p.port || 22}
                      {p.proxyPassword ? <span className="ml-2 text-cyan-400 font-sans text-[10px]">(Password saved)</span> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(p)}
                      className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-700 transition"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700 transition"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-slate-800/30">
          {savedMsg ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> Proxy profile saved!
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Profiles are auto-saved to settings</span>
          )}
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/10 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
