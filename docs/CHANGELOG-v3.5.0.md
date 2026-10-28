# MAC-WebOSTV 3.5.0

[Cài Windows](../windows/README.md) · [Cài Android/Termux](../android/README.md) · [English](CHANGELOG-v3.5.0.en.md)

- Bỏ DangBro khỏi danh sách và hướng dẫn root đang dùng. Faultmanager đứng đầu khi dữ liệu trực tiếp xác nhận đúng model/firmware có thể root. Root đã báo hoàn tất chuyển sang chờ Homebrew/SSH, không chạy exploit khác. Khi thất bại thực sự, setup đưa phương pháp phù hợp tiếp theo và hướng dẫn từ nguồn gốc.
- Mọi model dùng chung luồng cài tính năng. Bỏ quyết định bỏ qua voice/debloat/privacy chỉ vì không phải SK8000. Backup riêng của chủ TV vẫn kiểm tra đúng TV trước khi phục hồi.
- Kiểm tra Node, startup, SHA-256, tar và công cụ Luna. Có adapter input/PTY riêng, static ARM32/ARM64, kiểm tra hash/ELF và chạy xác nhận ABI trên TV trước khi đưa vào dùng. Bổ sung applet BusyBox qua thư mục riêng khi có thể; thiếu runtime không có bản khớp đã xác minh thì báo tên thành phần cần sửa.
- Cài boot hook 40 trên cả UM7400 và các model khác: chờ boot/app sẵn sàng rồi mở launcher một lần. Không chạy vòng lặp giành foreground từ app đang xem. HOME kiểm tra thiết bị/compositor trước khi giữ input, dùng Python phù hợp hoặc adapter static; lỗi input không khóa việc tự mở launcher lúc boot.
- Router giọng nói Node thay phụ thuộc Python2: tìm YouTube tiếng Việt có dấu, mở/đóng app, HDMI, TV đã học, âm lượng, độ sáng, mute, tắt/restart. Giữ xử lý NLP gốc cho lệnh hệ thống và đóng phiên voice đúng cách. Adapter YouTube chỉ áp dụng cho AdFree 0.5.3.
- Setup tự debloat; thêm mục **4 — YouTube AdFree + LGWS + tối ưu** trên Windows và Android; Rollback ở mục **5**. Chỉ xử lý danh sách app phụ, không xóa dữ liệu app. Ghi trạng thái khóa cũ để rollback. Nếu API không cho biết trạng thái khóa ban đầu, chỉ đóng app và báo rõ, không tự suy đoán.
- Cài LGWS cùng YouTube AdFree. Profile LGWS 0.7.0 bật ACR/quảng cáo/telemetry; giữ voice, ThinQ, QuickSet, casting/LAN, IPv6, SDP, cập nhật và cửa hàng. Lọc SDP riêng vì tùy chọn `off` của upstream vẫn có thể chặn ngay. Bind overlay danh sách thuộc dự án được tháo khi rollback; không sửa byte gói LGWS.
- Giảm tính lại bố cục dock theo từng sự kiện chuột; gom tối đa một lần mỗi frame, cache vùng dock. Giảm blur và shadow cho GPU TV; giữ các widget và hình nền.

Đây là bản sửa mã nguồn và được kiểm thử tự động/mô phỏng. Chưa có kiểm thử cold boot, HOME/Back/con trỏ, nhận giọng nói hay FPS trực tiếp trên **55UM7400PTA / 05.40.97** trong lần phát hành này. Mục báo “installed” nghĩa là đã triển khai; không thay thế xác minh vật lý. Khác biệt phần cứng/API vẫn được báo cụ thể, không xem đổi tên model là bằng chứng tương thích.

TV đã root: dùng bộ cài 3.5.0, chọn **TV đã root** để áp dụng thay đổi. Trong Homebrew bật **SSH Server**. Nếu Developer Mode còn cài sau root, gỡ **ứng dụng** đó trước reboot; không chỉ tắt Dev Mode Status.

## Cập nhật mục 4 — 29/10/2026

Mục 4 dùng profile [chỉ giữ 9 app chính](KEEP-NINE.md), khóa mọi app khác được SAM quản lý ngoài thành phần hệ thống/HDMI bắt buộc, thay cho giới hạn ở danh sách app phụ. Mở lại app chính nếu đang khóa; báo từng app khóa thất bại hoặc chưa cài. Profile được lưu cho boot. Nhật ký trạng thái khóa được lưu cạnh backup để hoàn tác qua nhiều phiên. Setup/Restore thông thường giữ profile app phụ riêng.

## Đổi tên thống nhất — MAC-WebOSTV

Đổi tên hiển thị, hướng dẫn, shell launcher và gói Windows/Android/Docs sang MAC-WebOSTV. Cache Android mới dùng `~/.mac-webostv`; vẫn tự tìm dữ liệu backup/khóa SSH đã lưu ở thư mục cũ. Tải lại bộ cài/đường dẫn mới khi nâng cấp.
