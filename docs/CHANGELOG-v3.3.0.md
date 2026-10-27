# MAC-WebOSTV by 20khzpc 3.3.0

## Tiếng Việt

- Dock tự tính chiều rộng theo số app có trên TV, luôn căn giữa. Tối đa 14 icon trong một hàng ở bố cục 1920×1080; nhiều hơn thì dùng trái/phải để cuộn ngang. Không còn chừa khoảng trống khi thiếu app.
- Bộ cài `.ps1` trực tiếp và `Start-Setup.cmd` cùng có lựa chọn TV chưa root / đã root trước bước nhập IP. Sau kết nối vẫn kiểm tra UID root thật; không dựa vào câu trả lời để coi thiết bị đã root. TV chưa root vẫn phải đạt điều kiện model/firmware của phương pháp root hiện có.
- Kiểm tra Homebrew, YouTube AdFree và Life’s Good Without Spying trước khi cài; giữ app đã có. IPK đi kèm được kiểm tra SHA-256. Khi cài LGWS trực tiếp thất bại, thử thêm repo vào Homebrew qua inspector và thử cài bằng dịch vụ Homebrew. Nếu inspector hoặc dịch vụ không hỗ trợ, ghi lỗi và hướng dẫn cài thủ công, không báo đã cài.
- Trang thiết lập thêm mục **Thành viên gia đình · Lịch vạn niên**: thêm/xóa, sửa tên và ngày sinh dương lịch của 1–30 người. Danh sách lưu trên TV, lịch đọc lại khi mở. Danh sách dài cuộn ngang; không đẩy nội dung việc nên/không nên làm xuống dưới.
- Stream thử các định dạng JPEG/JPG/PNG, hai tên dịch vụ capture và thử lại ngắn khi thiết bị bận. Chất lượng 480p dùng chiều rộng 848 để căn bội số 16. Ghi nhớ phương án hoạt động trong phiên; mỗi lần chỉ chụp một ảnh, xóa file tạm sau khi đọc. Không ghi video nền.
- Nếu gửi phím native trả lỗi, thử điều hướng qua inspector cho web app tương thích. HOME vẫn đóng System UI/Settings và mở launcher; BACK có thêm cách đóng System UI khi dịch vụ phím trả lỗi. Chuột không được cam kết hoạt động trong menu native hoặc nội dung DRM.
- Bổ sung xử lý hai lệnh nguồn từ cửa sổ nguồn trong launcher; chỉ chấp nhận yêu cầu có xác nhận.
- Cuối cài đặt xuất báo cáo JSON/TXT: root, đăng ký app, HTTP điều khiển/thiết lập, một lần capture, dịch vụ input và phần cần người dùng xác nhận. Xuất script Wake-TV theo IP/MAC/broadcast đọc từ TV nếu có đủ thông tin.

### Các bước sau cài

1. Đọc đường dẫn **FEATURE REPORT** ở cuối cửa sổ. Nếu dùng AutoSetup mặc định, báo cáo nằm trong `%LOCALAPPDATA%\MAC-WebOSTV\state\feature-reports`.
2. Trên launcher mở **Trung tâm điều khiển → Điều khiển từ xa & Thiết lập**, quét QR bằng điện thoại/PC cùng LAN. Máy chủ chạy ngay trên TV, không cần PC cũ bật.
3. Thử trái/phải/lên/xuống/OK, Back, Home, âm lượng và tắt tiếng. Mở từng widget rồi quay lại. Thử voice bằng remote có micro; thử các chế độ hình ảnh/độ sáng trên model của mình. Báo cáo API không thay thế các bước này.
4. Trong trang điều khiển chọn **Hình nền & vị trí thời tiết**, kéo đến mục thành viên, nhập tên/ngày sinh rồi **Lưu thành viên**. Đóng và mở lại lịch trên TV để cập nhật.
5. Bật **Mobile TV On / Turn on via Wi-Fi / Turn on via LAN** nếu TV có mục này. Dùng script `Wake-TV-<IP>.ps1` được tạo trong thư mục báo cáo từ thiết bị khác cùng LAN. Script chờ SSH đáp ứng mới báo bật thành công. Đánh thức qua Wi-Fi phụ thuộc TV; Ethernet thường là lựa chọn dễ kiểm tra hơn. Giữ TV cắm điện.
6. Chỉ thử tắt/khởi động lại khi sẵn sàng; chẩn đoán không tự tắt TV. Khi TV đang tắt, trang web do TV phục vụ cũng tắt: muốn đánh thức từ một trang luôn truy cập được, cần PC/NAS/Raspberry Pi/router hỗ trợ WoL luôn bật.

### LG Without Spying không cài tự động được

[Dự án](https://github.com/lewisdoesstuff/lifesgoodwithoutspying) và [catalog chính thức](https://repo.webosbrew.org/apps/ooo.lew.lifesgoodwithoutspying/) công bố yêu cầu root, Homebrew và webOS **5.0 trở lên**. Cài IPK thành công không chứng minh mọi tùy chọn chạy trên webOS cũ. Bộ cài không ép bỏ kiểm tra của trình cài app và không tự bật chặn Voice Services/ThinQ trên TV khác, vì có thể làm hỏng giọng nói/casting.

Nếu tự thêm repo không được: mở **Homebrew Channel → Settings → Repositories → Add**, dán URL bên dưới, lưu và tải lại danh sách, tìm **Life’s Good Without Spying**, chọn Install:

```text
https://raw.githubusercontent.com/lewisdoesstuff/lifesgoodwithoutspying/main/repo.json
```

Nếu vẫn lỗi, giữ nguyên lỗi trong báo cáo, kiểm tra phiên bản webOS và kết nối Internet. Không chạy nhiều công cụ capture/stream đồng thời khi gặp `Device or resource busy`; dừng phiên xem khác rồi thử lại. Không có cam kết 10–24 FPS trên mọi phần cứng.

## English

The dock now sizes itself to available tiles and stays centered. Up to 14 tiles fit the 1920×1080 layout; larger lists scroll horizontally using left/right. Both installer entry points offer unrooted/rooted choices before asking for an IP; SSH verifies the actual root UID. Unrooted installations remain restricted to supported rooting profiles.

Missing Homebrew, YouTube AdFree and LGWS packages are installed from checksum-pinned assets. Existing apps are retained. On direct LGWS installation failure, setup attempts to add its custom Homebrew repository through the application's inspector and install via the Homebrew service. Failures are recorded with manual steps, never treated as success. LGWS upstream declares webOS 5+ and root/Homebrew requirements. Installing it does not enable voice/ThinQ blocking on another TV.

Manage 1–30 family members, names and Gregorian birth dates in **Remote → Wallpaper & weather locations → Thành viên gia đình · Lịch vạn niên**. Save, then reopen the TV calendar. Long member lists scroll horizontally without expanding the advice panel.

Streaming now tries JPEG/JPG/PNG and alternate capture service names, briefly retries busy errors, remembers working strategies and uses aligned 848×480 capture requests. Only one frame is captured at a time; temporary files are deleted after reading. Native key errors can fall back to web-app inspector input; native menus, DRM and sustained frame rates remain device dependent. Launcher power commands now have explicit confirmed handlers.

After installation, read the JSON/TXT **FEATURE REPORT**, normally in `%LOCALAPPDATA%\MAC-WebOSTV\state\feature-reports`. It distinguishes verified probes from manual checks. Test arrows/OK, Home/Back, audio, widgets, voice, picture/brightness and power on the target TV. No diagnostic power cycle or synthetic keypress is performed.

Wake scripts are generated using the TV's actual LAN IP/MAC/netmask when available. Enable Mobile TV On / Wi-Fi or LAN wake in LG settings, keep mains power connected, and run the generated script from another LAN device while the TV is in standby. It waits for SSH before declaring success. The TV-hosted remote cannot serve a wake page while the TV is off; an always-on PC/NAS/Pi/router is needed for that use case.

Manual LGWS fallback: Homebrew Channel → Settings → Repositories → Add → paste the repository URL above → save/refresh → install Life’s Good Without Spying. Report unsupported versions rather than bypassing installer checks. Stop competing capture clients if the TV reports `Device or resource busy`.

This release is validated through offline checks and simulated installation flows. It has not been installed or functionally verified on the user's second TV from this machine. No changes were applied to the working reference TV.


## Cập nhật tại chỗ 3.3.0 / In-place 3.3.0 update

- Sửa lỗi lựa chọn 3 có thể báo `Invalid TV address` trước khi nhập IP do Enter còn dư sau menu `choice`. Menu mới nhận số rồi Enter; ô IP trống/sai sẽ hỏi lại. / Fixed a leftover Enter being consumed as an empty TV address; the menu now accepts a line and invalid/empty addresses are re-prompted.

- Đổi tên sản phẩm thành **MAC-WebOSTV by 20khzpc**, gồm tên hiển thị trên TV, bộ cài, source ZIP và tài liệu. Mã app/đường dẫn kỹ thuật cũ được giữ để nâng cấp tại chỗ mà không mất cấu hình hoặc tạo app trùng.
- Menu setup có **1: TV chưa root**, **2: TV đã root**, **3: kiểm tra chức năng** trước khi nhập IP. Kết quả chi tiết có màu hiện trong chính cửa sổ setup sau cài hoặc khi chọn 3; không phải tự đi tìm file báo cáo.
- Viết lại hướng dẫn Việt/Anh, liên kết rõ từng nhánh. TV đã root dùng CMD chọn 2; lệnh chỉ định khóa riêng nằm trong mục nâng cao tùy chọn.
- Giữ nguyên phiên bản **3.3.0**. Tải lại cả **MAC-WebOSTV-AutoSetup.ps1** và **Start-Setup.cmd** từ release này.
- Rebranded display names/assets/docs, added menu choice 3 for detailed inline feature reports, and rewrote both installation guides around the actual menu. Existing on-TV IDs/paths and saved SSH credentials remain compatible. Download both updated installer files; no new version number is created.
