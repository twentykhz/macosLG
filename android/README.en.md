# Install GathinTV on Android / Termux

[Home](../README.en.md) · [Tiếng Việt](README.md) · [Windows installation](../windows/README.en.md)

**Install to your LG TV from an Android phone. No Windows ZIP/PS1/CMD files are needed.**

1. Install [Termux from F-Droid](https://f-droid.org/packages/com.termux/).
2. Keep your powered-on TV and phone on the same Wi-Fi/LAN.
3. Run in Termux:

```bash
pkg update -y
pkg install nodejs curl -y
curl -fL https://github.com/twentykhz/macosLG/releases/latest/download/install-android.sh -o "$HOME/install-gathintv.sh"
bash "$HOME/install-gathintv.sh"
```

4. Choose a language, then enter **1** for an unrooted TV or **2** for an already-rooted TV. Enter your TV's IP when prompted. The menu also provides Doctor, backup and rollback.

For unrooted TVs, read the full model and Software Version from **Settings → Support → TV Information** (or **About This TV**). Examples: model `OLED65C2PSA` / `55SK8000PTA`, firmware `05.50.70`. A six-character Developer Mode passphrase such as `F02CFB` is not a TV model; webOS `4.4.0` is not the firmware. The passphrase is requested separately when connecting Developer Mode. Invalid input is retried instead of closing setup.

Reopen the menu with:

```bash
bash "$HOME/.gathintv/GathinTV-AutoSetup.sh"
```

The bootstrap verifies the runtime SHA-256 before execution. Setup replaces official/non-matching YouTube with AdFree 0.5.3 and retains a matching installation. Signing in again may be necessary; rollback does not restore the official YouTube package or account data.

For **Linux/macOS**, install Bash, curl and Node.js 20+, then run the same `curl` and `bash` commands above; skip the Termux `pkg` commands.

[Full shell guide](../docs/ANDROID.en.md) · [Rollback](../docs/ROLLBACK.en.md)

`install-android.sh` is the checksum-pinned bootstrap. `GathinTV-AutoSetup.sh` is the shared-core shell menu. Source users need the dependencies in the [development guide](../docs/DEVELOPMENT.en.md).
