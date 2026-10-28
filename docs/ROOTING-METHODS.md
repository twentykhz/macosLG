# Kiểm tra root và phương pháp dự phòng / Root checks and fallback methods

## Trước khi root

Setup hỏi đúng **model TV** và **firmware đang cài**, rồi đọc dữ liệu đang được triển khai tại [CanI.RootMy.TV](https://cani.rootmy.tv/). Sau khi đăng nhập TV, thông tin thực tế được đối chiếu và kiểm tra online lại trước khi chạy exploit. Dữ liệu được đọc dưới dạng JSON từ source map của website; không thực thi JavaScript tải từ website trên PC.

- **Có thể root:** có ít nhất một cách phần mềm được dữ liệu xác nhận phù hợp. Đây không phải bảo đảm exploit sẽ thành công.
- **Không có cách root phần mềm đã biết:** không có cách phù hợp cho đúng model, vùng OTAID, codename và firmware đã nhập. Setup dừng trước khi chạy exploit.
- **Chưa xác định:** model không có dữ liệu chính xác, firmware mới hơn bản được xác nhận, website thay đổi định dạng hoặc không truy cập được. Setup dừng; không suy đoán từ model/vùng tương tự và không dùng cache cũ để khẳng định root được.

TV đã có root được xác minh bằng `id -u = 0` và không chạy lại exploit. Kiểm tra tương thích của từng công cụ gốc được giữ nguyên. Model khác TV tham chiếu dùng nhánh cài theo khả năng thực tế, không áp tinh chỉnh debloat/privacy riêng của TV mẫu.

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
| [SlopBro](https://github.com/throwaway96/slopbro), [DangBro](https://azoffshowy.github.io/dangbro/), [ASM](https://github.com/illixion/root-my-webos-tv), [MVPD](https://github.com/throwaway96/mvpd-autoroot/) | Nếu cani xác nhận phù hợp, đưa vào lượt hướng dẫn dự phòng. DangBro chỉ được chọn khi dữ liệu model xác nhận tuner DVB. |

Sau bước thủ công, nhập `XONG` / `DONE` để kiểm tra root, `TIEP` / `NEXT` để bỏ qua, `DUNG` / `STOP` để dừng. Không phân biệt hoa/thường. Setup kiểm tra quyền root qua Homebrew hoặc SSH root trước khi cài tiếp; dòng “rooting complete” hay câu trả lời của người dùng không thay thế phép kiểm tra này. Khi đã xác minh root, các cách tiếp theo không được chạy.

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

Choose English or unaccented Vietnamese before the installation branch. Setup checks the exact model/firmware against the live CanI.RootMy.TV dataset, then rechecks the authenticated TV before any exploit. Known compatible, no known software method, and unknown are separate outcomes. Unknown or patched status does not authorize an automatic attempt.

faultmanager is preferred. A completed failure is shown and logged before the next eligible method. USB/browser methods require user actions and official instructions; NVM cannot be automated by a PC script. Each eligible method is attempted once. Root UID 0 must be verified before continuing, including after a partial failure or a skipped manual step. An uncertain in-flight exploit stops the sequence rather than starting another exploit concurrently.

If Developer Mode is unavailable, guided alternatives can be offered after a successful exact-model preflight; an authenticated root connection must subsequently match that model/firmware. Existing root is reused. Default SSH password `alpine` is tried automatically when no key is used, with a hidden custom-password prompt only after rejection. `YES` and `CO` are accepted in either language, case-insensitively.

The fallback sequence has been tested using simulated failures and root checks. It has not been exercised by deliberately failing exploits, factory-resetting the reference TV, modifying TV hardware, or rooting a second TV.
