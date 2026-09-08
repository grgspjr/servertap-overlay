const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, nativeImage, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, spawn } = require('child_process');
const net = require('net');

let mainWindow = null;
let tray = null;

// File paths for persistence
const userDataPath = app.getPath('userData');
const serversFilePath = path.join(userDataPath, 'servers.json');
const settingsFilePath = path.join(userDataPath, 'settings.json');

// Default initial settings
const defaultSettings = {
  hotkey: 'Ctrl+Alt+S',
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
    id: '2',
    name: 'Windows Domain Controller',
    host: '10.0.0.10',
    type: 'rdp',
    port: 3389,
    username: 'Administrator',
    rdpDomain: 'CORP',
    environment: 'Production',
    tags: ['windows', 'ad', 'infrastructure'],
    notes: 'Active Directory Domain Controller 01',
  },
  {
    id: '3',
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
    id: '4',
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
  const settings = loadJsonFile(settingsFilePath, defaultSettings);

  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 400,
    minHeight: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: settings.alwaysOnTop !== false,
    resizable: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    icon: path.join(__dirname, 'icon.png'),
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function registerHotkeys() {
  globalShortcut.unregisterAll();
  const settings = loadJsonFile(settingsFilePath, defaultSettings);
  const shortcut = settings.hotkey || 'Ctrl+Alt+S';

  try {
    const ret = globalShortcut.register(shortcut, () => {
      if (!mainWindow) return;
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    if (!ret) {
      console.warn(`Hotkey registration failed for: ${shortcut}`);
    }
  } catch (err) {
    console.error(`Hotkey registration error:`, err);
  }
}

function setupTray() {
  try {
    // Create simple 16x16 tray icon using buffer or image
    const iconPath = path.join(__dirname, 'tray.png');
    tray = new Tray(nativeImage.createFromPath(iconPath).isEmpty() 
      ? nativeImage.createEmpty() 
      : iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show / Hide DevOps Overlay',
        click: () => {
          if (!mainWindow) return;
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.show();
            mainWindow.focus();
          }
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
      if (!mainWindow) return;
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (e) {
    console.error('Tray initialization error:', e);
  }
}

app.whenReady().then(() => {
  createWindow();
  registerHotkeys();
  setupTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Communication Handlers

// 1-Tap SSH Connection Launcher
ipcMain.handle('launch-ssh', async (event, server) => {
  const { host, port, username, keyPath, customFlags, customCommand, name } = server;

  let sshArgs = [];

  if (port && parseInt(port) !== 22) {
    sshArgs.push(`-p ${port}`);
  }

  if (keyPath && keyPath.trim() !== '') {
    // Resolve ~ to user profile
    let resolvedKey = keyPath.trim();
    if (resolvedKey.startsWith('~')) {
      resolvedKey = path.join(os.homedir(), resolvedKey.slice(1));
    }
    sshArgs.push(`-i "${resolvedKey}"`);
  }

  if (customFlags && customFlags.trim() !== '') {
    sshArgs.push(customFlags.trim());
  }

  const userHost = username && username.trim() !== '' ? `${username.trim()}@${host.trim()}` : host.trim();
  sshArgs.push(userHost);

  if (customCommand && customCommand.trim() !== '') {
    sshArgs.push(`"${customCommand.trim()}"`);
  }

  const fullSshCmd = `ssh ${sshArgs.join(' ')}`;
  const title = name ? `SSH - ${name}` : `SSH - ${host}`;

  // Launch cmd.exe in a separate window executing ssh command
  const execCmd = `cmd.exe /c start "${title}" cmd.exe /k "${fullSshCmd}"`;

  return new Promise((resolve) => {
    exec(execCmd, (error) => {
      if (error) {
        console.error('SSH launch error:', error);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, command: fullSshCmd });
      }
    });
  });
});

// 1-Tap RDP Connection Launcher
ipcMain.handle('launch-rdp', async (event, server) => {
  const { host, port, username, rdpDomain, adminConsole } = server;

  const targetPort = port || 3389;
  const targetHost = `${host}:${targetPort}`;

  let rdpArgs = [`/v:${targetHost}`];

  if (adminConsole) {
    rdpArgs.push('/admin');
  }

  const rdpCmd = `mstsc.exe ${rdpArgs.join(' ')}`;

  return new Promise((resolve) => {
    exec(rdpCmd, (error) => {
      if (error) {
        console.error('RDP launch error:', error);
        resolve({ success: false, error: error.message });
      } else {
        resolve({ success: true, command: rdpCmd });
      }
    });
  });
});

// Ping host (ICMP / TCP socket check)
ipcMain.handle('ping-host', async (event, { host, port }) => {
  const startTime = Date.now();
  const testPort = port || 22;

  // Try TCP socket ping first (faster & reliable across firewall rules)
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

    socket.on('error', (err) => {
      if (isResolved) return;
      // Fallback to ICMP ping command on error
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
  return loadJsonFile(serversFilePath, sampleServers);
});

ipcMain.handle('save-servers', async (event, servers) => {
  return saveJsonFile(serversFilePath, servers);
});

ipcMain.handle('get-settings', async () => {
  return loadJsonFile(settingsFilePath, defaultSettings);
});

ipcMain.handle('save-settings', async (event, settings) => {
  const result = saveJsonFile(settingsFilePath, settings);
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

ipcMain.handle('resize-window', (event, { width, height }) => {
  if (mainWindow) {
    mainWindow.setSize(width, height);
  }
});
