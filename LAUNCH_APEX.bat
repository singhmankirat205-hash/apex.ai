@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File "%~dp0launch.ps1"
exit
