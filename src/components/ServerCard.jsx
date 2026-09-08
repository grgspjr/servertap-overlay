import React, { useState } from 'react';
import { Terminal, Monitor, Copy, Check, Edit2, Trash2, Shield, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';

export default function ServerCard({ server, index, isFirst, isLast, onLaunchSsh, onLaunchRdp, onEdit, onDelete, onPing, onMoveUp, onMoveDown }) {
  const [copied, setCopied] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [pinging, setPinging] = useState(false);

  // Environment visual styling mapping
  const envStyles = {
    Production: {
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500',
    },
    Staging: {
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500',
    },
    Tunnels: {
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
    },
    VPN: {
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      dot: 'bg-indigo-500',
    },
    Development: {
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      dot: 'bg-cyan-500',
    },
    Other: {
      badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      dot: 'bg-slate-500',
    },
  };

  const style = envStyles[server.environment] || envStyles.Other;

  const handleCopyHost = () => {
    navigator.clipboard.writeText(server.host);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopySshCmd = () => {
    const user = server.username ? `${server.username}@` : '';
    const port = server.port && server.port !== 22 ? ` -p ${server.port}` : '';
    const key = server.keyPath ? ` -i "${server.keyPath}"` : '';
    const noCmd = server.noRemoteCmd !== false && server.proxyType === 'tunnel' ? ' -N' : '';
    const tunnel = server.proxyType === 'tunnel' ? ` -L ${server.proxyPort || '10111'}:${server.proxyHost || '127.0.0.1'}:${server.targetPort || server.proxyPort || '10111'}` : '';
    const proxy = server.proxyType === 'jump' && server.proxyHost ? ` -J ${server.proxyUsername ? server.proxyUsername + '@' : ''}${server.proxyHost}` : '';
    const cmd = `ssh${key}${noCmd}${tunnel}${proxy} ${user}${server.host}${port}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1500);
  };

  const handleManualPing = async () => {
    setPinging(true);
    if (onPing) {
      await onPing(server);
    }
    setPinging(false);
  };

  return (
    <div className="glass-card rounded-xl p-3 flex flex-col gap-2 group relative border border-white/10 hover:border-white/20 transition-all duration-150">
      {/* Row 1: Position Controls + Server Name + Environment Badge + Ping */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {/* Server Position Reorder Controls */}
          <div className="flex items-center gap-0.5 text-slate-500 bg-slate-900/60 p-0.5 rounded border border-white/5 flex-shrink-0">
            <button
              onClick={() => onMoveUp(index)}
              disabled={isFirst}
              className="p-0.5 hover:text-cyan-300 disabled:opacity-20 disabled:hover:text-slate-500 transition"
              title="Move Server Up"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
            <button
              onClick={() => onMoveDown(index)}
              disabled={isLast}
              className="p-0.5 hover:text-cyan-300 disabled:opacity-20 disabled:hover:text-slate-500 transition"
              title="Move Server Down"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <h3 className="font-bold text-slate-100 text-xs tracking-wide group-hover:text-cyan-300 transition truncate">
            {server.name}
          </h3>

          <span className={`text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded border ${style.badge} flex-shrink-0`}>
            {server.environment}
          </span>
        </div>

        {/* Status Ping */}
        <button
          onClick={handleManualPing}
          disabled={pinging}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/60 hover:bg-slate-800 text-slate-400 text-[10px] border border-white/5 transition flex-shrink-0"
          title="Click to check ping"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              pinging
                ? 'bg-amber-400 animate-ping'
                : server.status === 'online'
                ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                : server.status === 'offline'
                ? 'bg-rose-500'
                : 'bg-slate-500'
            }`}
          />
          <span>{pinging ? '...' : server.status === 'online' ? `${server.latency ?? '<1'}ms` : 'ping'}</span>
        </button>
      </div>

      {/* Row 2: Host IP + User + Reverse Proxy Indicator */}
      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/40 px-2 py-1 rounded border border-white/5">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-slate-200 font-semibold">{server.host}</span>
          {server.username && <span className="text-slate-400 text-[10px]">({server.username})</span>}
          <button
            onClick={handleCopyHost}
            className="text-slate-500 hover:text-cyan-400 p-0.5 transition flex-shrink-0"
            title="Copy IP"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {server.proxyType && server.proxyType !== 'none' && (
          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 flex-shrink-0">
            <Shield className="w-2.5 h-2.5 text-cyan-400" />
            <span>via {server.proxyHost || server.proxyType}</span>
          </span>
        )}
      </div>

      {/* Row 3: Action Buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        {(server.type === 'ssh' || server.type === 'both' || !server.type) && (
          <button
            onClick={() => onLaunchSsh(server)}
            className="flex-1 btn-tap-ssh font-bold text-white py-1.5 px-3 rounded-md text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
            title="Launch SSH Session in CMD"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-200" />
            <span>SSH Connect</span>
          </button>
        )}

        {(server.type === 'rdp' || server.type === 'both') && (
          <button
            onClick={() => onLaunchRdp(server)}
            className="flex-1 btn-tap-rdp font-bold text-white py-1.5 px-3 rounded-md text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
            title="Launch Remote Desktop Session"
          >
            <Monitor className="w-3.5 h-3.5 text-purple-200" />
            <span>RDP Connect</span>
          </button>
        )}

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopySshCmd}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-md border border-white/10 transition"
            title="Copy SSH Command"
          >
            {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>

          <button
            onClick={() => onEdit(server)}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 rounded-md border border-white/10 transition"
            title="Edit Server"
          >
            <Edit2 className="w-3 h-3" />
          </button>

          <button
            onClick={() => onDelete(server.id)}
            className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800/60 hover:bg-red-500/20 rounded-md border border-white/10 transition"
            title="Delete Server"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
