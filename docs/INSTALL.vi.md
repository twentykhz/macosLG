# Cài GathinTV từng bước trên Windows

[Trang chính](../README.md) · [English](INSTALL.en.md) · [Cách dùng tính năng](FEATURES.vi.md)

Nếu bạn chỉ muốn cài, làm lần lượt các bước dưới đây. Không cần biết Git, Node.js hay npm. Chưa root thì dùng nhánh A; đã root thì dùng nhánh B. Không phải factory reset TV trước khi cài.

## 1. Kiểm tra trước khi tải

Chuẩn bị TV LG webOS tương thích, remote, PC Windows 64-bit và Internet. Cắm PC vào nguồn nếu có thể, tắt chế độ ngủ trong lúc cài. TV và PC phải cùng mạng nhà; tránh Wi-Fi khách có chặn các thiết bị truy cập nhau.

**Profile tham chiếu:** LG 55SK8000PTA / firmware 05.50.70 / SDK 4.4.0 / M16PP_DVB_EU / ARM32. Không phải mọi TV LG đều được hỗ trợ. Trên TV, tìm Cài đặt → Tất cả cài đặt → Cài đặt chung → Giới thiệu về TV (tên mục có thể khác theo đời TV) để ghi model và phiên bản phần mềm. Khi không chắc, hỏi trong [Issues](https://github.com/twentykhz/macosLG/issues) trước; không thay profile để ép chạy.

Root là cấp quyền quản trị cho phần mềm tùy chỉnh. Bộ cài có các bước root cho profile phù hợp; nó không phải ứng dụng chính thức của LG. Không tắt nguồn hoặc rút dây khi bộ cài đang làm việc. Nếu báo lỗi thì ghi lại lỗi và dừng, không tự chạy lại exploit nhiều lần.

## 2. Tải đúng file từ GitHub

1. Mở [Releases mới nhất](https://github.com/twentykhz/macosLG/releases/latest).
2. Mở phần **Assets** nếu đang bị thu gọn.
3. Tải **`GathinTV-AutoSetup.ps1`**. Đây là bộ cài, không phải `Source code (zip)` do GitHub tự tạo.
4. Nên tải thêm **`Start-Setup.cmd`** để mở bộ cài bằng cách nhấp đúp.
5. Tạo thư mục dễ tìm, ví dụ `Desktop\GathinTV`, rồi chuyển hai file vào đó. Không đổi tên chúng.
6. Không cần giải nén file `.ps1`. Source ZIP dành cho người xem/chỉnh mã nguồn, không bắt buộc cho việc cài.

Windows có thể hiện phần mở rộng tên file hoặc ẩn nó. Trong File Explorer, bật View → Show → File name extensions nếu cần kiểm tra file không bị đổi thành `.ps1.txt`.

Nếu Windows chặn file vừa tải: chỉ sau khi kiểm tra file lấy từ đúng repo/release này, mở Properties của file → chọn Unblock nếu có → Apply. Nếu có thông báo bảo mật khác, kiểm tra nguồn và nguyên văn thông báo; không tắt bảo vệ toàn máy chỉ để chạy script.

## 3. Chọn tình trạng TV

| TV của bạn | Làm tiếp |
|---|---|
| Chưa từng root, hoặc vừa factory reset và mất root | [Nhánh A](#nhánh-a-tv-chưa-root) |
| Đã root, SSH root vẫn dùng được/Homebrew đã hoạt động | [Nhánh B](#tv-đã-root) |
| Không biết | Dừng lại, kiểm tra hoặc hỏi trước; đừng cài Developer Mode lên TV đã root |

## Nhánh A: TV chưa root

### A1. Tạo tài khoản LG Developer trên PC/điện thoại

1. Mở [webOS TV Developer của LG](https://webostv.developer.lge.com/).
2. Chọn **SIGN IN**. Đăng ký tài khoản nếu chưa có, xác minh email và hoàn tất các yêu cầu của trang LG.
3. Ghi nhớ email/mật khẩu để đăng nhập ứng dụng Developer Mode trên TV. Tài khoản này không phải tài khoản GitHub.

### A2. Cài Developer Mode trên TV

1. Kết nối TV vào mạng và kiểm tra giờ/ngày TV hợp lý.
2. Mở **LG Content Store / Apps** trên TV.
3. Tìm đúng ứng dụng **Developer Mode** do LG cung cấp, chọn Install/Cài đặt.
4. Mở ứng dụng, đăng nhập bằng tài khoản LG Developer vừa chuẩn bị.

### A3. Bật Dev Mode Status, rồi Key Server

1. Trong ứng dụng Developer Mode, bật **Dev Mode Status**.
2. TV sẽ yêu cầu khởi động lại; đồng ý và chờ TV lên lại.
3. Mở lại Developer Mode sau reboot.
4. Bật **Key Server**. Bước này phải làm sau khi TV đã lên lại, đừng chỉ bật Dev Mode Status rồi chạy bộ cài ngay.
5. **Ghi lại hoặc chụp riêng IP của TV và passphrase 6 ký tự trên màn hình.** Passphrase phân biệt hoa/thường; không đăng ảnh này công khai.

Quy trình và tên nút được đối chiếu với [hướng dẫn chính thức của LG](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app). Không cần tự chạy các lệnh CLI trên trang LG: AutoSetup xử lý phần kết nối của nó.

### A4. Chạy AutoSetup

1. Trên PC, mở thư mục có hai file đã tải.
2. Nhấp đúp **`Start-Setup.cmd`**. Cửa sổ sẽ chạy `GathinTV-AutoSetup.ps1` trong cùng thư mục.
3. Khi hỏi **TV IP address**, nhập IP của TV vừa ghi, rồi Enter. Không nhập IP của PC/router.
4. Khi hỏi passphrase, nhập đúng **6 ký tự Developer Mode của TV này**, rồi Enter. Bạn không thấy ký tự/dấu sao khi gõ là bình thường.
5. Lần đầu kết nối, script yêu cầu kiểm tra IP TV và gõ **YES** (viết hoa) để chấp nhận host key mới. Chỉ gõ YES sau khi đối chiếu đúng IP trên TV của bạn. Khóa thay đổi sau reset phải được xác minh lại.
6. Để script chạy. Lần đầu PC có thể cần Internet để tải Node portable; bộ cài kiểm tra hash trước khi dùng.
7. TV có thể reboot theo từng giai đoạn; chờ bộ cài kết nối lại, không mở đồng thời bộ cài thứ hai.
8. Bộ cài xử lý gỡ Developer Mode ở giai đoạn cần thiết của luồng root. Không tự cài lại Developer Mode sau khi đã root thành công.

Nếu không dùng file CMD, mở PowerShell trong thư mục đó: bấm thanh địa chỉ File Explorer, gõ `powershell`, Enter. Sao chép lệnh sau, Enter:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1
```

Bộ cài sẽ hỏi IP; bạn không phải sửa nội dung file `.ps1`. Muốn truyền IP bằng lệnh, thay giá trị ví dụ bằng IP TV thật:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -HostName 192.168.1.100
```

`192.168.1.100` chỉ là ví dụ. Không dùng `-TrustNewHost` nếu chưa xác minh thiết bị/host key. Khi gặp lỗi, giữ cửa sổ, chép lỗi hoặc chụp ảnh đã che thông tin riêng; không nhấn chạy lại liên tục.

## TV đã root

**Không cài lại Developer Mode trên TV đã root.** [webOS Homebrew nêu rõ](https://www.webosbrew.org/pages/sdk-configuration) việc này có thể làm hỏng cấu hình root. Dùng Restore để cài/cập nhật giao diện, không chạy lại nhánh root mới.

1. Giữ TV và PC cùng LAN. Ghi IP hiện tại của TV.
2. Chuẩn bị khóa SSH root hoặc mật khẩu root của TV. **Passphrase Developer Mode không thay thế được mật khẩu root.**
3. Mở PowerShell trong thư mục có AutoSetup như mô tả ở A4.
4. Chạy, thay IP ví dụ bằng IP TV:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.100
```

Nếu dùng khóa riêng và bộ cài chưa tự tìm thấy khóa đã lưu:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.100 -RootKeyPath "C:\DuongDan\khoa-rieng-cua-tv.pem"
```

Thay cả IP lẫn đường dẫn khóa. Nếu TV còn dùng mật khẩu, nhập mật khẩu root của chính TV khi được hỏi; không điền mật khẩu vào README hoặc command line.

## 4. Cài xong thì làm gì?

1. Chờ thông báo hoàn tất, TV lên lại và launcher xuất hiện.
2. Thử HOME, dock và Action Center bằng remote. Một số app chỉ có icon khi chúng được cài trên TV.
3. Mở **Action Center → Điều khiển từ xa & Thiết lập**, dùng camera điện thoại quét QR, mở liên kết.
4. Điện thoại cùng Wi-Fi có thể dùng remote, đổi hình nền và hai địa điểm thời tiết. PC không cần bật để trang này hoạt động khi TV đang bật.
5. Cài/đăng nhập FPT Play, TV360, Netflix nếu cần. Bộ cài không cung cấp tài khoản hay thuê bao.
6. Lưu lại thư mục khóa và backup của bộ cài: mặc định dữ liệu PC ở `%LOCALAPPDATA%\GathinTV`. Không gửi thư mục này cho người khác.

Giao diện launcher hiện dùng tiếng Việt; bộ cài và thông báo hệ thống có thể dùng tiếng Anh. [Hướng dẫn tính năng](FEATURES.vi.md) giải thích cách dùng từng phần.

## 5. Kiểm tra, backup, Content Store và tắt tùy chỉnh

Trong các lệnh sau, thay `192.168.1.100` bằng IP TV. Luôn đứng trong thư mục có AutoSetup.

```powershell
# Chỉ kiểm tra bộ cài trên PC, không kết nối TV
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Prepare

# Xem tình trạng TV, không cài lại
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Doctor -HostName 192.168.1.100

# Lưu backup riêng
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Backup -HostName 192.168.1.100

# Mở Content Store theo luồng hỗ trợ, cài app xong chạy Sync
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Apps -HostName 192.168.1.100
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Sync -HostName 192.168.1.100

# Tắt các dịch vụ/tùy chỉnh riêng, không unroot hoặc factory reset
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -Mode Disable -HostName 192.168.1.100
```

Muốn bật lại sau Disable, chạy Restore. Backup không phải bộ cài để chia sẻ: nó có thể chứa ảnh/cấu hình cá nhân. Không xóa khóa riêng nếu vẫn muốn kết nối lại bằng khóa đó.

## Khi không chạy được

| Hiện tượng | Kiểm tra |
|---|---|
| Nhấp file PS1 lại mở Notepad | Dùng `Start-Setup.cmd` hoặc lệnh PowerShell A4; không đổi đuôi file |
| Không thấy Assets/bộ cài | Vào trang Releases, không dùng nút Code → Download ZIP cho việc cài thông thường |
| Connection timed out | TV đang bật? IP đúng? Chung LAN? Wi-Fi khách có chặn thiết bị? |
| Passphrase sai | Mở Developer Mode trên TV chưa root, bật Key Server; kiểm tra hoa/thường và đúng 6 ký tự |
| Authentication failed trên TV đã root | Dùng khóa/mật khẩu SSH root, không dùng mật khẩu LG hay passphrase Developer Mode |
| Wrong TV / Wrong hardware / ABI / firmware chưa kiểm chứng | Dừng; ghi model/firmware và lỗi để hỏi, không ép đổi profile |
| QR mở không được | TV phải đang bật, điện thoại cùng LAN, IP TV không đổi; thử quét lại QR sau khởi động lại |
| Không thấy FPT/TV360/Netflix | Cài app và đăng nhập riêng, rồi dùng Sync |
| Có script error/checksum mismatch | Tải lại hai file cùng một release; không trộn các phiên bản |

Khi gửi issue, che passphrase, QR, token, mật khẩu, tài khoản và khóa riêng. Ghi model/firmware, Windows, tên bước và nguyên văn lỗi để người khác hỗ trợ đúng chỗ.
