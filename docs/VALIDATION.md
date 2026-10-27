# Validation — GathinTV 3.1 / 2026-10-27

- Synced 125 current static runtime files from the reference TV; no live reinstall, reboot, factory reset or exploit replay performed during this source refresh.
- Rebuilt launcher IPK and verified all 140 payload/package checksums.
- 45/45 automated tests passed, including root sequencing, restore interruption, SSH, hash validation, per-TV remote token/IP generation and configurable family payload.
- Windows PowerShell single-file Prepare passed: embedded ZIP hash and extracted payload checksums verified; no TV connection made.
- Public source scan excludes owner access tokens, Wi-Fi/Ethernet MAC addresses, PC/VPN endpoints, root private keys and runtime state/logs. Family dates replaced by editable sample configuration.
- Runtime modules remain compatible with the reference webOS Node 0.12 / Python 2 environment; remote HTTP server uses Node core modules, not unavailable Python HTTP/threading packages.
- Full clean installation after factory reset on a second TV remains untested. Hardware/profile/firmware checks remain enabled.

Public repository preparation: bilingual landing pages and installation/feature/source guides checked for local links; generated AutoSetup kept in Releases; Start-Setup.cmd and first-connection confirmation added. Release 3.1.1 restores the owner-provided SF Pro font in the payload and generated installer, with Inter fallback. Font terms remain separate from the project code license.
