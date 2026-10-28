# GathinTV · MAC-WebOSTV

Giao diện lấy cảm hứng từ macOS cho TV LG webOS tương thích. **Chọn thiết bị bạn dùng để cài bên dưới.** TV và thiết bị cài cần cùng Wi-Fi/LAN.

**Tiếng Việt** | [English](README.en.md) · Phiên bản **3.4.2**

| Bạn đang dùng | Bắt đầu tại đây | Cần tải gì? |
|---|---|---|
| **Máy tính Windows** | **[Cài trên Windows →](windows/README.md)** | Một file ZIP, giải nén rồi mở `Start-Setup.cmd` |
| **Điện thoại Android** | **[Cài trên Android / Termux →](android/README.md)** | Chạy lệnh trong Termux; không tải file Windows |
| Linux / macOS | [Hướng dẫn shell](android/README.en.md) | Bash và Node.js 20+ |

**Chỉ muốn cài? Không cần bấm Code → Download ZIP hay mở các thư mục mã nguồn.** Dùng đúng hướng dẫn theo thiết bị ở bảng trên.

![Giao diện GathinTV](docs/screenshots/launcher-preview.jpg)

## Trước khi cài

- **TV đã root:** chọn nhánh đã root trong setup; không cần cài lại Developer Mode hay factory reset.
- **TV chưa root:** bật **Dev Mode Status**, cho reboot rồi bật **Key Server**. Setup kiểm tra trạng thái, tự đọc model/firmware sau xác thực và báo khả năng root; không phải mọi TV LG đều hỗ trợ. [Hỗ trợ DangBro](docs/DANGBRO.md).
- Phần cứng đã kiểm chứng: **55SK8000PTA / firmware 05.50.70**. Model khác dùng kiểm tra khả năng và có thể bỏ qua tính năng riêng; C2 chưa được kiểm chứng cài/rollback trên TV thật.

## Tài liệu cần dùng

| Nội dung | Liên kết |
|---|---|
| Tính năng, giao diện và ảnh | [Xem trước](docs/OVERVIEW.vi.md) · [Cách sử dụng](docs/FEATURES.vi.md) |
| Backup / khôi phục | [Hướng dẫn Rollback](docs/ROLLBACK.vi.md) |
| Thay đổi 3.4.2 | [Rollback và bản sửa YouTube AdFree](docs/CHANGELOG-v3.4.2.md) |
| Khắc phục lỗi, tương thích | [Mục lục tài liệu](docs/README.md) |
| Sửa mã nguồn / tự build | [Hướng dẫn phát triển](docs/DEVELOPMENT.vi.md) |

## Mã nguồn nằm ở đâu?

`windows/` và `android/` là hai lối cài đặt. `payload/` chứa launcher/dịch vụ TV; `lib/`, `scripts/`, `config/`, `packages/`, `upstream/` là thành phần dùng chung để build và chạy bộ cài; `test/` là kiểm thử. File bộ cài đóng gói nằm trong [Releases](https://github.com/twentykhz/macosLG/releases/latest).
