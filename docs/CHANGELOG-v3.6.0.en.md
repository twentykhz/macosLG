# MAC-WebOSTV 3.6.0 — NANO753PR report fixes

Based on the owner's 2026-10-29 report against `04ee5fe`; the unpublished patch branch was unavailable, so fixes were implemented and tested in this repository.

- Recovery-scoped upload validation and a pre-mutation deployment plan; static hashes, generated-source hashes, target modes and runtime requirements.
- WAM-readable token/config files (0644), private backend token (0600), authenticated backend readiness and a fresh launcher-originated challenge/heartbeat after each setup launch. Root filesystem access alone is insufficient.
- Live audio-output discovery and volume/mute readback, shared by Action Center, remote and custom voice commands. Ambiguous outputs do not trigger guessed writes.
- BACK always forwarded to the app; both compositor names supported. Separate Python/PTy stock-Home observer with ownership, bounded retries/buffers/logs, foreground rechecks and managed shutdown/rollback.
- Physical HDMI inventory across picker, tracker and voice; no registry-only ghost ports or guessed default when history is unknown.
- Native inputcommon/Voice/ThinQ dependencies preserved during debloat; explicit LGWS voice/purge opt-outs retained.
- Dock refresh reuses its renderer; settings read back actual state. Authenticated wallpaper deletion preserves fallback/config. Remote warns about black/dark frames before success/download, without assuming DRM.
- Scoped diagnostic evidence and partial/incomplete completion reporting. Unchanged kernel boot ID is not cold-boot proof, and does not trigger repeated reboot/reroot.

## Verification boundaries

The [NANO profile](NANO753PR.en.md) remains **runtime-tested-partial**, based on owner evidence. No new physical NANO deployment was performed for this release. Physical HOME/BACK, speech recognition, cold boot, wake and full device rollback remain unverified.

The webOS 6 voiceconductor recognized-result adapter is not implemented/verified; native microphone is preserved. Long Node 8 monitors are not enabled; short Luna child requests remain supported.

Runtime preloader/IoT masks in the report were made outside this source tree without their original journal. This release does not create/adopt or blindly unmask them. Doctor reports overrides; project rollback cannot claim restoration of unjournaled owner state.

Menu 4 retains rooted-TV YouTube AdFree/LGWS/keep-nine optimization; Rollback remains menu 5 with dated backups. Existing app IDs/internal paths remain compatible with installed data and backups.

## Automatic SlopBro refresh (same 3.6.0 release)

Faultmanager remains first. An eligible SlopBro fallback now automatically uses authenticated Developer Mode identity/SDK/app inventory, a Node-hosted pinned payload and pinned Homebrew IPK; host Python is unnecessary. Upstream commit: 21023d56ca424607bb03d2939609cc658c655fc7.

Developer SSH launch is preferred; if explicitly denied, SSAP pairing is used and the TV may require a physical approval. The Developer Mode passphrase cannot replace this approval. Pairing keys remain private. SSAP uses the TV's local self-signed TLS certificate as upstream does; payload/IPK HTTPS verification is not disabled.

Both payload completion and actual Homebrew UID 0 are required. Reported/pending/uncertain root blocks another exploit. The existing persistent SSH, Developer Mode removal and setup flow follows verification. No physical SlopBro device run was performed for this refresh.
