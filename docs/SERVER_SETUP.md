# Server Setup & Configuration Guide

This guide covers how to add and configure servers in ServerTap, including advanced proxy and tunneling options.

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

## ⌨️ Global Hotkeys

Press ANY of the following hotkeys anytime to toggle the ServerTap overlay over your active screen:
- **`Ctrl + Alt + S`** *(Default)*
- **`Shift + Home`**
- **`Alt + S`**
- **`F10`**
- **`Ctrl + Space`**
