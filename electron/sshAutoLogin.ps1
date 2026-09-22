# ServerTap SSH Hands-Free Auto-Login Assistant
param(
    [string]$windowTitle = "",
    [string]$serverHost = "",
    [string]$proxyPassword = "",
    [string]$targetPassword = "",
    [string]$keyPassphrase = "",
    [int]$proxyDelayMs = 1000,
    [int]$targetDelayMs = 3500
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

function Send-EscapedKeys {
    param([string]$text)
    if ([string]::IsNullOrEmpty($text)) { return }
    
    # Escape SendKeys reserved characters: + ^ % ~ ( ) { } [ ]
    $escaped = ""
    foreach ($char in $text.ToCharArray()) {
        $c = [string]$char
        if ("+^%~(){}[]".Contains($c)) {
            $escaped += "{$c}"
        } else {
            $escaped += $c
        }
    }
    [System.Windows.Forms.SendKeys]::SendWait($escaped)
}

function Paste-Password {
    param([string]$pwd, [string]$title, [string]$hostName)
    if ([string]::IsNullOrWhiteSpace($pwd)) { return }
    
    # Try focusing terminal window (up to 8 retries)
    for ($i = 0; $i -lt 8; $i++) {
        $focused = Focus-Terminal -title $title -hostName $hostName
        if ($focused) { break }
        Start-Sleep -Milliseconds 250
    }
    
    Start-Sleep -Milliseconds 250

    try {
        [System.Windows.Forms.Clipboard]::SetText($pwd)
        Start-Sleep -Milliseconds 150
        [System.Windows.Forms.SendKeys]::SendWait("^v")
        Start-Sleep -Milliseconds 150
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    } catch {
        # Fallback typing with reserved character escaping
        Send-EscapedKeys -text $pwd
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    } finally {
        # Clear sensitive password from clipboard after paste
        Start-Sleep -Milliseconds 500
        try { [System.Windows.Forms.Clipboard]::Clear() } catch {}
    }
}

# 1. Handle Proxy / Bastion Password (Prompt 1)
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
