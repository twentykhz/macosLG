# MAC-WebOSTV by 20khzpc

**3.4.1:** rooted compatibility installation, snapshot/rollback, upload verification and portable Luna controls/HDMI no longer require Python. Windows and Android/Termux share the same Node core. [Audit and requirements](docs/PYTHON-COMPATIBILITY.md).

## Compatibility with newer rooted LG TVs

The hardware-tested reference remains **55SK8000PTA / M16PP_DVB_EU / 05.50.70**. Rooted TVs outside the reference profile use conservative capability-based installation. Unsupported model-specific features are skipped rather than forced.

An early, cached, read-only capability probe selects working tools before backup and provisioning. Supported TV Node >=0.12 provides filesystem recovery and portable controls, HDMI learning, wallpaper and remote services. Host Node still requires >=20. SHA-256, tar and verified rollback are mandatory before managed installation. A minimal shell/tar TV without Node/Python can export a backup; installation is blocked until a safe rollback engine exists. No Python installation, alias or cross-architecture binary copying is performed.

**OLED65C2PSA / O22_DVB_AJ / 33.31.68 / SDK 10.3.1** has regression fixtures covering no-Python Setup, injected failure and rollback. It is **not yet hardware-validated after this patch**. Luna API availability determines controls support. Native HOME interception, Python2 voice routing, reference QML/input changes and SK8000 tuning are skipped; native LG HOME/microphone behavior is retained. The pinned ARM32 Homebrew IPK is never auto-deployed on aarch64; an existing installation is preserved.

Start with `./GathinTV-AutoSetup.sh --mode Doctor --host TV_IP --trust-new-host`, then `--mode Restore` for a rooted TV. Windows equivalents use `.\MAC-WebOSTV-AutoSetup.ps1 -Mode Doctor -HostName TV_IP -TrustNewHost` and `-Mode Restore`. Confirm your TV IP/fingerprint before trusting a new host. Doctor remains read-only. Failed Setup/Restore offers `YES/CO` recovery using that run's original snapshot, with model/firmware/host identity checks. [3.4.1 changes](docs/CHANGELOG-v3.4.1.md).

Install and manage from **Windows or Android/Termux, Linux and macOS**, using the same Node core. Windows keeps `MAC-WebOSTV-AutoSetup.ps1`; POSIX hosts use `GathinTV-AutoSetup.sh` and system Node >=20. [Android/Linux instructions](docs/ANDROID.en.md).

## Android / Termux installation

```bash
pkg update
pkg install nodejs git curl
termux-setup-storage # optional shared Downloads access
curl -fsSL https://raw.githubusercontent.com/twentykhz/macosLG/main/install-android.sh | bash
```

The bootstrap verifies a pinned release checksum before execution. Reopen with `cd "$HOME/.gathintv"` and run `./GathinTV-AutoSetup.sh`. Check first with `./GathinTV-AutoSetup.sh --mode Doctor --host TV_IP`; add `--trust-new-host` only after checking your TV's IP. Doctor needs root SSH and does not change the TV. Use `--mode Restore` for rooted TVs, `--mode Setup` for fresh setup and `--mode Backup` for an owner backup. No Windows computer or OpenSSH binary is required. Keep phone and TV on the same LAN; model/firmware compatibility still applies. [Commands, storage fallback, flags and safety](docs/ANDROID.en.md).

**3.4.0 installation recovery:** authenticated service checks precede HOME activation. On failure, answer `YES/CO` to restore the first snapshot from that run. [Reported screenshot, diagnosis and recovery scope](docs/diagnostics/RECOVERY.md).

[View all 19 feature screenshots](README.md#ảnh-preview-từng-tính-năng): launcher, adaptive HDMI, controls, weather, calendar, desktop/mobile remote, wallpaper cropping and family settings. The previews use sample data; [capture details](docs/screenshots/README.md).

**3.4.0:** The TV shortcut learns the HDMI port with the most viewing time. Before history exists, it opens the input picker. Explicit HDMI selections stay unchanged.

**Updated 3.3.0 installer:** redownload MAC-WebOSTV-AutoSetup.ps1 and Start-Setup.cmd. Run CMD: choose **1** for unrooted setup, **2** for rooted installation, or **3** for an inline feature report. [Branch-by-branch guide](docs/INSTALL.en.md).

**Version 3.3.0:** adaptive dock, editable family members, LGWS installation and feature reports. [Changes and post-install steps](docs/CHANGELOG-v3.3.0.md).

[Tiếng Việt](README.md) | **English**

A macOS-inspired home screen for compatible, rooted LG webOS TVs. Windows and POSIX wrappers install the launcher and its supporting services through the same Node core. The complete launcher source is available in this repository.

![Launcher preview](preview.jpg)

**Tested reference TV:** LG 55SK8000PTA, firmware 05.50.70, webOS SDK 4.4.0, M16PP_DVB_EU, ARM32/Python 2. Rooted installation detects available capabilities instead of requiring the reference model. Unrooted setup checks exact model/firmware eligibility using live CanI.RootMy.TV data, prefers faultmanager and guides compatible fallback methods if needed. Unsupported features are reported and reference-only tuning is not transplanted. A clean installation on a second TV has not yet been validated.

Choose **English** or **Tieng Viet khong dau** in setup. First-connection confirmation accepts `YES` or `CO`, case-insensitively. [Rootability results, fallback instructions and log locations](docs/ROOTING-METHODS.md).

## Start here

| What you want | Where to go |
|---|---|
| Install it without learning programming | [Step-by-step installation guide](docs/INSTALL.en.md) |
| Download the Windows installer | [Latest release](https://github.com/twentykhz/macosLG/releases/latest) |
| Install from Android/Termux, Linux or macOS | [Shell installer guide](docs/ANDROID.en.md) |
| Understand every feature | [Feature guide](docs/FEATURES.en.md) |
| Read or change the source | [Developer/source guide](docs/DEVELOPMENT.en.md) · [Launcher files](payload/app) |
| Find out what was checked | [Validation notes](docs/VALIDATION.md) |

**Regular users do not need to download this whole repository.** From the latest release, download `MAC-WebOSTV-AutoSetup.ps1` and, for easier launching, `Start-Setup.cmd`. Put both in the same folder. You do not need the source ZIP, npm or a separately installed webOS CLI to run the installer.

Already rooted? Do not reinstall Developer Mode; follow the [already-rooted instructions](docs/INSTALL.en.md#already-rooted-tv). For an unrooted TV, the guide walks through the LG Developer account, installing Developer Mode, enabling Dev Mode Status, rebooting, and enabling Key Server.

## Before you begin

Write down **your TV's IP address** and **the six-character Developer Mode passphrase**. The passphrase is case-sensitive and is not your LG account password or the root SSH password. Never copy another TV's credentials or publish them in an issue. The installer asks for them when needed; you do not edit passwords into the script.

The TV and installer host (Windows PC, Android phone or POSIX computer) must be on the same home network. Rooting and HOME/voice integration change how the TV operates; compatibility checks remain enabled. You do not have to factory-reset a working rooted TV to update this launcher.

## What you get

| Feature | What it does |
|---|---|
| Glass-style home screen | Large clock/date, translucent neutral panels, readable text and focus highlights |
| Adaptive centered dock | Compact when idle; names appear while navigating; slight zoom instead of an extra selection box |
| System controls | Inputs, Action Center, Settings and a small power/restart menu |
| Combined weather widget | Two locations together; click for hourly and roughly ten-day forecasts with two location tabs |
| Vietnamese lunar calendar | Lunar date, can chi, traditional day/hour indicators and family-specific suggestions in the detailed calendar |
| Voice widget | Opens the configured LG Voice Agent for supported device commands and YouTube AdFree searches |
| Wallpaper manager | Multiple original images, crop/display positioning, saved gallery and 5–60 second slideshow with fade |
| TV-hosted remote | Scan the Action Center QR from a phone/PC in the LAN; no PC server required while the TV is on |
| Screen viewing | On-demand JPEG frames at 360p, 480p, 720p or 1080p; not an audio/video stream at guaranteed FPS |
| Screenshot download | Original 1920×1080 PNG downloaded through your browser |
| Cleanup and loading policy | Temporary stream images removed, old browser frame URLs released, detailed forecasts loaded only when opened |

Starting with **3.1.1**, the launcher and AutoSetup use **SF Pro** as on the reference TV, with Inter retained as a fallback. SF Pro is an Apple third-party font and is not relicensed under this project's MIT license. App icons do not include paid subscriptions; install/sign in to FPT Play, TV360 or Netflix separately if desired.

Voice depends on LG services, language/consent/network availability and a compatible Magic Remote microphone. Pointer control works in the launcher and compatible web apps, not every native screen. Protected video may appear black. Lunar-calendar advice follows traditional conventions, not a guarantee of outcomes.

## Daily use

Open **Action Center → Remote Control & Settings** on the TV (the UI label is currently Vietnamese: **Điều khiển từ xa & Thiết lập**) and scan its QR. Remote navigation, screenshot download, wallpaper upload and weather location settings are available there. Each TV creates its own access key and QR; the default family members are editable examples, not the owner's family data.

When the TV is in standby its web page is offline. Another powered-on device in the home LAN must send Wake-on-LAN if you want to wake it. Access away from home additionally needs a configured VPN/subnet router or always-on relay; the installer does not publish the TV to the internet. [Details](docs/FEATURES.en.md#wake-on-lan-and-access-away-from-home).

## Repository versus release downloads

- **Repository:** readable source, configuration, build scripts, tests and documentation. Use `MAC-WebOSTV-Source` when maintaining this repository.
- **GitHub Releases:** generated one-file installer and optional source ZIP/checksums. Use `MAC-WebOSTV-Release` for release assets, not as a replacement for the repository source tree.

Do not upload `.local`, `node_modules`, SSH private keys, access keys, passphrases or personal backups. See [source/build instructions](docs/DEVELOPMENT.en.md).

## Getting help

[Open an issue](https://github.com/twentykhz/macosLG/issues/new/choose) with your TV model, firmware, SDK if known, installer OS/version, installation step and error text. Hide credentials, QR codes, account information and private keys. If the installer reports an unsupported profile, stop and include that message instead of rerunning the exploit repeatedly.

Project maintained by [twentykhz](https://github.com/twentykhz). See [LICENSE](LICENSE) and [third-party notices](THIRD-PARTY.md). This is an independent project, not an Apple or LG product.
