# Khôi phục trạng thái trước khi chạy tool

**Tiếng Việt** | [English](ROLLBACK.en.md)

Từ **3.4.2**, setup có mục **Rollback** riêng. Bạn có thể quay về snapshot trước các thay đổi cài đặt của dự án, kể cả khi cài đặt đã thành công. Lựa chọn khôi phục khi Setup/Restore gặp lỗi vẫn được giữ nguyên.

## Phạm vi khôi phục

Với TV chưa root, snapshot được chụp sau khi đã có root để sao lưu qua SSH. Rollback không trả TV về trạng thái chưa root trước exploit.

Rollback khôi phục file launcher, cấu hình/dữ liệu dịch vụ của dự án, wallpaper, token, hook boot và những file nằm trong snapshot. Tool gỡ các app dự án mới xuất hiện sau snapshot và chỉ khởi động lại runtime từng hoạt động trước đó. Các thay đổi của dự án sau thời điểm backup sẽ bị thay thế.

Đây **không phải reset xuất xưởng**, khôi phục firmware hoặc hủy root. Tài khoản, toàn bộ app/data của hãng, Developer Mode, cấu hình hệ thống ngoài phạm vi snapshot và thay đổi do exploit root không được bảo đảm khôi phục. Không dùng backup của TV khác. Xem phạm vi chính xác trong `config/recovery-roots.json` và [audit khôi phục](PYTHON-COMPATIBILITY.md).

Giữ nguyên thư mục state trên thiết bị đã chạy tool: Windows thường là `%LOCALAPPDATA%\GathinTV\state` hoặc `%LOCALAPPDATA%\MAC-WebOSTV\state`; Android/Linux mặc định `~/.gathintv/state`. Thư mục `sessions` chứa nhật ký; `backups/<thời-điểm>/snapshot.json` đi kèm `before-restore.tar.gz` chứa bản sao đầu phiên. Chỉ một file tar xuất riêng không đủ metadata để dùng menu này.

## Windows

Tải bộ cài mới từ [Releases](https://github.com/twentykhz/macosLG/releases/latest). Mở `Start-Setup.cmd`, chọn ngôn ngữ, chọn **5 — Rollback: chọn backup theo ngày giờ**, nhập IP TV. Chọn backup bằng số; kiểm tra model, địa chỉ TV, thời điểm và thư mục rồi nhập `CO` hoặc `YES`, không phân biệt hoa thường. Nhập `0` ở danh sách hoặc câu trả lời khác ở xác nhận để hủy.

Có thể mở trực tiếp:

```powershell
.\MAC-WebOSTV-AutoSetup.ps1 -Mode Rollback -HostName 192.168.1.11 -Language vi
```

Chỉ định thư mục backup hoặc file snapshot/session khi cần:

```powershell
.\MAC-WebOSTV-AutoSetup.ps1 -Mode Rollback -HostName 192.168.1.11 -Language vi -RecoverySession "C:\duong-dan\state\backups\THOI-DIEM\snapshot.json" -DryRun
```

Thay IP/path bằng TV và backup của bạn. `-DryRun` xác minh archive, kết nối root, fingerprint, model/firmware/board và khả năng rollback; không upload, đổi file, gỡ app hoặc reboot TV. Bỏ `-DryRun` để thực hiện sau xác nhận. `-RootKeyPath` được hỗ trợ. `-ConfirmRollback` chỉ dùng khi chủ động muốn xác nhận sẵn, ví dụ chạy không tương tác.

## Android / Termux / Linux / macOS

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh --language vi
```

Chọn **5 — Rollback**, nhập IP TV, chọn backup và xác nhận `CO/YES`. Hoặc:

```bash
./GathinTV-AutoSetup.sh --mode Rollback --host 192.168.1.11 --language vi
./GathinTV-AutoSetup.sh --mode Rollback --host 192.168.1.11 --session "$HOME/.gathintv/state/backups/THOI-DIEM/snapshot.json" --dry-run --language vi
```

Chạy không tương tác cần cả `--session PATH` và `--yes`; `--dry-run` không cần xác nhận. Không chọn ngầm “backup mới nhất”. Muốn về trước lần đầu dùng tool, hãy chọn backup của **lần chạy đầu tiên**; mỗi backup thể hiện trạng thái trước phiên tương ứng.

## Kiểm tra an toàn và lỗi

- Rollback giữ kiểm tra checksum, UID 0, fingerprint SSH và model/board/firmware của snapshot. Không tự nhận host key mới; nếu mất pin, chạy Doctor sau khi đối chiếu fingerprint của chính TV trước.
- Dùng cùng engine Node/Python2 đã kiểm tra của recovery; TV không Python có thể dùng Node. Thiếu engine/checksum/tar thì dừng trước thay đổi.
- Backup hỏng, khác TV, thiếu fingerprint hoặc không còn archive sẽ bị từ chối. Nếu di chuyển thư mục backup, đường dẫn archive trong metadata phải còn truy cập được; menu không tự sửa metadata.
- Khi lỗi, giữ backup và log. Tool không tự chạy exploit, flash firmware hoặc reboot để “cứu” rollback.

Các test gồm chọn backup, hủy, `CO/YES`, đường dẫn có dấu cách, yêu cầu xác nhận khi không tương tác, DryRun và rollback C2 không Python trong filesystem mô phỏng. Chưa xác nhận rollback bản này trên C2 thật.

Backup dates are shown as `dd/MM/yyyy HH:mm:ss (UTC±HH:mm)` in the installing device’s local timezone. Newest backups appear first and are labeled NEWEST/MOI NHAT; the oldest is labeled OLDEST/CU NHAT.
