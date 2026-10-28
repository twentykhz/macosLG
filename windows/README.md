# Cài GathinTV trên Windows

[Trang chính](../README.md) · [English](README.en.md) · [Tôi dùng Android](../android/README.md)

**[Tải bộ cài Windows 3.4.2 — GathinTV-Windows-3.4.2.zip](https://github.com/twentykhz/macosLG/releases/download/v3.4.2/GathinTV-Windows-3.4.2.zip)**

1. Tải ZIP ở trên và **giải nén toàn bộ** vào một thư mục.
2. Bật TV; máy tính và TV cần cùng Wi-Fi/LAN.
3. Nhấp đúp **`Start-Setup.cmd`** trong thư mục vừa giải nén.
4. Chọn ngôn ngữ, rồi chọn **1 — TV chưa root**, **2 — TV đã root**, **3 — Kiểm tra TV** hoặc **4 — Rollback**.
5. Nhập IP của chính TV và làm theo hướng dẫn. TV chưa root cần bật **Dev Mode Status**, cho reboot, mở lại Developer Mode và bật **Key Server**. Setup kiểm tra hai dịch vụ, báo trạng thái và cho kiểm tra lại. TV đã root dùng SSH, không cần cài lại Developer Mode.

Không cần tự cài Node.js, npm hoặc webOS CLI. Giữ `Start-Setup.cmd` và `MAC-WebOSTV-AutoSetup.ps1` cùng thư mục; không chạy trực tiếp trong ZIP.

**Model/firmware được tự đọc sau khi kết nối xác thực, không phải nhập.** Bạn chỉ nhập IP và passphrase Developer Mode khi được hỏi. Setup hiện model/firmware đã nhận diện và kết quả tương thích. Chế độ nhập thủ công chỉ dành cho tham số nâng cao; vẫn có Enter/SKIP. `webOS22 / 7.6.0-1901` là phiên bản hệ điều hành, không phải firmware. [Hỗ trợ root qua DangBro](../docs/DANGBRO.md).

Setup cài YouTube AdFree 0.5.3; nếu đang có YouTube gốc/bản không khớp, setup gỡ trước rồi cài AdFree. AdFree đúng bản được giữ nguyên. Khi gỡ YouTube, có thể cần đăng nhập lại; snapshot không phục hồi gói/dữ liệu đăng nhập của YouTube gốc.

**Root xong nhưng chưa có SSH / HOME bị bỏ qua?** Bật SSH Server trong Homebrew, gỡ Developer Mode trước reboot. Chọn lại **TV đã root**, không chạy exploit khác. HOME được kiểm tra input riêng, không còn khóa theo model SK8000. [Hướng dẫn xử lý](../docs/HOME-ROOT-RECOVERY.md).

[Hướng dẫn từng bước và điều kiện root](../docs/INSTALL.vi.md) · [Khôi phục backup](../docs/ROLLBACK.vi.md) · [Tải riêng file PS1](https://github.com/twentykhz/macosLG/releases/download/v3.4.2/MAC-WebOSTV-AutoSetup.ps1)

Các file `Setup-TV.ps1` và `Restore-TV.ps1` trong source dành cho người phát triển đã cài Node.js/dependencies; người cài thông thường dùng ZIP ở trên. `Wake-TV.ps1` là tiện ích bật TV qua LAN.
