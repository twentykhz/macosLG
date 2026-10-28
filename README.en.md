# GathinTV · MAC-WebOSTV

A macOS-inspired home screen for compatible LG webOS TVs. **Choose the device you will install from.** Keep it and the TV on the same Wi-Fi/LAN.

[Tiếng Việt](README.md) | **English** · Version **3.5.0**

| Your device | Start here | What to download |
|---|---|---|
| **Windows PC** | **[Install on Windows →](windows/README.en.md)** | One ZIP; extract it and open `Start-Setup.cmd` |
| **Android phone** | **[Install on Android / Termux →](android/README.en.md)** | Run the Termux command; no Windows files needed |
| Linux / macOS | [Shell installation](android/README.en.md) | Bash and Node.js 20+ |

**Installing only? You do not need Code → Download ZIP or the source folders.** Follow your platform's guide above.

![GathinTV launcher](docs/screenshots/launcher-preview.jpg)

[3.5.0 changes: startup, HOME, voice, debloat and privacy](docs/CHANGELOG-v3.5.0.en.md).

## Before installing

- **Already rooted:** choose the rooted setup branch; Developer Mode reinstallation or factory reset is unnecessary.
- **Not rooted:** enable **Dev Mode Status**, allow its reboot, then enable **Key Server**. Setup checks readiness, automatically reads authenticated model/firmware and reports compatibility. Some LG TVs cannot use these methods.
- Hardware-tested reference: **55SK8000PTA / firmware 05.50.70**. All models use the same startup/HOME/voice/debloat/privacy pipeline, with hardware/API checks before activation. UM7400/C2 have not been physically validated in this release.

## Documentation

| Topic | Link |
|---|---|
| Features and screenshots | [Feature guide](docs/FEATURES.en.md) · [Gallery](docs/OVERVIEW.vi.md) |
| Backup / restore | [Rollback guide](docs/ROLLBACK.en.md) |
| Version 3.5.0 | [Rollback and YouTube AdFree fix](docs/CHANGELOG-v3.5.0.en.md) |
| Troubleshooting / compatibility | [Documentation index](docs/README.en.md) |
| Source / building | [Development guide](docs/DEVELOPMENT.en.md) |

## Source layout

`windows/` and `android/` are the platform entry points. `payload/` contains the TV launcher/services. `lib/`, `scripts/`, `config/`, `packages/` and `upstream/` support the shared installer and builds; `test/` contains automated checks. Packaged installers belong in [Releases](https://github.com/twentykhz/macosLG/releases/latest).
