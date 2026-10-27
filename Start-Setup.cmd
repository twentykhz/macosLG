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
echo TV must be unrooted for default Setup. Already rooted? Use Restore as documented.
echo https://github.com/twentykhz/macosLG/blob/main/docs/INSTALL.en.md
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0GathinTV-AutoSetup.ps1" -NoPause
set "taskExit=%errorlevel%"
echo.
if not "%taskExit%"=="0" echo Setup stopped. Keep the error above for troubleshooting.
pause
exit /b %taskExit%
