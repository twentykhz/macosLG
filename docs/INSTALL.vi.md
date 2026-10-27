# Cài MAC-WebOSTV by 20khzpc trên Windows

[Trang chính](../README.md) · [English](INSTALL.en.md) · [Các tính năng](FEATURES.vi.md)

Bộ cài **3.3.0** có sẵn các nhánh cài đặt và kiểm tra. Chỉ cần nhấp đúp `Start-Setup.cmd`, chọn đúng tình trạng TV và trả lời câu hỏi trên màn hình. **TV đã root không cần tự gõ lệnh Restore, cài lại Developer Mode hoặc factory reset.**

## 1. Tải và mở bộ cài

1. Mở [release 3.3.0](https://github.com/twentykhz/macosLG/releases/tag/v3.3.0), mở **Assets**.
2. Tải **`MAC-WebOSTV-AutoSetup.ps1`** và **`Start-Setup.cmd`** vào cùng thư mục, ví dụ `Desktop\MAC-WebOSTV`. Nếu đã tải 3.3.0 trước đây, **tải lại cả hai file** vì release này được cập nhật tại chỗ.
3. Không đổi tên hoặc giải nén file `.ps1`. Không cần tải `Source code (zip)`, cài Node.js, npm hay webOS CLI.
4. Bật TV. Cho TV và PC Windows 64-bit cùng mạng LAN, tránh Wi-Fi khách có chặn thiết bị. Giữ PC hoạt động, không ngủ trong lúc cài.
5. Nếu Windows chặn file tải về: kiểm tra đúng nguồn repo này, mở **Properties → Unblock → Apply** nếu có. Không cần tắt bảo vệ toàn máy.
6. Nhấp đúp **`Start-Setup.cmd`**. Giữ cửa sổ mở để đọc câu hỏi và kết quả.

## 2. Chọn đúng nhánh

| Chọn trong bộ cài | Tình trạng TV | Hướng dẫn |
|---|---|---|
| **1 — TV not rooted** | TV chưa root hoặc đã mất root | [Nhánh A](#branch-a) |
| **2 — TV already rooted** | TV đã root, có SSH root | [Nhánh B](#branch-b) |
| **3 — Check TV features and show report** | Muốn kiểm tra lại chức năng, không cài lại | [Nhánh C](#branch-c) |

Chọn nhánh **trước khi nhập IP**. Bộ cài vẫn kiểm tra quyền root qua kết nối thật. Nếu chưa biết TV đã root chưa, kiểm tra trong Homebrew hoặc hỏi người đã root TV; đừng đoán mật khẩu hay cài Developer Mode lên TV đã root.

<a id="branch-a"></a>
## Nhánh A — TV chưa root

### A1. Kiểm tra tương thích

Nhánh root hiện có dành cho profile đã hỗ trợ: **LG 55SK8000PTA / firmware 05.50.70 / M16PP_DVB_EU / SDK 4.4.0 / ARM32**. Đây không phải phương pháp root mọi TV LG. Nếu bị từ chối model/firmware, không sửa `config/profile.json` để ép chạy. Ghi model, firmware và lỗi để hỏi tại [Issues](https://github.com/twentykhz/macosLG/issues).

Xem thông tin TV trong **Cài đặt → Tất cả cài đặt → Cài đặt chung → Giới thiệu về TV**; tên mục có thể khác theo đời TV.

### A2. Chuẩn bị Developer Mode — chỉ cho TV chưa root

1. Tạo tài khoản tại [webOS TV Developer của LG](https://webostv.developer.lge.com/), xác minh email nếu được yêu cầu.
2. Trên TV mở **LG Content Store / Apps**, tìm và cài **Developer Mode** của LG.
3. Mở Developer Mode, đăng nhập bằng tài khoản vừa chuẩn bị.
4. Bật **Dev Mode Status**, đồng ý khởi động lại và chờ TV lên lại.
5. Mở lại Developer Mode, bật **Key Server**.
6. **Ghi IP TV và passphrase 6 ký tự** trong ứng dụng. Passphrase phân biệt hoa/thường, khác mật khẩu tài khoản LG. Không đăng ảnh có passphrase lên mạng.

[Hướng dẫn Developer Mode chính thức](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app). Không cần tự chạy các lệnh CLI trên trang LG.

### A3. Chạy nhánh 1

1. Mở `Start-Setup.cmd`, chọn **1**.
2. Tại **TV IP address**, nhập IP **TV**, không phải IP PC/router.
3. Khi xác nhận kết nối đầu tiên, đối chiếu IP trên TV rồi gõ **YES** hoặc **yes**.
4. Khi được hỏi passphrase, nhập đúng 6 ký tự của TV này. Không thấy ký tự khi nhập mật khẩu là bình thường.
5. Chờ bộ cài xử lý và kết nối lại khi TV reboot. Không mở bộ cài thứ hai hoặc rút điện TV.
6. Bộ cài xử lý Developer Mode ở giai đoạn cần thiết; không tự cài lại Developer Mode sau khi root thành công.
7. Đọc **báo cáo chức năng ngay trong cửa sổ setup** khi hoàn tất.

<a id="branch-b"></a>
## Nhánh B — TV đã root

**Bỏ qua toàn bộ nhánh A. Không cài lại Developer Mode, không dùng passphrase Developer Mode.** Cần mật khẩu SSH root hoặc khóa SSH riêng của chính TV. [Lưu ý của webOS Homebrew](https://www.webosbrew.org/pages/sdk-configuration).

1. Bật TV, kiểm tra IP hiện tại trong cài đặt mạng. TV và PC phải cùng LAN.
2. Tải đủ hai file ở mục 1 vào cùng thư mục.
3. Nhấp đúp **`Start-Setup.cmd`**, chọn **2 — TV already rooted**.
4. Nhập **IP TV** khi được hỏi.
5. Nếu là kết nối đầu tiên, kiểm tra IP rồi xác nhận **YES/yes**.
6. Bộ cài dùng khóa đã lưu nếu có. Nếu chưa có, chọn **1** để dùng mật khẩu SSH root hoặc **2** để chọn file khóa SSH riêng. File khóa được lưu riêng trên PC sau khi TV xác thực thành công, không nằm trong bộ cài chia sẻ. Khi hỏi **SSH password (hidden)**, nhập **mật khẩu root của TV này**; không dùng mật khẩu LG, passphrase Developer Mode hoặc mật khẩu TV khác. Không thấy ký tự khi gõ là bình thường.
7. Chờ bộ cài kiểm tra root, sao lưu và cài/cập nhật các phần tương thích. **Không cần chạy lệnh Restore thủ công.**
8. Đọc **báo cáo chức năng ngay trong cửa sổ setup**. Cửa sổ chờ bạn nhấn phím trước khi đóng.

Nhánh TV đã root không bắt model phải trùng TV tham chiếu. Các phần phụ thuộc Node.js, Python, API/input được kiểm tra riêng. HOME relay hoặc voice không đủ điều kiện sẽ được ghi rõ; không báo tất cả hoạt động chỉ vì launcher cài xong. Nhánh Restore tương thích không chạy lại exploit hoặc ép reboot.

Nếu chỉ có **file khóa SSH riêng** chưa được lưu trong bộ cài, xem [tùy chọn nâng cao](#advanced). Đây không phải bước bắt buộc của nhánh B.

<a id="branch-c"></a>
## Nhánh C — Kiểm tra và xem báo cáo trong setup

1. Mở **`Start-Setup.cmd`**, chọn **3 — Check TV features and show report**.
2. Nhập IP, xác nhận host key nếu cần và đăng nhập SSH root như nhánh B.
3. Bộ cài kiểm tra root, app đã đăng ký, máy chủ remote/thiết lập, một lần capture, audio, độ sáng/chế độ hình ảnh, mạng và Bluetooth.
4. Kết quả có màu và nội dung chi tiết hiện trực tiếp trong cửa sổ. Đường dẫn JSON/TXT cũng được in ra.

| Trạng thái | Ý nghĩa |
|---|---|
| **OK / ĐÃ CÓ / ĐÃ CÀI** — xanh | Kiểm tra cụ thể đó đạt hoặc app đã đăng ký |
| **CẦN KIỂM TRA / CHECK** — đỏ | Đọc chi tiết lỗi cùng dòng; chưa coi là đạt |
| **THỬ TRÊN TV / MANUAL** — vàng | Chưa kiểm chứng thao tác thực tế; cần bạn thử |

Nhánh 3 không cài lại launcher, tự bấm phím hay tắt/reboot TV. Nó chụp một ảnh kiểm tra rồi xóa file tạm, tạo script Wake-TV trên PC nếu đọc được thông tin mạng. Home/Back, điều hướng/OK, chuột, voice, nguồn và WoL vẫn cần thử thực tế. Một lần capture đạt không chứng minh FPS stream ổn định.

Báo cáo mặc định nằm trong `%LOCALAPPDATA%\MAC-WebOSTV\state\feature-reports`. Khi nâng cấp từ tên cũ, bộ cài có thể tiếp tục dùng thư mục dữ liệu cũ để giữ khóa SSH; **xem đường dẫn thực tế ở cuối báo cáo**. Không chia sẻ toàn bộ thư mục dữ liệu vì có khóa riêng.

## 3. Dùng sau khi cài

1. Thử Home/Back, dock, từng widget và Trung tâm điều khiển.
2. Mở **Trung tâm điều khiển → Điều khiển từ xa & Thiết lập**, quét QR bằng điện thoại cùng LAN.
3. Trang điều khiển chạy trên TV; khi TV đang bật không cần PC cài đặt tiếp tục chạy. Thử điều hướng, âm lượng, stream và tải screenshot.
4. Chọn **Hình nền & vị trí thời tiết** để đổi ảnh/crop/slideshow, hai địa điểm và thành viên gia đình. Lưu thành viên rồi đóng/mở lại lịch trên TV.
5. LGWS có yêu cầu tương thích riêng (root/Homebrew và webOS 5+). Nếu cài lỗi, đọc báo cáo và [hướng dẫn dự phòng qua Homebrew](CHANGELOG-v3.3.0.md). Bộ cài không tự bật chặn Voice Services/ThinQ trên TV khác.
6. FPT Play, TV360, Netflix cần tự cài và đăng nhập; không có tài khoản/thuê bao đi kèm.
7. Muốn WoL: bật Mobile TV On / Turn on via Wi-Fi hoặc LAN nếu TV có hỗ trợ; giữ TV cắm điện. Chạy Wake-TV đã tạo từ **thiết bị khác cùng LAN**. TV tắt thì trang web trên TV cũng tắt; xem [giải thích và bước kiểm tra](CHANGELOG-v3.3.0.md).

## 4. Khi có lỗi

| Hiện tượng | Cách kiểm tra |
|---|---|
| PS1 mở Notepad | Mở `Start-Setup.cmd` |
| CMD báo thiếu file | Tải PS1 mới, đặt cùng CMD mới |
| Connection timed out | TV bật, IP đúng, cùng LAN; tránh Wi-Fi khách chặn thiết bị |
| Authentication failed ở nhánh 2/3 | Dùng mật khẩu/khóa SSH root của TV, không dùng passphrase Developer Mode |
| Wrong TV ở bản cũ | Tải lại cả hai file 3.3.0 mới, chọn 2; không ép sửa profile |
| ABI/Node/API không hỗ trợ | Đọc báo cáo; ghi model/firmware và lỗi để hỏi |
| Device or resource busy | Dừng các phiên capture/stream khác, thử lại và xem dòng stream-capture |
| QR không mở | TV bật, điện thoại cùng LAN; quét lại nếu IP TV đổi |
| Checksum mismatch | Tải lại file cùng release, không trộn bộ cài cũ/mới |

Gửi issue kèm model, firmware, lựa chọn 1/2/3 và lỗi liên quan. Che passphrase, QR/token, mật khẩu và khóa SSH.

<a id="advanced"></a>
## Tùy chọn nâng cao — không bắt buộc

<details>
<summary>Chỉ mở khi cần chỉ định khóa riêng, backup hoặc thao tác quản trị</summary>

Mở PowerShell trong thư mục có bộ cài. Thay IP/đường dẫn bằng thông tin của bạn:

```powershell
# Chỉ khi cần chỉ định một khóa riêng chưa được bộ cài lưu
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.100 -RootKeyPath "C:\KhoaCuaToi\tv.pem"

# Kiểm tra gói trên PC, không kết nối TV
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Prepare

# Backup riêng
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Backup -HostName 192.168.1.100

# Đồng bộ icon sau khi cài thêm app
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Sync -HostName 192.168.1.100

# Tắt tùy chỉnh, không unroot/factory reset
powershell -NoProfile -ExecutionPolicy Bypass -File .\MAC-WebOSTV-AutoSetup.ps1 -Mode Disable -HostName 192.168.1.100
```

Sau Disable, mở lại CMD, chọn 2 để cài/bật lại. Không chia sẻ backup cá nhân.

</details>
