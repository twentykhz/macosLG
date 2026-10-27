> Historical technical reference / Tài liệu kỹ thuật cũ. Current beginner guide / Hướng dẫn hiện hành: [Tiếng Việt](INSTALL.vi.md) · [English](INSTALL.en.md).

﻿# Khôi phục nhanh

Đọc README.md ở thư mục gốc. Nếu TV còn root, chạy file AutoSetup với `-Mode Restore`; không cài Developer Mode lên TV đang root. Nếu đã reset mất root, bật Developer Mode/Key Server rồi chạy Setup. Backup riêng dùng `-BackupFile`.

Khi cần thả chặn phím và runtime tùy biến, dùng `-Mode Disable`; root/SSH vẫn được giữ. Sau khi sửa, chạy Restore để bật lại. Backup cấu hình không phục hồi được firmware hoặc TV không boot/không còn SSH; không có thao tác flash trong bộ này.
