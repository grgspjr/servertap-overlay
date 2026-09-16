# ServerTap SSH Hands-Free Auto-Login Assistant
param(
    [string]$windowTitle = "",
    [string]$serverHost = "",
    [string]$proxyPassword = "",
    [string]$targetPassword = "",
    [string]$keyPassphrase = "",
    [int]$proxyDelayMs = 800,
    [int]$targetDelayMs = 2200
)

Add-Type -AssemblyName System.Windows.Forms
$wshell = New-Object -ComObject WScript.Shell

function Focus-Terminal {
    param([string]$title, [string]$hostName)
    
    $candidates = @($title, $hostName, "Windows Terminal", "cmd.exe", "Command Prompt", "SSH")
    foreach ($c in $candidates) {
        if (-not [string]::IsNullOrWhiteSpace($c)) {
            $ok = $wshell.AppActivate($c)
            if ($ok) { return $true }
        }
    }
    return $false
}

function Paste-Password {
    param([string]$pwd, [string]$title, [string]$hostName)
    if ([string]::IsNullOrWhiteSpace($pwd)) { return }
    
    # Try focusing terminal window
    for ($i = 0; $i -lt 6; $i++) {
        $focused = Focus-Terminal -title $title -hostName $hostName
        if ($focused) { break }
        Start-Sleep -Milliseconds 250
    }
    
    Start-Sleep -Milliseconds 200

    try {
        [System.Windows.Forms.Clipboard]::SetText($pwd)
        Start-Sleep -Milliseconds 150
        [System.Windows.Forms.SendKeys]::SendWait("^v")
        Start-Sleep -Milliseconds 150
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    } catch {
        # Fallback typing character-by-character
        foreach ($char in $pwd.ToCharArray()) {
            [System.Windows.Forms.SendKeys]::SendWait([string]$char)
        }
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    }
}

# 1. Handle Proxy Password (Prompt 1)
if (-not [string]::IsNullOrWhiteSpace($proxyPassword)) {
    Start-Sleep -Milliseconds $proxyDelayMs
    Paste-Password -pwd $proxyPassword -title $windowTitle -hostName $serverHost
}

# 2. Handle Key Passphrase (Prompt for encrypted SSH private keys)
if (-not [string]::IsNullOrWhiteSpace($keyPassphrase)) {
    $delay = if (-not [string]::IsNullOrWhiteSpace($proxyPassword)) { $targetDelayMs } else { $proxyDelayMs }
    Start-Sleep -Milliseconds $delay
    Paste-Password -pwd $keyPassphrase -title $windowTitle -hostName $serverHost
}

# 3. Handle Target Server Password (Prompt 2)
if (-not [string]::IsNullOrWhiteSpace($targetPassword)) {
    $delay = if (-not [string]::IsNullOrWhiteSpace($proxyPassword) -or -not [string]::IsNullOrWhiteSpace($keyPassphrase)) { $targetDelayMs } else { $proxyDelayMs }
    Start-Sleep -Milliseconds $delay
    Paste-Password -pwd $targetPassword -title $windowTitle -hostName $serverHost
}
