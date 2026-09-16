<div align="center">
  <h1>🚀 ServerTap</h1>
  <p><b>Ultra-fast DevOps Screen Overlay Launcher for 1-Tap SSH & RDP Connections</b></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Platform](https://img.shields.io/badge/Platform-Windows-blue)](https://microsoft.com/windows)
</div>

## 📖 Overview

**ServerTap** is a high-productivity desktop overlay manager designed for DevOps engineers, System Administrators, and SREs. It provides instant, global access to your server infrastructure with comprehensive support for SSH tunneling, jump hosts, and Remote Desktop (RDP). 

Instead of juggling multiple terminal windows and credential managers, hit a global hotkey to bring up your infrastructure, and connect with a single tap.

## ✨ Key Features

- **⚡ 1-Tap Connections**: Launch SSH directly into a multi-tab Windows Terminal (`wt.exe`) or trigger native RDP sessions.
- **🔒 Advanced Tunneling**: Comprehensive native support for:
  - SSH Jump Hosts / Bastions (`-J`)
  - Local Port Forwarding background tunnels (`-L`)
  - SOCKS5 / HTTP Local Proxies
- **⌨️ Global Hotkeys**: Instantly toggle the overlay over any application using customizable shortcuts (e.g., `Ctrl + Alt + S`).
- **🛡️ Secure by Design**: 100% local. Zero cloud sync. Passwords and proxy credentials are encrypted and stored solely in your local `%APPDATA%` profile.
- **🏷️ Environment Filtering**: Group and instantly filter servers by Production, Staging, VPN, Tunnels, and more.

## 🚀 Getting Started

### Prerequisites
- **Windows OS**: Windows 10 or 11
- **Node.js**: v18+ (for development builds)

### Installation

1. **Clone & Install Dependencies**
   ```bash
   git clone https://github.com/grgspjr/servertap-overlay.git
   cd servertap-overlay
   npm install
   ```

2. **Build the Frontend**
   ```bash
   npm run build:react
   ```

3. **Start the App**
   ```bash
   npm run dev
   ```

*To build a distributable Windows `.exe` installer:*
```bash
npm run build
```

## 📘 Documentation

For detailed guides on configuring advanced tunneling and understanding our security model, please refer to the documentation:

- [Server Setup & Configuration Guide](docs/SERVER_SETUP.md)
- [Security & Privacy Architecture](docs/SECURITY.md)

## 🛠️ Autostart (Windows Task Scheduler)

For the best experience, ServerTap should run in the background on startup:
1. Right-click **`Install-TaskScheduler.ps1`**
2. Click **Run with PowerShell**

*ServerTap will now start silently in your system tray whenever you log into Windows.*

## 🧑‍💻 Tech Stack

- **Framework**: Electron, React 18
- **Styling**: Tailwind CSS
- **Build Tooling**: Vite, Electron Builder

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
