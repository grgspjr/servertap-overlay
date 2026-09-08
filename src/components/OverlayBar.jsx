import React from 'react';
import { Search, Plus, FileDown, Settings, Terminal, Key } from 'lucide-react';

export default function OverlayBar({
  searchQuery,
  setSearchQuery,
  selectedEnv,
  setSelectedEnv,
  onOpenAddModal,
  onOpenImportModal,
  onOpenSettingsModal,
  onCopyPublicKey,
  serverCount,
  environments
}) {
  return (
    <header className="flex flex-col gap-3 pb-3 border-b border-white/10 select-none">
      {/* Top Title & Window Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">ServerTap</h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                DevOps Overlay
              </span>
            </div>
            <p className="text-xs text-slate-400">1-Tap SSH & Remote Desktop Manager</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md transition shadow-md shadow-cyan-600/30"
            title="Add New Server"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Server</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded-md transition border border-white/10"
            title="Import from ~/.ssh/config"
          >
            <FileDown className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Import SSH Config</span>
          </button>

          <button
            onClick={onCopyPublicKey}
            className="p-1.5 text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded-md transition border border-white/10"
            title="Copy Public Key (id_ed25519.pub)"
          >
            <Key className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={onOpenSettingsModal}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-md transition border border-white/10"
            title="Settings & Preferences"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar and Environment Filter Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search hostname, IP, tag, or environment..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/70 text-slate-200 placeholder-slate-500 text-xs rounded-lg border border-white/10 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Environment Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          <button
            onClick={() => setSelectedEnv('All')}
            className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
              selectedEnv === 'All'
                ? 'bg-slate-700 text-cyan-400 font-semibold border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-800/60'
            }`}
          >
            All ({serverCount})
          </button>
          {environments.map((env) => (
            <button
              key={env}
              onClick={() => setSelectedEnv(env)}
              className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
                selectedEnv === env
                  ? 'bg-slate-700 text-white font-semibold border border-white/20'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/40 hover:bg-slate-800/60'
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
