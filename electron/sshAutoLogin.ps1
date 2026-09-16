# ServerTap SSH Hands-Free Auto-Login Assistant
param(
    [string]$proxyPassword = "",
    [string]$targetPassword = "",
    [int]$proxyDelayMs = 1200,
    [int]$targetDelayMs = 2500
)

Add-Type -AssemblyName System.Windows.Forms

# Function to safely paste via clipboard and press Enter
function Paste-Password {
    param([string]$pwd)
    if ([string]::IsNullOrWhiteSpace($pwd)) { return }
    
    try {
        [System.Windows.Forms.Clipboard]::SetText($pwd)
        Start-Sleep -Milliseconds 150
        [System.Windows.Forms.SendKeys]::SendWait("^v")
        Start-Sleep -Milliseconds 150
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    } catch {
        # Fallback if clipboard lock occurs
    }
}

# 1. Handle Proxy Password (Prompt 1)
if (-not [string]::IsNullOrWhiteSpace($proxyPassword)) {
    Start-Sleep -Milliseconds $proxyDelayMs
    Paste-Password -pwd $proxyPassword
}

# 2. Handle Target Server Password (Prompt 2)
if (-not [string]::IsNullOrWhiteSpace($targetPassword)) {
    $delay = if (-not [string]::IsNullOrWhiteSpace($proxyPassword)) { $targetDelayMs } else { $proxyDelayMs }
    Start-Sleep -Milliseconds $delay
    Paste-Password -pwd $targetPassword
}
