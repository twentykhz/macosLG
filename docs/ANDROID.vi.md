# Cài và quản lý GathinTV từ Android / Termux

Không cần Windows. Android, Linux và macOS dùng `GathinTV-AutoSetup.sh` với **cùng `scripts/run.js`, SSH, autoroot và recovery core** như installer Windows `MAC-WebOSTV-AutoSetup.ps1`. Điện thoại và TV phải cùng LAN, không dùng Wi-Fi khách có cách ly thiết bị. Giữ Termux ở foreground và cho phép hoạt động nền khi cài; không để Android ngắt phiên giữa chừng.

## 1. Chuẩn bị Termux

```bash
pkg update
pkg install nodejs git curl
node --version                    # yêu cầu >=20
termux-setup-storage               # tùy chọn: cho phép lưu backup vào Downloads
```

Không cần `openssh`, PowerShell, webOS CLI hay compiler trên điện thoại: core dùng `ssh2`, `bcrypt-pbkdf` và WebSocket JavaScript thuần. `git` chỉ cần khi clone source; `curl` dùng để lấy bootstrap. Không tự chạy package manager trong bộ cài.

Linux/macOS: dùng Bash, Node >=20 và curl đã cài qua trình quản lý gói của hệ điều hành. Các lệnh bên dưới giống Termux. macOS cần mở Terminal có Bash; chưa kiểm thử trên máy Mac thực.

## 2. Cài bằng một dòng, không clone repo

```bash
curl -fsSL https://raw.githubusercontent.com/twentykhz/macosLG/main/install-android.sh | bash
```

Bootstrap từ URL chính thức là điểm tin cậy ban đầu. Nó chứa **version, tên archive có hash và SHA-256 ghim sẵn**, không tìm rồi chạy code “latest” tùy ý. Archive được kiểm tra kích thước và checksum trước khi giải nén, kiểm tra từng file theo manifest trước khi chạy. Không có executable Node tải riêng cho điện thoại. Cache sai hoặc có file thêm ngoài manifest sẽ không được sử dụng.

Sau đó mở lại menu bằng:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh
```

Menu có Setup, Restore, Doctor, Backup, Apps, Sync, Disable. Hỏi IP và trạng thái root; chỉ tin host mới sau khi bạn xác nhận đúng IP TV. CLI không tự bật `--trust-new-host`.

## 3. Doctor trước khi thay đổi TV

```bash
./GathinTV-AutoSetup.sh --mode Doctor --host 192.168.1.11
```

Lần đầu, nếu core báo fingerprint chưa được tin cậy, kiểm tra lại IP trên TV rồi chạy:

```bash
./GathinTV-AutoSetup.sh --mode Doctor --host 192.168.1.11 --trust-new-host
```

Doctor không cài app, không reboot, không ghi/xóa file trên TV. Báo cáo và log được lưu trên thiết bị chạy installer. Doctor cần **root SSH** để kiểm tra đầy đủ; TV chưa root sẽ không vượt qua bước này và không bị tự động root. Với TV chưa root, tiếp tục đúng nhánh Setup bên dưới sau khi đọc kết quả. Capture được báo cần thử riêng, không chụp ảnh tạm trong Doctor.

## 4. TV đã root

```bash
./GathinTV-AutoSetup.sh --mode Restore --host 192.168.1.11 --trust-new-host
```

Ưu tiên khóa đã lưu. Có thể chỉ định `--key "$HOME/my keys/root.pem"`. Nếu dùng mật khẩu, thử `alpine` trước; chỉ hỏi mật khẩu riêng khi TV từ chối. Mật khẩu được nhập ẩn trong terminal, không ghi log. Không cài lại Developer Mode hay chạy exploit trên TV đã root.

## 5. TV chưa root

Trên TV: cài Developer Mode, đăng nhập tài khoản LG Developer, bật Dev Mode Status và cho TV reboot, rồi bật Key Server. Ghi model/firmware đúng từ Settings và passphrase sáu ký tự trong Developer Mode. [Các bước trên TV](INSTALL.vi.md#branch-a).

```bash
./GathinTV-AutoSetup.sh --mode Setup --host 192.168.1.11 --trust-new-host
```

Terminal hỏi model và firmware; khi core hỏi passphrase thì nhập trực tiếp, ký tự sẽ bị ẩn. Flow vẫn lấy `/webos_rsa` từ Key Server `9991`, kết nối `prisoner:9922`, chạy phương pháp được xác minh phù hợp, kiểm tra root bridge rồi provision recovery SSH. Không cần binary SSH trên điện thoại.

Để cung cấp sẵn thông tin preflight:

```bash
./GathinTV-AutoSetup.sh --mode Setup --host 192.168.1.11 \
  --expected-model 55SK8000PTA --expected-firmware 05.50.70 \
  --trust-new-host
```

Thay ví dụ bằng thông tin **TV của bạn**. Phương pháp USB/trình duyệt vẫn cần thao tác trên TV/USB và nhập xác nhận trong terminal. Không chạy exploit chồng nhau. Termux không làm TV hoặc firmware không được hỗ trợ trở thành được hỗ trợ. Nếu cần chuẩn bị USB từ điện thoại, thiết bị phải hỗ trợ OTG/quyền ghi định dạng USB phù hợp.

## 6. Backup và khôi phục khi lỗi

```bash
./GathinTV-AutoSetup.sh --mode Backup --host 192.168.1.11
# Hoặc chỉ định đích có dấu cách:
./GathinTV-AutoSetup.sh --mode Backup --host 192.168.1.11 \
  --output-dir "$HOME/TV backups"
```

Trên Termux, mặc định ưu tiên `$HOME/storage/downloads/GathinTV-Backups` nếu có quyền ghi. Nếu chưa chạy `termux-setup-storage` hoặc storage bị từ chối, tự fallback sang `$HOME/GathinTV-Backups`; vị trí luôn được in ra. Linux/macOS dùng `$HOME/GathinTV-Backups`. Backup có token/cấu hình riêng, không đăng công khai; quyền bảo vệ của thư mục Downloads phụ thuộc Android.

State, key, fingerprint và backup đầu phiên nằm trong **`$HOME/.gathintv/state`**, quyền thư mục 700, key 600 khi filesystem hỗ trợ. Có thể đổi bằng biến môi trường `GATHIN_STATE_DIRECTORY` trỏ ra ngoài repo. Log chỉ ghi stdout/stderr, không ghi stdin, password hay passphrase.

Setup/Restore bị lỗi sau khi thay đổi sẽ hỏi có khôi phục snapshot đầu phiên không. Nhập `CO`/`YES` ở bất kỳ kiểu hoa/thường. CLI không tương tác không tự khôi phục; giữ session path được in để cứu hộ bằng core. [Phạm vi và cách kiểm tra khôi phục](diagnostics/RECOVERY.md).

## 7. Option tương đương Windows

| PowerShell | Shell → cùng Node core |
|---|---|
| `-Mode`, `-HostName` | `--mode`, `--host` |
| `-AlreadyRooted` | `--already-rooted` |
| `-DryRun` | `--dry-run` |
| `-TrustNewHost` | `--trust-new-host` |
| `-NoReboot` | `--no-reboot` |
| `-RemoveExtraApps` | `--remove-extra-apps` |
| `-RootKeyPath` | `--key` |
| `-DeveloperKeyPath` | `--developer-key` |
| `-BackupFile` | `--backup-file` |
| `-OutputDirectory` | `--output-dir` |
| `-TVModel`, `-FirmwareVersion` | `--expected-model`, `--expected-firmware` |
| `-Language` | `--language en` / `--language vi` |

`--no-reboot` giữ nguyên nghĩa trong core: bỏ reboot cuối, không bỏ các reboot cần thiết để provision root. `--remove-extra-apps` được truyền nguyên vẹn nhưng vẫn bị core chặn khi không thể bảo đảm recovery dữ liệu app bên ngoài snapshot; wrapper không bypass. Apps/Sync thay đổi Content Store/privacy theo core hiện tại; Disable tắt runtime dự án, giữ root và app. `--backup-file` không cho phép ghép backup riêng từ TV khác sang profile không phù hợp.

```bash
./GathinTV-AutoSetup.sh --mode Restore --host 192.168.1.11 --dry-run
./GathinTV-AutoSetup.sh --mode Apps --host 192.168.1.11
./GathinTV-AutoSetup.sh --mode Sync --host 192.168.1.11
./GathinTV-AutoSetup.sh --mode Disable --host 192.168.1.11
```

Không có argument sẽ mở menu nếu terminal tương tác. Trong CI, truyền `--mode` và `--host`; cấp khóa bằng `--key` và preflight model/firmware khi cần, không truyền mật khẩu qua command line. Bước cần passphrase hoặc USB/trình duyệt yêu cầu terminal thực.

## 8. Dùng từ source

```bash
git clone https://github.com/twentykhz/macosLG.git
cd macosLG
npm ci --omit=optional --ignore-scripts
./GathinTV-AutoSetup.sh --mode Doctor --host 192.168.1.11
```

`npm ci` thông thường vẫn dùng được; lệnh trên bỏ native optimization không bắt buộc. Chỉ cần runtime thì dùng `npm ci --omit=dev --omit=optional --ignore-scripts`. Bản release đã kèm đủ dependency JavaScript nên không cần npm hoặc compiler. Để chạy toàn bộ bộ test phát triển, cần thêm Python 3 và Bash; test PowerShell chỉ chạy trên Windows.
