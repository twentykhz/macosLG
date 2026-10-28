# Third-party sources

- Launcher foundations: https://github.com/khuonguyenhcm-bit/LGtv-Webos-homeskin , https://github.com/OmkarK97/webos-vibehack , https://github.com/Gathin23/cleanyourtv . Original MIT notices retained in LICENSE.
- New setup/runtime source provided under the repository LICENSE; that does not relicense trademarks, logos or third-party artwork.
- Public build fonts: static Inter Light/Regular/SemiBold and Inter Variable from https://github.com/rsms/inter (SIL OFL, see payload/app/fonts/OFL-Inter.txt); Outfit from https://github.com/Outfitio/Outfit-Fonts (SIL OFL, see payload/app/fonts/OFL.txt). SF Pro by Apple is included from release 3.1.1 at the repository owner’s request, matching the owner-provided reference TV font. It remains third-party material and is not covered or relicensed by the project MIT license. Inter remains the fallback.
- Node.js portable is downloaded from nodejs.org at the version and SHA-256 in config/node-runtime.json. Its official distribution includes its license.
- ssh2 and production dependencies are bundled with their package license files. Tests/examples/fixtures and personal keys are excluded from the share artifact.
- faultmanager-autoroot is included UNMODIFIED from commit a972c95f4f4dbacdb72215409ea0c9eff39dabc1, with upstream COPYING under upstream/faultmanager-COPYING. AGPL-3.0-or-later source: https://github.com/throwaway96/faultmanager-autoroot/tree/a972c95f4f4dbacdb72215409ea0c9eff39dabc1 . The script's own firmware checks remain intact.
- Pinned public IPKs: Homebrew Channel 0.7.3 (https://github.com/webosbrew/webos-homebrew-channel), YouTube AdFree 0.5.3 (https://github.com/webosbrew/youtube-webos), Life's Good Without Spying 0.7.0 (https://github.com/lewisdoesstuff/lifesgoodwithoutspying). Exact URLs and digests in config/bootstrap.json. Modified YouTube relaunch addition is readable in payload/advanced/youtube-userScript.js; upstream source tag v0.5.3 is available from the same repository.
- Store apps FPT Play, TV360 and Netflix are not redistributed. Their app icons are labels of their respective services, not a claim of paid subscriptions.

No LG firmware binaries, account databases, cookies or private SSH keys are redistributed in the share installer.

The host runtime also bundles [ws](https://github.com/websockets/ws) 8.22.0 (MIT) for Node 20's WebSocket fallback. ssh2 1.17.0, bcrypt-pbkdf, asn1/safer-buffer and tweetnacl retain their upstream license files in the release dependency tree. Optional native cpu-features, sshcrypto, bufferutil and utf-8 acceleration are not required or shipped in the portable runtime.

## Optional rooting references and data

Rootability checks read the live dataset deployed at [CanI.RootMy.TV](https://cani.rootmy.tv/), maintained by [webosbrew/caniroot](https://github.com/webosbrew/caniroot). Downloaded JavaScript is not executed. The website's generated model/exploit JSON data is parsed for each check and is not bundled as a stale offline rootability guarantee.

The optional DejaVuln fallback downloads the unchanged [dejavuln-autoroot v0.0.10 release archive](https://github.com/throwaway96/dejavuln-autoroot/releases/tag/v0.0.10), with pinned size/SHA-256. Its upstream code is AGPL-3.0; the archive and upstream notices remain intact. USB, browser and hardware methods retain their official procedures and are linked from [rooting instructions](docs/ROOTING-METHODS.md).

## Project static input/PTY adapters (3.5.0)

Source: `payload/portable/input-helper.c`, under the project LICENSE. Static ARM32/ARM64 builds use Zig 0.14.1 and musl. Their copyright notices are included in `payload/portable/native/MUSL-COPYRIGHT.txt` and `ZIG-LICENSE.txt`. No LG native library is redistributed. Compiler source and official distribution: https://ziglang.org/download/0.14.1/ . Native source/build hashes and ELF metadata are in the adjacent manifest.
