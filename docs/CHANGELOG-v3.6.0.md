# MAC-WebOSTV 3.6.0 — sửa lỗi từ report NANO753PR

Bản này được sửa dựa trên report chủ máy cung cấp ngày 29/10/2026, source gốc `04ee5fe`. Không có source các commit vá cục bộ được nhắc trong report; các thay đổi được thực hiện và kiểm thử lại tại repo này.

- Upload chấp nhận đúng các thư mục/file do snapshot quản lý, gồm hook Homebrew; vẫn từ chối traversal, ký tự điều khiển, file hệ thống và hook lạ. Setup xuất deployment plan gồm nguồn, đích, mode, runtime và checksum trước khi thay đổi TV. File sinh động có checksum nguồn sinh và được kiểm checksum khi upload.
- Script token mà WAM cần đọc được cài với mode 0644; token riêng backend vẫn 0600. Config remote/wallpaper được sửa lại quyền đọc khi nâng cấp. Setup phải nhận heartbeat có challenge mới từ chính launcher sau khi mở app, có config/token, backend xác thực và không ghi nhận lỗi JavaScript. Root đọc được file hoặc mở được app chưa đủ để hoàn tất.
- Audio ưu tiên trạng thái output thật của `audiooutput`, phân biệt với scenario volume. Mỗi lần ghi đều tìm output đang hoạt động, gửi output với volume/mute và đọc lại kết quả, kể cả khi API ghi báo lỗi. Không chọn bừa khi có nhiều output. Action Center, remote web và lệnh giọng nói tùy biến dùng chung adapter.
- Python và native HOME relay chuyển nguyên BACK đến ứng dụng. Nhận cả compositor `surface-manager` và `surface-manager-starfish`. Observer stock Home chạy bằng Python/PTy riêng, có owner lock, readiness, giới hạn buffer/retry/log và cleanup; nhận state `home`/`launcher`, kiểm tra foreground lại trước khi chuyển. Không chuyển khỏi HDMI/inputcommon/app khác. Observer nằm trong pause/rollback/Disable của project.
- HDMI dùng inventory cổng vật lý do TV trả về. Registry có HDMI4 không có nghĩa TV có cổng HDMI4. Picker và voice kiểm tra lại inventory khi mở; tracker bỏ cổng ma, giữ tie/history hợp lệ và không cộng standby/gap. Chưa có lịch sử hợp lệ thì mở bộ chọn đầu vào.
- LGWS giữ `voice.stop=off`, `purge.boot=off` và các endpoint phục vụ Voice/ThinQ/casting. Bảo vệ app hệ thống inputcommon/voiceconductor/ThinQtv khi debloat; không xóa/stub binary LiveTV dùng chung HDMI.
- Cập nhật dock tái sử dụng renderer đang có; đổi audio/brightness/picture đọc lại trạng thái thay vì báo thành công theo lệnh đã gửi. Thư viện wallpaper hỗ trợ xóa ảnh upload có xác thực, giữ ảnh dự phòng và cập nhật config. Remote cảnh báo ảnh đen/quá tối trước khi báo stream đạt hoặc tải screenshot; ảnh đen không tự chứng minh lỗi DRM.
- Doctor dùng kiểm tra backend có xác thực và báo rõ phạm vi/thời điểm. File capture tồn tại chỉ chứng minh tạo được file. Báo cáo tổng thể là `partial` khi còn bước thử thực tế, `incomplete` khi kiểm tra lõi thất bại. Không coi UI/Luna restart là kernel cold boot nếu boot ID không đổi; không lặp reboot hoặc reroot mù.

## Phạm vi còn cần kiểm chứng

[Profile NANO753PR](NANO753PR.vi.md) là **runtime-tested-partial** theo report chủ máy, không phải chứng nhận đầy đủ cho model/firmware này hay toàn bộ TV LG. Bản 3.6.0 chưa được chạy trên NANO753PR thật trong phiên phát hành này.

Adapter nhận kết quả giọng nói `voiceconductor` của webOS 6 chưa được triển khai/xác minh; giữ mic native, không chạy widget/STT tùy biến chưa kiểm chứng. Monitor dài trong Node 8 chưa được xác minh nên không tự khởi động; các lệnh Luna ngắn vẫn dùng được. HOME/BACK vật lý, cold boot, Wake-on-LAN và full rollback trên thiết bị vẫn phải thử.

Các runtime mask preloader/IoT trong report được tạo bởi phiên sửa ngoài repo, không có journal gốc đi kèm. Bản này không tạo/adopt các mask đó và không tự unmask trạng thái của chủ máy. Doctor báo override để người quản lý khôi phục theo journal gốc; rollback project không tuyên bố khôi phục các thay đổi không có bản ghi.

Menu giữ nguyên: **4 — YouTube AdFree + LGWS + tối ưu 9 app** cho TV đã root; **5 — Rollback** với backup có ngày giờ. Các định danh ứng dụng/path nội bộ cũ được giữ để nâng cấp và phục hồi dữ liệu đã cài.
