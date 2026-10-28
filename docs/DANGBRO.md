# Historical reference — excluded from MAC-WebOSTV 3.5.0 root flow

This document records an older integration. Current setup does not offer or invoke DangBro. See [current root methods](ROOTING-METHODS.md).

# DangBro trong setup 3.4.2 / DangBro in setup 3.4.2

[Trang chính](../README.md) · [Root và phương pháp dự phòng](ROOTING-METHODS.md)

Nguồn gốc: [azoffshowy/dangbro](https://github.com/azoffshowy/dangbro) · [Giao diện upstream](https://azoffshowy.github.io/dangbro/).

## Tiếng Việt

DangBro là phương pháp qua trình duyệt, upstream công bố hỗ trợ **webOS 7.x đến webOS 25 trên TV DVB**. Chỉ model/webOS không đủ để bảo đảm root được; trang upstream phải kiểm tra đúng firmware và dịch vụ của TV.

Khi kết quả tra cứu xác nhận DangBro phù hợp, setup hiện hướng dẫn riêng: mở trang upstream bằng Chrome trên Windows/Android, nhập IP TV, chấp nhận ghép nối trên TV và làm theo kết quả của trang. Nếu báo lỗi WSS, kiểm tra chứng chỉ tại `https://IP_TV:3001/` của chính TV; không cần tắt bảo mật toàn trình duyệt. Setup không tải rồi thực thi mã DangBro trên máy tính.

Hoàn tất quy trình upstream, xác nhận **Root OK** trong Homebrew Channel, bật SSH rồi quay lại setup nhập **XONG**. Setup kiểm tra UID 0 và model/firmware thực tế trước khi tiếp tục. Upstream có bước gỡ Developer Mode và reboot; phải làm đúng thứ tự, không reboot TV đã root khi Developer Mode vẫn còn cài. Log chẩn đoán phía TV: `/tmp/dangbro-root.log`.

Nếu không dùng được Developer Mode để tự nhận diện ban đầu, có thể dừng setup, chạy trang DangBro theo kiểm tra của upstream, rồi mở lại setup chọn **TV đã root**. Đây là thao tác có người dùng ghép nối/điều khiển, không phải root âm thầm. TV đã root không bị bắt cài lại Developer Mode.

## English

DangBro uses a browser and TV pairing. Upstream lists webOS 7.x through webOS 25 on DVB TVs; its exact compatibility checks still apply. An eligible result in setup opens a dedicated instruction step, followed by independent UID-0 and TV-identity verification. Known non-DVB boards and pre-webOS-7 SDKs are skipped.

Use the upstream page, accept pairing on your TV, follow its Developer Mode removal/reboot order, confirm **Root OK**, enable SSH and return with **DONE**. Review only your TV's local certificate if WSS fails; global browser-security bypasses are unnecessary. No upstream exploit code is bundled or executed on the installer host.

If Developer Mode is unavailable, stop setup and use the upstream browser flow, then restart setup's **already-rooted** branch after verifying root. No physical DangBro rooting of another TV was performed to validate these instructions.
