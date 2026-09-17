const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, shell, clipboard, screen, safeStorage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, execFile } = require('child_process');
const net = require('net');
const http = require('http');
const WebSocket = require('ws');

let mainWindow = null;
let tray = null;

// Hardware-Backed Password Encryption via Electron safeStorage (Windows DPAPI)
function encryptSecret(plainText) {
  if (!plainText || typeof plainText !== 'string' || plainText.trim() === '') return plainText;
  if (plainText.startsWith('enc:')) return plainText;
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const buffer = safeStorage.encryptString(plainText);
      return 'enc:' + buffer.toString('base64');
    }
  } catch (err) {
    console.error('Error encrypting secret:', err);
  }
  return plainText;
}

function decryptSecret(cipherText) {
  if (!cipherText || typeof cipherText !== 'string' || !cipherText.startsWith('enc:')) return cipherText;
  try {
    if (safeStorage && safeStorage.isEncryptionAvailable()) {
      const base64Data = cipherText.slice(4);
      const buffer = Buffer.from(base64Data, 'base64');
      return safeStorage.decryptString(buffer);
    }
  } catch (err) {
    console.error('Error decrypting secret:', err);
  }
  return cipherText;
}

function sanitizeServerForStorage(server) {
  if (!server) return server;
  return {
    ...server,
    password: encryptSecret(server.password),
    proxyPassword: encryptSecret(server.proxyPassword),
    keyPassphrase: encryptSecret(server.keyPassphrase),
  };
}

function prepareServerFromStorage(server) {
  if (!server) return server;
  return {
    ...server,
    password: decryptSecret(server.password),
    proxyPassword: decryptSecret(server.proxyPassword),
    keyPassphrase: decryptSecret(server.keyPassphrase),
  };
}

function sanitizeSettingsForStorage(settings) {
  if (!settings) return settings;
  let proxyProfiles = settings.proxyProfiles;
  if (Array.isArray(proxyProfiles)) {
    proxyProfiles = proxyProfiles.map((profile) => ({
      ...profile,
      proxyPassword: encryptSecret(profile.proxyPassword),
    }));
  }
  return {
    ...settings,
    proxyProfiles,
  };
}

function prepareSettingsFromStorage(settings) {
  if (!settings) return settings;
  let proxyProfiles = settings.proxyProfiles;
  if (Array.isArray(proxyProfiles)) {
    proxyProfiles = proxyProfiles.map((profile) => ({
      ...profile,
      proxyPassword: decryptSecret(profile.proxyPassword),
    }));
  }
  return {
    ...settings,
    proxyProfiles,
  };
}

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
  hotkey: 'Ctrl+Alt+S',
  alwaysOnTop: true,
  startMinimized: false,
  autoStartOnBoot: true,
  overlayOpacity: 0.95,
  pingIntervalMs: 30000,
  defaultTerminal: 'cmd.exe',
  defaultBrowserEngine: 'inapp',
};

function configureAutoStart(enable) {
  try {
    if (process.platform === 'win32') {
      // Skip auto-start registration in development mode (npm run dev)
      if (!app.isPackaged) {
        console.log('Skipping auto-start registration in development mode');
        return;
      }
      app.setLoginItemSettings({
        openAtLogin: enable !== false,
        path: app.getPath('exe'),
        args: ['--hidden']
      });
      console.log(`Windows Auto-Start on boot configured: ${enable !== false}`);
    }
  } catch (err) {
    console.error('Failed to set login item settings:', err);
  }
}

// Default sample servers for DevOps onboarding
const sampleServers = [
  {
    id: '1',
    name: 'App Server (Via Proxy)',
    host: '10.0.0.31',
    type: 'ssh',
    port: 22,
    username: 'appuser',
    environment: 'Production',
    tags: ['app-server', 'reverse-proxy', 'linux'],
    notes: 'Routes via Bastion Jump Host',
    proxyType: 'jump',
    proxyHost: 'bastion.example.com',
    proxyUsername: 'proxyuser',
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

  const isHiddenLaunch = process.argv.includes('--hidden');

  if (isHiddenLaunch) {
    mainWindow.hide();
  } else {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.center();
  }

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
    const settings = loadJsonFile(getSettingsFilePath(), defaultSettings);
    configureAutoStart(settings.autoStartOnBoot !== false);
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

  const rawPassword = decryptSecret(password);
  const rawProxyPassword = decryptSecret(server.proxyPassword);
  const rawKeyPassphrase = decryptSecret(server.keyPassphrase);

  let sshArgs = [];

  // Auto-copy password to clipboard if saved
  if (rawPassword && rawPassword.trim() !== '') {
    try {
      clipboard.writeText(rawPassword.trim());
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

  // Hands-free password auto-login sidecar execution
  const proxyPwd = rawProxyPassword ? rawProxyPassword.trim() : '';
  const targetPwd = rawPassword ? rawPassword.trim() : '';
  const keyPwd = rawKeyPassphrase ? rawKeyPassphrase.trim() : '';

  if (proxyPwd || targetPwd || keyPwd) {
    const scriptPath = path.join(__dirname, 'sshAutoLogin.ps1');
    const titleArg = `-windowTitle "${title.replace(/"/g, '`"')}"`;
    const hostArg = `-serverHost "${finalHost.replace(/"/g, '`"')}"`;
    const pPwdArg = proxyPwd ? `-proxyPassword "${proxyPwd.replace(/"/g, '`"')}"` : '';
    const tPwdArg = targetPwd ? `-targetPassword "${targetPwd.replace(/"/g, '`"')}"` : '';
    const kPwdArg = keyPwd ? `-keyPassphrase "${keyPwd.replace(/"/g, '`"')}"` : '';
    const psCmd = `powershell.exe -ExecutionPolicy Bypass -NoProfile -File "${scriptPath}" ${titleArg} ${hostArg} ${pPwdArg} ${tPwdArg} ${kPwdArg}`;

    setTimeout(() => {
      exec(psCmd, (err) => {
        if (err) console.error('SSH Auto-login helper error:', err);
      });
    }, 300);
  }

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
            resolve({ success: true, command: fullSshCmd, passwordCopied: false, tabbed: false });
          }
        });
      } else {
        resolve({ success: true, command: fullSshCmd, passwordCopied: false, tabbed: true });
      }
    });
  });
});

// 1-Tap RDP Connection Launcher (100% Passwordless Auto-Login via Windows Credential Manager)
ipcMain.handle('launch-rdp', async (event, server) => {
  const { host, port, username, password, adminConsole, proxyType, proxyPort } = server;
  const rawPassword = decryptSecret(password);

  let targetHost = host ? host.trim() : '127.0.0.1';
  let targetPort = port || 3389;

  if (proxyType === 'tunnel' && proxyPort) {
    targetHost = '127.0.0.1';
    targetPort = proxyPort;
  }

  // Windows Credential Manager cmdkey integration for 100% passwordless RDP
  let cmdPrefix = '';
  if (username && username.trim() && rawPassword && rawPassword.trim()) {
    const credTarget = `TERMSRV/${targetHost}`;
    cmdPrefix = `cmdkey /generic:${credTarget} /user:${username.trim()} /pass:"${rawPassword.trim()}" && `;
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
        resolve({ success: true, command: fullCmd, autoLoggedIn: !!(username && rawPassword) });
      }
    });
  });
});

// Proxy-Aware & Multistage Server Health Checker
ipcMain.handle('ping-host', async (event, payload) => {
  const { host, port, type, environment, proxyType, proxyHost, proxyPort } = payload || {};
  if (!host || typeof host !== 'string' || host.trim() === '') {
    return { host: '', status: 'offline', latency: null };
  }

  const rawHost = host.trim();
  let cleanHost = rawHost.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
  const startTime = Date.now();

  // Helper to check if an IP / hostname is a private/internal network address
  const isPrivateAddress = (addr) => {
    if (!addr) return false;
    const lower = addr.toLowerCase();
    if (lower.startsWith('10.') || lower.startsWith('192.168.') || lower.endsWith('.internal') || lower.endsWith('.local')) return true;
    if (lower.startsWith('172.')) {
      const parts = lower.split('.');
      if (parts.length >= 2) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
      }
    }
    return false;
  };

  // If host is a private IP/domain AND is routed via Bastion Jump Host, test the Proxy Host reachability
  let targetHostToProbe = cleanHost;
  let targetPortToProbe = port ? parseInt(port) : null;
  let isRoutingViaProxy = false;

  if (proxyHost && proxyHost.trim() !== '' && proxyType && proxyType !== 'none') {
    const cleanProxyHost = proxyHost.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
    if (isPrivateAddress(cleanHost)) {
      targetHostToProbe = cleanProxyHost;
      targetPortToProbe = proxyPort ? parseInt(proxyPort) : 22;
      isRoutingViaProxy = true;
    }
  }

  if (!targetPortToProbe) {
    if (type === 'rdp') targetPortToProbe = 3389;
    else if (type === 'website' || environment === 'Websites' || rawHost.startsWith('http')) targetPortToProbe = 443;
    else targetPortToProbe = 22;
  }

  // Helper for ICMP Shell Ping Fallback
  const tryIcmpPing = (target) => {
    return new Promise((resolve) => {
      const pingCmd = `ping -n 1 -w 2500 ${target}`;
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
  };

  // Helper for HTTP/HTTPS Probe
  const tryHttpCheck = (target, targetPort) => {
    return new Promise((resolve) => {
      const isHttps = targetPort === 443 || rawHost.startsWith('https');
      const mod = isHttps ? require('https') : require('http');
      const reqUrl = (rawHost.startsWith('http') ? rawHost : (isHttps ? 'https://' : 'http://') + target);
      
      try {
        const req = mod.get(reqUrl, { timeout: 2500, rejectUnauthorized: false }, (res) => {
          const latency = Date.now() - startTime;
          req.destroy();
          resolve({ host, status: 'online', latency });
        });

        req.on('error', async () => {
          const icmpRes = await tryIcmpPing(target);
          resolve(icmpRes);
        });

        req.on('timeout', async () => {
          req.destroy();
          const icmpRes = await tryIcmpPing(target);
          resolve(icmpRes);
        });
      } catch (e) {
        tryIcmpPing(target).then(resolve);
      }
    });
  };

  // Stage 1: TCP Socket Check
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

    socket.on('error', async () => {
      if (isResolved) return;
      isResolved = true;
      socket.destroy();

      if (!isRoutingViaProxy && (type === 'website' || environment === 'Websites' || targetPortToProbe === 443 || targetPortToProbe === 80)) {
        const httpRes = await tryHttpCheck(targetHostToProbe, targetPortToProbe);
        resolve(httpRes);
      } else {
        const icmpRes = await tryIcmpPing(targetHostToProbe);
        resolve(icmpRes);
      }
    });

    socket.on('timeout', async () => {
      if (isResolved) return;
      isResolved = true;
      socket.destroy();

      if (!isRoutingViaProxy && (type === 'website' || environment === 'Websites' || targetPortToProbe === 443 || targetPortToProbe === 80)) {
        const httpRes = await tryHttpCheck(targetHostToProbe, targetPortToProbe);
        resolve(httpRes);
      } else {
        const icmpRes = await tryIcmpPing(targetHostToProbe);
        resolve(icmpRes);
      }
    });

    socket.connect(targetPortToProbe, targetHostToProbe);
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
  const loaded = loadJsonFile(getServersFilePath(), sampleServers);
  return (loaded || []).map(prepareServerFromStorage);
});

ipcMain.handle('save-servers', async (event, servers) => {
  const sanitized = (servers || []).map(sanitizeServerForStorage);
  return saveJsonFile(getServersFilePath(), sanitized);
});

ipcMain.handle('get-settings', async () => {
  const loaded = loadJsonFile(getSettingsFilePath(), defaultSettings);
  const prepared = prepareSettingsFromStorage(loaded);
  return { ...prepared, hotkey: activeHotkey };
});

ipcMain.handle('get-active-hotkey', async () => {
  return activeHotkey;
});

ipcMain.handle('save-settings', async (event, settings) => {
  const sanitized = sanitizeSettingsForStorage(settings);
  const result = saveJsonFile(getSettingsFilePath(), sanitized);
  configureAutoStart(settings.autoStartOnBoot !== false);
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

// 1. Return dynamic app version to UI
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});
// 2. Launch Website in Microsoft Edge & Auto-Fill Credentials via Windows UI Automation Sidecar
ipcMain.handle('launch-website', async (event, server) => {
  try {
    let url = server.host ? server.host.trim() : '';
    if (!url) return { success: false, error: 'Empty URL provided' };

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const { username, password } = server;
    const rawPassword = decryptSecret(password);

    // 1. Copy password to clipboard as a 1-tap backup
    if (rawPassword && rawPassword.trim() !== '') {
      try {
        clipboard.writeText(rawPassword.trim());
      } catch (e) {}
    }

    // 2. Launch Microsoft Edge natively in user's default browser window
    const cmd = `start msedge "${url}"`;
    exec(cmd, { shell: 'cmd.exe' });

    // 3. Execute ServerTap Windows UI Automation Sidecar (Native OS Accessibility API)
    if (username || rawPassword) {
      const sidecarExe = path.join(__dirname, 'ServerTapUiaSidecar.exe');
      const uStr = username ? username.trim() : '';
      const pStr = rawPassword ? rawPassword.trim() : '';

      if (fs.existsSync(sidecarExe)) {
        execFile(sidecarExe, [url, uStr, pStr], (err, stdout, stderr) => {
          if (err) {
            console.error('UIA Sidecar execution error:', err);
          }
        });
      }
    }

    return { success: true, mode: 'external', autoLoggedIn: !!(username || rawPassword) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
