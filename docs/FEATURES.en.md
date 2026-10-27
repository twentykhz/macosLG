# Features and everyday use

[Home](../README.en.md) · [Tiếng Việt](FEATURES.vi.md) · [Installation](INSTALL.en.md)

## Home screen and dock

Large clock/date text and shadows improve wallpaper readability. The nine-position dock expands names during navigation/hover and contracts when idle. Icons, top buttons and widgets use a small focus zoom/highlight.

Use left/right to select a dock app and OK to open it. Up/down moves among the dock, widgets and top buttons; mouse input also works. In detailed views, Back returns a step or closes the view. The supported profile's HOME relay returns to GathinTV; Back remains a system-level back action.

The power button opens a small shutdown/restart menu. Inputs opens the native input picker; Settings uses the native settings key. The web remote asks for confirmation before restarting.

## Action Center

The top Action Center button opens Wi-Fi, Bluetooth, picture mode, brightness, volume, mute and **Điều khiển từ xa & Thiết lập** (Remote Control & Settings). Connected Wi-Fi/Bluetooth tiles have blue backgrounds and white text. Availability depends on TV hardware/APIs; not all Bluetooth profiles are connectable audio devices.

## Two-location weather

The left widget shows both locations with name, temperature, icon, conditions and high/low range. Press OK or click to open details.

- Two tabs represent the locations; click a tab or use left/right to switch.
- Hourly and roughly ten-day forecasts depend on the API response.
- Detailed data loads when the view opens or a location is selected. Back closes the view and cancels pending work.
- Compact-widget data is reused and refreshed about every ten minutes.
- Open-Meteo requires internet access; saved values may remain visible during network errors.

To change locations: scan the remote QR → **Hình nền & vị trí thời tiết** (Wallpapers & weather locations) → find/select two places → **Áp dụng hai khu vực** (Apply both locations). Names favor locality and province/city; available naming comes from the provider.

## Vietnamese lunar calendar

The center widget displays the lunar date, month/year, can chi, traditional day indicator, brief advice and the current/next favorable-hour period.

Open it, use directional keys to select a date, then OK for details. Back first returns to date selection, then closes the view. **Về hôm nay** means Back to today. The detailed panel includes favorable hours and family-member buttons; choosing a member changes the suggested/avoided activities shown side by side.

This is traditional-calendar reference material, not a guarantee. Public builds use example names/dates. Change `family` in `config/launcher.json` and rebuild to personalize it; see the [source guide](DEVELOPMENT.en.md). Do not publish real family information unintentionally.

## Voice widget

Select the microphone widget on the right, press OK or click it. It opens the **LG Voice Agent** used by the configured command router, not the normal text-entry search application.

- Supported phrases can open/close apps or control the TV.
- Search phrases are routed to YouTube AdFree.
- YouTube/Phim/Ứng dụng (YouTube/Movies/Apps) labels suggest use categories; they are not three independent filter buttons.
- A compatible Magic Remote microphone, internet, LG voice availability, language and consent settings are required. Clicking from a phone does not use that phone's microphone.

The allowlisted commands/aliases are in `payload/advanced/files/var/lib/webosbrew/gathin-youtube-voice/commands.py`. Unrecognized or unsupported phrases may do nothing. Voice behavior is not identical across all LG models.

## Phone/PC web remote

1. While the TV is on, open Action Center → **Điều khiển từ xa & Thiết lập**.
2. Scan its QR on a phone in the same LAN. PCs can open the same link.
3. The page is hosted at `http://YOUR_TV_IP:8091`; no PC relay is needed for LAN use. The QR contains an access key, so do not post it publicly.

Controls include power/restart, system Home/Back, directions/OK, volume/mute and wallpaper/weather management. Restart asks for confirmation.

**Stream Màn Hình TV** starts screen viewing; **Dừng xem** stops it. Choose 360p/480p/720p/1080p. Higher resolution may be slower. This is a sequence of JPEG snapshots, with no audio or guaranteed 10–24 FPS. Viewing stops when the browser tab is hidden.

With mouse control enabled, move/click on the image to interact with the launcher or compatible web apps; use the wheel to scroll. Pointer control does not replace Magic Remote behavior in every native application. Direction/Back buttons use system input. DRM-protected video can appear black.

**Lưu Screenshot** downloads an original 1920×1080 PNG. Enable your browser's “Ask where to save each file before downloading” setting to choose a destination each time. Screen viewing does not automatically save a frame history to Downloads.

## Wallpapers, cropping and slideshow

From the remote, open **Hình nền & vị trí thời tiết**:

1. Select one or more files on your phone/PC.
2. Select each draft image and adjust the crop/zoom/position preview.
3. Save the selected image or batch to the TV gallery. Selecting a file alone does not apply it to the TV.
4. Check the gallery images you want to use.
5. Enable **Chạy slideshow** (Run slideshow) and choose 5–60 seconds; with slideshow disabled, the first selected image is used.
6. Press **Áp dụng lên TV** (Apply to TV), then allow the launcher to pick up the settings.

Original uploaded files are retained; cropping is stored as display parameters instead of re-encoding a low-quality JPEG. The next wallpaper is preloaded about four seconds ahead and fades over about 1.2 seconds. Draft storage belongs to that browser/device. Saved TV gallery images can be selected from another authorized device. Clearing browser storage removes unsaved drafts, not the TV gallery.

## Temporary data and runtime services

The TV deletes temporary screen files after reading them for transmission. The browser revokes old frame URLs after replacement loads and on page exit. Downloaded screenshots and gallery images are intentionally retained. The current frame, UI and running services still need RAM.

Widget data refreshes periodically and details load on demand. Sound-wave graphics have no continuous animation. HOME hooks, voice-result listeners, HTTP services and slideshow schedules still run as needed for their features.

## Wake-on-LAN and access away from home

The TV-hosted web page stops in standby. Another powered-on LAN device must send the TV's MAC a Magic Packet. The TV must remain plugged in with the relevant Mobile TV On/WoL/WoWLAN setting enabled. A phone on home Wi-Fi or a suitable PC/router/NAS can send it.

Download `Wake-TV.ps1` from the release and substitute **your TV's** information:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Wake-TV.ps1 -TvAddress 192.168.1.100 -MacAddress "AA:BB:CC:DD:EE:FF" -BroadcastAddress 192.168.1.255
```

The values are examples. The script waits for an SSH greeting, reports service readiness and waits for Enter; Ctrl+C cancels. An SSH response does not prove the display is lit.

Away from home, configure a VPN/subnet router or always-on relay at home, for example a Tailscale router/NAS/PC that can reach the LAN. Tailscale on the phone alone is insufficient. Wake broadcasts must be sent from a LAN device rather than assumed to cross the VPN. The installer does not configure Tailscale accounts, router settings or public internet ports.


## 3.3.0

[Dock, family editor, LGWS, feature checks and Wake-on-LAN / Dock, thành viên, LGWS và kiểm tra sau cài](CHANGELOG-v3.3.0.md).
