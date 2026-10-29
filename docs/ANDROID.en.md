# Android / Termux, Linux and macOS

**3.6.0:** menu item **5 — Rollback** restores a selected initial snapshot after `YES/CO` confirmation. [Rollback guide](ROLLBACK.en.md) | [Tiếng Việt](ROLLBACK.vi.md).

**3.4.1:** rooted compatibility mode makes Python optional with an early capability probe and verified Node backup/rollback path. Reference HOME/voice/tuning helpers are skipped on other boards. C2/O22 has regression fixtures, with post-patch physical installation still unconfirmed. Run Doctor first. [Requirements and complete audit](PYTHON-COMPATIBILITY.en.md).

No Windows computer is required. Both `MAC-WebOSTV-AutoSetup.sh` and the existing Windows `MAC-WebOSTV-AutoSetup.ps1` delegate to **the same `scripts/run.js` core**. Keep the phone and TV on the same LAN; avoid isolated guest Wi-Fi. Keep Termux active during setup. Android may otherwise terminate background processes.

## Install without cloning

In Termux:

```bash
pkg update
pkg install nodejs git curl
termux-setup-storage     # optional shared Downloads access
node --version          # must be >=20
curl -fsSL https://github.com/twentykhz/macosLG/releases/latest/download/install-android.sh | bash
```

Linux/macOS: install Bash, system Node >=20 and curl, then use the same bootstrap. No portable runtime is downloaded. Git is only required for cloning. OpenSSH, PowerShell, webOS CLI and a native compiler are not required by the runtime. macOS hardware has not been tested.

The official HTTPS bootstrap is the initial trust point. It pins a versioned, content-addressed release archive, byte length, SHA-256 and runtime manifest hash. It verifies before extraction/execution; it does not discover and execute arbitrary latest branch code. Cached files are checked, including rejection of added native binaries. Release archives bundle only required JavaScript dependency edges; optional native acceleration is omitted.

Reopen the menu or run commands:

```bash
cd "$HOME/.mac-webostv"
./MAC-WebOSTV-AutoSetup.sh
# First check: root SSH diagnostics, no TV writes/install/reboot.
./MAC-WebOSTV-AutoSetup.sh --mode Doctor --host 192.168.1.11
# If this is a new host, verify the TV's IP before explicitly trusting its key:
./MAC-WebOSTV-AutoSetup.sh --mode Doctor --host 192.168.1.11 --trust-new-host
# Already rooted:
./MAC-WebOSTV-AutoSetup.sh --mode Restore --host 192.168.1.11 --trust-new-host
# Unrooted, interactive model/firmware and hidden passphrase prompts:
./MAC-WebOSTV-AutoSetup.sh --mode Setup --host 192.168.1.11 --trust-new-host
# Owner backup:
./MAC-WebOSTV-AutoSetup.sh --mode Backup --host 192.168.1.11
```

Replace sample addresses with your TV's address. Doctor requires root SSH; on an unrooted TV it reports unavailable access and does not root the TV. Capture is a manual check in Doctor because no temporary TV files are written.

## Fresh setup

On the TV install LG Developer Mode, sign in, enable Dev Mode Status, allow its reboot and then enable Key Server. Record the model, installed firmware and case-sensitive six-character passphrase. [TV-side steps](INSTALL.en.md#branch-a). The shared core retrieves `/webos_rsa` on port 9991, authenticates prisoner SSH on 9922, runs eligible pinned methods, verifies the root bridge and provisions recovery SSH. Passphrases/passwords use the terminal without echo or input logging.

```bash
./MAC-WebOSTV-AutoSetup.sh --mode Setup --host 192.168.1.11 \
  --expected-model 55SK8000PTA --expected-firmware 05.50.70 \
  --trust-new-host
```

Use your own model/firmware. Model, firmware, ABI, hash, fingerprint and verified-root checks remain enabled. Termux does not make unsupported TV firmware compatible. USB/browser methods still require physical interaction; preparing USB on Android may need OTG and appropriate filesystem support. No concurrent or infinite exploit retries.

## Options, state and recovery

All seven modes map directly to the core: Setup, Restore, Doctor, Backup, Apps, Sync, Disable. Flags: `--already-rooted`, `--dry-run`, `--trust-new-host`, `--no-reboot`, `--remove-extra-apps`, `--key PATH`, `--developer-key PATH`, `--backup-file PATH`, `--output-dir PATH`, `--expected-model MODEL`, `--expected-firmware VERSION`, `--language en|vi`. Quote paths containing spaces. `Doctor TV_IP` is also accepted.

`--no-reboot` skips the final reboot, preserving root-provisioning reboots. The existing restriction against unrelated app removal in snapshot-protected setup remains; passing `--remove-extra-apps` does not bypass it. Private backups cannot be transplanted onto a mismatched TV.

State defaults to `~/.mac-webostv/state`, outside source (directory 700, keys 600 where supported). Override `GATHIN_STATE_DIRECTORY` if needed. Logs record output only. Termux backups prefer `~/storage/downloads/MAC-WebOSTV-Backups` if writable, otherwise `~/MAC-WebOSTV-Backups` automatically; Linux/macOS use the latter. `--output-dir "$HOME/TV backups"` overrides this. Android shared-storage permissions differ from private app storage; do not publicly share backups.

On a changed Setup/Restore failure, interactive users can answer `YES` or `CO`, case-insensitively, to restore the first snapshot from that run. Noninteractive runs print the recovery session location and do not silently restore. [Recovery scope](diagnostics/RECOVERY.md).

For automation, supply `--mode` and `--host`, a private key if needed, and model/firmware for unrooted preflight. Hidden passwords and guided manual rooting need an actual terminal. No arguments opens the menu only in an interactive terminal.

## Developers

```bash
git clone https://github.com/twentykhz/macosLG.git
cd macosLG
npm ci --omit=optional --ignore-scripts
./MAC-WebOSTV-AutoSetup.sh --mode Doctor --host 192.168.1.11
npm test
npm run verify
```

Regular `npm ci` also works; the explicit flags avoid compiling optional native optimizations. Runtime-only: `npm ci --omit=dev --omit=optional --ignore-scripts`. Releases already contain the runtime dependencies. Development tests also require Python 3 and Bash; PowerShell tests run only on Windows. `npm run package` uses built-in Node ZIP/tar generation on either platform and retains the existing Windows release filenames.
