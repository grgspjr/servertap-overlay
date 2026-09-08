import React, { useState, useEffect } from 'react';
import { X, Settings, Keyboard, Shield, Download, Upload, Monitor, Check } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings, onExportData, onImportData }) {
  const [hotkey, setHotkey] = useState('Ctrl+Alt+S');
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);
  const [defaultTerminal, setDefaultTerminal] = useState('cmd.exe');
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (settings) {
      setHotkey(settings.hotkey || 'Ctrl+Alt+S');
      setAlwaysOnTop(settings.alwaysOnTop !== false);
      setDefaultTerminal(settings.defaultTerminal || 'cmd.exe');
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updated = {
      ...settings,
      hotkey,
      alwaysOnTop,
      defaultTerminal,
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
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
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
        <div className="p-5 space-y-4 text-xs">
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
