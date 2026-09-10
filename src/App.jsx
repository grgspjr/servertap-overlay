import React, { useState, useEffect } from 'react';
import OverlayBar from './components/OverlayBar';
import ServerCard from './components/ServerCard';
import AddServerModal from './components/AddServerModal';
import SshImporterModal from './components/SshImporterModal';
import SettingsModal from './components/SettingsModal';
import { Terminal, Monitor, Server, AlertCircle, RefreshCw, Layers, ShieldCheck } from 'lucide-react';

export default function App() {
  const [servers, setServers] = useState([]);
  const [settings, setSettings] = useState({
    hotkey: 'Ctrl+Alt+S',
    alwaysOnTop: true,
    defaultTerminal: 'cmd.exe',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('All');
  const [toast, setToast] = useState(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [appVersion, setAppVersion] = useState('2.1.1');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Initial load
  useEffect(() => {
    loadData();
    if (window.api) {
      if (window.api.onUpdateAvailable) {
        window.api.onUpdateAvailable((info) => {
          setUpdateInfo(info);
          showToast(`🚀 ServerTap ${info.version} is available! Downloading update...`, 'info');
        });
      }
      if (window.api.onUpdateDownloaded) {
        window.api.onUpdateDownloaded((info) => {
          setUpdateDownloaded(true);
          showToast(`✅ ServerTap ${info.version} downloaded! Click Restart to apply.`, 'success');
        });
      }
    }
    if (window.api && window.api.getAppVersion) {
    window.api.getAppVersion().then((v) => setAppVersion(v));
    }
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      if (window.api) {
        const loadedServers = await window.api.getServers();
        const loadedSettings = await window.api.getSettings();
        setServers(loadedServers || []);
        if (loadedSettings) setSettings(loadedSettings);
      } else {
        // Fallback demo state
        setServers([
          //{
          //  id: '1',
          //  name: 'App Server (Via Proxy)',
          //  host: '192.168.10.31',
          //  type: 'ssh',
          //  port: 22,
          //  username: 'appuser',
          //  environment: 'Production',
          //  tags: ['app-server', 'reverse-proxy', 'linux'],
          //  notes: 'Routes via Reverse Proxy 192.168.15.58',
          //  proxyType: 'jump',
          //  proxyHost: '192.168.15.58',
          //  proxyUsername: 'proxyuser',
          //  status: 'online',
          //  latency: 18,
          //},
          {
            id: '2',
            name: 'Prod Master 01',
            host: '192.168.1.100',
            type: 'ssh',
            port: 22,
            username: 'root',
            environment: 'Production',
            tags: ['production', 'linux'],
            notes: 'Primary Kubernetes Master Node',
            status: 'online',
            latency: 14,
          },
          {
            id: '3',
            name: 'Windows Domain Controller',
            host: '10.0.0.10',
            type: 'rdp',
            port: 3389,
            username: 'Administrator',
            environment: 'Production',
            tags: ['windows', 'ad', 'infrastructure'],
            notes: 'Active Directory Domain Controller 01',
            status: 'online',
            latency: 28,
          },
          {
            id: '4',
            name: 'Staging API Webserver',
            host: 'staging-api.internal.net',
            type: 'ssh',
            port: 2222,
            username: 'devops',
            environment: 'Staging',
            tags: ['api', 'staging', 'docker'],
            notes: 'Docker Swarm Staging cluster node',
            status: 'online',
            latency: 42,
          },
          {
            id: '5',
            name: 'Dev PostgreSQL DB',
            host: 'dev-db.internal.net',
            type: 'ssh',
            port: 22,
            username: 'postgres',
            environment: 'Development',
            tags: ['database', 'dev', 'postgres'],
            notes: 'Development Database Instance',
            status: 'offline',
          },
        ]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const saveServersList = async (newList) => {
    setServers(newList);
    if (window.api) {
      await window.api.saveServers(newList);
    }
  };

  // Launchers
  const handleLaunchSsh = async (server) => {
    if (window.api && window.api.launchSsh) {
      showToast(`1-Tap SSH: Spawning CMD session to ${server.name}...`, 'ssh');
      const res = await window.api.launchSsh(server);
      if (!res.success) {
        showToast(`SSH Launch Failed: ${res.error}`, 'error');
      } else if (res.passwordCopied) {
        showToast('Password copied to clipboard! (Ctrl+V to paste if prompted)', 'info');
      }
    } else {
      showToast(`[Demo] Executing: ssh ${server.username ? server.username + '@' : ''}${server.host}`, 'ssh');
    }
  };

  const handleLaunchRdp = async (server) => {
    if (window.api && window.api.launchRdp) {
      showToast(`1-Tap RDP: Launching Remote Desktop to ${server.name}...`, 'rdp');
      const res = await window.api.launchRdp(server);
      if (!res.success) {
        showToast(`RDP Launch Failed: ${res.error}`, 'error');
      } else if (res.autoLoggedIn) {
        showToast('Auto-authenticating via Windows Credential Manager...', 'rdp');
      }
    } else {
      showToast(`[Demo] Executing: mstsc.exe /v:${server.host}:${server.port || 3389}`, 'rdp');
    }
  };

  const handleLaunchWebsite = async (server) => {
    if (window.api && window.api.launchWebsite) {
      showToast(`1-Tap Web: Opening Edge & Auto-Logging in to ${server.name}...`, 'info');
      const res = await window.api.launchWebsite(server);
      if (res.autoLoggedIn) {
        showToast('Auto-filling credentials & submitting login form...', 'info');
      }
    } else {
      window.open(server.host.startsWith('http') ? server.host : `https://${server.host}`, '_blank');
    }
  };

  // Manual Ping
  const handlePingServer = async (server) => {
    if (window.api && window.api.pingHost) {
      const res = await window.api.pingHost({ host: server.host, port: server.port });
      const updated = servers.map((s) =>
        s.id === server.id ? { ...s, status: res.status, latency: res.latency } : s
      );
      saveServersList(updated);
    } else {
      const mockLatency = Math.floor(Math.random() * 35) + 5;
      const updated = servers.map((s) =>
        s.id === server.id ? { ...s, status: 'online', latency: mockLatency } : s
      );
      saveServersList(updated);
    }
  };

  // Batch Ping All
  const handlePingAll = async () => {
    showToast('Pinging all servers...', 'info');
    for (const server of servers) {
      await handlePingServer(server);
    }
    showToast('Ping checks updated!', 'info');
  };

  // Add / Edit / Delete Server
  const handleSaveServer = (serverData) => {
    let newList;
    if (editingServer) {
      newList = servers.map((s) => (s.id === serverData.id ? serverData : s));
      showToast(`Updated server ${serverData.name}`, 'info');
    } else {
      newList = [serverData, ...servers];
      showToast(`Added server ${serverData.name}`, 'info');
    }
    saveServersList(newList);
    setEditingServer(null);
  };

  const handleDeleteServer = (id) => {
    const target = servers.find((s) => s.id === id);
    const newList = servers.filter((s) => s.id !== id);
    saveServersList(newList);
    showToast(`Removed server ${target?.name || ''}`, 'info');
  };

  const handleImportSshCompleted = (importedServers) => {
    const existingHosts = new Set(servers.map((s) => s.host));
    const newItems = importedServers.filter((s) => !existingHosts.has(s.host));
    const combined = [...newItems, ...servers];
    saveServersList(combined);
    showToast(`Imported ${newItems.length} new SSH servers!`, 'info');
  };

  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    if (window.api && window.api.saveSettings) {
      await window.api.saveSettings(newSettings);
    }
    showToast('Settings saved successfully', 'info');
  };

  const handleExportData = () => {
    const jsonStr = JSON.stringify(servers, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `servertap-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup JSON downloaded!', 'info');
  };

  const handleImportJsonData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            if (Array.isArray(parsed)) {
              saveServersList(parsed);
              showToast(`Imported ${parsed.length} servers from JSON backup!`, 'info');
            }
          } catch (err) {
            showToast('Invalid JSON file format', 'error');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleCopyPublicKey = () => {
    const pubKeySample = `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI... devops-key`;
    navigator.clipboard.writeText(pubKeySample);
    showToast('Copied Public Key (id_ed25519.pub) to clipboard!', 'info');
  };

  // Filtering servers logic
  const filteredServers = servers.filter((server) => {
    const matchesSearch =
      searchQuery === '' ||
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (server.username && server.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (server.tags && server.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesEnv = selectedEnv === 'All' || server.environment === selectedEnv;

    return matchesSearch && matchesEnv;
  });

  const environments = ['Production', 'Staging', 'Tunnels', 'VPN', 'Websites', 'Other'];

  // Reorder Server Position
  const handleMoveServer = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= servers.length) return;

    const newList = [...servers];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    saveServersList(newList);
  };

  return (
    <div className="h-screen w-screen p-3 flex flex-col gap-3 glass-container rounded-2xl select-none overflow-hidden border border-white/15">
      {/* Top Header & Search Navigation Bar */}
      <OverlayBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedEnv={selectedEnv}
        setSelectedEnv={setSelectedEnv}
        onOpenAddModal={() => {
          setEditingServer(null);
          setIsAddModalOpen(true);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onCopyPublicKey={handleCopyPublicKey}
        serverCount={servers.length}
        environments={environments}
      />

      {/* Auto-Update Notification Banner */}
      {updateDownloaded && (
        <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2 text-white text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in flex-shrink-0">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>ServerTap {updateInfo?.version || 'Update'} is ready to install!</span>
          </div>
          <button
            onClick={() => window.api && window.api.restartAndInstallUpdate()}
            className="px-3 py-1 bg-white text-emerald-900 rounded-md hover:bg-emerald-50 text-xs font-bold transition shadow-sm"
          >
            Restart & Update Now
          </button>
        </div>
      )}

      {/* Main Server Cards View Grid */}
      <main className="flex-1 overflow-y-auto pr-1">
        {filteredServers.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 gap-3 text-center text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-500">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">No matching servers found</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {searchQuery || selectedEnv !== 'All'
                  ? 'Try adjusting your search query or environment filter.'
                  : 'Get started by adding a new server or importing your ~/.ssh/config.'}
              </p>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  setEditingServer(null);
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition"
              >
                + Add Server
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/10 transition"
              >
                Import SSH Config
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pb-2">
            {filteredServers.map((server, idx) => (
              <ServerCard
                key={server.id}
                server={server}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === filteredServers.length - 1}
                onLaunchSsh={handleLaunchSsh}
                onLaunchRdp={handleLaunchRdp}
                onLaunchWebsite={handleLaunchWebsite}
                onEdit={(srv) => {
                  setEditingServer(srv);
                  setIsAddModalOpen(true);
                }}
                onDelete={handleDeleteServer}
                onPing={handlePingServer}
                onMoveUp={(i) => handleMoveServer(i, 'up')}
                onMoveDown={(i) => handleMoveServer(i, 'down')}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer Info Bar */}
      <footer className="flex items-center justify-between px-2 pt-2 border-t border-white/10 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Hotkey: <code className="text-cyan-300 font-mono font-bold">{settings.hotkey || 'Shift+Home'}</code></span>
          </span>
          <button
            onClick={handlePingAll}
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition"
            title="Ping all servers now"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Ping All</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span>{filteredServers.length} servers listed</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">ServerTap v{appVersion}</span>
        </div>
      </footer>

      {/* Toast Notification Popup */}
      {toast && (
        <div
          className={`fixed bottom-12 right-6 z-50 px-4 py-2.5 rounded-xl border shadow-2xl text-xs font-medium flex items-center gap-2 animate-bounce ${
            toast.type === 'ssh'
              ? 'bg-cyan-950/90 text-cyan-200 border-cyan-500/40'
              : toast.type === 'rdp'
              ? 'bg-purple-950/90 text-purple-200 border-purple-500/40'
              : toast.type === 'error'
              ? 'bg-red-950/90 text-red-200 border-red-500/40'
              : 'bg-slate-900/90 text-slate-200 border-white/20'
          }`}
        >
          {toast.type === 'ssh' && <Terminal className="w-4 h-4 text-cyan-400" />}
          {toast.type === 'rdp' && <Monitor className="w-4 h-4 text-purple-400" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      <AddServerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveServer}
        editingServer={editingServer}
      />

      <SshImporterModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportCompleted={handleImportSshCompleted}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onExportData={handleExportData}
        onImportData={handleImportJsonData}
      />
    </div>
  );
}