# 3.4.2 changes

- Decouple HOME from the SK8000 allowlist: require runtime/ABI/input/compositor preflight after backup and a matching ready PID after grabbing. Failure retains LG input; reference voice/tuning guards remain.
- Persist reported root as `root-pending`, retry Homebrew/root SSH and stop later exploits. Resume verification for the same authenticated TV. Remind users to enable Homebrew SSH Server and uninstall Developer Mode before reboot.
- An absent `networkinput/getServiceInfo` method means this diagnostic is unsupported, not proof that key injection is broken.

- Auto-detect model/firmware by default, with no manual identity prompts. Require Dev Mode Status/Key Server for unrooted SSH setup, probe both services independently, report/retry readiness and confirm working Developer Mode only after authentication. Status logs exclude keys/passphrases.
- Add dedicated DangBro instructions with upstream DVB/support constraints, TV pairing and independent root/identity verification. See `docs/DANGBRO.md`; no upstream exploit code is embedded on the installer host.

- Windows/Termux: Enter auto-detects model/firmware; `SKIP`, `-SkipPreflight` and `--skip-preflight` bypass only the initial manual lookup. Authenticated TV identification, identity pinning and root compatibility gates remain enforced. Explain webOS22/7.6.0-1901 versus firmware and the Support → Software Update location.

- Fix Termux prompts: select English/Vietnamese, describe rooted/unrooted branches, retry invalid menu/model/firmware input, and distinguish the TV model/software version from the Developer Mode passphrase. CLI validation rejects passphrases as model names before connecting to the TV.

- Fix YouTube provisioning: replace an existing official/non-pinned YouTube before installing pinned YouTube AdFree 0.5.3, verify its version after installation, and retain a matching AdFree installation. `--no-extra-apps` skips this step. Official YouTube and its sign-in data are not restored by snapshot rollback; reinstall the official app from LG Content Store if needed.

[Tiếng Việt](CHANGELOG-v3.4.2.md) | **English**

- Add Rollback to Windows and Android setup menus using the shared recovery core, including after successful installation.
- List snapshots for the requested TV with model/date; require `YES/CO` confirmation without silently selecting a default backup.
- Accept session/snapshot files or backup folders, paths with spaces and a read-only DryRun preflight.
- Retain fingerprint, model/firmware/board, root, hash, engine and file-scope protections. Rollback is not factory reset or unroot.
- Translate 3.4.1 documentation into Vietnamese with separate English counterparts; add bilingual rollback instructions.
- Preserve the 3.4.1 tag/artifact checksums and publish a separately pinned 3.4.2 runtime.

[Rollback guide](ROLLBACK.en.md) · [3.4.1 audit](PYTHON-COMPATIBILITY.en.md)
