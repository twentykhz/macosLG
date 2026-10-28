# Thay đổi phiên bản 3.4.1

**Tiếng Việt** | [English](CHANGELOG-v3.4.1.en.md)

- Bỏ yêu cầu bắt buộc có Python khi cài ở chế độ tương thích trên TV đã root, bao gồm sao lưu trạng thái đầu phiên và rollback.
- Phát hiện, ghi nhận kiến trúc, trình thông dịch, công cụ kiểm tra checksum và khả năng khôi phục trước những bước phụ thuộc nền tảng.
- Kiểm tra SHA-256 của file upload bằng SHA256/Busybox/Node/Python đã phát hiện trước khi kích hoạt; từ chối payload không kiểm tra được.
- Bổ sung Action Center qua Luna và bộ theo dõi thời gian xem HDMI bằng Node, song song với dịch vụ TV mẫu.
- Giữ hành vi HOME/giọng nói gốc; bỏ qua tuning, input và thay đổi QML của mẫu trên profile khác.
- Chặn tự động triển khai binary Homebrew ARM32 lên kiến trúc chưa xác minh; giữ nguyên Homebrew đã có.
- Mở rộng Doctor chỉ đọc, xử lý Apps/Sync thận trọng, test hồi quy và tài liệu hai ngôn ngữ.
- Windows PowerShell và Android/Termux Bash tiếp tục dùng chung Node core; Node trên máy/điện thoại vẫn cần >=20.

OLED65C2PSA/O22 có test mô phỏng không Python; chưa xác nhận cài bản vá trên TV thật. Xem [audit, phạm vi khôi phục và giới hạn](PYTHON-COMPATIBILITY.md).

Từ **3.4.2**, setup có thêm mục rollback chủ động để chọn snapshot trước khi chạy tool, kể cả sau khi cài thành công. [Hướng dẫn rollback](ROLLBACK.vi.md).
