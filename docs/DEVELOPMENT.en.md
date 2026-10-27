# Read the source and build

[Home](../README.en.md) · [Tiếng Việt](DEVELOPMENT.vi.md)

The repository contains **GathinTV-Source**. Generated **GathinTV-Release** files belong in GitHub Releases; they do not replace the source tree.

| Path | Contents |
|---|---|
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

Development requires Windows, Node.js 20+ and npm. End users running AutoSetup do not need these steps.

Edit locations and `family` in `config/launcher.json`. Each of 1–6 members has `name`, `day`, `month`, `year`. Samples are not the reference owner's family data. Configure dock apps in `payload/app/config.js`. Do not hard-code IPs or QR keys; target-TV services generate their own token and URL.

```powershell
npm.cmd run build
npm.cmd run verify
npm.cmd test
npm.cmd run package
```

`build` creates configuration, IPK and checksums. `package` creates the one-file installer and ZIP under the sibling `GathinTV-Release` folder. Rebuild/repackage after changing payload; an older installer does not read newer loose source files automatically.

The generated installer is also copied to the repository root for local testing but ignored by Git. Upload it as a release asset rather than committing generated large files. The release ZIP includes production dependencies for the installer; source developers still run `npm.cmd ci` for build tools.

Project code uses LICENSE; fonts, artwork and upstream components have their own terms. Public builds use Inter and do not bundle SF Pro. Check `THIRD-PARTY.md` before adding assets.

Never commit `.local`, `node_modules`, SSH keys, access keys/PINs, passphrases, logs or personal backups. Read [VALIDATION.md](VALIDATION.md) before claiming support for new TVs. Keep hardware/firmware/ABI and SSH host-key checks. Editing a model name in JSON is not evidence of compatibility.
