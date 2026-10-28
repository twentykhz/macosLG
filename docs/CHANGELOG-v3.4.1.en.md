# 3.4.1

[Tiếng Việt](CHANGELOG-v3.4.1.md) | **English**

- Make rooted compatibility Setup Python-optional, including the initial snapshot and rollback.
- Detect and log architecture, interpreters, checksum providers and recovery capabilities before platform-dependent work.
- Verify uploads with SHA256/Busybox/Node/detected Python before activation; refuse unchecked payloads.
- Add portable Node Luna controls and HDMI viewing tracker alongside the existing reference services.
- Preserve native HOME/voice behavior and skip reference tuning/input/QML helpers on other profiles.
- Block automatic deployment of the pinned ARM32 Homebrew binaries on unverified architectures; preserve installed Homebrew.
- Extend read-only Doctor, conservative Apps/Sync handling, regression fixtures and bilingual documentation.
- Keep Windows PowerShell and Android/Termux Bash on the same installer core; host Node >=20 remains required.

OLED65C2PSA/O22 is covered by no-Python regression fixtures; physical installation after this patch remains unconfirmed. See [audit, recovery scope and limitations](PYTHON-COMPATIBILITY.en.md).

From **3.4.2**, setup also offers manual Rollback to a selected initial snapshot after a successful installation. [Rollback guide](ROLLBACK.en.md).
