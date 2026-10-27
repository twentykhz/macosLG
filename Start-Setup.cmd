@echo off
setlocal
title GathinTV Setup
if not exist "%~dp0GathinTV-AutoSetup.ps1" (
  echo Missing GathinTV-AutoSetup.ps1.
  echo Download it from https://github.com/twentykhz/macosLG/releases/latest
  echo Put both files in the same folder, then try again.
  pause
  exit /b 1
)
echo GathinTV - Windows installer
echo Read the installation guide before continuing.
echo Choose the current state of your TV.
echo https://github.com/twentykhz/macosLG/blob/main/docs/INSTALL.en.md
echo.
echo [1] TV not rooted - initial Setup
echo [2] TV already rooted - Restore launcher
choice /c 12 /n /m "Select 1 or 2: "
set "taskMode=Setup"
if errorlevel 2 set "taskMode=Restore"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0GathinTV-AutoSetup.ps1" -Mode %taskMode% -NoPause
set "taskExit=%errorlevel%"
echo.
if not "%taskExit%"=="0" echo Setup stopped. Keep the error above for troubleshooting.
pause
exit /b %taskExit%
