> Historical technical reference / Tài liệu kỹ thuật cũ. Current beginner guide / Hướng dẫn hiện hành: [Tiếng Việt](INSTALL.vi.md) · [English](INSTALL.en.md).

﻿# GathinTV AutoSetup 3.0

Một file `GathinTV-AutoSetup.ps1` chạy bằng PowerShell trên Windows 10/11 64-bit. Không cần cài Node.js, npm, Dev Manager hay USB root trước: script dùng Node đang có hoặc tải bản portable từ nodejs.org, kiểm tra SHA-256 rồi chạy.

Profile đã kiểm tra: **LG 55SK8000PTA · firmware 05.50.70 · webOS SDK 4.4.0 · M16PP_DVB_EU · Magic Remote hai kênh input · Python 2/ARM32**. Máy khác bị từ chối trước khi root/cài. Gửi file cho bạn bè được; chỉ áp dụng đầy đủ cho TV khớp profile này, không phải bộ cài chung cho mọi TV LG.

## Chuẩn bị trên TV sau reset

1. Kết nối TV với mạng. Nên cài FPT Play, TV360, Netflix từ LG Content Store trước nếu cần.
2. Cài Developer Mode, đăng nhập LG Developer, bật **Dev Mode Status**, để TV reboot theo yêu cầu.
3. Mở Developer Mode lại, bật **Key Server**, ghi IP và passphrase 6 ký tự.

Đây là thao tác trên TV mà script PC không thể tự làm trước khi có kết nối. **Nếu TV vẫn còn root, không cài lại Developer Mode:** dùng Restore/Backup bên dưới.

## Cài từ đầu

Mở PowerShell trong thư mục chứa file:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -HostName 192.168.1.11 -TrustNewHost
```

Nhập passphrase Developer Mode khi được hỏi (không hiện ký tự). Script dùng nguyên bản `faultmanager-autoroot` từ commit ghim trong `config/bootstrap.json`, giữ kiểm tra tương thích của exploit, cài Homebrew, xác minh root, tạo khóa SSH riêng cho TV, gỡ Developer Mode trước reboot, tự reconnect, cài YouTube AdFree/LGWS/launcher và tính năng, rồi reboot để hoàn tất. Không flash phân vùng, không factory reset, không tự lặp exploit khi lỗi.

Có Internet ở PC khi cần tải Node portable. Mã exploit, COPYING, IPK Homebrew/YouTube/LGWS và dependency SSH được nhúng sẵn cùng checksum. Không lấy script root mới ngẫu nhiên từ nhánh main khi chạy.

## Chế độ sử dụng

```powershell
# Chuẩn bị và kiểm tra bộ cài trên PC; không kết nối TV:
.\GathinTV-AutoSetup.ps1 -Mode Prepare

# Chỉ kiểm tra TV đang root, không ghi cấu hình/reboot:
.\GathinTV-AutoSetup.ps1 -Mode Doctor -HostName 192.168.1.11

# Backup cấu hình hiện tại về thư mục GathinTV-Backups cạnh file PS1:
.\GathinTV-AutoSetup.ps1 -Mode Backup -HostName 192.168.1.11

# TV còn root nhưng lỗi giao diện/chức năng: cài lại, không chạy exploit:
.\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.11

# Khôi phục đúng các file gốc trong backup riêng (kể cả font/giao diện riêng):
.\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.11 -BackupFile .\Gathin-SK8000-20261026.tar.gz

# Sau reset mất root: dùng backup riêng cùng quy trình root từ Developer Mode:
.\GathinTV-AutoSetup.ps1 -HostName 192.168.1.11 -TrustNewHost -BackupFile .\Gathin-SK8000-20261026.tar.gz

# Kiểm tra kế hoạch Setup mà chưa ghi lên TV:
.\GathinTV-AutoSetup.ps1 -HostName 192.168.1.11 -AlreadyRooted -DryRun

# Tùy chọn xóa app ngoài danh sách giữ lại; mặc định KHÔNG xóa app riêng của bạn bè:
.\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.11 -RemoveExtraApps

# Mở Store gốc để cài các app thương mại còn thiếu:
.\GathinTV-AutoSetup.ps1 -Mode Apps -HostName 192.168.1.11
# Sau khi cài xong, đồng bộ icon và bật lại bảo vệ SDP:
.\GathinTV-AutoSetup.ps1 -Mode Sync -HostName 192.168.1.11

# Giải phóng chặn phím/runtime tùy biến khi cần chẩn đoán:
.\GathinTV-AutoSetup.ps1 -Mode Disable -HostName 192.168.1.11

# Xem/chỉnh toàn bộ source được nhúng:
.\GathinTV-AutoSetup.ps1 -Mode Extract -OutputDirectory .\GathinTV-source
```

Nếu PowerShell chặn chạy trực tiếp, dùng tiền tố `powershell -NoProfile -ExecutionPolicy Bypass -File` như lệnh cài đầu tiên. Thêm `-RootKeyPath` để dùng khóa riêng; nếu chưa có khóa, chế độ root hỏi mật khẩu SSH kín. `-TrustNewHost` chỉ dùng lần ghép máy mới/sau reset; reconnect bắt buộc đúng fingerprint. `-NoReboot` bỏ reboot cuối. `-PortableNode` ép dùng Node portable để chuẩn bị một PC chưa có Node.

## Các tính năng được đóng gói

- Launcher/dock/icon, HDMI 3, thời tiết và lịch âm hiện tại; dock trái/phải đi vòng, Lên để vào ba nút trên.
- Chặn Home/Back trước compositor: Home về Gathin; Back từ app khác về Gathin, trong bảng điều khiển vẫn đóng bảng. Có kiểm tra hai kênh remote và ABI trước khi grab.
- Action Center: bấm OK bật/tắt Wi-Fi/Bluetooth, giữ để vào cài đặt; trạng thái/tên kết nối; chế độ hình ảnh, độ sáng đèn nền và âm lượng. Helper chỉ nghe localhost, token riêng cho từng TV.
- Voice: bỏ bảng kết quả LG, tìm trực tiếp trong YouTube đang chạy; mở/đóng app, HDMI, tắt/reboot, âm lượng/đèn nền 0–100 và số đọc tiếng Việt; “mở ti-vi” = HDMI 3.
- LGWS chạy ngầm lúc boot, thông báo native “LGWS Enable” góc trái trên trong 3 giây sau khi áp dụng xong. Giữ voice, AirPlay/LAN; bộ lọc DNS bổ sung không tương thích được giữ tắt.
- Khóa các tiện ích firmware không dùng, tắt preload, lịch phát sóng/hỗ trợ từ xa; giữ renderer warm cache và các dịch vụ phát hình/tiếng, remote, mạng, Bluetooth, AirPlay, root.

Danh sách giữ khi dùng `-RemoveExtraApps`: Gathin, YouTube, trình duyệt, FPT Play, TV360, Netflix, AirPlay, Homebrew và LGWS. HDMI/Settings là thành phần hệ thống. App firmware chỉ đọc được khóa, không xóa khỏi squashfs và không tạo dung lượng trống giả.

## Backup và chia sẻ

**Chỉ cần gửi `GathinTV-AutoSetup.ps1` cho bạn bè**, kèm hướng dẫn nếu muốn. `GathinTV-Source.zip` là bản source/dependency tương ứng để xem và tự build. File `.sha256` cho phép kiểm tra tải/copy đúng.

Không gửi thư mục `%LOCALAPPDATA%\GathinTV\state`: chứa khóa SSH riêng, fingerprint và log của máy bạn. Backup cá nhân để riêng. Bộ share không chứa tài khoản, cookie, Wi-Fi password, khóa SSH hay token điều khiển của TV nguồn. Token mới được sinh khi cài/restore.

Backup là **cấu hình + mã giao diện/tính năng**, không phải ảnh nguyên phân vùng và không chứa tài khoản YouTube/Netflix, thuê bao FPT/TV360, dữ liệu Wi-Fi hay firmware. Sau factory reset phải đăng nhập/cài app Store lại. Bộ cài không giả mạo quyền cài các ứng dụng thương mại hoặc sao chép tài khoản cho bạn bè.

Bản chia sẻ dùng **Inter (OFL)** thay SF Pro; các chức năng và bố cục giữ nguyên. Backup riêng của chủ TV giữ file/font gốc. Thay địa điểm thời tiết trong `config/weather.json` và build lại source nếu dùng địa phương khác.

## Kiểm thử và giới hạn

Kiểm tra nguồn: `npm ci`, `npm test`, `npm run verify`. Build launcher bằng `npm run build`; build file một cục bằng `npm run package`. Builder chỉ chọn thư mục code/payload/dependency, không gom `.local`, private keys, token hoặc database vào gói share.

Các chức năng gốc đã chạy trên TV nguồn; gói này đã kiểm tra parser, checksum, định tuyến, staging, giải nén PowerShell và read-only preflight. **Chưa factory reset rồi chạy lại exploit thật trong phiên này.** Root phụ thuộc firmware còn lỗ hổng và nguồn upstream; không khẳng định cài được trên model khác. Không dùng tùy chọn bỏ kiểm tra để ép vào máy chưa được hỗ trợ.

Nguồn root: https://github.com/throwaway96/faultmanager-autoroot . Kiểm tra tình trạng firmware: https://cani.rootmy.tv/ .
