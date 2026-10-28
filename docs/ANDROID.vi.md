# Cài GathinTV bằng điện thoại Android

Bạn **không cần máy tính Windows**.

Chỉ cần:

- Điện thoại Android
- TV LG và điện thoại kết nối **cùng một mạng Wi-Fi/LAN**
- Ứng dụng **Termux**

> Trong lúc cài, hãy giữ Termux mở và không tắt Wi-Fi.

---

# Bước 1: Chuẩn bị Termux

Mở **Termux**.

Copy lệnh này, dán vào Termux rồi nhấn Enter:

```bash
pkg update
```

Nếu Termux hỏi:

```text
Do you want to continue? [Y/n]
```

nhập:

```text
y
```

rồi Enter.

Tiếp theo chạy:

```bash
pkg install nodejs git curl
```

Nếu được hỏi `[Y/n]`, tiếp tục nhập:

```text
y
```

---

# Bước 2: Cho phép Termux truy cập bộ nhớ

Chạy:

```bash
termux-setup-storage
```

Android sẽ hiện hộp thoại xin quyền truy cập file.

Chọn **Cho phép**.

> Bước này giúp GathinTV lưu file backup vào thư mục Download của điện thoại.

---

# Bước 3: Cài GathinTV

Copy **nguyên dòng này** vào Termux:

```bash
curl -fsSL https://raw.githubusercontent.com/twentykhz/macosLG/main/install-android.sh | bash
```

Nhấn Enter.

Bộ cài sẽ tự tải các file cần thiết và kiểm tra chúng trước khi chạy.

---

# Bước 4: Nhập IP của TV

Khi bộ cài hỏi IP TV, nhập IP của TV LG.

Ví dụ:

```text
192.168.1.11
```

Bạn có thể xem IP trong phần **Cài đặt mạng** trên TV.

Điện thoại và TV phải ở cùng mạng.

---

# Bước 5: Chọn đúng tình trạng TV

Có 2 trường hợp.

## Trường hợp A — TV đã root

Nếu TV đã có root/Homebrew và SSH root hoạt động:

Chọn:

```text
TV đã root
```

Bộ cài sẽ **không root lại TV**.

Sau đó làm theo hướng dẫn hiện trên Termux.

---

## Trường hợp B — TV chưa root

Trước tiên trên TV:

1. Cài ứng dụng **Developer Mode**.
2. Đăng nhập tài khoản LG Developer.
3. Bật **Dev Mode Status**.
4. TV sẽ yêu cầu reboot.
5. Sau khi TV bật lại, mở **Developer Mode**.
6. Bật **Key Server**.
7. Ghi lại:
   - IP của TV
   - Passphrase 6 ký tự

Sau đó trên Termux chọn:

```text
TV chưa root
```

Khi bộ cài hỏi passphrase, nhập **6 ký tự đang hiện trong Developer Mode**.

> Khi nhập mật khẩu/passphrase, màn hình có thể không hiện ký tự. Đây là bình thường.

Bộ cài sẽ tự kiểm tra TV trước khi thực hiện các bước tiếp theo.

---

# Bước 6: Chờ cài đặt hoàn tất

Sau khi bắt đầu cài:

- Không tắt TV
- Không tắt Wi-Fi
- Không đóng Termux
- Không chuyển điện thoại sang chế độ tiết kiệm pin làm Termux bị dừng

Làm theo thông báo trên màn hình cho đến khi bộ cài báo hoàn tất.

TV có thể reboot trong quá trình cài.

---

# Muốn mở lại GathinTV Installer

Sau này muốn chạy lại bộ cài, mở Termux và chạy:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh
```

Menu GathinTV sẽ hiện lại.

---

# Kiểm tra TV mà không cài lại

Nếu chỉ muốn kiểm tra TV đã root:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh --mode Doctor --host 192.168.1.11
```

Thay:

```text
192.168.1.11
```

bằng IP TV của bạn.

Doctor chỉ kiểm tra và báo cáo tình trạng TV, không cài lại GathinTV.

---

# Backup TV

Để tạo backup:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh --mode Backup --host 192.168.1.11
```

Nếu bạn đã cho Termux quyền truy cập bộ nhớ, backup sẽ ưu tiên được lưu trong:

```text
Download/GathinTV-Backups
```

---

# Nếu TV đã root và muốn cài lại GathinTV

Chạy:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh --mode Restore --host 192.168.1.11 --trust-new-host
```

Thay IP bằng IP TV của bạn.

Lệnh này dành cho **TV đã root** và không chạy exploit root lại.

---

# Nếu gặp lỗi

Trước tiên kiểm tra 3 thứ:

### 1. Điện thoại và TV có cùng mạng không?

Ví dụ:

```text
Điện thoại: 192.168.1.xxx
TV:         192.168.1.xxx
```

### 2. IP TV có đúng không?

Kiểm tra lại IP trực tiếp trong cài đặt mạng của TV.

### 3. Nếu TV chưa root

Kiểm tra:

- Developer Mode đã bật
- Dev Mode Status đang ON
- Key Server đang ON
- Passphrase 6 ký tự đúng

---

# Cài nhanh — dành cho người đã biết Termux

Chạy lần lượt:

```bash
pkg update
pkg install nodejs git curl
termux-setup-storage
curl -fsSL https://raw.githubusercontent.com/twentykhz/macosLG/main/install-android.sh | bash
```

Sau này mở lại:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh
```

---

# Lưu ý

- Android **không làm một model/firmware không hỗ trợ root trở thành hỗ trợ root**.
- Không cố ép root nếu bộ cài báo TV không tương thích.
- Nếu TV đã root, hãy chọn đúng chế độ **TV đã root** để tránh chạy exploit lại.
- Không chia sẻ file backup, SSH key hoặc dữ liệu trong thư mục state của bạn lên mạng.

---

## Tóm tắt

Nếu bạn chưa từng dùng Termux, chỉ cần nhớ:

```text
1. Mở Termux
        ↓
2. Cài nodejs + git + curl
        ↓
3. Chạy install-android.sh
        ↓
4. Nhập IP TV
        ↓
5. Chọn TV đã root / chưa root
        ↓
6. Làm theo hướng dẫn trên màn hình
        ↓
7. Xong
```
