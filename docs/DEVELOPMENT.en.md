# Read the source and build

[Home](../README.en.md) · [Tiếng Việt](DEVELOPMENT.vi.md)

The repository contains **MAC-WebOSTV-Source**. Generated **MAC-WebOSTV-Release** files belong in GitHub Releases; they do not replace the source tree.

| Path | Contents |
|---|---|
| `windows/` | Windows guides, setup CMD, source PowerShell wrappers and Wake helper |
| `android/` | Termux guides, checksum-pinned bootstrap and shell menu; from source run `bash android/GathinTV-AutoSetup.sh` |
| `payload/app/` | Launcher HTML/CSS/JavaScript, widgets, dock, icons, images and public fonts |
| `payload/advanced/files/` | Remote, wallpaper service, root bridge, voice and startup hooks |
| `payload/advanced/map.json` | Source-to-TV installation path mapping |
| `payload/home/` | HOME relay and launcher startup |
| `config/launcher.json` | Default locations, example family members and slideshow |
| `config/profile.json` | Validated hardware/API profile |
| `lib/`, `scripts/` | Installer, backup, restore, build and one-file packaging |
| `test/` | Automated checks that do not reinstall the TV |
| `upstream/`, `THIRD-PARTY.md` | Pinned third-party components and source/license notices |

Use GitHub Code → Download ZIP and extract, or:

```powershell
git clone https://github.com/twentykhz/macosLG.git
cd macosLG
npm.cmd ci
```

Development requires Node.js 20+ and npm on Windows, Android/Termux, Linux or macOS. Use `npm` instead of `npm.cmd` on POSIX; `npm ci --omit=optional --ignore-scripts` avoids native optimization builds. Full tests also use Bash and Python 3. PowerShell-specific tests run only on Windows. Release users do not need npm installation.

Edit locations and `family` in `config/launcher.json`. Each of 1–6 members has `name`, `day`, `month`, `year`. Samples are not the reference owner's family data. Configure dock apps in `payload/app/config.js`. Do not hard-code IPs or QR keys; target-TV services generate their own token and URL.

```powershell
npm.cmd run build
npm.cmd run verify
npm.cmd test
npm.cmd run package
```

`build` creates configuration, IPK and checksums. `package` uses built-in Node ZIP/tar generation with POSIX paths, keeps the existing single-file Windows assets and adds `GathinTV-Termux-3.5.0-HASH.tar.gz`, checksum, manifest and a checksum-pinned `install-android.sh` in the sibling `MAC-WebOSTV-Release` directory. The phone runtime omits tests, screenshot documentation and optional native optimizations, using the same core source. Generate the bootstrap after the tar; exclude it from that tar to avoid a circular hash. Retain immutable hash-named archives on Releases for published bootstraps. Repackage after source changes; rebuild first after payload changes.

The generated installer is also copied to the repository root for local testing but ignored by Git. Upload it as a release asset rather than committing generated large files. The release ZIP includes production dependencies for the installer; source developers still run `npm.cmd ci` for build tools.

Project code uses LICENSE; fonts, artwork and upstream components have their own terms. Release 3.1.1 uses the reference TV’s SF Pro with Inter fallback; the code’s MIT license does not relicense third-party fonts. Check `THIRD-PARTY.md` before adding assets.

Never commit `.local`, `node_modules`, SSH keys, access keys/PINs, passphrases, logs or personal backups. Read [validation](VALIDATION.en.md) before claiming support for new TVs. Keep hardware/firmware/ABI and SSH host-key checks. Editing a model name in JSON is not evidence of compatibility.

## Static input/PTY build (3.5.0)

Run `node scripts/build-input-helper.js` with `ZIG_BINARY` pointing to Zig 0.14.1. The Windows x86_64 compiler ZIP SHA-256 is `554f5378228923ffd558eac35e21af020c73789d87afeabf4bfd16f2e6feed2c`. The script checks static ELF ARM32/ARM64 metadata, records source/binary digests and executes the Windows protocol self-test. Do not ship the compiler or assume ELF checks replace physical input testing.
