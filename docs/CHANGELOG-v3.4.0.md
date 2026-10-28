# 3.4.0 — TV tự chọn cổng HDMI

- Icon TV và lệnh “mở ti-vi” mở cổng HDMI có tổng thời gian xem cao nhất, thay vì mặc định HDMI 3. Nhãn icon tự đổi theo cổng đã chọn.
- Bắt đầu ghi nhận sau Setup/Restore. Khi chưa có dữ liệu, icon TV mở bảng đầu vào để người dùng chọn. Sau khoảng 15–30 giây xem HDMI, bộ theo dõi bắt đầu chọn được cổng.
- Chỉ tính khi TV báo nguồn `Active` và hai lần đọc liên tiếp cùng một cổng. Không tính standby, lỗi đọc hoặc khoảng ngắt dài. Không tự chuyển cổng khi cài đặt.
- Thống kê riêng từng TV nằm ở `/var/lib/webosbrew/gathin-hdmi/usage.json`; giữ qua reboot/Restore. Không chia sẻ lịch sử của TV nguồn và không giả định có thể lấy lại lịch sử trước lúc cài sau factory reset.
- Chọn HDMI cụ thể trong bảng đầu vào hoặc nói “mở HDMI 3” vẫn mở đúng cổng được yêu cầu.
- Cần Python 2 và Homebrew startup để chạy bộ theo dõi; TV không đáp ứng vẫn dùng bảng đầu vào. API nguồn không đọc được thì không cộng thời gian.

Kiểm tra: bộ test tự động, checksum payload, build IPK và AutoSetup; biên dịch Python 2 và kiểm tra API nguồn trên TV tham chiếu. Chưa kiểm chứng setup sau factory reset hoặc trên TV thứ hai.
