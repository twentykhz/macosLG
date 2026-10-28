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

For unrooted TVs, enable **Dev Mode Status**, allow the reboot, reopen Developer Mode and enable **Key Server**. Setup checks SSH and Key Server independently, reports readiness and offers retry. After authenticating with the six-character passphrase, **it reads the actual model/firmware automatically**, then displays compatibility results. Already-rooted TVs use SSH without Developer Mode reinstallation.

For **webOS22 and newer**, `webOS22 / 7.6.0-1901` is not firmware; setup reads the actual value from the TV. Advanced `--expected-model` / `--expected-firmware` and `--skip-preflight`/Enter/SKIP remain available, but normal setup does not need them. [DangBro rooting support](../docs/DANGBRO.md).

Reopen the menu with:

```bash
bash "$HOME/.gathintv/GathinTV-AutoSetup.sh"
```

The bootstrap verifies the runtime SHA-256 before execution. Setup replaces official/non-matching YouTube with AdFree 0.5.3 and retains a matching installation. Signing in again may be necessary; rollback does not restore the official YouTube package or account data.

For **Linux/macOS**, install Bash, curl and Node.js 20+, then run the same `curl` and `bash` commands above; skip the Termux `pkg` commands.

[Full shell guide](../docs/ANDROID.en.md) · [Rollback](../docs/ROLLBACK.en.md)

After reported root, enable **SSH Server** in Homebrew and uninstall the **Developer Mode app** before rebooting. Unavailable SSH does not trigger another exploit. HOME is model-independent but still requires actual input checks. [HOME / root recovery](../docs/HOME-ROOT-RECOVERY.md).

`install-android.sh` is the checksum-pinned bootstrap. `GathinTV-AutoSetup.sh` is the shared-core shell menu. Source users need the dependencies in the [development guide](../docs/DEVELOPMENT.en.md).
