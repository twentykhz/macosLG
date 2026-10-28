# HOME và xác minh root / HOME and root verification

[Trang chính](../README.md) · [Windows](../windows/README.md) · [Android](../android/README.md)

## TV đã cài xong nhưng HOME vẫn mở LG Home

Bản sửa 3.4.2 bỏ giới hạn model/firmware SK8000 cho **HOME relay**. TV như **55UM7400PTA / K5LP_DVB_EU / 05.40.97** được xét theo khả năng thực tế: root, startup, ARM32, Python2 với input modules/ABI phù hợp và hai kênh Magic Remote. Sau backup, bộ cài probe thiết bị, đối chiếu khả năng input và xác nhận compositor đang nghe kênh nhận trước khi bật relay. Probe không giữ độc quyền phím; có phát SYN_REPORT vào kênh nhận để kiểm tra đường truyền.

1. Tải lại bộ cài **3.4.2**, chọn **TV đã root**. Không root lại TV đã có UID 0.
2. Không giữ phím remote trong lúc cài; để Magic Remote kết nối bình thường.
3. Xem dòng `HOME relay ACTIVE` và mục `home-relay` trong báo cáo. PID phải khớp tín hiệu sẵn sàng sau khi grab input thành công, không chỉ là process còn chạy.
4. Thử HOME từ app/HDMI, Back và con trỏ trên TV. Kiểm thử tự động chưa thay thế được thao tác remote thực tế.

Thiếu ABI/runtime/kênh input, probe hoặc startup lỗi thì giữ input LG và báo nguyên nhân cụ thể. Không ép relay lên phần cứng chưa kiểm tra. Voice/QML/tuning SK8000 vẫn có giới hạn riêng, không quyết định HOME của model khác. Failsafe: tạo `/home/root/DISABLE-GATHIN-HOME` để relay nhả remote.

## Faultmanager báo Rooting complete / Payload complete nhưng SSH bị từ chối

Điều này không chứng minh root thất bại: Homebrew có thể chưa sẵn sàng hoặc SSH Server chưa bật. Setup ghi `root-pending`, kiểm tra lại Homebrew/root SSH và **không chuyển sang exploit khác** sau khi đã có thông báo root hoàn tất. Trạng thái chờ được giữ theo TV để lần chạy tiếp theo tiếp tục xác minh thay vì chạy lại exploit.

- Mở **Homebrew Channel → Settings**, xác nhận **Root OK**, bật **SSH Server**.
- **Không reboot khi ứng dụng LG Developer Mode còn cài.** Setup tự gỡ và xác minh app đã mất trước reboot tự động, sau khi root SSH được xác minh.
- Nếu phải reboot mới thấy Homebrew: gỡ **ứng dụng Developer Mode** trên TV trước lần reboot đó theo thông báo upstream. Không dùng công tắc tắt Dev Mode Status hoặc Clear Cache để thay cho gỡ app.
- Quay lại setup nhấn Enter để kiểm tra lại; hoặc dừng rồi mở nhánh **TV đã root** sau khi SSH sẵn sàng. Không chạy DejaVuln/DangBro hay root lần nữa chỉ vì cổng 22 đang đóng.

Nguồn: [faultmanager-autoroot](https://github.com/throwaway96/faultmanager-autoroot) · [Homebrew Channel](https://github.com/webosbrew/webos-homebrew-channel).

`networkinput/getServiceInfo` không tồn tại trên một số firmware. Báo cáo mới đánh dấu phép chẩn đoán này cần kiểm tra thực tế; lỗi đó không tự chứng minh tính năng điều khiển phím bị hỏng và không gửi phím giả để thử.

## English

HOME is no longer restricted to the SK8000 identity. Compatible ARM32/Python2 TVs must pass device capability, compositor and input-ABI checks after a recovery snapshot. Activation requires the relay process and its matching readiness PID; failure preserves native LG input. Reference voice/QML/tuning remain separate. Physical HOME/Back/pointer testing is still required; no physical UM7400 input takeover was performed to validate this change.

A reported faultmanager completion followed by refused SSH is **pending root verification**, not permission to run another exploit. Setup retries the Homebrew bridge/root SSH, preserves a TV-bound pending journal and stops the method chain. Confirm Root OK and enable SSH Server in Homebrew. Remove the LG Developer Mode app before any reboot; automated reboot stays gated on verified removal and root reconnect. If Homebrew requires a reboot to appear, follow upstream's app-removal order first. Resume the already-rooted branch once SSH is available.
