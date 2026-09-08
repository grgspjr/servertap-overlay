import React, { useState, useEffect } from 'react';
import { X, FileDown, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function SshImporterModal({ isOpen, onClose, onImportCompleted }) {
  const [loading, setLoading] = useState(false);
  const [foundServers, setFoundServers] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      scanSshConfig();
    }
  }, [isOpen]);

  const scanSshConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      if (window.api && window.api.importSshConfig) {
        const res = await window.api.importSshConfig();
        if (res.success) {
          setFoundServers(res.servers);
          setSelectedIds(new Set(res.servers.map((s) => s.id)));
        } else {
          setError(res.error || 'Failed to scan ~/.ssh/config');
        }
      } else {
        setError('Electron API not available in browser mode.');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.size === foundServers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(foundServers.map((s) => s.id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleConfirmImport = () => {
    const selected = foundServers.filter((s) => selectedIds.has(s.id));
    onImportCompleted(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Import from ~/.ssh/config</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              <p className="text-xs">Scanning your local SSH config file...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : foundServers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No server entries were found in your <code className="text-cyan-300 font-mono">~/.ssh/config</code> file.
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-slate-400">
                  Found <strong className="text-white">{foundServers.length}</strong> hosts in your SSH config.
                </span>
                <button
                  onClick={toggleSelectAll}
                  className="text-cyan-400 hover:underline font-medium"
                >
                  {selectedIds.size === foundServers.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {foundServers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => toggleSelectOne(s.id)}
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                      selectedIds.has(s.id)
                        ? 'bg-slate-800 border-cyan-500/50 text-white'
                        : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-200">{s.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {s.username ? `${s.username}@` : ''}
                        {s.host} {s.port !== 22 ? `:${s.port}` : ''}
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedIds.has(s.id)
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                          : 'border-slate-600'
                      }`}
                    >
                      {selectedIds.has(s.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-white/10 bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={selectedIds.size === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition shadow-lg shadow-cyan-600/30"
          >
            Import Selected ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}
