# Install MAC-WebOSTV on Windows

[Home](../README.en.md) · [Tiếng Việt](README.md) · [I use Android](../android/README.en.md)

**[Download Windows 3.6.0 — MAC-WebOSTV-Windows-3.6.0.zip](https://github.com/twentykhz/macosLG/releases/download/v3.6.0/MAC-WebOSTV-Windows-3.6.0.zip)**

1. Download the ZIP and **extract all files** into one folder.
2. Turn on the TV; keep the PC and TV on the same Wi-Fi/LAN.
3. Double-click **`Start-Setup.cmd`** in the extracted folder.
4. Choose a language, then **1 — Not rooted**, **2 — Already rooted**, **3 — Check TV**, or **4 — YouTube AdFree + LGWS + rooted TV optimization**, or **5 — Rollback**.
5. Enter your TV's IP and follow setup. Unrooted TVs need **Dev Mode Status enabled**, its reboot completed, then **Key Server enabled** after reopening Developer Mode. Setup checks both services, reports readiness and offers retry. Rooted TVs use SSH without Developer Mode reinstallation.

No separate Node.js, npm or webOS CLI installation is required. Keep `Start-Setup.cmd` and `MAC-WebOSTV-AutoSetup.ps1` together; do not run inside the ZIP.

**Model/firmware are read automatically after authentication; no manual input is required.** Enter only the TV IP and Developer Mode passphrase when prompted. Setup displays the detected identity and compatibility result. Advanced manual parameters still support Enter/SKIP; `webOS22 / 7.6.0-1901` is an OS label, not firmware.

Setup installs YouTube AdFree 0.5.3, removing official/non-matching YouTube first and preserving a matching AdFree installation. Removal may require signing in again. Snapshot rollback does not restore the official YouTube package or sign-in data.

**Reported root but SSH unavailable / HOME skipped?** Enable SSH Server in Homebrew and uninstall Developer Mode before rebooting. Resume **already rooted** rather than running another exploit. HOME uses independent input checks instead of an SK8000 model restriction. [Recovery guide](../docs/HOME-ROOT-RECOVERY.md).

[Detailed prerequisites and steps](../docs/INSTALL.en.md) · [Rollback](../docs/ROLLBACK.en.md) · [Standalone PS1](https://github.com/twentykhz/macosLG/releases/download/v3.6.0/MAC-WebOSTV-AutoSetup.ps1)

Source scripts `Setup-TV.ps1` and `Restore-TV.ps1` require Node.js/dependencies and are intended for developers. Regular installation uses the ZIP above. `Wake-TV.ps1` is an optional LAN wake helper.

**Menu 4 keeps the nine primary apps and locks/closes other apps**, preserving essential system components/HDMI. [App list, reports and rollback](../docs/KEEP-NINE.md). **Menu 5: Rollback**, with local dates/timezone and newest first.
