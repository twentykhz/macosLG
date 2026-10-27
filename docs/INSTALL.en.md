# Step-by-step Windows installation

[Home](../README.en.md) · [Tiếng Việt](INSTALL.vi.md) · [Using the features](FEATURES.en.md)

No Git, Node.js or npm knowledge is needed to use the installer. Follow branch A for an unrooted TV and branch B for an already-rooted TV. You do not have to factory-reset first.

## 1. Check before downloading

You need a compatible LG webOS TV, its remote, a 64-bit Windows PC and internet access. Keep the PC powered and awake during installation. The TV and PC must be on the same home network; guest Wi-Fi may block device-to-device access.

**Reference profile:** LG 55SK8000PTA / firmware 05.50.70 / SDK 4.4.0 / M16PP_DVB_EU / ARM32. Already-rooted TVs using Restore 3.2.0 or later are capability-checked rather than blocked by model name. Individual features still depend on hardware/APIs. Not every unrooted TV can use the bundled root procedure. On the TV, look under Settings → All Settings → General → About This TV; menu names vary. Record model and software version. If unsure, ask in [Issues](https://github.com/twentykhz/macosLG/issues) first; do not edit the profile to force installation.

Root provides administrator access for custom software. This installer includes a rooting sequence for compatible profiles and is not an official LG application. Do not unplug the TV while installation is running. Record any error and stop rather than repeatedly retrying an exploit.

## 2. Download the correct files

1. Open the [latest release](https://github.com/twentykhz/macosLG/releases/latest).
2. Expand **Assets** if necessary.
3. Download **`GathinTV-AutoSetup.ps1`**. This is the installer; GitHub's automatic `Source code (zip)` is not the installer.
4. Also download **`Start-Setup.cmd`** for double-click launching.
5. Make a folder such as `Desktop\GathinTV` and put both files there, without renaming them.
6. Do not unzip the PS1 file. The source ZIP is optional and intended for reading/development.

In File Explorer, View → Show → File name extensions helps you check that the file has not become `.ps1.txt`.

If Windows blocks a downloaded file, first verify it came from this repository's release. Open its Properties, select Unblock if present, then Apply. For other security notices, check the source and message instead of disabling protection across the computer.

## 3. Choose your TV's starting state

| Your TV | Next step |
|---|---|
| Never rooted, or factory reset removed root | [Branch A](#branch-a-unrooted-tv) |
| Already rooted, working root SSH/Homebrew | [Branch B](#already-rooted-tv) |
| Unsure | Check/ask first; do not reinstall Developer Mode on a rooted TV |

## Branch A: unrooted TV

### A1. Prepare an LG Developer account

1. On your PC or phone, open [LG's webOS TV Developer website](https://webostv.developer.lge.com/).
2. Select **SIGN IN**. Register if necessary, verify your email and complete LG's required steps.
3. Keep the account email/password available for the Developer Mode app on the TV. This is not your GitHub account.

### A2. Install Developer Mode on the TV

1. Connect the TV to your network and check that its date/time are reasonable.
2. Open **LG Content Store / Apps**.
3. Search for LG's **Developer Mode** application and install it.
4. Open it and sign in with your LG Developer account.

### A3. Enable Dev Mode Status, then Key Server

1. Turn **Dev Mode Status** on in the application.
2. Accept the TV's restart request and wait for it to finish.
3. Open Developer Mode again after the restart.
4. Turn **Key Server** on. Enabling Dev Mode Status alone is not sufficient for the PC connection.
5. **Privately record the TV's IP address and six-character passphrase shown on the screen.** The passphrase is case-sensitive; do not post this screen publicly.

These steps follow [LG's official documentation](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app). You do not need to run the separate LG CLI commands from that page; AutoSetup handles its connection steps.

### A4. Run AutoSetup

1. On the PC, open the folder containing the downloaded files.
2. Double-click **`Start-Setup.cmd`** and choose **1** for an unrooted TV. It launches `GathinTV-AutoSetup.ps1` from the same folder.
3. When asked for **TV IP address**, enter the TV's recorded address and press Enter. Do not use the PC's or router's address.
4. When asked for the passphrase, enter the exact **six Developer Mode characters for this TV**, then Enter. Characters/stars may not appear as you type; this is normal.
5. On the first connection, the installer asks you to verify the TV IP and type **YES** or **yes** to accept a new SSH host key. Only type YES after checking the address on your own TV. A key change after a reset must be verified again.
6. Let the script run. It may download a pinned portable Node.js runtime if necessary and verifies its checksum.
7. The TV may restart at installation stages. Wait for the installer to reconnect; do not launch another copy of the installer.
8. The root sequence handles removing Developer Mode at the required stage. Do not reinstall it after rooting succeeds.

Without the CMD file: in File Explorer's address bar type `powershell`, press Enter, then run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1
```

The installer asks for the address; you do not edit passwords into the PS1. To supply an address explicitly, replace this example with your TV's real address:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -HostName 192.168.1.100
```

`192.168.1.100` is only an example. Do not use `-TrustNewHost` without verifying the device/host key. If an error occurs, keep the window open and record the message with private details hidden; do not repeatedly rerun it.

## Already-rooted TV

**Do not reinstall Developer Mode on an already-rooted TV.** [webOS Homebrew explains](https://www.webosbrew.org/pages/sdk-configuration) that this can break the root setup. Use Restore to install/update the interface rather than replaying the initial rooting sequence.

1. Keep the TV and PC on the same LAN and record the TV's current IP.
2. Prepare this TV's root SSH private key or root password. **The Developer Mode passphrase is not the root SSH password.**
3. Open PowerShell in the installer folder, as described in A4.
4. Replace the example address and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.100
```

To select a private key if it is not found automatically:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.100 -RootKeyPath "C:\YourFolder\this-tv-private-key.pem"
```

Replace both the address and path. If password authentication is used, enter the TV's root password when asked. Do not put it in the command line or public documentation.

## 4. After installation

1. Wait for the completion message, the TV's restart and the launcher to appear.
2. Try HOME, the dock and Action Center with the remote. Some app tiles only appear when their apps are installed.
3. Open **Action Center → Điều khiển từ xa & Thiết lập** (Remote Control & Settings), scan the QR with your phone camera and open the link.
4. On the same LAN, use the web remote, wallpapers and weather settings. The PC does not need to stay on while the TV-hosted page is running.
5. Install/sign in to FPT Play, TV360 or Netflix if wanted. The installer supplies neither accounts nor subscriptions.
6. Keep the installer's keys/backups private. PC state is stored under `%LOCALAPPDATA%\GathinTV` by default; do not share this folder.

The launcher interface currently uses Vietnamese. Installer/system messages may be in English. See the [feature guide](FEATURES.en.md) for translated labels and daily use.

## 5. Prepare, inspect, back up, open the store and disable customizations

Replace the example IP in each command. Run from the installer folder.

```powershell
# Check the PC package only; no TV connection
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Prepare

# Read TV status without reinstalling
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Doctor -HostName 192.168.1.100

# Make a private backup
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Backup -HostName 192.168.1.100

# Open the store through the supported flow; Sync after installing apps
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Apps -HostName 192.168.1.100
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Sync -HostName 192.168.1.100

# Disable custom services/hooks without unrooting or resetting
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Disable -HostName 192.168.1.100
```

Use Restore to enable the setup again after Disable. A backup is private data, potentially including personal images/settings, not an installer to redistribute. Keep the private key if you want to reconnect with it.

## Restore on other models from 3.2.0

Already-rooted TVs are no longer rejected merely for differing model/board names. COMPATIBILITY REPORT lists Node.js, Python, HOME relay, Voice Agent and YouTube capabilities. Failed/missing remote-channel probes retain native HOME; missing Node.js skips web services; voice requires Python 2, a compatible Voice Agent and YouTube AdFree 0.5.3. Reference-only debloat/privacy is skipped. This compatible Restore branch runs no exploit or forced reboot.

For Wrong TV on 3.1.x, download AutoSetup **3.2.0 or later** from Releases and run the new file. Do not force-edit config/profile.json.

## Troubleshooting

| Symptom | What to check |
|---|---|
| PS1 opens Notepad | Use `Start-Setup.cmd` or the PowerShell command; do not change the extension |
| Cannot find the installer | Open Releases → Assets, not Code → Download ZIP |
| Connection timed out | TV on? Correct IP? Same LAN? Guest network isolation? |
| Incorrect passphrase | On the unrooted TV, enable Key Server and recheck all six case-sensitive characters |
| Root authentication failed | Use the root key/password, not LG account credentials or Developer Mode passphrase |
| Wrong TV/hardware/ABI/untested firmware | Stop and report model, firmware and error; do not force the profile |
| QR page unavailable | TV must be on, phone on the LAN, IP unchanged; rescan after restarting if needed |
| Missing FPT/TV360/Netflix | Install/sign in separately, then Sync |
| Script/checksum error | Download the files from the same release again; do not mix versions |

For issues, include model/firmware, Windows version, step and exact error. Hide passphrases, QR codes, tokens, passwords, accounts and private keys.
