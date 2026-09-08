import React, { useState, useEffect } from 'react';
import { X, Server, Key, Shield, Tag, Terminal, Monitor, FileText, Lock, Eye, EyeOff } from 'lucide-react';

export default function AddServerModal({ isOpen, onClose, onSave, editingServer }) {
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    type: 'ssh',
    port: '22',
    username: '',
    authType: 'key',
    keyPath: '',
    environment: 'Production',
    tags: '',
    notes: '',
    customCommand: '',
    proxyType: 'none',
    proxyHost: '',
    proxyPort: '',
    targetPort: '',
    noRemoteCmd: true,
    proxyUsername: '',
    proxyKeyPath: '',
    proxyPassword: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editingServer) {
      setFormData({
        name: editingServer.name || '',
        host: editingServer.host || '',
        type: editingServer.type || 'ssh',
        port: editingServer.port ? String(editingServer.port) : '22',
        username: editingServer.username || '',
        authType: editingServer.authType || 'key',
        keyPath: editingServer.keyPath || '',
        environment: editingServer.environment || 'Production',
        tags: editingServer.tags ? editingServer.tags.join(', ') : '',
        notes: editingServer.notes || '',
        customCommand: editingServer.customCommand || '',
        proxyType: editingServer.proxyType || 'none',
        proxyHost: editingServer.proxyHost || '',
        proxyPort: editingServer.proxyPort ? String(editingServer.proxyPort) : '',
        targetPort: editingServer.targetPort ? String(editingServer.targetPort) : '',
        noRemoteCmd: editingServer.noRemoteCmd !== false,
        proxyUsername: editingServer.proxyUsername || '',
        proxyKeyPath: editingServer.proxyKeyPath || '',
        proxyPassword: editingServer.proxyPassword || '',
        password: editingServer.password || '',
      });
    } else {
      setFormData({
        name: '',
        host: '',
        type: 'ssh',
        port: '22',
        username: '',
        authType: 'key',
        keyPath: '',
        environment: 'Production',
        tags: '',
        notes: '',
        customCommand: '',
        proxyType: 'none',
        proxyHost: '',
        proxyPort: '',
        targetPort: '',
        noRemoteCmd: true,
        proxyUsername: '',
        proxyKeyPath: '',
        proxyPassword: '',
        password: '',
      });
    }
  }, [editingServer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.host.trim()) return;

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const savedData = {
      id: editingServer ? editingServer.id : String(Date.now()),
      name: formData.name.trim(),
      host: formData.host.trim(),
      type: formData.type,
      port: formData.port ? parseInt(formData.port) : (formData.type === 'rdp' ? 3389 : 22),
      username: formData.username.trim(),
      authType: formData.authType,
      keyPath: formData.keyPath.trim(),
      environment: formData.environment,
      tags: tagsArray,
      notes: formData.notes.trim(),
      customCommand: formData.customCommand.trim(),
      proxyType: formData.proxyType,
      proxyHost: formData.proxyHost.trim(),
      proxyPort: formData.proxyPort ? parseInt(formData.proxyPort) : null,
      targetPort: formData.targetPort ? parseInt(formData.targetPort) : null,
      noRemoteCmd: formData.noRemoteCmd !== false,
      proxyUsername: formData.proxyUsername.trim(),
      proxyKeyPath: formData.proxyKeyPath.trim(),
      proxyPassword: formData.proxyPassword.trim(),
      password: formData.password.trim(),
    };

    onSave(savedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">
              {editingServer ? 'Edit Server Entry' : 'Add New DevOps Server'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Server Name & Host */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Server Display Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Prod-K8s-Worker-01"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Hostname or IP Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 192.168.1.50 or db.company.com"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Connection Type & Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Protocol Type</label>
              <select
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  let newPort = formData.port;
                  if (newType === 'rdp') newPort = '3389';
                  if (newType === 'ssh') newPort = '22';
                  setFormData({ ...formData, type: newType, port: newPort });
                }}
                className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="ssh">SSH (Linux/Unix)</option>
                <option value="rdp">RDP (Windows)</option>
                <option value="both">Both (SSH & RDP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Environment</label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Production">Production</option>
                <option value="Staging">Staging</option>
                <option value="Tunnels">Tunnels</option>
                <option value="VPN">VPN</option>
                <option value="Websites">Websites</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Port</label>
              <input
                type="number"
                placeholder={formData.type === 'rdp' ? '3389' : '22'}
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Reverse Proxy / Bastion Jump Host / SSH Tunnel Section */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Proxy & SSH Local Tunnel (-L) Settings</span>
              </label>
              <select
                value={formData.proxyType}
                onChange={(e) => setFormData({ ...formData, proxyType: e.target.value })}
                className="px-2 py-1 bg-slate-900 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
              >
                <option value="none">No Proxy (Direct Connection)</option>
                <option value="tunnel">SSH Local Tunnel (-L Port Forwarding)</option>
                <option value="jump">SSH Jump Host (Bastion -J)</option>
                <option value="socks5">Local SOCKS5 / HTTP Proxy</option>
              </select>
            </div>

            {formData.proxyType !== 'none' && (
              <div className="space-y-3 pt-2 border-t border-white/5 animate-fade-in">
                {formData.proxyType === 'jump' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Reverse Proxy / Bastion Host IP *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 192.168.15.58 or bastion.company.com"
                        value={formData.proxyHost}
                        onChange={(e) => setFormData({ ...formData, proxyHost: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Proxy Username (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. proxyuser"
                        value={formData.proxyUsername}
                        onChange={(e) => setFormData({ ...formData, proxyUsername: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Proxy Port
                      </label>
                      <input
                        type="number"
                        placeholder="22"
                        value={formData.proxyPort}
                        onChange={(e) => setFormData({ ...formData, proxyPort: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Proxy Key Path (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ~/.ssh/bastion.pem or D:\.ssh\key.pem"
                        value={formData.proxyKeyPath}
                        onChange={(e) => setFormData({ ...formData, proxyKeyPath: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {formData.proxyType === 'socks5' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Local Proxy Address
                      </label>
                      <input
                        type="text"
                        placeholder="127.0.0.1"
                        value={formData.proxyHost || '127.0.0.1'}
                        onChange={(e) => setFormData({ ...formData, proxyHost: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Local Proxy Port
                      </label>
                      <input
                        type="number"
                        placeholder="1080 or 8080"
                        value={formData.proxyPort}
                        onChange={(e) => setFormData({ ...formData, proxyPort: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                )}

                {formData.proxyType === 'tunnel' && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Local Forward Port (-L)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 10111"
                          value={formData.proxyPort}
                          onChange={(e) => setFormData({ ...formData, proxyPort: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Target Bind Host
                        </label>
                        <input
                          type="text"
                          placeholder="127.0.0.1"
                          value={formData.proxyHost || '127.0.0.1'}
                          onChange={(e) => setFormData({ ...formData, proxyHost: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Target Bind Port
                        </label>
                        <input
                          type="number"
                          placeholder="e.g. 10111"
                          value={formData.targetPort || formData.proxyPort}
                          onChange={(e) => setFormData({ ...formData, targetPort: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="noRemoteCmd"
                        checked={formData.noRemoteCmd !== false}
                        onChange={(e) => setFormData({ ...formData, noRemoteCmd: e.target.checked })}
                        className="rounded bg-slate-900 border-white/10 text-cyan-500 focus:ring-cyan-500"
                      />
                      <label htmlFor="noRemoteCmd" className="text-xs text-slate-300">
                        Do not execute remote command (<code className="text-cyan-300 font-mono">-N</code> for background SSH tunnel)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
              <input
                type="text"
                placeholder="e.g. root, devops, Administrator"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                <span>Save Password</span>
                <span className="text-[10px] text-cyan-400 font-normal">Auto-login</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="For 1-tap passwordless login"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-3 pr-8 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SSH Key Path (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. ~/.ssh/id_rsa or C:\keys\prod.pem"
                value={formData.keyPath}
                onChange={(e) => setFormData({ ...formData, keyPath: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Tags & Custom Command */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. k8s, production, db, nginx"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Custom Command to run on SSH launch (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. htop or docker ps or tail -f /var/log/syslog"
              value={formData.customCommand}
              onChange={(e) => setFormData({ ...formData, customCommand: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Notes / Reminders</label>
            <textarea
              rows={2}
              placeholder="e.g. Primary DB server. Backup runs at midnight."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition shadow-lg shadow-cyan-600/30"
            >
              {editingServer ? 'Save Changes' : 'Create Server'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
