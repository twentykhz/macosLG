# Python-optional compatibility — 3.4.1

[Tiếng Việt](PYTHON-COMPATIBILITY.en.md) | **English**

## Investigation and call chain

The supplied console excerpt establishes UID 0 on OLED65C2PSA/O22_DVB_AJ, firmware 33.31.68, SDK 10.3.1, followed by exit 127, `sh: python: not found`. The two named `/mnt/data` logs were unavailable in the Windows workspace; the user explicitly requested continuing without them. No claim is made to have read those files or reproduced on physical C2 hardware.

Source before this patch called:

```text
AutoSetup.template.ps1 → node scripts/run.js Setup
→ scripts/bootstrap.js main → lib/provision.js provision
→ AutorootSteps.captureInitialState → lib/recovery.js capture
→ ssh.exec("python -c " + quoted metadata-generation code)
```

`capture` used Python `os/json` unconditionally, before `rooted-compat.detect`. That is the earliest unconditional Python command on the reported already-rooted compatibility Setup path. Exit 127 aborts before the compatibility feature selection can help. Other unconditional Python utilities in launcher preservation/promotion/pause/cleanup, SSH checksum verification and rollback would have caused subsequent failures too.

## Shared architecture

Windows PowerShell and Android/Termux/Linux/macOS Bash remain wrappers around `scripts/run.js`. Host Node >=20 uses `ssh2`; no external SSH/SCP dependency is introduced. The TV uses its own existing Node >=0.12, independently of host Node. TV code uses ES5 and built-ins, with no native Node addon.

`lib/tv-capabilities.js` performs one memoized read-only probe per SSH connection. It verifies UID, architecture, tool paths, working Node filesystem/crypto support, Python major/input ABI, checksum results, tar, stat/readlink and startup layout. It never installs interpreters or runs an exploit. A fresh connection is checked again.

Backup metadata uses shell/stat/readlink first, then Node, with detected Python2 only as a legacy fallback. Host Node serializes JSON. A minimal backup-only path needs shell/tar and collects existing scoped paths; it does **not** authorize mutations or claim rollback support. Installation requires root, tar, a tested SHA provider and a verified Node filesystem or legacy Python2 recovery engine. The Node helper is uploaded with checksum verification and syntax-checked before persistent project mutation.

Uploads establish a provider before sending bytes: `sha256sum → busybox sha256sum → Node crypto → detected Python hashlib → refuse`. Providers must hash an empty input correctly. The host compares the actual uploaded temporary file with its local SHA-256 before chmod/rename. Archive data travels over verified SSH and is integrity-checked and SHA-hashed on the host.

Node recovery validates host fingerprint, root UID, model/board/firmware, archive hash, allowed roots, tar types/paths, parent identities, filesystem staging and per-file hashes. It stages outside application and boot directories, stops only exact project script identities, preserves ownership/mode and symlinks, compensates interrupted renames and restarts only project runtimes active in the original snapshot. Newly installed known project apps are removed through the existing Luna subscription API; unrelated apps are untouched. These are project-scoped snapshots, not a full firmware/factory-state image.

## Python audit inventory

The audit covers source, shell boot scripts, payload maps, all `.py` files, upstream scripts, tests and documentation. Remaining path strings ending in `.py` in recovery/config are identities to back up, stop or restore existing reference processes; they do not execute an interpreter on C2.

| Class | Files / family | Resolution |
| --- | --- | --- |
| B: metadata / filesystem utility | `lib/recovery.js` | Shell/host JSON or Node descriptor; Python2 is detected fallback only. |
| B: hashing | `lib/ssh.js` | Verified SHA provider chain; no unconditional Python. |
| B: preservation, promotion, cleanup, pause | `lib/launcher-install.js`; `scripts/{preserve-app,promote-app,pause-runtimes}.py` | `lib/portable-tv.js` + `scripts/tv-files.js` preferred; old scripts retained only for detected Python2 without usable Node. |
| B: snapshot restoration | `scripts/rollback-snapshot.py` | Portable Node rollback preferred; old fallback retained for Python2 TVs and separately regression-tested. |
| B: app removal | `scripts/remove-devmode.py`, removal portion of old rollback | `lib/app-removal.js` + subscribed `ssh.removePackage`; Python script retained for legacy tools/tests, not used by normal Developer Mode removal. |
| B: final verification / source capture | `lib/autoroot.js`, `scripts/capture-baseline.js` | Node filesystem/process identity checks. Capture-baseline remains explicitly reference-profile scoped. |
| C: reference installation / tuning | `lib/advanced.js`, `scripts/install-advanced.py` | Explicit exact-profile/ARM32/Python2 gate before uploads. This installs reference Python helpers, QML/service ACL and tuning; it is skipped on C2. |
| C: reference HOME input ABI | `payload/home/home-keyhook.py`; duplicate in `payload/advanced/files/home/root`; HOME boot/disable scripts; `scripts/tv.js` probe/compile | Exact model, board, firmware, ARMv7, Python2 as `python`, 16-byte input ABI and live input probe required. Native HOME retained otherwise. |
| C: legacy control bridge / permissions | `payload/advanced/files/var/lib/webosbrew/gathin-controls/{bridge,permissions}.py`; init.d/38 | Reference bridge retained; compatibility uses `payload/portable/controls.js` with authenticated loopback HTTP and whitelisted Luna APIs, no reference ACL patches. |
| B/C: HDMI viewing tracker | `payload/advanced/files/var/lib/webosbrew/gathin-hdmi/track.py`; init.d/37 | Compatibility uses `payload/portable/hdmi.js`; continuous active viewing only, bounded sampling gaps, stable ties. |
| C: reference voice/QML integration | `home/root/gathin-youtube-voice-router.py`; `gathin-youtube-voice/{commands,disable-results}.py`; init.d/42,43; `home/root/gathin-lgws/{notify.py,boot.sh}` | Not deployed in compatibility mode. Python2 modules, pinned YouTube behavior and reference QML paths/permissions are not assumed on newer firmware. Native voice app launch is used only when exposed; otherwise use physical microphone. |
| C: reference debloat/jobs | `var/lib/webos-debloat/{gathin-final/debloat.py,kept-apps/optional-jobs.py}`; init.d/35,36 | Never deployed or started by compatibility setup; no reference sysctl/job/input assumptions on O22. |
| C: unrelated app removal | `scripts/remove-extra-apps.py` | Existing snapshot safety prohibition retained; outside recovery scope. No newly enabled destructive cleanup. |
| Development only | `scripts/prepare-v3.py`, `test/rollback-sandbox.py`, `test/helpers/host-tools.js`, Python-based reference/HDMI/rollback tests | Not Android installer requirements. Host Python, when used for these legacy tests/tools, is separate from TV Python. |
| Development diagnostics | `scripts/check-live.js` | Compiles legacy scripts only if Python2 is detected; backup-only checks otherwise. Does not install code or reboot. |
| Upstream / descriptive references | `upstream/faultmanager-autoroot.sh`; payload maps, recovery roots, checksums, prior changelogs and guides | Pinned upstream unchanged; references do not add a Python requirement to the portable installer. Root compatibility/prerequisite checks remain enabled. |

No portable core feature intrinsically requires Python (class A). Reference input interception and voice integration remain class C because their exact ABI and firmware behavior have not been validated on newer boards, not merely because an interpreter is missing.

## Native payload audit

`config/component-support.json` records component requirements. The pinned Homebrew 0.7.3 IPK contains five ELF32 ARM (`e_machine=40`) executables: `dropbear`, `rsync`, `scp`, `sftp-server`, `telnetd`. Both optional app installation and faultmanager automatic deployment reject this package for an unverified architecture such as aarch64. Existing Homebrew is preserved. The launcher, portable JS services, pinned YouTube web payload and privacy package contain no ELF executable. No ARM32 compatibility ABI is assumed on aarch64; no sample-TV binary is copied.

## Profiles and practical limits

| Profile | Available | Expected |
| --- | --- | --- |
| A — reference ARMv7 / Python2 | Node, SHA, tar, exact profile/input ABI | Existing reference flow, hooks and tuning retained. |
| B — C2/O22 aarch64 | root, Node, SHA, tar; no Python | Core install, capture, checked uploads, rollback; reference HOME/voice/tuning skipped. |
| C — minimal | root, shell, SHA, tar; no Node/Python | Backup export and read-only reports; no managed mutation without verified rollback. |
| D — no usable hash provider | none of SHA/Busybox/Node crypto/Python hashlib | No unchecked upload; installation stops safely. |

On C2 the expected portable features are launcher/dock, app/HDMI launch and learning, weather/calendar, wallpaper/remote pages and QR configuration. Volume, mute, brightness, picture modes, Wi-Fi/Bluetooth and voice launch remain dependent on firmware-exposed Luna APIs. The installer verifies authenticated runtime readiness; an available HTTP port alone is not treated as success. Physical controls, sustained capture performance and native voice behavior require manual checks on each TV.

Tests exercise actual portable helper operations in a mapped TV filesystem, real archives/checksums, full mocked-transport Setup, failure after mutation and rollback. This is regression coverage, not a C2 hardware certification. A read-only connection attempt to the reference TV during this patch timed out at SSH handshake; no installation or TV mutation was performed.


## Patch file inventory

Created:

- `config/component-support.json`
- `docs/CHANGELOG-v3.4.1.md`
- `docs/PYTHON-COMPATIBILITY.md`
- `lib/app-removal.js`
- `lib/portable-tv.js`
- `lib/tv-capabilities.js`
- `payload/portable/controls.js`
- `payload/portable/hdmi.js`
- `scripts/describe-tv.sh`
- `scripts/tv-files.js`
- `test/c2-python-free-flow.test.js`
- `test/component-support.test.js`
- `test/helpers/tv-profiles.js`
- `test/helpers/tv-sandbox.js`
- `test/minimal-tv-backup.test.js`
- `test/portable-controls.test.js`
- `test/portable-files.test.js`
- `test/ssh-upload-checksum.test.js`
- `test/tv-capabilities.test.js`

Modified (including the generated checksum-pinned bootstrap):

- `GathinTV-AutoSetup.sh`
- `README.en.md`
- `README.md`
- `checksums.json`
- `docs/ANDROID.en.md`
- `docs/ANDROID.vi.md`
- `docs/INSTALL.en.md`
- `docs/INSTALL.vi.md`
- `docs/VALIDATION.md`
- `install-android.sh`
- `lib/advanced.js`
- `lib/autoroot.js`
- `lib/launcher-install.js`
- `lib/post-install.js`
- `lib/recovery.js`
- `lib/rooted-compat.js`
- `lib/runtime-health.js`
- `lib/ssh.js`
- `package-lock.json`
- `package.json`
- `packages/com.gathin.tvhome_1.4.0_all.ipk`
- `scripts/AutoSetup.template.ps1`
- `scripts/capture-baseline.js`
- `scripts/check-live.js`
- `scripts/pause-runtimes.py`
- `scripts/rollback-snapshot.py`
- `scripts/run.js`
- `scripts/tv.js`
- `test/advanced.test.js`
- `test/doctor-readonly.test.js`
- `test/recovery.test.js`
- `test/restore.test.js`
- `test/root-preflight-flow.test.js`
- `test/rooted-compat.test.js`
- `test/rooted-model-flow.test.js`


From 3.4.2, select manual Rollback from setup or use --mode Rollback. [English guide](ROLLBACK.en.md) | [Vietnamese guide](ROLLBACK.vi.md). Read-only Python probes use -B to avoid writing bytecode files.
