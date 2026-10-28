# 3.5.0 validation

188 automated tests pass without skips, including simulated ARM64 installation/rollback without Python, dependency ABI rejection, portable voice routing and privacy/debloat state handling. ARM32/ARM64 ELF loader/hash checks and Windows helper self-test pass. No physical UM7400 cold boot, input, recognition or FPS validation was performed. See [3.5.0 changes](CHANGELOG-v3.5.0.en.md). Historical evidence follows.

# Validation — MAC-WebOSTV 3.1 / 2026-10-27

[Tiếng Việt](VALIDATION.md) | **English**

## Manual rollback and bilingual documentation (3.4.2)

142/142 tests pass on Node 24 and Node 20.20.2, with no skipped tests. New coverage includes TV-specific snapshot selection/deduplication, confirmation/cancellation, explicit non-interactive session/confirmation, rejection of missing fingerprints or invalid hashes, Bash arguments with spaces and actual PowerShell menu item 4. The C2 fixture exercises read-only DryRun and manual rollback through the real portable Node recovery engine in a mapped filesystem.

No physical TV installation or rollback was performed during this update. Version-specific 3.4.1 evidence and historical validation are retained below.

## Python-optional rooted compatibility (3.4.1)

135/135 automated tests pass on host Node 24 and official Node 20.20.2, with no skipped tests. `npm run verify` verifies all 147 payload/package entries. Coverage includes the reference profile, C2/O22 aarch64 without Python, minimal backup-only TVs, missing checksum providers, real checked uploads, full compatibility Setup over mocked SSH transport, injected post-mutation failure, portable Node rollback and compensated rename failure. Existing Python rollback/preservation tests remain enabled.

Portable helper, Luna controls and HDMI tracker syntax and controls health also passed on a checksum-verified official Windows Node 0.12.18 binary. That checks the legacy language/runtime floor; it is not a physical-TV test. A read-only SSH attempt to the reference TV timed out before handshake, with no TV installation or mutation. C2 remains a regression fixture until the user confirms post-patch hardware testing. [Investigation, complete Python/native audit and limits](PYTHON-COMPATIBILITY.en.md).

## Shared Windows / Android host support (3.4.0)

116 automated tests pass on host Node 24 and official Node 20.20.2, including Bash option forwarding, Termux storage fallback, Windows/Linux/Android/macOS path selection, POSIX ZIP/tar, archive rejection, pinned-download rejection, cache integrity, pure-JS encrypted-key decryption, SSH and Node-20 WebSocket inspector forwarding. Windows regression tests remain enabled on Windows; Python checks use Python 3 when available.

The first live TV check for this port was Doctor through Bash and the shared core from the Windows workstation. It exited successfully without TV file writes, capture, input injection, installation or reboot. Root, launcher, audio, picture, brightness, network, Bluetooth and HTTP availability were verified; network-input service-info remains needs-attention on the reference firmware. Capture and physical controls remain manual checks. This is not a physical Android/Termux or macOS hardware test, nor a new rooting/Restore deployment to the TV. The generated POSIX tar passed system-tar extraction and all 145 payload hashes; the new ZIP passed Windows single-file Prepare. An isolated runtime-only npm ci installed six required JS packages without build scripts or optional dependencies.

The portable runtime uses only required JS packages from the production graph. Optional native acceleration and bundled development CLI tools are excluded. Android/Linux uses system Node >=20, checksum-pinned tar and private state outside source. Windows retains its PowerShell entry point and portable-runtime configuration. Older validation history follows.

- Synced 125 current static runtime files from the reference TV; no live reinstall, reboot, factory reset or exploit replay performed during this source refresh.
- Rebuilt launcher IPK and verified all 141 payload/package checksums.
- 45/45 automated tests passed, including root sequencing, restore interruption, SSH, hash validation, per-TV remote token/IP generation and configurable family payload.
- Windows PowerShell single-file Prepare passed: embedded ZIP hash and extracted payload checksums verified; no TV connection made.
- Public source scan excludes owner access tokens, Wi-Fi/Ethernet MAC addresses, PC/VPN endpoints, root private keys and runtime state/logs. Family dates replaced by editable sample configuration.
- Runtime modules remain compatible with the reference webOS Node 0.12 / Python 2 environment; remote HTTP server uses Node core modules, not unavailable Python HTTP/threading packages.
- Full clean installation after factory reset on a second TV remains untested. Hardware/profile/firmware checks remain enabled.

Public repository preparation: bilingual landing pages and installation/feature/source guides checked for local links; generated AutoSetup kept in Releases; Start-Setup.cmd and first-connection confirmation added. Release 3.1.1 restores the owner-provided SF Pro font in the payload and generated installer, with Inter fallback. Font terms remain separate from the project code license.

3.2.0: 54 automated checks pass, including simulated UK6340/LM18A capability selection, degraded feature paths and no-exploit/no-reboot rooted compatibility sequencing. This is not a claim of live validation on the owner’s 55UK6340PTF.


## 3.3.0 validation

Offline regression checks cover cross-model rooted installation flow, JPEG-to-JPG capture fallback and temporary-file cleanup, family date validation and persistence. The installer writes separate verified / needs-attention / manual-check-required results on the target TV. Hardware input, sustained streaming FPS and Wake-on-LAN from standby have not been tested on the second TV from this workstation. See [3.3.0 notes](CHANGELOG-v3.3.0.md).

## 3.4.0 validation

90 automated checks pass, including duration-based HDMI selection, standby/read-error/suspend exclusion, stable ties, dynamic tile labels, explicit HDMI selections, default/custom SSH authentication, exact-model live-data parsing, patched/unknown rootability states, fallback ordering, partial-root verification, uncertain execution stops, language/confirmation handling, and output-only logging. The tracker and voice code compile on the reference TV's Python 2; the duration-selection function runs there without writing TV files. The TV returns `Active` from the power API and has the native input picker. Live CanI.RootMy.TV checks, optional DejaVuln ZIP checksum, both setup languages and the packaged unknown-model stop have been checked. IPK/checksum verification and single-file packaging pass. Fallback exploits, USB/browser rooting and hardware NVM have not been exercised on a TV. End-to-end viewing across standby/reboot and clean installation after factory reset remain untested.
