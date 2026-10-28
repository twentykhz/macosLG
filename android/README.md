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

4. Chọn **2 — Tiếng Việt**, rồi nhập **số 1** cho TV chưa root hoặc **số 2** cho TV đã root. Nhập IP TV khi được hỏi. Menu cũng có kiểm tra TV, backup và rollback.

**Nếu chọn TV chưa root:** bật **Dev Mode Status**, cho TV reboot, mở lại ứng dụng Developer Mode và bật **Key Server**. Setup kiểm tra độc lập SSH Developer Mode và Key Server, báo trạng thái và cho kiểm tra lại. Sau xác thực bằng passphrase 6 ký tự, **setup tự đọc model/firmware, không bắt nhập thủ công**, rồi hiện kết quả tương thích. TV đã root dùng SSH, không phải cài lại Developer Mode.

**webOS22 trở lên:** `webOS22 / 7.6.0-1901` không phải firmware; bộ cài đọc trực tiếp thông tin từ TV. Tham số nâng cao vẫn có `--expected-model` / `--expected-firmware` và `--skip-preflight`/Enter/SKIP; thông thường không cần dùng.

Mở lại menu sau này:

```bash
bash "$HOME/.gathintv/GathinTV-AutoSetup.sh"
```

Bootstrap xác minh SHA-256 của runtime trước khi chạy. Setup cài YouTube AdFree 0.5.3, gỡ YouTube gốc/bản không khớp trước và giữ AdFree đúng bản. Có thể cần đăng nhập lại; rollback không phục hồi gói/dữ liệu đăng nhập của YouTube gốc.

[Hướng dẫn Android đầy đủ](../docs/ANDROID.vi.md) · [Rollback](../docs/ROLLBACK.vi.md)

Root đã báo hoàn tất thì bật **SSH Server** trong Homebrew và gỡ **app Developer Mode** trước khi reboot; không chạy exploit khác chỉ vì SSH chưa sẵn sàng. HOME relay không còn khóa model SK8000, nhưng phải qua probe input thực tế. [Hướng dẫn HOME / root](../docs/HOME-ROOT-RECOVERY.md).

`install-android.sh` là bootstrap đã ghim checksum. `GathinTV-AutoSetup.sh` là menu shell dùng cùng Node core; nếu chạy từ source, cài dependencies theo [hướng dẫn phát triển](../docs/DEVELOPMENT.vi.md).
