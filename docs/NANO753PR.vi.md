# LG 55NANO753PR — bằng chứng tương thích

| Mục | Giá trị được chủ máy cung cấp |
|---|---|
| Model / board | 55NANO753PR / K7LP_DVB_EU |
| Firmware / SDK | 03.53.45 / 6.5.3 |
| Build webOS | 6.5.3-47, chủ máy cung cấp |
| Kiến trúc / runtime | ARMv7, Node 8.12.0, Python 2.7.16 |
| Source report | 04ee5fe, report ngày 29/10/2026 |
| Mức xác nhận | runtime-tested-partial |

Đây là tóm tắt đã loại dữ liệu riêng tư từ report cục bộ, không phải log của lần cài 3.6.0 mới. Repo không chứa IP, token, SSH key, ảnh gia đình hay nội dung backup của chủ máy.

Report xác nhận một số API/runtime hoạt động sau vá cục bộ, đồng thời ghi nhận lỗi upload scope, quyền WAM, audio scenario/output, stock HOME/BACK, HDMI registry và Node 8 monitor. [3.6.0](CHANGELOG-v3.6.0.md) thêm kiểm thử hồi quy cho các trường hợp này.

Chưa xác minh physical HOME/BACK, cold boot, Wake-on-LAN, recognized-result adapter của voiceconductor và full rollback trên thiết bị. Không dùng profile này để cấy binary/QML từ SK8000 sang TV khác.
