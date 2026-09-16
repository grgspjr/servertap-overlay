import React, { useState, useEffect } from 'react';
import { X, Settings, Keyboard, Shield, Download, Upload, Monitor, Check, Plus, Trash2, Edit2 } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings, onExportData, onImportData }) {
  const [hotkey, setHotkey] = useState('Ctrl+Alt+S');
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [defaultTerminal, setDefaultTerminal] = useState('cmd.exe');
  const [defaultBrowserEngine, setDefaultBrowserEngine] = useState('external');
  const [autoStartOnBoot, setAutoStartOnBoot] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  // Reverse Proxy Profiles state
  const [proxyProfiles, setProxyProfiles] = useState([]);
  const [showAddProxyForm, setShowAddProxyForm] = useState(false);
  const [editingProxyId, setEditingProxyId] = useState(null);
  const [newProxy, setNewProxy] = useState({
    name: '',
    proxyType: 'jump',
    host: '',
    port: '22',
    username: '',
    keyPath: '',
  });

  useEffect(() => {
    if (settings) {
      setHotkey(settings.hotkey || 'Ctrl+Alt+S');
      setAlwaysOnTop(settings.alwaysOnTop !== false);
      setDefaultTerminal(settings.defaultTerminal || 'cmd.exe');
      setDefaultBrowserEngine(settings.defaultBrowserEngine || 'external');
      setAutoStartOnBoot(settings.autoStartOnBoot !== false);
      setProxyProfiles(settings.proxyProfiles || []);
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSaveProxyProfile = () => {
    if (!newProxy.name.trim() || !newProxy.host.trim()) return;

    if (editingProxyId) {
      setProxyProfiles(
        proxyProfiles.map((p) =>
          p.id === editingProxyId
            ? {
                ...p,
                name: newProxy.name.trim(),
                proxyType: newProxy.proxyType || 'jump',
                host: newProxy.host.trim(),
                port: newProxy.port ? parseInt(newProxy.port) : 22,
                username: newProxy.username.trim(),
                proxyPassword: (newProxy.proxyPassword || '').trim(),
                keyPath: newProxy.keyPath.trim(),
              }
            : p
        )
      );
      setEditingProxyId(null);
    } else {
      const profile = {
        id: String(Date.now()),
        name: newProxy.name.trim(),
        proxyType: newProxy.proxyType || 'jump',
        host: newProxy.host.trim(),
        port: newProxy.port ? parseInt(newProxy.port) : 22,
        username: newProxy.username.trim(),
        proxyPassword: (newProxy.proxyPassword || '').trim(),
        keyPath: newProxy.keyPath.trim(),
      };
      setProxyProfiles([...proxyProfiles, profile]);
    }

    setNewProxy({ name: '', proxyType: 'jump', host: '', port: '22', username: '', proxyPassword: '', keyPath: '' });
    setShowAddProxyForm(false);
  };

  const handleEditProxy = (p) => {
    setEditingProxyId(p.id);
    setNewProxy({
      name: p.name || '',
      proxyType: p.proxyType || 'jump',
      host: p.host || '',
      port: p.port ? String(p.port) : '22',
      username: p.username || '',
      proxyPassword: p.proxyPassword || '',
      keyPath: p.keyPath || '',
    });
    setShowAddProxyForm(true);
  };

  const handleDeleteProxy = (id) => {
    setProxyProfiles(proxyProfiles.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    const updated = {
      ...settings,
      hotkey,
      alwaysOnTop,
      defaultTerminal,
      defaultBrowserEngine,
      autoStartOnBoot,
      proxyProfiles,
    };
    onSaveSettings(updated);
    setSavedMsg(true);
    setTimeout(() => {
      setSavedMsg(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Overlay Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          {/* Global Hotkey */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              <span>Global Overlay Hotkey</span>
            </label>
            <input
              type="text"
              value={hotkey}
              onChange={(e) => setHotkey(e.target.value)}
              placeholder="e.g. Ctrl+Shift+S or Alt+Space"
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 mb-2"
            />
            <div className="flex flex-wrap gap-1.5 mb-1">
              {['Shift+Home', 'Ctrl+Shift+S', 'Alt+Space', 'Ctrl+Alt+D', 'F10'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setHotkey(preset)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                    hotkey === preset
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-semibold'
                      : 'bg-slate-800 text-slate-400 border-white/5 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Press this key anywhere on Windows to toggle ServerTap. (If your shortcut is taken by another app, pick an alternate above).
            </p>
          </div>

          {/* Terminal Launcher Selection */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-purple-400" />
              <span>SSH Terminal Executable</span>
            </label>
            <select
              value={defaultTerminal}
              onChange={(e) => setDefaultTerminal(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="cmd.exe">Command Prompt (cmd.exe - Preferred)</option>
              <option value="powershell.exe">PowerShell (powershell.exe)</option>
              <option value="wt.exe">Windows Terminal (wt.exe)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Command execution spawns native Windows OpenSSH in your selected shell.
            </p>
          </div>

          {/* Reverse Proxy Profiles Section */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-200">Reusable Reverse Proxy Profiles</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProxyId(null);
                  setNewProxy({ name: '', proxyType: 'jump', host: '', port: '22', username: '', keyPath: '' });
                  setShowAddProxyForm(!showAddProxyForm);
                }}
                className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/30 rounded text-xs flex items-center gap-1 font-medium transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Profile</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Configure your reusable Bastion Jump Hosts or SSH Tunnels so you can select them from a dropdown when adding servers.
            </p>

            {/* Form to Add / Edit Proxy Profile */}
            {showAddProxyForm && (
              <div className="p-3 rounded-lg bg-slate-900 border border-cyan-500/30 space-y-2.5 animate-fade-in">
                <div className="font-bold text-cyan-400 text-[11px]">
                  {editingProxyId ? 'Edit Proxy Profile' : 'New Proxy Profile'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">Profile Label *</label>
                    <input
                      type="text"
                      placeholder="e.g. Primary Bastion"
                      value={newProxy.name}
                      onChange={(e) => setNewProxy({ ...newProxy, name: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">Proxy Type</label>
                    <select
                      value={newProxy.proxyType}
                      onChange={(e) => setNewProxy({ ...newProxy, proxyType: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      <option value="jump">SSH Jump Host (-J)</option>
                      <option value="tunnel">SSH Local Tunnel (-L)</option>
                      <option value="socks5">SOCKS5 Proxy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">Proxy Host / IP *</label>
                    <input
                      type="text"
                      placeholder="e.g. 10.0.0.50 or bastion.domain.com"
                      value={newProxy.host}
                      onChange={(e) => setNewProxy({ ...newProxy, host: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">Port</label>
                    <input
                      type="number"
                      placeholder="22"
                      value={newProxy.port}
                      onChange={(e) => setNewProxy({ ...newProxy, port: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">Proxy Username</label>
                    <input
                      type="text"
                      placeholder="e.g. proxyuser"
                      value={newProxy.username}
                      onChange={(e) => setNewProxy({ ...newProxy, username: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">Proxy Password</label>
                    <input
                      type="password"
                      placeholder="Proxy password"
                      value={newProxy.proxyPassword || ''}
                      onChange={(e) => setNewProxy({ ...newProxy, proxyPassword: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-0.5">Proxy Key Path (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. ~/.ssh/bastion.pem"
                      value={newProxy.keyPath}
                      onChange={(e) => setNewProxy({ ...newProxy, keyPath: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddProxyForm(false)}
                    className="px-2.5 py-1 text-slate-400 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProxyProfile}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold"
                  >
                    Save Profile
                  </button>
                </div>
              </div>
            )}

            {/* List of Proxy Profiles */}
            <div className="space-y-1.5">
              {proxyProfiles.length === 0 ? (
                <div className="text-[11px] text-slate-500 italic py-1 text-center bg-slate-900/40 rounded border border-dashed border-white/5">
                  No proxy profiles saved yet. Click "+ Add Profile" above to create one.
                </div>
              ) : (
                proxyProfiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 bg-slate-900 border border-white/10 rounded-lg text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{p.name}</span>
                        <span className="text-[10px] text-cyan-400 uppercase bg-cyan-500/10 px-1.5 py-0.2 rounded font-mono">
                          {p.proxyType || 'jump'}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {p.username ? `${p.username}@` : ''}
                        {p.host}:{p.port || 22}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditProxy(p)}
                        className="p-1 text-slate-400 hover:text-cyan-400 rounded hover:bg-slate-800"
                        title="Edit profile"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProxy(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800"
                        title="Delete profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Always on Top */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-white/5">
            <div>
              <div className="font-semibold text-slate-200">Always On Top Screen Overlay</div>
              <div className="text-[11px] text-slate-400">Keep overlay floating over active windows</div>
            </div>
            <input
              type="checkbox"
              checked={alwaysOnTop}
              onChange={(e) => setAlwaysOnTop(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Auto-Start on Boot */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-white/5">
            <div>
              <div className="font-semibold text-slate-200">Run on Windows Startup</div>
              <div className="text-[11px] text-slate-400">Launch silently in background when Windows boots</div>
            </div>
            <input
              type="checkbox"
              checked={autoStartOnBoot}
              onChange={(e) => setAutoStartOnBoot(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Backup & Restore Data */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <label className="block font-semibold text-slate-200">Backup & Team Sharing</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onExportData}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/10 flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export Servers (JSON)</span>
              </button>

              <button
                type="button"
                onClick={onImportData}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-white/10 flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Import JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-slate-800/30">
          {savedMsg ? (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" /> Preferences saved!
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">Press Esc or Close when done</span>
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition shadow-lg shadow-cyan-600/30"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
