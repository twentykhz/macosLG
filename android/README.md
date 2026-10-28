# Cài GathinTV trên Android / Termux

[Trang chính](../README.md) · [English / Linux / macOS](README.en.md) · [Tôi dùng Windows](../windows/README.md)

**Dùng điện thoại Android để cài cho TV LG. Không cần tải ZIP/PS1/CMD của Windows.**

1. Cài [Termux từ F-Droid](https://f-droid.org/packages/com.termux/).
2. Bật TV; điện thoại và TV cần cùng Wi-Fi/LAN.
3. Mở Termux và chạy lần lượt:

```bash
pkg update -y
pkg install nodejs curl -y
curl -fL https://github.com/twentykhz/macosLG/releases/latest/download/install-android.sh -o "$HOME/install-gathintv.sh"
bash "$HOME/install-gathintv.sh"
```

4. Chọn ngôn ngữ, nhập IP TV, rồi chọn cài cho **TV đã root / chưa root**. Menu cũng có kiểm tra TV, backup và rollback.

Mở lại menu sau này:

```bash
bash "$HOME/.gathintv/GathinTV-AutoSetup.sh"
```

Bootstrap xác minh SHA-256 của runtime trước khi chạy. Setup cài YouTube AdFree 0.5.3, gỡ YouTube gốc/bản không khớp trước và giữ AdFree đúng bản. Có thể cần đăng nhập lại; rollback không phục hồi gói/dữ liệu đăng nhập của YouTube gốc.

[Hướng dẫn Android đầy đủ](../docs/ANDROID.vi.md) · [Rollback](../docs/ROLLBACK.vi.md)

`install-android.sh` là bootstrap đã ghim checksum. `GathinTV-AutoSetup.sh` là menu shell dùng cùng Node core; nếu chạy từ source, cài dependencies theo [hướng dẫn phát triển](../docs/DEVELOPMENT.vi.md).
