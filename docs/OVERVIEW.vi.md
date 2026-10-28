# Giao diện và tính năng

[Trang chính](../README.md) · [Windows](../windows/README.md) · [Android](../android/README.md)

## Các tính năng hiện có

| Tính năng | Cách hoạt động |
|---|---|
| [Giao diện kính](#preview-home) | Đồng hồ/ngày lớn, nền trung tính trong suốt, chữ rõ khi nhìn xa, highlight khi chọn |
| [Dock tự co giãn](#preview-dock) | Thu gọn khi không dùng, hiện tên khi điều hướng, zoom nhẹ thay khung chọn thừa |
| [TV tự chọn HDMI](#preview-hdmi) | Icon TV và “mở ti-vi” dùng cổng có tổng thời gian xem cao nhất |
| [Điều khiển hệ thống](#preview-controls) | Nguồn vào, Action Center, Settings và menu tắt/khởi động lại TV gọn |
| [Thời tiết gộp](#preview-weather) | Hai địa điểm trên một widget; mở ra có hai tab, dự báo theo giờ và khoảng 10 ngày |
| [Âm lịch Việt Nam](#preview-calendar) | Ngày âm, can chi, đánh giá ngày/giờ dân gian; lịch chi tiết và gợi ý theo thành viên |
| [Widget giọng nói](#preview-voice) | Gọi Voice Agent đã cấu hình để điều khiển thiết bị và tìm qua YouTube AdFree |
| [Quản lý hình nền](#preview-wallpaper) | Nhiều ảnh gốc, crop/định vị, thư viện lưu lại, slideshow 5–60 giây có fade |
| [Remote chạy trên TV](#preview-remote) | Quét QR bằng điện thoại/PC cùng LAN; TV bật thì không cần PC làm máy chủ |
| [Xem màn hình TV](#preview-stream) | Chuỗi JPEG theo yêu cầu, chọn 360p/480p/720p/1080p; không bảo đảm FPS như video |
| [Lưu Screenshot](#preview-stream) | Tải PNG gốc 1920×1080 qua trình duyệt |
| [Đổi hai địa điểm thời tiết](#preview-weather-settings) | Tìm/chọn địa điểm từ điện thoại hoặc PC, áp dụng lên widget TV |
| [Quản lý thành viên](#preview-family-editor) | Thêm, sửa tên/ngày sinh và lưu trên TV để xem lịch theo từng người |
| Tải khi cần, dọn ảnh tạm | Dự báo chi tiết chỉ tải khi mở; ảnh stream tạm được xóa, khung hình cũ được giải phóng |

Từ bản **3.1.1**, launcher và AutoSetup dùng **SF Pro** như TV tham chiếu; Inter được giữ làm font dự phòng. SF Pro là font bên thứ ba của Apple, không được đổi giấy phép thành MIT của dự án. Icon FPT Play/TV360/Netflix không đồng nghĩa có sẵn thuê bao: người dùng tự cài và đăng nhập các app này nếu cần.

Voice phụ thuộc dịch vụ LG, Internet, ngôn ngữ/quyền voice và micro Magic Remote tương thích. Chuột trên ảnh hỗ trợ launcher/app web phù hợp, không thay thế mọi màn hình native. Video có bảo vệ có thể bị đen. Gợi ý lịch là quy ước dân gian để tham khảo.

## Ảnh preview từng tính năng

19 ảnh dưới đây được chụp trực tiếp từ giao diện source 3.4.0 chạy trong trình duyệt, với dữ liệu minh họa cho thời tiết, Wi-Fi/Bluetooth, HDMI và thành viên. QR dùng địa chỉ demo, không chứa khóa truy cập TV. Khung remote hiển thị ảnh launcher mẫu; đây là preview giao diện, không phải phép đo tốc độ stream hay xác nhận hoạt động trên mọi model. Bấm vào ảnh để xem bản lớn. [Thông tin bộ ảnh](screenshots/README.md).

<a id="preview-home"></a>

### Màn hình chính và các widget

Đồng hồ lớn, ngày dương/âm, thời tiết hai khu vực và nút micro nằm cùng một màn hình. Nền ảnh có thể đổi từ trình quản lý hình nền.

![Màn hình chính: đồng hồ, thời tiết hai khu vực, âm lịch, micro và dock chín icon](screenshots/01-home.jpg)

<a id="preview-dock"></a>

### Dock thu gọn và hiện tên khi chọn

Dock thu gọn ở màn hình trên. Khi rê chuột hoặc điều hướng bằng remote, icon được chọn phóng nhẹ và hiện tên ứng dụng như ảnh dưới.

![Dock đang mở rộng và hiển thị tên Trình duyệt dưới icon được chọn](screenshots/02-dock.jpg)

<a id="preview-hdmi"></a>

### Icon TV tự chọn cổng HDMI

Ảnh minh họa shortcut đang dùng **HDMI 2**. Sau Setup/Restore, bộ theo dõi chọn cổng có tổng thời gian xem cao nhất khi TV bật; chưa có lịch sử thì mở bảng đầu vào để chọn. Lệnh “mở ti-vi” dùng cùng lựa chọn. [Chi tiết cơ chế và giới hạn](CHANGELOG-v3.4.0.md).

![Icon TV được chọn với nhãn TV · HDMI 2 thay cho cổng HDMI 3 cố định](screenshots/10-adaptive-hdmi.jpg)

<a id="preview-controls"></a>

### Action Center và menu nguồn

Mở nút hai thanh gạt phía trên bên phải để chỉnh Wi-Fi, Bluetooth, chế độ hình ảnh, độ sáng, âm lượng và tắt tiếng. Nút cuối mở QR cho trang điều khiển/thiết lập.

![Action Center với Wi-Fi, Bluetooth, chế độ Điện ảnh, độ sáng 65 phần trăm và âm lượng 24 phần trăm](screenshots/03-action-center.jpg)

Nút nguồn phía trên bên trái mở menu gọn gồm **Tắt TV**, **Khởi động lại TV** và **Đóng**.

![Menu nguồn trên launcher với các nút Tắt TV, Khởi động lại TV và Đóng](screenshots/04-power-menu.jpg)

<a id="preview-weather"></a>

### Thời tiết hai địa điểm, dự báo giờ và 10 ngày

Chọn widget thời tiết để mở chi tiết: nhiệt độ, độ ẩm, gió, 12 giờ tiếp theo và dự báo 10 ngày. Hai tab phía trên đổi khu vực; số liệu trong ảnh là dữ liệu mẫu.

![Chi tiết thời tiết khu vực thứ nhất với dự báo 12 giờ và 10 ngày](screenshots/05-weather.jpg)

![Tab thời tiết thứ hai được chọn, hiển thị khu vực Thanh Xuân, Hà Nội](screenshots/06-weather-second-location.jpg)

<a id="preview-calendar"></a>

### Âm lịch, giờ tốt và gợi ý theo thành viên

Mở widget âm lịch để xem lịch tháng, ngày dương/âm, can chi, giờ tốt và hai cột **Nên làm / Không nên làm**. Bốn hướng chọn ngày; **Về hôm nay** quay lại ngày hiện tại.

![Lịch vạn niên với lịch tháng, can chi, giờ tốt và hai cột việc nên làm, không nên làm](screenshots/07-calendar.jpg)

Chọn thành viên để xem phần gợi ý tương ứng. Bộ ảnh dùng tên và ngày sinh mẫu; thông tin lịch theo quy ước dân gian, không phải dự đoán bảo đảm.

![Thành viên thứ hai được chọn trong lịch, với ngày sinh mẫu và gợi ý tương ứng](screenshots/08-calendar-family.jpg)

<a id="preview-voice"></a>

### Widget tìm kiếm và điều khiển bằng giọng nói

Widget micro là điểm mở LG Voice Agent. Có thể nói lệnh được hỗ trợ để điều khiển TV/app, hoặc tìm nội dung qua YouTube AdFree. Ảnh thể hiện widget trên launcher; việc nhận giọng nói cần dịch vụ LG và micro remote tương thích.

![Widget micro được chọn, bên dưới có các nhãn gợi ý YouTube, Phim và Ứng dụng](screenshots/09-voice-widget.jpg)

<a id="preview-remote"></a>

### Quét QR để mở remote và thiết lập

Trong Action Center chọn **Điều khiển từ xa & Thiết lập**, dùng điện thoại cùng LAN quét QR. QR trong ảnh là demo; khi dùng thật, TV tự tạo liên kết và khóa riêng.

![Hộp QR Điều khiển từ xa và Thiết lập, dùng địa chỉ demo không trỏ tới TV thật](screenshots/11-remote-qr.jpg)

<a id="preview-stream"></a>

### Remote trên PC: xem màn hình, điều khiển và lưu screenshot

Cột phải có nguồn/restart, chất lượng **360p–1080p**, **Lưu Screenshot**, điều khiển chuột, bốn hướng/OK, Home/Back và âm lượng. **Lưu Screenshot** tải PNG gốc 1920×1080. Khung trái dưới đây đang hiển thị ảnh launcher mẫu; stream thực tế là chuỗi JPEG, không có âm thanh.

![Remote trên PC với ảnh launcher, tùy chọn 1080p, nút Lưu Screenshot và các phím điều khiển TV](screenshots/12-remote-desktop.jpg)

### Remote trên điện thoại

Giao diện tự xếp lại theo chiều dọc: khung xem và lựa chọn chất lượng ở phía trên, các phím điều khiển ở phía dưới. Hai ảnh chụp thể hiện hai phần của cùng trang trên màn hình hẹp.

<p>
  <a href="docs/screenshots/13-remote-mobile.jpg"><img src="docs/screenshots/13-remote-mobile.jpg" width="360" alt="Phần trên của remote điện thoại: khung xem TV, chất lượng và nút lưu screenshot"></a>
  <a href="docs/screenshots/19-remote-mobile-controls.jpg"><img src="docs/screenshots/19-remote-mobile-controls.jpg" width="360" alt="Phần dưới của remote điện thoại: bốn hướng, OK, Home, Back và điều chỉnh âm lượng"></a>
</p>

<a id="preview-wallpaper"></a>

### Thư viện hình nền và slideshow

Từ remote chọn **Hình nền & vị trí thời tiết**. Đánh dấu nhiều ảnh trong thư viện, bật **Chạy slideshow**, đặt khoảng **5–60 giây** rồi bấm **Áp dụng lên TV**. Ảnh minh họa đang chọn ba hình và khoảng chuyển 15 giây.

![Thư viện bốn hình nền, ba ảnh được chọn, slideshow đang bật với khoảng chuyển 15 giây](screenshots/14-wallpaper-library.jpg)

### Crop, zoom và lưu bản nháp ảnh

Chọn ảnh từ điện thoại/PC để mở bản nháp. Kéo ảnh và chỉnh thanh **Phóng to** trước khi lưu một ảnh hoặc cả nhóm vào thư viện TV; ảnh gốc được giữ lại.

![Trình crop hình nền với ảnh bản nháp, thanh phóng to và các nút lưu vào thư viện TV](screenshots/15-wallpaper-crop.jpg)

![Cùng ảnh bản nháp sau khi tăng mức zoom, thể hiện vùng ảnh được cắt khác đi](screenshots/16-wallpaper-crop-detail.jpg)

<a id="preview-weather-settings"></a>

### Đổi hai khu vực thời tiết từ trình duyệt

Tìm và chọn địa điểm cho từng khu vực, sau đó bấm **Áp dụng hai khu vực**. Widget và hai tab chi tiết trên TV dùng các vị trí đã lưu.

![Trang thiết lập thời tiết với hai ô tìm khu vực và nút Áp dụng hai khu vực](screenshots/17-weather-settings.jpg)

<a id="preview-family-editor"></a>

### Thêm, sửa và xóa thành viên gia đình

Trong cùng trang thiết lập, phần **Thành viên gia đình · Lịch vạn niên** cho sửa tên/ngày sinh, thêm hoặc xóa người, rồi **Lưu thành viên**. Đóng và mở lại lịch trên TV để cập nhật; ảnh dùng sáu thành viên mẫu.

![Trình quản lý sáu thành viên mẫu với ô tên, ngày sinh, nút Xóa, Thêm người và Lưu thành viên](screenshots/18-family-editor.jpg)

Dự báo chi tiết chỉ tải khi mở; stream tạm được dọn sau khi gửi và trình duyệt giải phóng ảnh cũ. Đây là cơ chế chạy nền, không có bảng đo RAM riêng trong bộ ảnh. [Chi tiết dữ liệu tạm và dịch vụ](FEATURES.vi.md#dữ-liệu-tạm-và-dịch-vụ).

## Dùng hằng ngày ở đâu?

Trên TV mở **Action Center → Điều khiển từ xa & Thiết lập**, quét QR. Từ đây dùng remote, tải screenshot, đổi hình nền và hai địa điểm thời tiết. Mỗi TV tự tạo khóa/QR riêng; thông tin thành viên đi kèm là dữ liệu mẫu có thể sửa.

Khi TV tắt/chờ, trang web trên TV cũng dừng. Muốn đánh thức cần thiết bị khác còn bật trong LAN gửi Wake-on-LAN. Muốn dùng ngoài nhà cần VPN/subnet router hoặc thiết bị trung gian đã cấu hình; bộ cài không tự mở TV ra Internet. [Xem cách hoạt động](FEATURES.vi.md#wake-on-lan-và-truy-cập-ngoài-nhà).

## Khi cần hỗ trợ

[Tạo issue](https://github.com/twentykhz/macosLG/issues/new/choose), ghi model TV, firmware, SDK nếu biết, Windows đang dùng, bước đang làm và nguyên văn lỗi. Che QR, mật khẩu, passphrase, tài khoản và khóa riêng. Nếu báo không tương thích, dừng và gửi thông tin thay vì chạy exploit lặp lại.

Duy trì bởi [twentykhz](https://github.com/twentykhz). Xem [LICENSE](../LICENSE), [thành phần bên thứ ba](../THIRD-PARTY.md). Đây là dự án độc lập, không phải sản phẩm của Apple hay LG.
