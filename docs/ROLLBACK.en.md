# Restore the state from before running the tool

[Tiếng Việt](ROLLBACK.vi.md) | **English**

Starting with **3.4.2**, setup has a separate **Rollback** mode. Select a snapshot captured before project installation changes, even after a successful installation. The existing recovery offer following a failed Setup/Restore remains available.

## Scope

For an initially unrooted TV, capture occurs after root access is available for SSH backup. Rollback does not return the TV to its pre-exploit unrooted state.

Rollback restores snapshotted launcher files, project service configuration/data, wallpapers, tokens and boot hooks. It removes newly installed known project apps and restarts only project runtimes active in that snapshot. Later project changes are replaced.

This is **not a factory reset, firmware restore or unroot**. Accounts, all vendor apps/data, Developer Mode, system settings outside the snapshot and exploit changes are not guaranteed to be restored. Never transplant another TV's snapshot. See `config/recovery-roots.json` and the [recovery audit](PYTHON-COMPATIBILITY.en.md).

Keep the original state directory: normally `%LOCALAPPDATA%\MAC-WebOSTV\state` or `%LOCALAPPDATA%\MAC-WebOSTV\state` on Windows and `~/.mac-webostv/state` on Android/Linux. `sessions` contains journals; `backups/<timestamp>/snapshot.json` accompanies `before-restore.tar.gz`. An exported tar alone lacks the metadata required by this menu.

## Windows

Download the current installer from [Releases](https://github.com/twentykhz/macosLG/releases/latest). Open `Start-Setup.cmd`, choose the language, then **5 — Rollback: choose a dated backup**. Enter the TV IP, select a numbered snapshot, check its model/host/date/folder and confirm with case-insensitive `YES` or `CO`. Enter `0` at selection, or anything else at confirmation, to cancel.

```powershell
.\MAC-WebOSTV-AutoSetup.ps1 -Mode Rollback -HostName 192.168.1.11 -Language en
.\MAC-WebOSTV-AutoSetup.ps1 -Mode Rollback -HostName 192.168.1.11 -RecoverySession "C:\path\state\backups\TIMESTAMP\snapshot.json" -DryRun -Language en
```

Replace IP/path with your own TV and backup. `-DryRun` validates the archive, root connection, SSH fingerprint, model/firmware/board and rollback capabilities without TV uploads, file changes, app removal or reboot. Omit it to restore after confirmation. `-RootKeyPath` is supported. `-ConfirmRollback` explicitly preconfirms a non-interactive operation.

## Android / Termux / Linux / macOS

```bash
cd "$HOME/.mac-webostv"
./MAC-WebOSTV-AutoSetup.sh --language en
```

Choose **5 — Rollback**, enter the TV IP, select a backup and confirm `YES/CO`. Alternatively:

```bash
./MAC-WebOSTV-AutoSetup.sh --mode Rollback --host 192.168.1.11 --language en
./MAC-WebOSTV-AutoSetup.sh --mode Rollback --host 192.168.1.11 --session "$HOME/.mac-webostv/state/backups/TIMESTAMP/snapshot.json" --dry-run --language en
```

Non-interactive restoration requires both `--session PATH` and `--yes`; DryRun does not need confirmation. No newest-backup default is selected. To return to before first use, select the **first run's snapshot**; each snapshot represents the beginning of its own run.

## Safety and failures

- Hashes, UID 0, the pinned SSH fingerprint and snapshot model/board/firmware are checked. Rollback does not trust a new host key automatically; if pins are missing, verify the actual TV fingerprint before using Doctor to establish trust.
- The existing verified Node/Python2 recovery engine is shared. A TV without Python can use Node. Missing recovery/hash/tar capabilities stop before changes.
- Corrupt, cross-TV, unidentified snapshots or missing archives are rejected. If a backup was moved, its recorded archive path must remain accessible; metadata is not silently rewritten.
- Keep backups/logs if recovery fails. No exploit, firmware flashing or reboot is automatically attempted to repair rollback.

Tests cover selection, cancellation, mixed-case confirmation, paths with spaces, non-interactive confirmation, DryRun and actual portable recovery in the no-Python C2 filesystem fixture. Physical C2 rollback remains unconfirmed.

Backup dates are shown as `dd/MM/yyyy HH:mm:ss (UTC±HH:mm)` in the installing device’s local timezone. Newest backups appear first and are labeled NEWEST/MOI NHAT; the oldest is labeled OLDEST/CU NHAT.
