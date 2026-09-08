@echo off
title Stop ServerTap
taskkill /F /IM electron.exe 2>nul
echo ServerTap has been stopped.
timeout /t 2 >nul
