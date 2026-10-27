> Historical technical reference / Tài liệu kỹ thuật cũ. Current beginner guide / Hướng dẫn hiện hành: [Tiếng Việt](INSTALL.vi.md) · [English](INSTALL.en.md).

# 2.0 — 26/10/2026

- Entry point mới `Setup-TV.ps1`: tự động từ Developer Mode tới root và giao diện, dùng đúng `throwaway96/faultmanager-autoroot`.
- Bỏ helper chuẩn bị USB/DejaVuln của bản 1.0.
- Khóa commit exploit và SHA-256 của sáu asset upstream; cache trên PC.
- Tự xác thực prisoner bằng khóa từ Key Server và mã hiển thị trên TV.
- Xác minh Homebrew root, tạo khóa SSH root riêng và thử khóa trước khi gỡ Developer Mode.
- Tự gỡ duy nhất LG Developer Mode qua installer; chặn reboot nếu app còn hoặc không đọc được registry.
- Tự reboot/reconnect và xác minh boot ID; không tự chấp nhận một host key khác trong lúc reconnect.
- Cài app phụ nếu thiếu, áp dụng giao diện/hook hiện có và kiểm tra sau reboot cuối.
- Giữ các lệnh backup, restore giao diện, doctor và disable/enable của bản cũ.
- 36 kiểm thử đã qua; đã thử dry-run trên TV đang root. Chưa chạy exploit sau factory reset thực tế.
