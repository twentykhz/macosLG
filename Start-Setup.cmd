@echo off
setlocal
title MAC-WebOSTV by 20khzpc - Setup
if not exist "%~dp0MAC-WebOSTV-AutoSetup.ps1" (
  echo Missing MAC-WebOSTV-AutoSetup.ps1.
  echo Download it from https://github.com/twentykhz/macosLG/releases/latest
  echo Put both files in the same folder, then try again.
  pause
  exit /b 1
)
echo MAC-WebOSTV by 20khzpc - Windows installer
echo Read the installation guide before continuing.
echo Choose the current state of your TV.
echo https://github.com/twentykhz/macosLG/blob/main/docs/INSTALL.en.md
echo.
echo [1] TV not rooted - initial Setup
echo [2] TV already rooted - Restore launcher
echo [3] Check TV features and show report
:selectMode
set "taskChoice="
set /p "taskChoice=Select 1, 2 or 3, then press Enter: "
set "taskMode="
if "%taskChoice%"=="1" set "taskMode=Setup"
if "%taskChoice%"=="2" set "taskMode=Restore"
if "%taskChoice%"=="3" set "taskMode=Doctor"
if not defined taskMode (
  echo Please enter 1, 2 or 3.
  goto selectMode
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAC-WebOSTV-AutoSetup.ps1" -Mode %taskMode% -NoPause
set "taskExit=%errorlevel%"
echo.
if not "%taskExit%"=="0" echo Setup stopped. Keep the error above for troubleshooting.
pause
exit /b %taskExit%
