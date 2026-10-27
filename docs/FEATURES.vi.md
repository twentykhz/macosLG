# Tính năng và cách dùng

[Trang chính](../README.md) · [English](FEATURES.en.md) · [Cài đặt](INSTALL.vi.md)

## Màn hình chính và dock

Đồng hồ và ngày dùng chữ lớn, shadow giúp nổi trên nền ảnh. Dock có chín vị trí icon; tên xuất hiện khi điều hướng/hover rồi thu lại để bớt chiếm màn hình. Icon, nút trên cùng và widget có highlight/zoom nhẹ.

Dùng trái/phải để chọn app trong dock, OK để mở. Dùng lên/xuống để đi giữa dock, widget và nút phía trên; chuột cũng chọn/mở được. Ở chi tiết, Back quay về bước trước hoặc đóng. HOME của remote được định tuyến về launcher trên profile hỗ trợ; Back vẫn là lệnh quay lại hệ thống.

Nút nguồn mở menu nhỏ có Tắt TV/Khởi động lại; nguồn vào mở bộ chọn input. Settings gọi cài đặt gốc. Restart có xác nhận trong trang remote. Không cần mở cửa sổ toàn màn hình chỉ để tắt TV.

## Action Center

Mở nút Action Center phía trên. Bảng có Wi-Fi, Bluetooth, chế độ hình ảnh, độ sáng, âm lượng, tắt tiếng và **Điều khiển từ xa & Thiết lập**. Wi-Fi/Bluetooth đã kết nối có nền xanh, chữ trắng. Các tùy chọn phụ thuộc API và phần cứng TV; không phải mọi Bluetooth profile đều là thiết bị âm thanh có thể kết nối từ bảng này.

## Thời tiết hai địa điểm

Widget bên trái chứa cả hai địa điểm: tên, nhiệt độ, biểu tượng, tình trạng và khoảng cao/thấp. Mở widget bằng OK hoặc chuột để xem chi tiết.

- Hai tab phía trên tương ứng hai địa điểm; bấm tab hoặc dùng trái/phải để chuyển.
- Có dữ liệu theo giờ và khoảng mười ngày; số ngày thực tế phụ thuộc phản hồi API.
- Dự báo chi tiết chỉ tải khi mở/chuyển địa điểm. Đóng bằng Back để hủy yêu cầu và giải phóng cửa sổ.
- Dữ liệu ngoài widget được dùng lại và làm mới khoảng mười phút, không gọi API liên tục.
- Dữ liệu từ Open-Meteo, cần Internet; lỗi mạng có thể khiến widget dùng dữ liệu đã lưu.

Đổi địa điểm: quét QR remote → **Hình nền & vị trí thời tiết** → tìm/chọn đủ hai vị trí → **Áp dụng hai khu vực**. Tên ưu tiên xã/phường, tỉnh/thành phố; địa danh trả về phụ thuộc nhà cung cấp.

## Âm lịch và lịch chi tiết

Widget giữa có ngày âm, tháng/năm, can chi, chỉ số/đánh giá ngày, nhắc việc chính và giờ tốt hiện tại/kế tiếp.

Mở lịch: chọn ngày bằng bốn hướng, OK để đọc chi tiết; Back một lần về chọn ngày, thêm lần nữa đóng. Nút **Về hôm nay** đưa ngày đang xem về hiện tại. Phần chi tiết có giờ tốt và tên thành viên; chọn thành viên để đổi phần nên/không nên làm. Hai nhóm công việc đặt cạnh nhau để dễ đọc.

Thông tin này theo quy ước dân gian, không phải dự đoán bảo đảm. Bản công khai dùng thành viên/ngày sinh mẫu. Muốn dùng người thật: chỉnh `family` trong `config/launcher.json`, build lại theo [hướng dẫn mã nguồn](DEVELOPMENT.vi.md). Không đăng cấu hình gia đình thật nếu không muốn công khai.

## Widget giọng nói

Chọn widget micro bên phải, nhấn OK hoặc bấm chuột. Widget gọi **LG Voice Agent** mà bộ định tuyến giọng nói tùy chỉnh đang dùng, không mở ô tìm kiếm gõ chữ thông thường.

- Nói lệnh được hỗ trợ để mở/tắt app hoặc điều khiển TV.
- Nói nội dung tìm kiếm để bộ định tuyến chuyển sang YouTube AdFree.
- Nhãn YouTube/Phim/Ứng dụng là gợi ý nhóm sử dụng, không phải ba nút lọc riêng.
- Cần micro Magic Remote tương thích, Internet, quyền/ngôn ngữ voice và dịch vụ LG còn hoạt động. Bấm trên điện thoại không biến micro điện thoại thành micro TV.

Tập lệnh và alias nằm trong `payload/advanced/files/var/lib/webosbrew/gathin-youtube-voice/commands.py`. Một câu ngoài danh sách hoặc dịch vụ LG không nhận dạng được có thể không thực hiện. Không phải mọi lệnh giọng nói ở mọi đời LG đều được hỗ trợ.

## Remote trên điện thoại hoặc PC

1. TV đang bật: Action Center → **Điều khiển từ xa & Thiết lập**.
2. Dùng điện thoại cùng LAN quét QR, mở liên kết. PC có thể mở liên kết đó trong trình duyệt.
3. Trang chạy ở `http://IP_CUA_TV:8091`; không cần PC trung gian. Khóa truy cập nằm trong QR; không chia sẻ ảnh QR công khai.

Remote có tắt/restart, Home/Back hệ thống, bốn hướng/OK, âm lượng/tắt tiếng và trình quản lý ảnh nền/thời tiết. Restart cần xác nhận.

**Stream Màn Hình TV:** bấm để bắt đầu, Dừng xem để dừng; chọn 360p/480p/720p/1080p. Độ phân giải cao rõ hơn nhưng có thể chậm hơn. Đây là từng ảnh JPEG nối tiếp, không có âm thanh và không hứa hẹn 10–24 FPS. Khi tab bị ẩn, luồng xem dừng để giảm tải.

Bật điều khiển chuột rồi rê/bấm trên ảnh để tác động vào launcher/app web tương thích. Con lăn để cuộn. Chuột chưa hoạt động như Magic Remote trong mọi app native; phím điều hướng/Back dùng kênh hệ thống. Nội dung bảo vệ DRM có thể hiện đen.

**Lưu Screenshot:** tải PNG gốc 1920×1080 qua trình duyệt. Muốn chọn thư mục mỗi lần, mở cài đặt Downloads/Tải xuống của trình duyệt và bật hỏi vị trí lưu trước khi tải. Ảnh đã bấm lưu là file của bạn; stream không tự ghi lịch sử ảnh vào Downloads.

## Hình nền, crop và slideshow

Từ remote, mở **Hình nền & vị trí thời tiết**:

1. Chọn một hoặc nhiều ảnh trên điện thoại/PC.
2. Chọn từng ảnh trong hàng bản nháp, chỉnh khung crop/zoom/vị trí để xem vùng hiển thị trên TV.
3. Lưu ảnh đã chọn hoặc nhóm ảnh vào thư viện TV. Chỉ chọn file chưa có nghĩa là đã áp dụng lên TV.
4. Đánh dấu các ảnh muốn dùng trong thư viện.
5. Muốn slideshow: bật **Chạy slideshow**, chọn 5–60 giây; nếu tắt slideshow, TV dùng ảnh đầu được chọn.
6. Bấm **Áp dụng lên TV**. Chờ launcher đọc lại cấu hình.

File tải lên được giữ ở chất lượng gốc; crop là thông số hiển thị, không xuất lại thành JPEG chất lượng thấp. Ảnh sau được preload trước khoảng bốn giây, chuyển fade khoảng 1,2 giây. Mỗi thiết bị/trình duyệt có kho bản nháp riêng; ảnh đã lưu lên TV có thể chọn lại từ thiết bị khác đã được cấp quyền. Xóa dữ liệu trình duyệt sẽ mất bản nháp chưa lưu, không tự xóa thư viện TV.

## Dữ liệu tạm và dịch vụ

TV xóa file ảnh stream tạm sau khi đọc để gửi; trình duyệt hủy URL ảnh cũ sau khi ảnh thay thế tải xong và khi rời trang. Screenshot tải về và thư viện hình nền được giữ có chủ đích. Không gọi đây là “không dùng RAM”: khung hình hiện tại, giao diện và dịch vụ đang chạy vẫn cần RAM.

Widget làm mới theo chu kỳ, chi tiết chỉ tải khi mở. Không chạy animation sóng âm liên tục. Hook HOME, bộ nghe kết quả voice, dịch vụ HTTP và lịch slideshow vẫn cần hoạt động để tính năng tương ứng dùng được.

## Wake-on-LAN và truy cập ngoài nhà

TV tắt/chờ thì dịch vụ web trên TV dừng. Thiết bị khác còn bật trong LAN phải gửi Magic Packet tới MAC TV để đánh thức; TV còn cắm điện và bật Mobile TV On/WoL/WoWLAN tương ứng. Có thể dùng điện thoại cùng Wi-Fi hoặc PC/router/NAS phù hợp.

Tải `Wake-TV.ps1` từ Release. Điền thông tin **TV của bạn**, không lấy MAC từ người khác:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Wake-TV.ps1 -TvAddress 192.168.1.100 -MacAddress "AA:BB:CC:DD:EE:FF" -BroadcastAddress 192.168.1.255
```

IP/MAC trên là ví dụ. Script chờ lời chào SSH, báo dịch vụ đã sẵn sàng và chờ Enter; Ctrl+C để hủy. SSH lên không phải phép đo màn hình đã sáng.

Ngoài nhà: cần VPN/subnet router hoặc thiết bị trung gian luôn bật ở nhà. Ví dụ Tailscale trên router/NAS/PC có định tuyến được vào LAN; chỉ cài Tailscale trên điện thoại không đủ. WoL broadcast cần được gửi từ thiết bị trong LAN, không tự đi xuyên VPN. Bản cài không cấu hình tài khoản Tailscale, router hay mở port Internet.
