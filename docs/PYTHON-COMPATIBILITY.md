# Tương thích không bắt buộc Python — 3.4.1

**Tiếng Việt** | [English](PYTHON-COMPATIBILITY.en.md)

## Điều tra và chuỗi gọi gây lỗi

Đoạn console được cung cấp xác nhận UID 0 trên OLED65C2PSA/O22_DVB_AJ, firmware 33.31.68, SDK 10.3.1, sau đó dừng với mã 127 và `sh: python: not found`. Hai file log trong `/mnt/data` không có trong workspace Windows; người dùng đã yêu cầu tiếp tục mà không cần chúng. Không khẳng định đã đọc hai file đó hoặc tái hiện lỗi trên C2 thật.

Source trước bản vá gọi:

```text
AutoSetup.template.ps1 → node scripts/run.js Setup
→ scripts/bootstrap.js main → lib/provision.js provision
→ AutorootSteps.captureInitialState → lib/recovery.js capture
→ ssh.exec("python -c " + đoạn mã tạo metadata đã quote)
```

`capture` gọi `os/json` bằng Python vô điều kiện, trước `rooted-compat.detect`. Đây là lệnh Python vô điều kiện đầu tiên trên nhánh Setup tương thích của TV đã root được báo lỗi. Mã 127 làm dừng cài đặt trước khi chọn tính năng theo khả năng thực tế. Những tiện ích Python vô điều kiện khác trong bảo toàn/cập nhật/dừng/dọn launcher, xác minh upload và rollback cũng có thể gây lỗi ở các bước sau.

## Kiến trúc dùng chung

PowerShell trên Windows và Bash trên Android/Termux/Linux/macOS vẫn gọi `scripts/run.js`. Node >=20 trên thiết bị chạy tool dùng `ssh2`; không bổ sung phụ thuộc SSH/SCP bên ngoài. TV dùng Node >=0.12 có sẵn của chính nó, độc lập với Node trên máy/điện thoại. Mã trên TV dùng ES5 và module tích hợp, không cần native Node addon.

`lib/tv-capabilities.js` thực hiện một lần kiểm tra chỉ đọc và lưu kết quả cho mỗi kết nối SSH. Nó kiểm tra UID, kiến trúc, đường dẫn công cụ, khả năng filesystem/crypto của Node, phiên bản Python/ABI input, kết quả hash, tar, stat/readlink và cấu trúc startup. Không cài trình thông dịch hoặc chạy exploit. Kết nối mới được kiểm tra lại. Python trong bước chỉ đọc dùng `-B` để không tạo file bytecode.

Metadata backup ưu tiên shell/stat/readlink, sau đó Node; Python2 được phát hiện chỉ là phương án dự phòng cũ. JSON được tạo trên host Node. Nhánh chỉ sao lưu tối giản cần shell/tar và thu thập đường dẫn trong phạm vi dự án; nhánh này **không cho phép thay đổi TV hoặc khẳng định có rollback**. Cài đặt cần root, tar, công cụ SHA hoạt động và engine khôi phục Node filesystem hoặc Python2 đã kiểm tra. Helper Node được upload có xác minh checksum và kiểm tra cú pháp trước thay đổi lâu dài của dự án.

Upload chọn công cụ trước khi gửi dữ liệu: `sha256sum → busybox sha256sum → Node crypto → Python hashlib đã phát hiện → từ chối`. Công cụ phải trả đúng hash đầu vào rỗng. Host so sánh SHA-256 của file tạm trên TV với file local trước chmod/rename. Archive đi qua SSH đã xác minh; host kiểm tra toàn vẹn gzip và tính SHA-256.

Khôi phục bằng Node kiểm tra fingerprint SSH, UID root, model/board/firmware, hash archive, các đường dẫn cho phép, loại/path trong tar, danh tính thư mục cha, filesystem staging và hash từng file. Dữ liệu tạm nằm ngoài thư mục ứng dụng và boot. Tool chỉ dừng tiến trình có đúng danh tính script của dự án, giữ quyền/owner/symlink, hoàn tác khi rename bị gián đoạn và chỉ khởi động lại runtime từng hoạt động trong snapshot. App dự án mới được cài được gỡ qua API Luna dạng subscription; không gỡ app không liên quan. Snapshot chỉ bao gồm phạm vi dự án, **không phải ảnh firmware hoặc toàn bộ trạng thái xuất xưởng**.

## Danh mục audit Python

Audit bao gồm source, script boot, map payload, toàn bộ file `.py`, script upstream, test và tài liệu. Chuỗi đường dẫn `.py` còn trong cấu hình/recovery dùng nhận diện file hoặc tiến trình TV mẫu cần sao lưu/dừng/khôi phục; chúng không gọi trình thông dịch trên C2.

| Nhóm | File / thành phần | Cách xử lý |
| --- | --- | --- |
| B: metadata / filesystem | `lib/recovery.js` | Shell/JSON trên host hoặc Node; Python2 chỉ là dự phòng đã phát hiện. |
| B: tính hash | `lib/ssh.js` | Chuỗi công cụ SHA đã kiểm tra; không gọi Python vô điều kiện. |
| B: bảo toàn, cập nhật, dọn và dừng | `lib/launcher-install.js`; `scripts/{preserve-app,promote-app,pause-runtimes}.py` | Ưu tiên `lib/portable-tv.js` và `scripts/tv-files.js`; script cũ chỉ dành cho TV có Python2 nhưng thiếu Node phù hợp. |
| B: khôi phục snapshot | `scripts/rollback-snapshot.py` | Ưu tiên Node; giữ phương án Python2 cũ và test hồi quy riêng. |
| B: gỡ app | `scripts/remove-devmode.py`, phần gỡ app trong rollback cũ | Dùng `lib/app-removal.js` và `ssh.removePackage`; script Python giữ cho công cụ/test cũ, không còn dùng trong bước gỡ Developer Mode thông thường. |
| B: xác minh cuối / thu source | `lib/autoroot.js`, `scripts/capture-baseline.js` | Node kiểm tra filesystem/danh tính tiến trình. Capture-baseline vẫn giới hạn vào profile TV mẫu. |
| C: cài đặt / tuning TV mẫu | `lib/advanced.js`, `scripts/install-advanced.py` | Kiểm tra đúng profile/ARM32/Python2 trước upload. Thành phần này cài helper Python, QML/ACL và tuning của mẫu; bị bỏ qua trên C2. |
| C: ABI input HOME | `payload/home/home-keyhook.py`; bản tương ứng trong `payload/advanced/files/home/root`; script boot/tắt HOME; probe/compile trong `scripts/tv.js` | Cần đúng model, board, firmware, ARMv7, Python2 mang tên `python`, ABI input 16 byte và probe input thực tế. Ngoài điều kiện đó giữ HOME gốc. |
| C: bridge điều khiển / quyền cũ | `payload/advanced/files/var/lib/webosbrew/gathin-controls/{bridge,permissions}.py`; init.d/38 | Giữ bridge mẫu; nhánh tương thích dùng `payload/portable/controls.js`, HTTP loopback có xác thực và API Luna cho phép, không vá ACL theo mẫu. |
| B/C: thời gian xem HDMI | `payload/advanced/files/var/lib/webosbrew/gathin-hdmi/track.py`; init.d/37 | Nhánh tương thích dùng `payload/portable/hdmi.js`; chỉ tính xem liên tục khi TV hoạt động, loại khoảng lấy mẫu quá dài, giữ lựa chọn ổn định khi bằng thời gian. |
| C: voice/QML TV mẫu | `home/root/gathin-youtube-voice-router.py`; `gathin-youtube-voice/{commands,disable-results}.py`; init.d/42,43; `home/root/gathin-lgws/{notify.py,boot.sh}` | Không triển khai trong chế độ tương thích. Không giả định module Python2, hành vi YouTube đã pin, đường dẫn/quyền QML giống mẫu. Chỉ mở voice app gốc nếu API có; nếu không dùng microphone trên remote. |
| C: debloat/job TV mẫu | `var/lib/webos-debloat/{gathin-final/debloat.py,kept-apps/optional-jobs.py}`; init.d/35,36 | Không triển khai hoặc khởi động trong nhánh tương thích; không áp giả định sysctl/job/input của mẫu lên O22. |
| C: gỡ app không liên quan | `scripts/remove-extra-apps.py` | Giữ chặn an toàn vì ngoài phạm vi khôi phục; không bật dọn app mang tính phá hủy. |
| Chỉ dành phát triển | `scripts/prepare-v3.py`, `test/rollback-sandbox.py`, `test/helpers/host-tools.js`, test Python của relay/HDMI/rollback | Không phải phụ thuộc installer Android. Python trên máy phát triển là môi trường riêng với Python trên TV. |
| Chẩn đoán phát triển | `scripts/check-live.js` | Chỉ compile script cũ khi phát hiện Python2; phần còn lại kiểm tra sao lưu. Không cài mã hoặc reboot. |
| Upstream / tham chiếu | `upstream/faultmanager-autoroot.sh`; map payload, recovery roots, checksum, changelog/hướng dẫn cũ | Upstream được pin giữ nguyên; các tham chiếu không tạo yêu cầu Python cho installer portable. Giữ kiểm tra khả năng root và điều kiện tiên quyết. |

Không có tính năng core portable nào bắt buộc Python về bản chất (nhóm A). HOME interception và voice của mẫu vẫn thuộc nhóm C vì ABI/hành vi firmware chưa được xác minh trên board mới, không chỉ vì thiếu trình thông dịch.

## Audit binary native

`config/component-support.json` ghi điều kiện từng thành phần. Gói Homebrew 0.7.3 được pin có năm binary ELF32 ARM (`e_machine=40`): `dropbear`, `rsync`, `scp`, `sftp-server`, `telnetd`. Cả bước cài app tùy chọn và tự triển khai faultmanager đều từ chối gói này trên kiến trúc chưa xác minh như aarch64. Homebrew đã có được giữ nguyên. Launcher, dịch vụ JS portable, payload YouTube web và gói privacy được pin không có ELF executable. Không giả định aarch64 hỗ trợ ABI ARM32 và không chép binary TV mẫu sang TV khác.

## Profile và giới hạn thực tế

| Profile | Khả năng có sẵn | Kết quả dự kiến |
| --- | --- | --- |
| A — mẫu ARMv7 / Python2 | Node, SHA, tar, đúng profile/ABI input | Giữ flow, hook và tuning của mẫu. |
| B — C2/O22 aarch64 | Root, Node, SHA, tar; không Python | Cài core, capture, upload đã kiểm tra, rollback; bỏ HOME/voice/tuning riêng. |
| C — tối giản | Root, shell, SHA, tar; không Node/Python | Xuất backup và báo cáo chỉ đọc; không thay đổi có quản lý khi chưa có rollback đã kiểm tra. |
| D — thiếu công cụ hash | Không có SHA/Busybox/Node crypto/Python hashlib sử dụng được | Không upload thiếu kiểm tra; dừng cài an toàn. |

Trên C2 dự kiến có launcher/dock, mở app/HDMI và học cổng, thời tiết/lịch, wallpaper/remote và cấu hình QR. Volume, mute, brightness, picture mode, Wi-Fi/Bluetooth và voice launch phụ thuộc API Luna mà firmware cung cấp. Installer xác minh runtime có xác thực; cổng HTTP mở đơn thuần chưa được tính là thành công. Điều khiển vật lý, tốc độ capture liên tục và voice gốc cần thử trên từng TV.

Test chạy helper thật trong filesystem TV mô phỏng, archive/checksum thật, Setup qua SSH giả lập, lỗi sau thay đổi và rollback. Đây là test hồi quy, không phải chứng nhận phần cứng C2. Kết nối chỉ đọc tới TV mẫu trong lần vá này timeout ở handshake SSH; không cài hoặc thay đổi TV.

Từ 3.4.2, có thể chọn rollback ngay từ menu setup hoặc `--mode Rollback`. [Hướng dẫn tiếng Việt](ROLLBACK.vi.md) | [English](ROLLBACK.en.md).


## Danh sách file của bản vá 3.4.1
Đã tạo:

- `config/component-support.json`
- `docs/CHANGELOG-v3.4.1.md`
- `docs/PYTHON-COMPATIBILITY.md`
- `lib/app-removal.js`
- `lib/portable-tv.js`
- `lib/tv-capabilities.js`
- `payload/portable/controls.js`
- `payload/portable/hdmi.js`
- `scripts/describe-tv.sh`
- `scripts/tv-files.js`
- `test/c2-python-free-flow.test.js`
- `test/component-support.test.js`
- `test/helpers/tv-profiles.js`
- `test/helpers/tv-sandbox.js`
- `test/minimal-tv-backup.test.js`
- `test/portable-controls.test.js`
- `test/portable-files.test.js`
- `test/ssh-upload-checksum.test.js`
- `test/tv-capabilities.test.js`

Đã sửa (bao gồm bootstrap được tạo và ghim checksum):

- `GathinTV-AutoSetup.sh`
- `README.en.md`
- `README.md`
- `checksums.json`
- `docs/ANDROID.en.md`
- `docs/ANDROID.vi.md`
- `docs/INSTALL.en.md`
- `docs/INSTALL.vi.md`
- `docs/VALIDATION.md`
- `install-android.sh`
- `lib/advanced.js`
- `lib/autoroot.js`
- `lib/launcher-install.js`
- `lib/post-install.js`
- `lib/recovery.js`
- `lib/rooted-compat.js`
- `lib/runtime-health.js`
- `lib/ssh.js`
- `package-lock.json`
- `package.json`
- `packages/com.gathin.tvhome_1.4.0_all.ipk`
- `scripts/AutoSetup.template.ps1`
- `scripts/capture-baseline.js`
- `scripts/check-live.js`
- `scripts/pause-runtimes.py`
- `scripts/rollback-snapshot.py`
- `scripts/run.js`
- `scripts/tv.js`
- `test/advanced.test.js`
- `test/doctor-readonly.test.js`
- `test/recovery.test.js`
- `test/restore.test.js`
- `test/root-preflight-flow.test.js`
- `test/rooted-compat.test.js`
- `test/rooted-model-flow.test.js`
