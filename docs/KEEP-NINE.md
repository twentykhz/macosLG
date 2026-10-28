# Mục 4 — Chỉ giữ 9 app chính trên TV đã root

[Windows](../windows/README.md) · [Android](../android/README.md) · [Rollback](ROLLBACK.vi.md)

Mục **4** cài YouTube AdFree và LGWS, rồi áp dụng danh sách giữ của TV mẫu SK8000PTA. Không cài lại launcher, không chạy exploit và không xóa app/tài khoản/dữ liệu.

| App giữ hoạt động | App ID |
|---|---|
| GathinTV | `com.gathin.tvhome` |
| YouTube AdFree | `youtube.leanback.v4` |
| Trình duyệt | `com.webos.app.browser` |
| FPT Play | `com.fpt.fptplay` |
| TV360 | `com.viettel.media.tv360` |
| Netflix | `netflix` |
| AirPlay | `airplay` |
| Homebrew Channel | `org.webosbrew.hbchannel` |
| LGWS | `ooo.lew.lifesgoodwithoutspying` |

Các app khác được yêu cầu khóa bằng SAM và đóng, bao gồm app bên thứ ba không có trong danh sách app phụ cũ, Music, Photo/Video và LG Content Store. Các app chính đang khóa được mở lại. Chỉ các thành phần hệ thống cần cho Settings, HOME dự phòng, giọng nói, remote, trình chạy app và các nguồn HDMI được giữ riêng; không tắt dịch vụ Linux tùy tiện. HDMI vẫn là nguồn vào TV, không phải app giải trí thứ mười.

Profile được lưu và chạy lại lúc boot. Báo cáo liệt kê `kept`, `disabled`, `failed`, `missing` và `unknownOriginal`. App không có trên TV được ghi `missing`, không bị coi là đã cài hoặc đã bật. FPT Play/TV360/Netflix cần cài và đăng nhập hợp lệ nếu chưa có. Chọn **7 — Apps** để tạm mở cửa hàng; profile khóa lại cửa hàng ở lần boot tiếp theo. Khóa lỗi được báo rõ và mục 4 trả về trạng thái cần kiểm tra, không báo thành công toàn bộ.

**5 — Rollback** chọn backup theo ngày giờ. Giữ nguyên thư mục state/backups: file `app-locks-before.json` lưu trạng thái khóa theo phiên, giúp hoàn tác qua nhiều lần tối ưu. Trạng thái cũ đọc được sẽ được phục hồi. Khi TV không cung cấp trạng thái khóa ban đầu, tool ghi rõ và rollback mở khóa do chính tác vụ đã áp dụng; không khẳng định phục hồi chính xác trạng thái không quan sát được.

Setup/Restore đầy đủ vẫn dùng profile app phụ thông thường. Profile giới hạn 9 app được chọn riêng tại mục 4.

## English

Menu **4** installs AdFree/LGWS and keeps the nine app IDs above enabled, locking and closing other installed apps. Essential system components and HDMI inputs remain available. It does not reinstall the launcher, root again or delete app data. The profile reapplies at boot, reports failed locks/missing apps, and stores app lock history beside the recovery snapshot. Menu **5** restores a dated backup; unknown original lock states are reported and project-applied locks are released on rollback. Menu **7 — Apps** temporarily unlocks Content Store when needed. Full Setup/Restore retains the ordinary optional-app profile.
