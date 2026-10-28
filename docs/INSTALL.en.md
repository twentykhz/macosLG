# Install MAC-WebOSTV by 20khzpc on Windows

[Home](../README.en.md) · [Tiếng Việt](INSTALL.vi.md) · [Features](FEATURES.en.md)

The updated **3.3.0** installer includes installation branches and feature checks. Double-click `Start-Setup.cmd`, select your TV's state, and follow the prompts. **Already-rooted TVs do not require a manual Restore command, Developer Mode installation or a factory reset.**

## 1. Download and start

1. Open [release 3.3.0](https://github.com/twentykhz/macosLG/releases/tag/v3.3.0) and expand **Assets**.
2. Download **`MAC-WebOSTV-AutoSetup.ps1`** and **`Start-Setup.cmd`** into the same folder, for example `Desktop\MAC-WebOSTV`. **Download both again** if you previously downloaded 3.3.0: this release has been updated in place.
3. Do not rename or unpack the PS1 file. GitHub's automatic Source code ZIP, Node.js, npm and the webOS CLI are not required.
4. Turn on the TV. Connect it and a 64-bit Windows PC to the same LAN; avoid isolated guest Wi-Fi. Keep the PC awake during installation.
5. If Windows blocks a downloaded file, verify that it came from this repository, then use **Properties → Unblock → Apply**, if available. Do not disable protection for the entire PC.
6. Double-click **`Start-Setup.cmd`** and keep its window open.

## 2. Choose the right branch

| Menu choice | Use when | Instructions |
|---|---|---|
| **1 — TV not rooted** | TV is unrooted or has lost root | [Branch A](#branch-a) |
| **2 — TV already rooted** | Root SSH is available | [Branch B](#branch-b) |
| **3 — Check TV features and show report** | Check an installed TV without reinstalling | [Branch C](#branch-c) |

Choose before entering an IP. Setup still verifies actual root access after authentication. If unsure, check Homebrew or ask whoever rooted the TV; do not install Developer Mode on an already-rooted TV.

<a id="branch-a"></a>
## Branch A — Unrooted TV

The current rooting path is restricted to the supported profile: **LG 55SK8000PTA / firmware 05.50.70 / M16PP_DVB_EU / SDK 4.4.0 / ARM32**. This is not a universal LG rooting method. Do not edit the profile to bypass a refusal. Record the model, firmware and error for [Issues](https://github.com/twentykhz/macosLG/issues).

On an unrooted TV only:

1. Register at [LG webOS TV Developer](https://webostv.developer.lge.com/) and complete email verification if required.
2. Open **LG Content Store / Apps** on the TV and install LG's **Developer Mode** app.
3. Sign in, enable **Dev Mode Status**, approve the restart and wait for the TV to return.
4. Reopen Developer Mode and enable **Key Server**.
5. Record **this TV's IP and six-character passphrase**. The passphrase is case-sensitive and differs from your LG account password. Do not publish it.
6. On the PC run `Start-Setup.cmd`, choose **1**, and enter the **TV's** IP.
7. Verify the target address before accepting its first SSH host key with **YES/yes**. Enter the Developer Mode passphrase when prompted; hidden password input is normal.
8. Wait through the supported installation/reconnection steps. Do not run a second installer or disconnect power. Setup handles Developer Mode removal where required; do not reinstall it after rooting.
9. Read the feature report in the setup window.

[Official Developer Mode instructions](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app). You do not need to run the CLI commands on LG's page yourself.

<a id="branch-b"></a>
## Branch B — Already-rooted TV

**Skip branch A. Do not reinstall Developer Mode or use its passphrase.** Use this TV's root SSH password or private key. See the [webOS Homebrew guidance](https://www.webosbrew.org/pages/sdk-configuration).

1. Turn on the TV and record its current IP from network settings. Keep the TV and PC on the same LAN.
2. Put the two downloaded files in one folder.
3. Double-click **`Start-Setup.cmd`**, select **2 — TV already rooted**.
4. Enter the **TV IP** when prompted.
5. Verify the address and confirm **YES/yes** if this is the first connection.
6. Setup uses a saved SSH key or a key supplied with `-RootKeyPath` when available. Without a key, it **automatically tries the default root password `alpine`**. If accepted, setup continues without prompting. Only an authentication rejection asks for this TV's own root SSH password, with hidden input. Passwords are not saved to configuration or logs. Do not enter an LG account password or Developer Mode passphrase. Supplied keys are cached privately only after successful authentication and are never bundled in shared downloads.
7. Wait while setup verifies root, backs up existing files and installs/updates compatible components. **No manual Restore command is needed.**
8. Read the feature report in the same window; it stays open until you dismiss it.

Rooted installation detects capabilities instead of requiring the reference model name. Node.js, Python, input and API requirements are checked separately. Unavailable HOME/voice capabilities are reported; launcher installation does not prove every feature works. The compatibility Restore branch does not replay an exploit or force a reboot.

Only if you need to supply an external SSH key that setup has not saved, see [advanced options](#advanced).

<a id="branch-c"></a>
## Branch C — Feature report inside setup

1. Run **`Start-Setup.cmd`**, select **3 — Check TV features and show report**.
2. Enter the IP, verify a new host key if required, and authenticate with root SSH as in branch B.
3. Setup checks root, registered apps, remote/settings HTTP servers, one screen capture, audio, brightness/picture, network and Bluetooth APIs.
4. Detailed results appear directly in the window. JSON/TXT report paths are also printed.

| Status | Meaning |
|---|---|
| **OK / PRESENT / INSTALLED** — green | That specific probe passed or the app is registered |
| **CHECK** — red | Read the error on that line; do not treat it as passed |
| **MANUAL** — yellow | Physical operation has not been verified; test it on the TV |

Branch 3 does not reinstall the launcher, inject keys or power-cycle the TV. It captures one test frame and deletes the temporary file, and may generate PC wake scripts from the TV's network details. Home/Back, navigation, mouse, voice, power and Wake-on-LAN still require physical checks. A successful single capture does not prove sustained stream FPS.

Reports normally live under `%LOCALAPPDATA%\MAC-WebOSTV\state\feature-reports`. Upgrades may retain the older data folder to preserve SSH keys; **use the actual path printed in the report**. Do not share the entire private state folder.

## 3. After installation

1. Test Home/Back, dock apps, widgets and Control Center.
2. Open **Trung tâm điều khiển → Điều khiển từ xa & Thiết lập**, scan the QR from another LAN device.
3. The TV hosts the remote page; the setup PC does not need to remain on while the TV is awake. Try navigation, audio, streaming and screenshot download.
4. Open **Hình nền & vị trí thời tiết** to configure wallpapers/crop/slideshow, two weather locations and family members. Save family changes, then reopen the TV calendar.
5. LGWS declares root/Homebrew and webOS 5+ requirements. If installation fails, read the report and [Homebrew fallback instructions](CHANGELOG-v3.3.0.md). Setup does not enable voice/ThinQ blocking on another TV.
6. Install/sign in to FPT Play, TV360 and Netflix separately if wanted. No subscriptions/accounts are supplied.
7. For WoL, enable Mobile TV On / Wi-Fi or LAN wake if supported, keep mains power connected and run the generated Wake-TV script from **another LAN device**. A sleeping TV cannot host its wake page. See [post-install checks](CHANGELOG-v3.3.0.md).

## Troubleshooting

| Symptom | Check |
|---|---|
| PS1 opens in Notepad | Double-click `Start-Setup.cmd` |
| CMD says a file is missing | Download the new PS1 and CMD into the same folder |
| Connection timed out | TV awake, correct IP, same LAN, no guest isolation |
| Authentication failed in 2/3 | Use this TV's root SSH credentials, not Developer Mode credentials |
| Wrong TV in an older installer | Download both updated 3.3.0 files and choose 2; do not bypass profiles |
| Unsupported ABI/Node/API | Read the report and include model/firmware when asking for help |
| Device or resource busy | Stop other capture/stream sessions and check the capture report |
| QR cannot open | TV awake, same LAN; rescan if its IP changed |
| Checksum mismatch | Redownload matching assets from this release |

For issues, include model, firmware, menu choice 1/2/3 and the relevant error. Hide passphrases, QR/tokens, passwords and private keys.

<a id="advanced"></a>
## Advanced options — optional

<details>
<summary>Only for an external SSH key, backups or administration</summary>

Open PowerShell in the installer folder and replace the sample IP/path:

```powershell
# Only when an unsaved external key must be selected
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.100 -RootKeyPath "C:\MyKeys\tv.pem"

# Verify PC package without connecting to the TV
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Prepare

# Private backup
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Backup -HostName 192.168.1.100

# Resync installed tiles
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Sync -HostName 192.168.1.100

# Disable custom services without unrooting or resetting
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Disable -HostName 192.168.1.100
```

After Disable, run CMD and choose 2 to restore. Keep backups private.

</details>
