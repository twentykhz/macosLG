@echo off
setlocal
title MAC-WebOSTV by 20khzpc - Setup
if not exist "%~dp0MAC-WebOSTV-AutoSetup.ps1" (
  echo Missing / Thieu file MAC-WebOSTV-AutoSetup.ps1.
  echo https://github.com/twentykhz/macosLG/releases/latest
  echo Put both files in one folder / Dat hai file trong cung thu muc.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0MAC-WebOSTV-AutoSetup.ps1" -NoPause
set "taskExit=%errorlevel%"
echo.
if not "%taskExit%"=="0" echo Setup stopped / Setup da dung. Read the error above / Doc loi ben tren.
pause
exit /b %taskExit%
