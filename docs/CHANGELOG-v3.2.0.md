# MAC-WebOSTV 3.2.0 — Rooted TV compatibility

- Already-rooted TV installation no longer requires the reference model/board/firmware.
- Detect Node.js, Python ABI, root startup hooks, Magic Remote channels and Voice Agent/YouTube version before selecting features.
- Install the portable launcher; enable remote/wallpaper, controls, HOME relay and voice only when their prerequisites are available.
- Keep native HOME when the relay probe is incompatible. Skip reference-only debloat/privacy and app removal on other models.
- Rooting an unrooted TV remains profile/firmware gated; no arbitrary exploit bypass.
- First SSH confirmation accepts yes/YES and surrounding whitespace.
- Specific report: 55UK6340PTF / LM18A_DVB_EU was previously rejected at model check. Actual installation on this TV must be confirmed by its owner.
