# Validation — 2026-10-26

- Windows PowerShell 5.1: single-file extraction, embedded SHA-256 verification and portable Node preparation passed.
- Portable Node 24.22.1 downloaded from nodejs.org and checked against pinned official SHA-256.
- Single-file Backup successfully exported the current TV runtime to the PC.
- Unit tests: 43 passed, including root sequencing, interrupted restore, SSH, payload hashes and backup parser rejection cases.
- Read-only TV compatibility: 55SK8000PTA / 05.50.70 / SDK 4.4.0 / M16PP_DVB_EU. TV-bound Python scripts compiled without execution; shell syntax checked. Installer does not require missing TV tarfile/threading/BaseHTTPServer modules.
- Both current private backup archives parsed successfully on PC; device credentials are excluded from share build, control token is regenerated during restore.
- No factory reset, exploit replay, live reinstall or reboot performed on the working TV during release validation. Full recovery after reset remains untested end to end.
