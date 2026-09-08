const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, shell, clipboard, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const net = require('net');

let mainWindow = null;
let tray = null;

function getUserDataPath() {
  let targetDir = null;
  try {
    if (app.isReady()) {
      targetDir = app.getPath('userData');
    }
  } catch (e) {}

  if (!targetDir) {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    targetDir = path.join(appData, 'servertap-devops-overlay');
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Automatic Migration Check from legacy folder paths
  try {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const legacyDirs = [
      path.join(appData, 'servertap-devops-overlay'),
      path.join(appData, 'servertap-overlay'),
      path.join(appData, 'ServerTap DevOps Overlay')
    ];

    for (const legacyDir of legacyDirs) {
      if (legacyDir.toLowerCase() !== targetDir.toLowerCase() && fs.existsSync(legacyDir)) {
        const legacyServers = path.join(legacyDir, 'servers.json');
        const currentServers = path.join(targetDir, 'servers.json');
        if (fs.existsSync(legacyServers) && !fs.existsSync(currentServers)) {
          fs.copyFileSync(legacyServers, currentServers);
          console.log(`Migrated servers.json from ${legacyDir} to ${targetDir}`);
        }
        const legacySettings = path.join(legacyDir, 'settings.json');
        const currentSettings = path.join(targetDir, 'settings.json');
        if (fs.existsSync(legacySettings) && !fs.existsSync(currentSettings)) {
          fs.copyFileSync(legacySettings, currentSettings);
        }
      }
    }
  } catch (err) {
    console.error('Data migration error:', err);
  }

  return targetDir;
}

const getServersFilePath = () => path.join(getUserDataPath(), 'servers.json');
const getSettingsFilePath = () => path.join(getUserDataPath(), 'settings.json');

// Default initial settings
const defaultSettings = {
  hotkey: 'Shift+Home',
  alwaysOnTop: true,
  startMinimized: false,
  overlayOpacity: 0.95,
  pingIntervalMs: 30000,
  defaultTerminal: 'cmd.exe',
};

// Default sample servers for DevOps onboarding
const sampleServers = [
  {
    id: '1',
    name: 'App Server (Via Proxy)',
    host: '192.168.10.31',
    type: 'ssh',
    port: 22,
    username: 'appuser',
    environment: 'Production',
    tags: ['app-server', 'reverse-proxy', 'linux'],
    notes: 'Routes via Reverse Proxy 192.168.15.58',
    proxyType: 'jump',
    proxyHost: '192.168.15.58',
    proxyUsername: 'proxyuser',
  },
  {
    id: '2',
    name: 'Prod K8s Master 01',
    host: '192.168.1.100',
    type: 'ssh',
    port: 22,
    username: 'root',
    environment: 'Production',
    tags: ['k8s', 'production', 'linux'],
    notes: 'Primary Kubernetes Master Node',
    authType: 'key',
    keyPath: '~/.ssh/id_rsa_prod',
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
    customCommand: 'docker ps',
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
  },
];

function loadJsonFile(filepath, fallback) {
  try {
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading ${filepath}:`, err);
  }
  return fallback;
}

function saveJsonFile(filepath, data) {
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filepath}:`, err);
    return false;
  }
}

function createWindow() {
  const settings = loadJsonFile(getSettingsFilePath(), defaultSettings);

  mainWindow = new BrowserWindow({
    width: 920,
    height: 650,
    minWidth: 500,
    minHeight: 400,
    frame: true,
    title: "ServerTap - DevOps Overlay Launcher",
    backgroundColor: '#0f172a',
    alwaysOnTop: settings.alwaysOnTop !== false,
    resizable: true,
    show: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  });

  const distHtmlPath = path.join(__dirname, '../dist/index.html');

  if (fs.existsSync(distHtmlPath)) {
    mainWindow.loadFile(distHtmlPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.show();
  mainWindow.focus();
  mainWindow.center();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

let activeHotkey = 'Ctrl+Alt+S';

function toggleOverlayWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } else if (mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

function registerHotkeys() {
  globalShortcut.unregisterAll();
  const settings = loadJsonFile(getSettingsFilePath(), defaultSettings);
  
  const hotkeyCandidates = [
    'Ctrl+Alt+S',
    'Alt+S',
    'F10',
    'F9',
    'Ctrl+Space',
    'Shift+Home',
    settings.hotkey
  ].filter(Boolean);

  const uniqueCandidates = [...new Set(hotkeyCandidates)];
  let registeredList = [];

  for (const shortcut of uniqueCandidates) {
    try {
      const success = globalShortcut.register(shortcut, () => {
        toggleOverlayWindow();
      });

      if (success) {
        registeredList.push(shortcut);
        console.log(`Registered hotkey: ${shortcut}`);
      }
    } catch (err) {
      console.warn(`Failed to register hotkey: ${shortcut}`, err);
    }
  }

  activeHotkey = registeredList[0] || settings.hotkey || 'Ctrl+Alt+S';
  return activeHotkey;
}

function setupTray() {
  try {
    const iconPath = path.join(__dirname, 'tray.png');
    tray = new Tray(fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty());

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show / Hide ServerTap Overlay',
        click: () => {
          toggleOverlayWindow();
        },
      },
      {
        label: 'Toggle Always on Top',
        type: 'checkbox',
        checked: true,
        click: (menuItem) => {
          if (mainWindow) {
            mainWindow.setAlwaysOnTop(menuItem.checked);
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Exit ServerTap',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setToolTip('ServerTap - DevOps Screen Overlay');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
      toggleOverlayWindow();
    });
  } catch (e) {
    console.error('Tray initialization error:', e);
  }
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    toggleOverlayWindow();
  });

  app.whenReady().then(() => {
    createWindow();
    registerHotkeys();
    setupTray();

    // Check for updates 5 seconds after startup
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((err) => console.log('Auto update check:', err.message));
    }, 5000);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Auto-Updater IPCs
ipcMain.handle('check-for-updates', async () => {
  try {
    return await autoUpdater.checkForUpdatesAndNotify();
  } catch (err) {
    return { error: err.message };
  }
});

ipcMain.handle('restart-and-install-update', () => {
  autoUpdater.quitAndInstall();
});

// IPC Communication Handlers

// 1-Tap SSH Connection Launcher
ipcMain.handle('launch-ssh', async (event, server) => {
  const {
    host,
    port,
    username,
    password,
    keyPath,
    customFlags,
    customCommand,
    name,
    proxyType,
    proxyHost,
    proxyPort,
    proxyUsername,
    proxyKeyPath,
  } = server;

  let sshArgs = [];

  // Auto-copy password to clipboard if saved
  if (password && password.trim() !== '') {
    try {
      clipboard.writeText(password.trim());
    } catch (e) {
      console.error('Failed to copy password to clipboard:', e);
    }
  }

  // Key path argument
  if (keyPath && keyPath.trim() !== '') {
    let resolvedKey = keyPath.trim();
    if (resolvedKey.startsWith('~')) {
      resolvedKey = path.join(os.homedir(), resolvedKey.slice(1));
    }
    sshArgs.push(`-i "${resolvedKey}"`);
  }

  // -N flag (Do not execute remote command, background tunnel)
  if (server.noRemoteCmd !== false && (proxyType === 'tunnel' || server.isTunnel)) {
    sshArgs.push('-N');
  }

  // SSH Local Port Forwarding Tunnel (-L localPort:targetHost:targetPort)
  if (proxyType === 'tunnel') {
    const lPort = proxyPort || '10111';
    const tHost = proxyHost && proxyHost.trim() ? proxyHost.trim() : '127.0.0.1';
    const tPort = server.targetPort || lPort;
    sshArgs.push(`-L ${lPort}:${tHost}:${tPort}`);
  } else if (proxyType === 'jump' && proxyHost && proxyHost.trim() !== '') {
    const pUser = proxyUsername && proxyUsername.trim() ? `${proxyUsername.trim()}@` : '';
    const pPort = proxyPort ? `:${proxyPort}` : '';
    sshArgs.push(`-J ${pUser}${proxyHost.trim()}${pPort}`);
  } else if (proxyType === 'socks5') {
    const sHost = proxyHost && proxyHost.trim() ? proxyHost.trim() : '127.0.0.1';
    const sPort = proxyPort || '1080';
    sshArgs.push(`-o "ProxyCommand=connect -S ${sHost}:${sPort} %h %p"`);
  }

  // Target SSH Server Host & Username
  const finalHost = host.trim();
  const userHost = username && username.trim() !== '' ? `${username.trim()}@${finalHost}` : finalHost;
  sshArgs.push(userHost);

  // Target SSH Port
  const finalPort = port ? parseInt(port) : 22;
  if (finalPort !== 22) {
    sshArgs.push(`-p ${finalPort}`);
  }

  if (customFlags && customFlags.trim() !== '') {
    sshArgs.push(customFlags.trim());
  }

  if (customCommand && customCommand.trim() !== '') {
    sshArgs.push(`"${customCommand.trim()}"`);
  }

  const fullSshCmd = `ssh ${sshArgs.join(' ')}`;
  const title = name ? `${name}` : `${host}`;

  // Open as a NEW TAB in the existing Windows Terminal window (-w 0 nt)
  const wtCmd = `wt.exe -w 0 nt --title "${title}" cmd.exe /k "${fullSshCmd}"`;
  const fallbackCmd = `cmd.exe /c start "SSH - ${title}" cmd.exe /k "${fullSshCmd}"`;

  return new Promise((resolve) => {
    exec(wtCmd, (error) => {
      if (error) {
        // Fallback to cmd.exe if wt.exe is not available
        exec(fallbackCmd, (fbErr) => {
          if (fbErr) {
            console.error('SSH launch error:', fbErr);
            resolve({ success: false, error: fbErr.message });
          } else {
            resolve({ success: true, command: fullSshCmd, passwordCopied: !!password, tabbed: false });
          }
        });
      } else {
        resolve({ success: true, command: fullSshCmd, passwordCopied: !!password, tabbed: true });
      }
    });
  });
});

// 1-Tap RDP Connection Launcher (100% Passwordless Auto-Login via Windows Credential Manager)
ipcMain.handle('launch-rdp', async (event, server) => {
  const { host, port, username, password, adminConsole, proxyType, proxyPort } = server;

  let targetHost = host ? host.trim() : '127.0.0.1';
  let targetPort = port || 3389;

  if (proxyType === 'tunnel' && proxyPort) {
    targetHost = '127.0.0.1';
    targetPort = proxyPort;
  }

  // Windows Credential Manager cmdkey integration for 100% passwordless RDP
  let cmdPrefix = '';
  if (username && username.trim() && password && password.trim()) {
    const credTarget = `TERMSRV/${targetHost}`;
    cmdPrefix = `cmdkey /generic:${credTarget} /user:${username.trim()} /pass:"${password.trim()}" && `;
  }

  let rdpArgs = [`/v:${targetHost}:${targetPort}`];

  if (adminConsole) {
    rdpArgs.push('/admin');
  }

  const fullCmd = `${cmdPrefix}mstsc.exe ${rdpArgs.join(' ')}`;

  return new Promise((resolve) => {
    exec(fullCmd, (error) => {
      if (error) {
        console.error('RDP launch error:', error);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, command: fullCmd, autoLoggedIn: !!(username && password) });
      }
    });
  });
});

// Ping host (ICMP / TCP socket check)
ipcMain.handle('ping-host', async (event, { host, port }) => {
  const startTime = Date.now();
  const testPort = port || 22;

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(2500);

    socket.on('connect', () => {
      if (isResolved) return;
      isResolved = true;
      const latency = Date.now() - startTime;
      socket.destroy();
      resolve({ host, status: 'online', latency });
    });

    socket.on('error', () => {
      if (isResolved) return;
      isResolved = true;
      socket.destroy();
      
      const pingCmd = `ping -n 1 -w 2000 ${host}`;
      exec(pingCmd, (pErr, stdout) => {
        if (!pErr && stdout.includes('TTL=')) {
          const match = stdout.match(/time[=<](\d+)ms/i);
          const latency = match ? parseInt(match[1]) : (Date.now() - startTime);
          resolve({ host, status: 'online', latency });
        } else {
          resolve({ host, status: 'offline', latency: null });
        }
      });
    });

    socket.on('timeout', () => {
      if (isResolved) return;
      isResolved = true;
      socket.destroy();
      resolve({ host, status: 'offline', latency: null });
    });

    socket.connect(testPort, host);
  });
});

// SSH Config Auto-Importer (~/.ssh/config)
ipcMain.handle('import-ssh-config', async () => {
  const sshConfigPath = path.join(os.homedir(), '.ssh', 'config');

  if (!fs.existsSync(sshConfigPath)) {
    return { success: false, error: `No SSH config found at ${sshConfigPath}` };
  }

  try {
    const content = fs.readFileSync(sshConfigPath, 'utf8');
    const lines = content.split('\n');

    const importedServers = [];
    let currentServer = null;

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      const [key, ...valParts] = line.split(/\s+/);
      const value = valParts.join(' ');

      if (key.toLowerCase() === 'host') {
        if (currentServer && currentServer.host) {
          importedServers.push(currentServer);
        }
        currentServer = {
          id: 'imported-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
          name: value,
          host: value,
          type: 'ssh',
          port: 22,
          username: '',
          environment: 'Development',
          tags: ['imported', 'ssh-config'],
          notes: `Imported from ~/.ssh/config (${value})`,
        };
      } else if (currentServer) {
        const lowerKey = key.toLowerCase();
        if (lowerKey === 'hostname') currentServer.host = value;
        else if (lowerKey === 'user') currentServer.username = value;
        else if (lowerKey === 'port') currentServer.port = parseInt(value) || 22;
        else if (lowerKey === 'identityfile') currentServer.keyPath = value;
      }
    }

    if (currentServer && currentServer.host) {
      importedServers.push(currentServer);
    }

    return { success: true, servers: importedServers };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Data persistence IPCs
ipcMain.handle('get-servers', async () => {
  return loadJsonFile(getServersFilePath(), sampleServers);
});

ipcMain.handle('save-servers', async (event, servers) => {
  return saveJsonFile(getServersFilePath(), servers);
});

ipcMain.handle('get-settings', async () => {
  const loaded = loadJsonFile(getSettingsFilePath(), defaultSettings);
  return { ...loaded, hotkey: activeHotkey };
});

ipcMain.handle('get-active-hotkey', async () => {
  return activeHotkey;
});

ipcMain.handle('save-settings', async (event, settings) => {
  const result = saveJsonFile(getSettingsFilePath(), settings);
  registerHotkeys();
  if (mainWindow && settings.alwaysOnTop !== undefined) {
    mainWindow.setAlwaysOnTop(settings.alwaysOnTop);
  }
  return result;
});

// Window controls
ipcMain.handle('hide-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('toggle-always-on-top', (event, flag) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag);
    return mainWindow.isAlwaysOnTop();
  }
  return false;
});

ipcMain.handle('toggle-dock-mode', (event, expand) => {
  if (!mainWindow) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  if (expand) {
    const windowWidth = 220;
    const windowHeight = Math.min(680, screenHeight - 40);
    mainWindow.setBounds({
      x: screenWidth - windowWidth,
      y: Math.floor((screenHeight - windowHeight) / 2),
      width: windowWidth,
      height: windowHeight,
    });
  } else {
    mainWindow.setBounds({
      x: screenWidth - 55,
      y: 120,
      width: 50,
      height: 50,
    });
  }
});

ipcMain.handle('resize-window', (event, { width, height }) => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
  }
});
