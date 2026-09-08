# Task Scheduler Registration Script for ServerTap (Dynamic Drive & Directory Support)
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Registering ServerTap in Windows Task Scheduler   " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$projectDir = if ($PSScriptRoot) { $PSScriptRoot } else { "D:\projects\screen_overlay_v2" }
$vbsPath = Join-Path $projectDir "ServerTapLauncher.vbs"
$taskName = "ServerTapDevOpsTask_V2"

# Create Task Action & Trigger
$action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbsPath`"" -WorkingDirectory $projectDir
$trigger = New-ScheduledTaskTrigger -AtLogOn
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 0)

try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings | Out-Null
    Write-Host "`n[SUCCESS] Windows Task '$taskName' registered in Task Scheduler!" -ForegroundColor Green
    Write-Host "Target Directory: $projectDir" -ForegroundColor White
    Write-Host "ServerTap will start silently in the background whenever you log into Windows." -ForegroundColor White
} catch {
    Write-Host "`n[!] Registration Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Also create Startup folder shortcut for instant fallback
$startupFolder = [System.IO.Path]::Combine($env:APPDATA, 'Microsoft\Windows\Start Menu\Programs\Startup')
$shortcutPath = "$startupFolder\ServerTap_V2.lnk"
$wshShell = New-Object -ComObject WScript.Shell
$shortcut = $wshShell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"$vbsPath`""
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = "ServerTap DevOps Screen Overlay Launcher V2"
$shortcut.Save()

Write-Host "[+] Startup folder shortcut created at:" -ForegroundColor Green
Write-Host "    $shortcutPath" -ForegroundColor Yellow