# Security & Privacy Architecture

ServerTap is designed with a strict **Local-First, Zero-Cloud** security philosophy. We understand that DevOps engineers manage highly sensitive credentials, and our architecture ensures your data never leaves your machine unless you explicitly initiate a connection.

## 🔒 Data Storage & Encryption

All server configurations, environments, and credentials are saved strictly to your local Windows User Profile (`%APPDATA%`):

- **Data File**: `%APPDATA%\servertap-devops-overlay\servers.json`
- **Absolute Path**: `C:\Users\<YourUsername>\AppData\Roaming\servertap-devops-overlay\servers.json`

### Password Encryption
*(Introduced in v2.2.2)*
Passwords and proxy credentials saved in ServerTap are AES-encrypted at rest within the `servers.json` file. This prevents raw plain-text passwords from being exposed if the file is accidentally opened or shared.

## 🚫 Zero Cloud Sync
- **No Telemetry**: ServerTap does not track your usage, IPs, or connection habits.
- **No Cloud Backups**: Your data is not sent to any external server or database. It lives purely on your local disk.

## 🤝 Safe Sharing
Because the `servers.json` configuration file is stored in your personal `%APPDATA%` profile (and outside the project repository directory), **sharing the project folder or source code with colleagues is 100% safe**. No passwords, IPs, or personal settings will be leaked.
