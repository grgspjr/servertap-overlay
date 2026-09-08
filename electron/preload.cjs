const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Launchers
  launchSsh: (server) => ipcRenderer.invoke('launch-ssh', server),
  launchRdp: (server) => ipcRenderer.invoke('launch-rdp', server),
  
  // Network & Config
  pingHost: (data) => ipcRenderer.invoke('ping-host', data),
  importSshConfig: () => ipcRenderer.invoke('import-ssh-config'),

  // Data persistence
  getServers: () => ipcRenderer.invoke('get-servers'),
  saveServers: (servers) => ipcRenderer.invoke('save-servers', servers),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  getActiveHotkey: () => ipcRenderer.invoke('get-active-hotkey'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  // Window management
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  toggleAlwaysOnTop: (flag) => ipcRenderer.invoke('toggle-always-on-top', flag),
  toggleDockMode: (expand) => ipcRenderer.invoke('toggle-dock-mode', expand),
  resizeWindow: (dimensions) => ipcRenderer.invoke('resize-window', dimensions),
});
