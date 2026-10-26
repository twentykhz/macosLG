# Third-party sources

- Launcher foundations: https://github.com/khuonguyenhcm-bit/LGtv-Webos-homeskin , https://github.com/OmkarK97/webos-vibehack , https://github.com/Gathin23/cleanyourtv . Original MIT notices retained in LICENSE.
- New setup/runtime source provided under the repository LICENSE; that does not relicense trademarks, logos or third-party artwork.
- Share font: static Inter Light/Regular/SemiBold from https://github.com/rsms/inter/tree/master/docs/font-files ; OFL text in payload/app/fonts/OFL.txt. Apple's SF Pro is not included in the share payload. The separate owner backup is not part of the share build.
- Node.js portable is downloaded from nodejs.org at the version and SHA-256 in config/node-runtime.json. Its official distribution includes its license.
- ssh2 and production dependencies are bundled with their package license files. Tests/examples/fixtures and personal keys are excluded from the share artifact.
- faultmanager-autoroot is included UNMODIFIED from commit a972c95f4f4dbacdb72215409ea0c9eff39dabc1, with upstream COPYING under upstream/faultmanager-COPYING. AGPL-3.0-or-later source: https://github.com/throwaway96/faultmanager-autoroot/tree/a972c95f4f4dbacdb72215409ea0c9eff39dabc1 . The script's own firmware checks remain intact.
- Pinned public IPKs: Homebrew Channel 0.7.3 (https://github.com/webosbrew/webos-homebrew-channel), YouTube AdFree 0.5.3 (https://github.com/webosbrew/youtube-webos), Life's Good Without Spying 0.7.0 (https://github.com/lewisdoesstuff/lifesgoodwithoutspying). Exact URLs and digests in config/bootstrap.json. Modified YouTube relaunch addition is readable in payload/advanced/youtube-userScript.js; upstream source tag v0.5.3 is available from the same repository.
- Store apps FPT Play, TV360 and Netflix are not redistributed. Their app icons are labels of their respective services, not a claim of paid subscriptions.

No LG firmware binaries, account databases, cookies or private SSH keys are redistributed in the share installer.
