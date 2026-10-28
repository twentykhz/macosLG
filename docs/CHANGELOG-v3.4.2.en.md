# 3.4.2 changes

[Tiếng Việt](CHANGELOG-v3.4.2.md) | **English**

- Add Rollback to Windows and Android setup menus using the shared recovery core, including after successful installation.
- List snapshots for the requested TV with model/date; require `YES/CO` confirmation without silently selecting a default backup.
- Accept session/snapshot files or backup folders, paths with spaces and a read-only DryRun preflight.
- Retain fingerprint, model/firmware/board, root, hash, engine and file-scope protections. Rollback is not factory reset or unroot.
- Translate 3.4.1 documentation into Vietnamese with separate English counterparts; add bilingual rollback instructions.
- Preserve the 3.4.1 tag/artifact checksums and publish a separately pinned 3.4.2 runtime.

[Rollback guide](ROLLBACK.en.md) · [3.4.1 audit](PYTHON-COMPATIBILITY.en.md)
