# ServerTap - DevOps Screen Overlay Launcher 🚀

**ServerTap** is an ultra-fast, high-productivity DevOps desktop overlay manager built for **1-Tap SSH** and **Remote Desktop (RDP)** server connections. Designed specifically for DevOps engineers, sysadmins, and site reliability teams.

---

## 🌟 Key Features

- ⚡ **1-Tap Connection Launcher**: Launch SSH directly into multi-tab **Windows Terminal (`wt.exe`)** or Remote Desktop (**RDP**).
- 🔒 **Comprehensive Proxy & Tunneling**:
  - **SSH Jump Host (Bastion `-J`)**: Route connections through a reverse proxy / bastion jump host.
  - **SSH Local Port Forwarding (`-L`)**: Create background SSH port forwarding tunnels (`ssh -i key.pem -N -L localPort:targetHost:targetPort user@IP -p port`).
  - **Local SOCKS5 / HTTP Proxy**: Route SSH sessions through local proxy tunnels (`connect -S`).
- ⌨️ **Global Screen Overlay Hotkey**: Toggle overlay on/off anytime over any application (`Ctrl + Alt + S`, `Shift + Home`, `Alt + S`, `F10`).
- 📌 **Always on Top & System Tray**: Stays accessible near your Windows clock.
- 🏷️ **Environment Filtering**: Instant filtering by **Production**, **Staging**, **Tunnels**, **VPN**, and **Other**.
- 📶 **Live Latency & Ping Monitoring**: Real-time server connectivity status checks.
- 🔒 **100% Privacy & Security**: Credentials and server lists are saved strictly in your private Windows User Profile (`%APPDATA%`). Project folders contain **zero sensitive data** and can be shared safely with colleagues.

---

## 🛠️ Prerequisites & Installation

### Step 1: Prerequisites
- **Windows OS**: Windows 10 or 11.
- **Node.js (LTS)**: Download and install [Node.js (LTS version)](https://nodejs.org/) if not already installed.

### Step 2: Download / Extract Project Folder
1. Place the project folder on your desired drive (e.g. `D:\projects\screen_overlay_v2` or `E:\projects\screen_overlay`).
2. Open a terminal inside the project directory and run:
   ```bash
   npm install
   npm run build:react
   ```

---

## 🚀 How to Run & Autostart

### Option A: 1-Click Instant Run
- Double-click **`Toggle-ServerTap.bat`** (or **`ServerTapLauncher.vbs`**).
- ServerTap will launch silently into your system tray!

### Option B: Autostart via Windows Task Scheduler (Recommended)
1. Right-click **`Install-TaskScheduler.ps1`** -> Click **Run with PowerShell**.
2. ServerTap will now start silently in the background whenever you log into Windows!

---

## ⌨️ Global Hotkeys (Toggle Overlay On / Off)

Press ANY of the following hotkeys anytime to toggle the ServerTap overlay over your active screen:

- **`Ctrl + Alt + S`** *(Default)*
- **`Shift + Home`**
- **`Alt + S`**
- **`F10`**
- **`Ctrl + Space`**

---

## 📝 Step-by-Step Server Addition Guide

Click **`+ Add Server`** at the top right of the overlay interface.

### 1. Basic Server Information
- **Server Display Name**: A descriptive title (e.g. `Prod K8s Master`).
- **Hostname or IP Address**: Target server IP or FQDN (e.g. `192.168.10.31` or `db.company.com`).
- **Protocol Type**: `SSH (Linux/Unix)`, `RDP (Windows)`, or `Both`.
- **Environment**: Select `Production`, `Staging`, `Tunnels`, `VPN`, or `Other`.
- **Port**: Default is `22` for SSH, `3389` for RDP.

---

### 2. Configuring Proxy & Tunneling Options

Under **Proxy & SSH Local Tunnel (-L) Settings**, select your desired mode:

#### 🔹 Option A: Direct Connection (No Proxy)
- Select **`No Proxy (Direct Connection)`**.
- Connects directly to the server hostname/IP.

#### 🔹 Option B: SSH Jump Host / Bastion Reverse Proxy (`-J`)
Used when a server is inside a private network behind a Bastion / Jump host.
- Select **`SSH Jump Host (Bastion -J)`**.
- **Reverse Proxy / Bastion Host IP**: IP or hostname of your proxy (e.g. `192.168.15.58`).
- **Proxy Username**: Username for proxy login (e.g. `proxyuser`).
- **Proxy Port**: Default `22`.
- **Proxy Key Path**: Path to SSH key for bastion (e.g. `D:\.ssh\bastion.pem`).
- **Generated Command**: `ssh -J proxyuser@192.168.15.58 user@192.168.10.31`

#### 🔹 Option C: SSH Local Port Forwarding Tunnel (`-L`)
Used for creating background port forwarding tunnels to access remote internal services locally.
- Select **`SSH Local Tunnel (-L Port Forwarding)`**.
- **Local Forward Port (-L)**: Local loopback port on your PC (e.g. `10111`).
- **Target Bind Host**: Destination IP bound remotely (e.g. `127.0.0.1`).
- **Target Bind Port**: Destination port (e.g. `10111`).
- **Do not execute remote command (`-N`)**: Checked by default for background SSH tunnels.
- **Generated Command Example**:
  ```bash
  ssh -i "D:\.ssh\key.pem" -N -L 10111:127.0.0.1:10111 username@SERVER_IP -p 2222
  ```

#### 🔹 Option D: Local SOCKS5 / HTTP Proxy
Used when routing connections through a local proxy tool (e.g. Charles, SSH SOCKS tunnel).
- Select **`Local SOCKS5 / HTTP Proxy`**.
- **Local Proxy Address**: e.g. `127.0.0.1`.
- **Local Proxy Port**: e.g. `1080` or `8080`.

---

### 3. Credentials & Keys
- **Username**: Login user (e.g. `root`, `devops`, `ubuntu`, `Administrator`).
- **Save Password**: Save password for 1-tap clipboard auto-copy upon launch.
- **SSH Key Path**: Path to private key file (e.g. `D:\.ssh\id_rsa` or `C:\keys\prod.pem`).

---

## 🔒 Data Location & Sharing Safely

All server configurations and credentials are stored strictly in your private Windows AppData folder:

📍 **Saved Servers Path**:
`%APPDATA%\servertap-devops-overlay\servers.json`

📍 **Full Windows Path**:
`C:\Users\<YourUsername>\AppData\Roaming\servertap-devops-overlay\servers.json`

> [!IMPORTANT]
> **Sharing with Colleagues**:
> Because `servers.json` is stored in your personal `%APPDATA%` profile (outside the project folder), **sharing the project directory with colleagues is 100% safe**. No passwords, IPs, or credentials will be leaked!
