# GathinTV AutoSetup 3.0

GathinTV AutoSetup là bộ cài tự động dành cho TV LG webOS đã được kiểm tra đúng profile hỗ trợ. Phần lớn thao tác được thực hiện từ **một file PowerShell duy nhất trên Windows**, nên bạn không cần tự cài Node.js, npm, Dev Manager hay chuẩn bị USB root trước.

Script sẽ tự dùng Node.js đang có trên máy hoặc tải bản portable từ `nodejs.org`, kiểm tra SHA-256 rồi mới chạy.

> **Profile tham chiếu đã kiểm tra:** LG 55SK8000PTA · firmware 05.50.70 · webOS SDK 4.4.0 · M16PP_DVB_EU · Magic Remote hai kênh input · Python 2/ARM32.
>
> TV LG khác vẫn có thể chạy bộ cài ở chế độ tương thích. Bộ cài sẽ tự nhận diện những tính năng phù hợp với TV đang kết nối và bỏ qua các thành phần phần cứng/ABI không tương thích thay vì dừng toàn bộ quá trình.

---

## 1. Nếu vừa factory reset TV

Trước khi chạy bộ cài trên máy tính, cần làm vài bước trực tiếp trên TV:

1. Kết nối TV vào mạng.
2. Nếu cần dùng các app như **FPT Play, TV360, Netflix**, nên cài chúng từ LG Content Store trước.
3. Cài app **Developer Mode** trên TV.
4. Đăng nhập tài khoản LG Developer.
5. Bật **Dev Mode Status** và để TV reboot theo yêu cầu.
6. Mở Developer Mode lại, bật **Key Server**.
7. Ghi lại:
   - IP của TV
   - passphrase 6 ký tự

Đây là phần duy nhất bạn phải chuẩn bị thủ công trước khi PC có thể kết nối vào TV.

> **Nếu TV vẫn còn root thì không cần cài lại Developer Mode.** Hãy dùng chế độ **Restore** hoặc **Backup** ở phần bên dưới.

---

## 2. Cài mới từ đầu

Mở PowerShell ngay trong thư mục chứa `GathinTV-AutoSetup.ps1`, rồi chạy:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 -HostName 192.168.1.11 -TrustNewHost
```

Đổi `192.168.1.11` thành IP thực tế của TV nếu khác.

Khi script hỏi passphrase Developer Mode, nhập 6 ký tự lấy ở bước chuẩn bị. Ký tự sẽ không hiện trên màn hình khi nhập — đây là bình thường.

Sau đó script sẽ tự làm các phần chính:

- kiểm tra TV có đúng profile hỗ trợ hay không;
- dùng bản `faultmanager-autoroot` đã ghim trong `config/bootstrap.json`;
- chạy kiểm tra tương thích trước khi exploit;
- cài Homebrew;
- xác minh quyền root;
- tạo khóa SSH riêng cho TV;
- gỡ Developer Mode trước reboot khi cần;
- tự kết nối lại sau reboot;
- cài YouTube AdFree, LGWS, launcher và các tính năng đi kèm;
- reboot lần cuối để hoàn tất.

Bộ cài **không flash phân vùng**, **không factory reset TV** và **không tự lặp exploit vô hạn nếu root thất bại**.

### Internet có cần không?

PC cần Internet nếu phải tải Node.js portable. Các thành phần quan trọng khác như exploit đã ghim, COPYING, IPK Homebrew/YouTube/LGWS và dependency SSH đã được đóng gói kèm checksum.

Bộ cài không tự lấy một bản root script mới ngẫu nhiên từ nhánh `main` khi chạy.

---

## 3. Các chế độ hay dùng

Không cần nhớ hết. Chỉ chọn đúng tình huống của bạn.

### Chỉ chuẩn bị bộ cài trên PC

Không kết nối hoặc thay đổi TV:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Prepare
```

### Kiểm tra tình trạng TV

Chỉ kiểm tra TV đang root và các trạng thái liên quan, không ghi cấu hình hay reboot:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Doctor -HostName 192.168.1.11
```

### Backup TV hiện tại

Backup được lưu vào thư mục `GathinTV-Backups` nằm cạnh file PowerShell:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Backup -HostName 192.168.1.11
```

### TV vẫn còn root nhưng launcher/giao diện/chức năng bị lỗi

Cài lại các thành phần cần thiết mà **không chạy exploit root lại**:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.11
```

### Khôi phục đúng một backup riêng

Dùng khi muốn lấy lại đúng giao diện, font hoặc cấu hình cũ đã backup:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.11 -BackupFile .\Gathin-SK8000-20261026.tar.gz
```

### Sau factory reset, TV mất root nhưng bạn có backup cũ

Chuẩn bị lại Developer Mode như phần đầu, rồi chạy:

```powershell
.\GathinTV-AutoSetup.ps1 -HostName 192.168.1.11 -TrustNewHost -BackupFile .\Gathin-SK8000-20261026.tar.gz
```

### Xem trước bộ cài sẽ làm gì

Không ghi thay đổi lên TV:

```powershell
.\GathinTV-AutoSetup.ps1 -HostName 192.168.1.11 -AlreadyRooted -DryRun
```

### Xóa các app ngoài danh sách giữ lại

Mặc định bộ cài **không xóa app riêng của người dùng**. Nếu thực sự muốn dọn app ngoài danh sách giữ lại:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.11 -RemoveExtraApps
```

### Mở LG Content Store để cài app thương mại còn thiếu

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Apps -HostName 192.168.1.11
```

Sau khi cài app xong, đồng bộ lại icon và bật lại bảo vệ SDP:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Sync -HostName 192.168.1.11
```

### Tạm tắt các hook/runtime tùy biến để chẩn đoán

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Disable -HostName 192.168.1.11
```

### Bung toàn bộ source đang được đóng gói

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Extract -OutputDirectory .\GathinTV-source
```

---

## 4. Một số tùy chọn hữu ích

Nếu PowerShell chặn file script, hãy chạy theo dạng đầy đủ:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\GathinTV-AutoSetup.ps1 ...
```

Một số tùy chọn khác:

- `-RootKeyPath`: dùng khóa SSH riêng đã có.
- `-TrustNewHost`: dùng khi ghép TV lần đầu hoặc sau factory reset. Sau đó script sẽ yêu cầu fingerprint phải đúng.
- `-NoReboot`: bỏ qua reboot cuối.
- `-PortableNode`: ép dùng Node portable, hữu ích trên PC chưa cài Node.js.

Nếu chưa có SSH key, quá trình root có thể hỏi mật khẩu SSH theo dạng nhập ẩn.

---

## 5. Sau khi cài xong bạn sẽ có gì?

### Launcher riêng

- Dock/icon tùy biến.
- HDMI 3.
- Thời tiết.
- Lịch âm.
- Điều hướng trái/phải có vòng lặp.
- Nhấn **Lên** để vào ba nút điều khiển phía trên.

### Điều khiển Home / Back

Home và Back được xử lý trước compositor:

- Home quay về Gathin.
- Back từ app khác quay về Gathin.
- Nếu đang mở bảng điều khiển thì Back vẫn đóng bảng như bình thường.

Bộ cài kiểm tra cả hai kênh input của Magic Remote và ABI trước khi thực hiện grab.

### Action Center

Có thể điều khiển nhanh:

- Wi-Fi;
- Bluetooth;
- tên và trạng thái kết nối;
- chế độ hình ảnh;
- độ sáng đèn nền;
- âm lượng.

Bấm **OK** để bật/tắt nhanh. Giữ nút để mở phần cài đặt tương ứng.

Helper chỉ lắng nghe trên localhost và mỗi TV có token riêng.

### Voice

Voice được điều hướng để thao tác trực tiếp hơn, ví dụ:

- tìm trực tiếp trong YouTube đang chạy;
- mở/đóng app;
- chuyển HDMI;
- tắt hoặc reboot TV;
- chỉnh âm lượng và đèn nền từ 0–100;
- đọc số bằng tiếng Việt.

Lệnh **“mở ti-vi”** được hiểu là mở HDMI 3.

### LGWS

LGWS chạy nền khi boot. Sau khi áp dụng xong, TV sẽ hiện thông báo native **“LGWS Enable”** ở góc trái trên trong khoảng 3 giây.

Voice, AirPlay và LAN vẫn được giữ. Bộ lọc DNS bổ sung không tương thích sẽ được giữ ở trạng thái tắt.

### Tối ưu hệ thống

Bộ cài có thể:

- khóa một số tiện ích firmware không dùng;
- tắt preload không cần thiết;
- tắt lịch phát sóng/hỗ trợ từ xa không cần dùng;
- giữ renderer warm cache;
- giữ các dịch vụ quan trọng cho hình ảnh, âm thanh, remote, mạng, Bluetooth, AirPlay và root.

---

## 6. Khi dùng `-RemoveExtraApps`, những app nào được giữ lại?

Danh sách giữ lại gồm:

- Gathin;
- YouTube;
- Trình duyệt;
- FPT Play;
- TV360;
- Netflix;
- AirPlay;
- Homebrew;
- LGWS.

HDMI và Settings là thành phần hệ thống.

Các app firmware nằm trong phần hệ thống chỉ có thể được khóa khi phù hợp; bộ cài không giả vờ “xóa sạch squashfs” để tạo dung lượng trống ảo.

---

## 7. Backup và chia sẻ cho người khác

Nếu chỉ muốn đưa bộ cài cho bạn bè, thông thường chỉ cần gửi:

- `GathinTV-AutoSetup.ps1`
- file hướng dẫn này

`GathinTV-Source.zip` là source và dependency tương ứng dành cho người muốn xem code hoặc tự build.

File `.sha256` dùng để kiểm tra file tải/copy có bị sai hay không.

### Không được gửi thư mục state cá nhân

Không chia sẻ:

```text
%LOCALAPPDATA%\GathinTV\state
```

Thư mục này có thể chứa:

- SSH key riêng;
- fingerprint;
- log của máy bạn.

Backup cá nhân cũng nên giữ riêng.

Bộ share chuẩn không chứa:

- tài khoản;
- cookie;
- mật khẩu Wi-Fi;
- SSH key của TV nguồn;
- token điều khiển của TV nguồn.

Token mới sẽ được sinh khi cài hoặc restore.

---

## 8. Backup chứa gì và không chứa gì?

Backup là **cấu hình + mã giao diện + tính năng**, không phải ảnh nguyên phân vùng TV.

Backup **không chứa**:

- tài khoản YouTube/Netflix;
- thuê bao FPT/TV360;
- Wi-Fi;
- firmware;
- dữ liệu đăng nhập thương mại.

Vì vậy sau factory reset, bạn vẫn phải đăng nhập lại và cài lại các app Store cần thiết.

Bộ cài không giả mạo quyền cài app thương mại và không sao chép tài khoản từ TV này sang TV khác.

---

## 9. Font và thời tiết trong bản chia sẻ

Bản chia sẻ dùng **Inter (OFL)** thay vì SF Pro.

Các chức năng và bố cục vẫn giữ nguyên.

Backup riêng của chủ TV có thể giữ lại font/file giao diện gốc.

Muốn đổi địa điểm thời tiết, sửa:

```text
config/weather.json
```

sau đó build lại source.

---

## 10. Nếu muốn tự build / kiểm tra source

Các lệnh thường dùng:

```bash
npm ci
npm test
npm run verify
```

Build launcher:

```bash
npm run build
```

Đóng gói thành file một cục:

```bash
npm run package
```

Builder chỉ lấy các thư mục code/payload/dependency cần thiết. Những dữ liệu riêng như `.local`, private key, token hoặc database không được đưa vào gói share.

---

## 11. Giới hạn cần biết

Các chức năng chính đã chạy trên TV nguồn và gói này đã kiểm tra những phần như:

- parser;
- checksum;
- routing;
- staging;
- giải nén PowerShell;
- read-only preflight.

Tuy nhiên, **chưa có một vòng factory reset rồi chạy lại exploit thật từ đầu trong phiên đóng gói này**.

Root vẫn phụ thuộc vào:

- firmware còn lỗ hổng phù hợp;
- tình trạng upstream;
- profile TV có khớp hay không.

Không nên dùng các tùy chọn bỏ kiểm tra để ép bộ cài chạy trên model/firmware chưa được hỗ trợ.

---

## 12. Nguồn tham khảo

Root tool:

https://github.com/throwaway96/faultmanager-autoroot

Kiểm tra firmware có khả năng root hay không:

https://cani.rootmy.tv/

---

## Tóm tắt nhanh

Nếu TV **vừa reset và mất root**:

1. Cài Developer Mode.
2. Bật Dev Mode Status + Key Server.
3. Lấy IP + passphrase.
4. Chạy lệnh cài mới.

Nếu TV **vẫn còn root nhưng launcher bị lỗi**:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Restore -HostName 192.168.1.11
```

Nếu muốn **backup trước khi nghịch tiếp**:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Backup -HostName 192.168.1.11
```

Nếu chỉ muốn **kiểm tra TV có ổn không**:

```powershell
.\GathinTV-AutoSetup.ps1 -Mode Doctor -HostName 192.168.1.11
```
