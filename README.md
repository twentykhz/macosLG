# MAC-WebOSTV by 20khzpc

**Bản 3.3.0:** dock tự co giãn, quản lý thành viên gia đình, cài LGWS và báo cáo chức năng. Tối ưu lại MAC-WebOSTV-AutoSetup.ps1 và Start-Setup.cmd. Mở CMD: chọn **1** nếu chưa root, **2** nếu đã root, **3** để xem báo cáo chức năng ngay trong setup. [Hướng dẫn đúng từng nhánh](docs/INSTALL.vi.md). [Thay đổi và các bước sau cài](docs/CHANGELOG-v3.3.0.md).

**Tiếng Việt** | [English](README.en.md)

Biến màn hình chính của TV LG webOS tương thích thành giao diện lấy cảm hứng từ macOS. Người dùng Windows cài bằng **một file AutoSetup**; người muốn tìm hiểu có thể xem toàn bộ mã nguồn launcher ngay trong repo.

![Giao diện launcher](preview.png)

**TV tham chiếu đã chạy thực tế:** LG 55SK8000PTA · firmware 05.50.70 · webOS SDK 4.4.0 · M16PP_DVB_EU · ARM32/Python 2. Từ **3.2.0**, TV đã root dùng **Restore** được dò khả năng thực tế, không bắt trùng model mẫu. Tính năng thiếu điều kiện sẽ được bỏ qua và báo rõ; các tinh chỉnh riêng của TV mẫu không áp sang TV khác. Root TV chưa root vẫn cần đúng profile/firmware. Chưa kiểm chứng cài mới sau reset trên TV thứ hai.

## Bạn muốn làm gì?

| Nhu cầu | Bấm vào đây |
|---|---|
| Cài launcher, chưa biết lập trình | [Hướng dẫn từng bước từ đầu](docs/INSTALL.vi.md) |
| Tải bộ cài Windows | [Bản phát hành mới nhất](https://github.com/twentykhz/macosLG/releases/latest) |
| Xem từng tính năng và cách dùng | [Hướng dẫn tính năng](docs/FEATURES.vi.md) |
| Xem/chỉnh mã nguồn | [Hướng dẫn mã nguồn](docs/DEVELOPMENT.vi.md) · [Source launcher](payload/app) |
| Biết bản này đã kiểm tra đến đâu | [Ghi chú kiểm chứng](docs/VALIDATION.md) |

**Người chỉ muốn cài không cần tải cả repo.** Vào bản phát hành mới nhất, tải `MAC-WebOSTV-AutoSetup.ps1` và nên tải thêm `Start-Setup.cmd` để mở dễ hơn. Đặt hai file cùng một thư mục. Không cần tải source ZIP, tự cài npm hoặc webOS CLI để chạy AutoSetup.

**TV đã root:** không cài lại Developer Mode; làm theo [phần TV đã root](docs/INSTALL.vi.md#tv-đã-root). **TV chưa root:** hướng dẫn có đầy đủ bước tạo tài khoản LG Developer, cài Developer Mode, bật Dev Mode Status, reboot và bật Key Server.

## Hai thông tin phải ghi lại

Ghi **IP của chính TV cần cài** và **passphrase 6 ký tự trong Developer Mode**. Passphrase phân biệt chữ hoa/thường, khác mật khẩu tài khoản LG và mật khẩu SSH root. Không lấy thông tin của TV mẫu để điền vào TV khác. Không đăng chúng lên issue.

Bộ cài sẽ hỏi khi cần; không phải mở file script để sửa mật khẩu. TV và PC cần chung mạng nhà. Root và việc đổi HOME/voice tác động tới hoạt động TV nên bộ cài vẫn giữ kiểm tra tương thích. TV đã root đang hoạt động không cần factory reset chỉ để cập nhật launcher.

## Các tính năng hiện có

| Tính năng | Cách hoạt động |
|---|---|
| Giao diện kính | Đồng hồ/ngày lớn, nền trung tính trong suốt, chữ rõ khi nhìn xa, highlight khi chọn |
| Dock tự co giãn | Thu gọn khi không dùng, hiện tên khi điều hướng, zoom nhẹ thay khung chọn thừa |
| Điều khiển hệ thống | Nguồn vào, Action Center, Settings và menu tắt/khởi động lại TV gọn |
| Thời tiết gộp | Hai địa điểm trên một widget; mở ra có hai tab, dự báo theo giờ và khoảng 10 ngày |
| Âm lịch Việt Nam | Ngày âm, can chi, đánh giá ngày/giờ dân gian; lịch chi tiết và gợi ý theo thành viên |
| Widget giọng nói | Gọi Voice Agent đã cấu hình để điều khiển thiết bị và tìm qua YouTube AdFree |
| Quản lý hình nền | Nhiều ảnh gốc, crop/định vị, thư viện lưu lại, slideshow 5–60 giây có fade |
| Remote chạy trên TV | Quét QR bằng điện thoại/PC cùng LAN; TV bật thì không cần PC làm máy chủ |
| Xem màn hình TV | Chuỗi JPEG theo yêu cầu, chọn 360p/480p/720p/1080p; không bảo đảm FPS như video |
| Lưu Screenshot | Tải PNG gốc 1920×1080 qua trình duyệt |
| Tải khi cần, dọn ảnh tạm | Dự báo chi tiết chỉ tải khi mở; ảnh stream tạm được xóa, khung hình cũ được giải phóng |

Từ bản **3.1.1**, launcher và AutoSetup dùng **SF Pro** như TV tham chiếu; Inter được giữ làm font dự phòng. SF Pro là font bên thứ ba của Apple, không được đổi giấy phép thành MIT của dự án. Icon FPT Play/TV360/Netflix không đồng nghĩa có sẵn thuê bao: người dùng tự cài và đăng nhập các app này nếu cần.

Voice phụ thuộc dịch vụ LG, Internet, ngôn ngữ/quyền voice và micro Magic Remote tương thích. Chuột trên ảnh hỗ trợ launcher/app web phù hợp, không thay thế mọi màn hình native. Video có bảo vệ có thể bị đen. Gợi ý lịch là quy ước dân gian để tham khảo.

## Dùng hằng ngày ở đâu?

Trên TV mở **Action Center → Điều khiển từ xa & Thiết lập**, quét QR. Từ đây dùng remote, tải screenshot, đổi hình nền và hai địa điểm thời tiết. Mỗi TV tự tạo khóa/QR riêng; thông tin thành viên đi kèm là dữ liệu mẫu có thể sửa.

Khi TV tắt/chờ, trang web trên TV cũng dừng. Muốn đánh thức cần thiết bị khác còn bật trong LAN gửi Wake-on-LAN. Muốn dùng ngoài nhà cần VPN/subnet router hoặc thiết bị trung gian đã cấu hình; bộ cài không tự mở TV ra Internet. [Xem cách hoạt động](docs/FEATURES.vi.md#wake-on-lan-và-truy-cập-ngoài-nhà).

## Nên đưa thư mục nào lên GitHub?

- **Repo dùng `MAC-WebOSTV-Source`:** mã nguồn, cấu hình, script build, kiểm tra và tài liệu để mọi người đọc/chỉnh được.
- **GitHub Releases dùng file từ `MAC-WebOSTV-Release`:** AutoSetup đã build, source ZIP tùy chọn và checksum để người mới tải.

Không dùng thư mục Release thay toàn bộ source repo. Không đăng `.local`, `node_modules`, khóa SSH, token, passphrase hay backup cá nhân. [Chi tiết build và cấu trúc](docs/DEVELOPMENT.vi.md).

## Khi cần hỗ trợ

[Tạo issue](https://github.com/twentykhz/macosLG/issues/new/choose), ghi model TV, firmware, SDK nếu biết, Windows đang dùng, bước đang làm và nguyên văn lỗi. Che QR, mật khẩu, passphrase, tài khoản và khóa riêng. Nếu báo không tương thích, dừng và gửi thông tin thay vì chạy exploit lặp lại.

Duy trì bởi [twentykhz](https://github.com/twentykhz). Xem [LICENSE](LICENSE), [thành phần bên thứ ba](THIRD-PARTY.md). Đây là dự án độc lập, không phải sản phẩm của Apple hay LG.
