# 3.6.0 SlopBro refresh validation

209 automated tests pass with zero skips on this build host. Added pinned SlopBro source/SDK selection, HTTP payload scope, UID/completion evidence, genuine root probe, faultmanager-first fallback, uncertain-state stop, SSAP pairing/key reuse and denied Developer Mode fallback tests. No physical SlopBro TV root was performed. Previous 3.6.0 validation follows.

# 3.6.0 validation

199 automated tests pass with zero skips on this build host. Includes real upload-validator transport, WAM startup script, output-specific audio/readback, physical HDMI inventory, HOME observer policy and dark-frame regressions. No new physical NANO753PR test was performed. Full device rollback, cold boot and voiceconductor routing remain unverified. See [3.6.0 changes](CHANGELOG-v3.6.0.md). Historical evidence follows.

# 3.5.0 validation

189 automated tests pass without skips, including simulated ARM64 installation/rollback without Python, dependency ABI rejection, portable voice routing and privacy/debloat state handling. ARM32/ARM64 ELF loader/hash checks and Windows helper self-test pass. No physical UM7400 cold boot, input, recognition or FPS validation was performed. See [3.5.0 changes](CHANGELOG-v3.5.0.en.md). Historical evidence follows.

# Kiểm chứng MAC-WebOSTV

**Tiếng Việt** | [English](VALIDATION.en.md)

## Rollback chủ động và tài liệu hai ngôn ngữ (3.4.2)

142/142 test pass trên Node 24 và Node 20.20.2, không bỏ qua test. Test mới kiểm tra chọn/deduplicate backup đúng TV, xác nhận CO/YES và hủy, bắt buộc session/xác nhận khi không tương tác, từ chối snapshot thiếu fingerprint hoặc sai checksum, chuyển tham số có dấu cách qua Bash và chọn mục 4 trong menu PowerShell thật. Fixture C2 chạy cả DryRun không ghi TV và rollback thủ công bằng engine Node thực tế trên filesystem mô phỏng.

Không cài lại hoặc rollback trên TV thật trong lần cập nhật này. Dữ liệu kiểm chứng 3.4.1 và lịch sử bên dưới được giữ riêng theo phiên bản.

## Tương thích TV đã root không bắt buộc Python (3.4.1)

135/135 test tự động pass trên Node 24 và Node 20.20.2 chính thức, không bỏ qua test. `npm run verify` xác minh đủ 147 file payload/package. Test bao gồm profile mẫu, C2/O22 aarch64 không Python, TV chỉ sao lưu tối giản, thiếu công cụ checksum, upload có kiểm tra thật, Setup tương thích qua SSH mô phỏng, lỗi sau khi thay đổi, rollback Node portable và hoàn tác khi rename lỗi. Các test Python rollback/bảo toàn dữ liệu cũ vẫn được bật.

Helper portable, bridge điều khiển Luna và bộ theo dõi HDMI cũng qua kiểm tra cú pháp; API health của controls chạy được trên Node Windows 0.12.18 chính thức đã xác minh checksum. Đây là kiểm tra mức runtime/ngôn ngữ cũ, không phải thử trên TV thật. Kết nối SSH chỉ đọc tới TV mẫu timeout trước handshake; không cài hoặc thay đổi TV. C2 vẫn là fixture hồi quy cho đến khi người dùng xác nhận thử bản vá trên phần cứng thật. [Điều tra, audit Python/native và giới hạn](PYTHON-COMPATIBILITY.md).

## Dùng chung host Windows / Android (3.4.0)

116 test tự động pass trên Node 24 và Node 20.20.2 chính thức, bao gồm chuyển cờ Bash, đường dẫn backup dự phòng Termux, chọn path Windows/Linux/Android/macOS, ZIP/tar POSIX, từ chối archive sai hoặc download không đúng pin, kiểm tra cache, giải mã khóa và SSH thuần JS, chuyển tiếp inspector WebSocket trên Node 20. Test hồi quy Windows vẫn được bật trên Windows; kiểm tra Python dùng Python 3 nếu có.

Kiểm tra TV thật đầu tiên của bản port là Doctor qua Bash và core chung từ máy Windows. Lệnh thành công mà không ghi file TV, capture, gửi input, cài đặt hoặc reboot. Đã kiểm tra root, launcher, audio, picture, brightness, network, Bluetooth và HTTP; API service-info của network-input vẫn cần chú ý trên firmware mẫu. Capture và điều khiển vật lý cần kiểm tra thủ công. Đây không phải thử phần cứng Android/Termux hoặc macOS, cũng không phải cài mới root/Restore lên TV. Tar POSIX qua giải nén bằng tar hệ thống và đủ 145 hash; ZIP mới qua Windows single-file Prepare. `npm ci` runtime riêng cài sáu gói JS bắt buộc mà không cần build script hoặc phụ thuộc tùy chọn.

Runtime portable chỉ dùng các gói JS bắt buộc trong cây production dependency. Tăng tốc native tùy chọn và CLI phát triển không được đóng gói vào runtime. Android/Linux dùng Node hệ thống >=20, tar ghim checksum và state riêng ngoài source. Windows giữ entrypoint PowerShell và cấu hình runtime portable. Lịch sử kiểm chứng cũ ở dưới.

## Lịch sử 3.1 / 3.1.1 (27-10-2026)

- Đồng bộ 125 file runtime tĩnh từ TV mẫu; không cài lại, reboot, reset hoặc chạy lại exploit trong đợt làm mới source này.
- Build lại launcher IPK và xác minh 141 checksum payload/package.
- 45/45 test tự động pass: thứ tự root, Restore bị gián đoạn, SSH/hash, token/IP riêng từng TV và cấu hình gia đình.
- PowerShell single-file Prepare pass: hash ZIP nhúng và checksum payload sau giải nén được xác minh; không kết nối TV.
- Source công khai không chứa access token của chủ TV, MAC Wi-Fi/Ethernet, endpoint PC/VPN, private key root hoặc state/log runtime. Ngày gia đình được thay bằng mẫu có thể sửa.
- Module runtime giữ tương thích với Node 0.12 / Python2 của webOS mẫu; remote HTTP dùng Node core, không dựa vào HTTP/threading Python không có trên TV.
- Cài sạch sau reset xuất xưởng trên TV thứ hai chưa được thử; giữ kiểm tra hardware/profile/firmware.

Chuẩn bị repository công khai: kiểm tra liên kết local của trang giới thiệu và hướng dẫn cài đặt/tính năng/source hai ngôn ngữ; AutoSetup sinh ra nằm trong Releases; thêm Start-Setup.cmd và xác nhận kết nối lần đầu. Bản 3.1.1 phục hồi font SF Pro do chủ TV cung cấp và giữ Inter dự phòng. Điều khoản font riêng với giấy phép mã nguồn.

## Kiểm chứng 3.2.0

54 kiểm tra tự động pass, gồm mô phỏng chọn khả năng UK6340/LM18A, tính năng suy giảm và thứ tự nhánh TV đã root không exploit/reboot. Không khẳng định đã kiểm chứng trực tiếp trên 55UK6340PTF của chủ TV.

## Kiểm chứng 3.3.0

Test hồi quy offline bao gồm cài TV đã root khác model, chuyển JPEG sang JPG dự phòng khi capture và dọn file tạm, kiểm tra/lưu ngày gia đình. Installer ghi riêng kết quả đã xác minh / cần chú ý / cần thử thủ công trên TV đích. Input phần cứng, FPS stream duy trì và Wake-on-LAN từ standby chưa được thử trên TV thứ hai từ máy này. Xem [ghi chú 3.3.0](CHANGELOG-v3.3.0.md).

## Kiểm chứng 3.4.0

90 kiểm tra tự động pass, gồm chọn HDMI theo thời gian xem; loại standby/lỗi đọc/suspend; giữ lựa chọn ổn định khi hòa; nhãn tile động; chọn HDMI tường minh; xác thực SSH mặc định/tùy chỉnh; phân tích dữ liệu rootability đúng model; firmware đã vá hoặc chưa rõ; thứ tự phương án root; xác minh root từng phần; dừng khi chưa rõ trạng thái thực thi; ngôn ngữ/xác nhận và log đầu ra.

Mã tracker/voice compile trên Python2 của TV mẫu; hàm chọn thời lượng chạy tại đó mà không ghi file. TV trả `Active` từ API power và có input picker gốc. Đã kiểm tra dữ liệu CanI.RootMy.TV trực tiếp, checksum ZIP DejaVuln tùy chọn, hai ngôn ngữ setup và dừng với model không biết trong bộ cài. IPK/checksum và đóng gói single-file pass. Chưa thử exploit dự phòng, root USB/browser hoặc NVM phần cứng trên TV. Chưa kiểm tra xem liên tục qua standby/reboot hoặc cài sạch sau factory reset.
