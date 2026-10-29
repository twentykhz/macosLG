# Kiểm tra root và phương pháp dự phòng / Root checks and fallback methods

## Trước khi root

Setup mặc định **tự đọc model TV và firmware sau khi xác thực**, không hỏi người dùng nhập. Với TV chưa root, trước tiên bật **Dev Mode Status**, cho TV reboot rồi mở lại ứng dụng và bật **Key Server**. Bộ cài kiểm tra độc lập SSH Developer Mode và khóa do Key Server trả về, báo kết quả và cho kiểm tra lại sau khi bật. Xác thực thành công mới xác nhận dịch vụ Dev Mode hoạt động; mất kết nối không đồng nghĩa chắc chắn công tắc đang tắt. Xem [quy trình chính thức của LG](https://webostv.developer.lge.com/develop/getting-started/developer-mode-app).

Thông tin thực tế được tra cứu tại [CanI.RootMy.TV](https://cani.rootmy.tv/) và kiểm tra trước khi chạy exploit. Có thể chỉ định model/firmware thủ công bằng các tham số nâng cao; dữ liệu nhập vẫn phải khớp TV sau đăng nhập. Dữ liệu website được đọc dưới dạng JSON; không thực thi JavaScript của website trên PC.

- **Có thể root:** có ít nhất một cách phần mềm được dữ liệu xác nhận phù hợp. Đây không phải bảo đảm exploit sẽ thành công.
- **Không có cách root phần mềm đã biết:** không có cách phù hợp cho đúng model, vùng OTAID, codename và firmware đã nhập. Setup dừng trước khi chạy exploit.
- **Chưa xác định:** model không có dữ liệu chính xác, firmware mới hơn bản được xác nhận, website thay đổi định dạng hoặc không truy cập được. Setup dừng; không suy đoán từ model/vùng tương tự và không dùng cache cũ để khẳng định root được.

TV đã có root được xác minh bằng `id -u = 0` và không chạy lại exploit. Kiểm tra tương thích của từng công cụ gốc được giữ nguyên. Mọi model dùng chung luồng tính năng 3.5.0: HOME, boot, voice, debloat và privacy đều có preflight riêng theo phần cứng/API.

## Thứ tự và thao tác

Nguồn danh sách: [webOSBrew Rooting](https://www.webosbrew.org/rooting/); các cách bổ sung đang có trong dữ liệu cani cũng được liệt kê. Mỗi cách phù hợp được thử tối đa một lần trong phiên. Cách bị vá, không tương thích hoặc chưa rõ được ghi là bỏ qua.

| Cách | Setup thực hiện |
|---|---|
| [faultmanager](https://github.com/throwaway96/faultmanager-autoroot) | Ưu tiên đầu tiên, tự chạy bản đã ghim commit/SHA-256 qua Developer Mode SSH. Hiện stdout/stderr và lưu log ngay khi chạy. |
| [DejaVuln](https://github.com/throwaway96/dejavuln-autoroot) | Tải release ZIP 0.0.10 đã ghim SHA-256 về PC; hướng dẫn giải nén vào USB và mở file MP3 đặc biệt trên TV. Người dùng phải chuẩn bị/cắm USB và thao tác TV. |
| [WTA](https://gist.github.com/throwaway96/b171240ef59d7f5fd6fb48fc6dfd2941) | Hướng dẫn quy trình USB/khởi động và mục Homebrew Channel từ nguồn gốc. PC không tự cắm USB hoặc thay thế lần boot cần thiết. |
| [crashd](https://gist.github.com/throwaway96/e811b0f7cc2a705a5a476a8dfa45e09f) | Hiện hướng dẫn legacy và điều kiện Developer Mode. Hướng dẫn đã ngừng bảo trì, Developer Mode mới có thể chặn điều kiện cần; không tự vá jail hoặc hạ cấp. |
| [RootMy.TV](https://rootmy.tv/) | Hướng dẫn mở và thực hiện trên trình duyệt TV nếu đúng firmware còn phù hợp. |
| [GetMeNow](https://www.webosbrew.org/rooting/getmenow/) | Liệt kê trạng thái từ dữ liệu; chỉ hướng dẫn khi dữ liệu xác nhận phù hợp. Không coi firmware/Developer Mode mới là chưa vá. |
| [NVM](https://gist.github.com/throwaway96/827ff726981cc2cbc46a22a2ad7337a1) | Ghi rõ cần thao tác phần cứng chuyên môn; không chạy tự động hoặc sửa NVRAM từ setup. |
| [SlopBro](https://github.com/throwaway96/slopbro) | Tự động ngay sau faultmanager nếu đúng model/firmware còn phù hợp. Dùng phiên Dev Mode đã xác thực, tự chọn app theo SDK/inventory, phục vụ payload ghim checksum và kiểm tra root; fallback ghép đôi SSAP khi firmware chặn mở app qua Dev Mode. Có thể cần bấm chấp nhận trên TV. |
| [ASM](https://github.com/illixion/root-my-webos-tv), [MVPD](https://github.com/throwaway96/mvpd-autoroot/) | Nếu cani xác nhận phù hợp, đưa vào lượt hướng dẫn dự phòng. |

Sau bước thủ công, nhập `XONG` / `DONE` để kiểm tra root, `TIEP` / `NEXT` để bỏ qua, `DUNG` / `STOP` để dừng. Không phân biệt hoa/thường. Dòng “rooting complete” / “Payload complete” hoặc xác nhận đã làm xong không thay thế kiểm tra UID 0, nhưng sẽ chuyển setup sang **chờ xác minh root**, không thử exploit khác khi SSH chưa sẵn sàng. Bật **SSH Server** trong Homebrew, gỡ app Developer Mode trước khi reboot rồi kiểm tra lại. [Xử lý HOME / root đang chờ](HOME-ROOT-RECOVERY.md).

Nếu faultmanager mất kết nối hoặc hết thời gian khi chưa biết tiến trình trên TV đã dừng hay chưa, setup ghi trạng thái chưa rõ và dừng để tránh chạy hai exploit chồng nhau. Đây không được tính là một thất bại đã hoàn tất để chuyển cách ngay.

## Ngôn ngữ và log

Mở `Start-Setup.cmd`, chọn `1 - English` hoặc `2 - Tieng Viet khong dau`, rồi chọn nhánh TV chưa root / đã root / kiểm tra. Có thể truyền `-Language en` hoặc `-Language vi` khi chạy PS1 trực tiếp. Các câu hỏi chính và kết quả kiểm tra theo ngôn ngữ đã chọn; log công cụ bên ngoài giữ thông báo gốc để chẩn đoán.

Xác nhận kết nối chấp nhận `YES`, `yes`, `YeS`, `CO`, `co`, `Co`, kể cả khoảng trắng hai đầu.

Đường dẫn log được hiện trong cửa sổ. Dưới thư mục dữ liệu của setup:

- `state/logs/setup-*.log`: bản ghi câu hỏi và thông báo PowerShell.
- `state/logs/setup-*.runtime.log`: toàn bộ stdout/stderr của tiến trình Node và công cụ root, gồm lỗi và kết quả; không ghi stdin/mật khẩu nhập.
- `state/rootability/check-*.json`: dữ liệu TV, nguồn kiểm tra, trạng thái từng cách và thời điểm kiểm tra.
- `state/bootstrap/<mã-TV>/root-attempts.json`: kết quả từng lượt và lỗi xác minh root.
- `faultmanager-console.log`, `faultmanager-autoroot.log`, `faultmanager-autoroot-payload.log`: output và log phía TV nếu đọc được.

Mật khẩu nhập được ẩn và không được ghi vào cấu hình/log. Không công khai thư mục dữ liệu, khóa SSH hoặc log chưa kiểm tra thông tin riêng.

## English

Choose English or unaccented Vietnamese before the installation branch. Setup automatically reads the authenticated model/firmware by default. Unrooted TVs require Dev Mode Status enabled, its reboot completed, and Key Server enabled. SSH service and Key Server are probed independently; only authentication confirms working Developer Mode access. Unreachable services can indicate disabled/expired mode or a network issue. Setup then checks the actual identity against live CanI.RootMy.TV data before exploits. Unknown/patched status does not authorize an automatic attempt.

faultmanager is preferred. A completed failure is shown and logged before the next eligible method. USB/browser methods require user actions and official instructions; NVM cannot be automated by a PC script. Each eligible method is attempted once. Root UID 0 must be verified before continuing, including after a partial failure or a skipped manual step. An uncertain in-flight exploit stops the sequence rather than starting another exploit concurrently.

If Developer Mode readiness checks fail, enable Dev Mode Status, complete its reboot, enable Key Server and retry. After a compatible method is attempted, setup verifies authenticated root and TV identity. Existing root is reused without requiring Developer Mode. Default SSH password `alpine` is tried automatically when no key is used, with a hidden custom-password prompt only after rejection. `YES` and `CO` are accepted in either language, case-insensitively.

The fallback sequence has been tested using simulated failures and root checks. It has not been exercised by deliberately failing exploits, factory-resetting the reference TV, modifying TV hardware, or rooting a second TV.

## Nếu faultmanager thất bại thực sự

Chỉ chọn phương pháp mà dữ liệu trực tiếp xác nhận phù hợp. Nếu đã báo Rooting complete/Payload complete, bật Homebrew SSH và tiếp tục xác minh, không chuyển cách root.

**DejaVuln:** (1) Dùng ZIP release đã tải và kiểm hash; (2) giải nén để `autoroot.sh` nằm ngay gốc USB một phân vùng FAT32/NTFS, không lồng thêm thư mục; (3) chỉ cắm USB đó, mở bằng Music/Media Player; (4) mở thư mục tên đặc biệt rồi phát MP3 bên trong, lỗi phát là bình thường; (5) khi báo root hoàn tất, tháo USB, kiểm tra Homebrew Root OK, bật SSH, gỡ app Developer Mode trước reboot rồi nhập XONG tại setup. Nếu không có báo hoàn tất, xem `autoroot.log` trên USB. [Hướng dẫn chính thức](https://github.com/throwaway96/dejavuln-autoroot#instructions).

**WTA:** (1) Chuẩn bị USB FAT32/NTFS; (2) nếu Homebrew đã cài qua Developer Mode, làm đúng mục Homebrew Channel trong hướng dẫn gốc để tạo `wta_usb.sh` ở gốc USB, LF và shebang; (3) cắm USB, thực hiện reboot thật, chờ script; (4) kiểm tra Root OK, bật SSH và gỡ Developer Mode trước lần reboot tiếp theo; (5) nhập XONG để setup xác minh UID 0. Không coi việc tắt/bật nhanh là bằng chứng đã reboot. [Các bước và file mẫu chính thức](https://gist.github.com/throwaway96/b171240ef59d7f5fd6fb48fc6dfd2941).
