# 📱 Cài Launcher MAC-WebOS LG bằng điện thoại Android

Không có máy tính Windows cũng cài được.

**Bản mới 3.4.2:** menu có thêm **8 — Rollback**, khôi phục snapshot trước khi chạy tool sau khi chọn backup và xác nhận `CO/YES`. [Hướng dẫn khôi phục](ROLLBACK.vi.md) | [English](ROLLBACK.en.md).

> **Bản 3.4.1:** TV đã root ngoài profile mẫu được kiểm tra capability trước khi backup/cài đặt. Python không bắt buộc nếu TV có Node và rollback đã kiểm chứng; HOME/voice/tuning riêng của TV mẫu được bỏ qua khi không phù hợp. C2/O22 hiện có regression mô phỏng, chưa xác nhận cài bản vá trên TV thật. [Phạm vi hỗ trợ và audit](PYTHON-COMPATIBILITY.md). Chạy Doctor trước khi Restore.

Bạn chỉ cần:

- Một điện thoại Android
- TV LG và điện thoại đang **cùng Wi-Fi**
- Khoảng 5–10 phút
- Làm lần lượt từng bước bên dưới

> **Chưa từng dùng Termux cũng không sao.** Không cần biết Linux hay code gì cả, cứ copy đúng từng lệnh trong hướng dẫn.

---

# Bước 1 — Cài Termux

**Termux** là ứng dụng chúng ta dùng để chạy bộ cài GathinTV trên điện thoại.

### Cách dễ nhất 

Lên GOOGLE PLAY STORE -> Search TERMUX và tải về

hoặc

Mở trình duyệt trên điện thoại và vào:

https://f-droid.org/packages/com.termux/

Tìm phần **Versions** → bấm **Download APK**.

Android có thể hiện cảnh báo cài ứng dụng ngoài CH Play.

Chọn:

**Cho phép từ nguồn này → Cài đặt**

Sau khi cài xong, mở **Termux**.

> Nên tải Termux từ **F-Droid hoặc GitHub chính thức**, không tải APK từ các trang chia sẻ linh tinh.

Trang GitHub chính thức của Termux:

https://github.com/termux/termux-app/releases

---

## Mở Termux lên sẽ thấy gì?

Màn hình sẽ màu đen, có chữ trắng và dấu `$` ở cuối.

Nó gần giống thế này:

<p align="center">
  <img src="https://f-droid.org/repo/com.termux/en-US/phoneScreenshots/1.jpg" width="320">
</p>

**Ảnh: giao diện Termux chính thức trên F-Droid**

Thấy màn hình kiểu này là đúng.

Bạn sẽ nhập lệnh vào ngay sau dấu:

```text
$
```

---

# Bước 2 — Cập nhật Termux

Copy dòng này:

```bash
pkg update
```

Sau đó quay lại Termux, **nhấn giữ vào màn hình → Paste/Dán → Enter**.

Termux sẽ chạy một lúc.

Nếu thấy:

```text
Do you want to continue? [Y/n]
```

thì nhập:

```text
y
```

rồi bấm **Enter**.

### Nếu nó hỏi chọn mirror

Một số máy có thể hiện danh sách máy chủ tải xuống.

Nếu không biết chọn gì thì cứ chọn mặc định rồi Enter.

Đợi đến khi màn hình lại xuất hiện:

```text
$
```

là xong bước này.

---

# Bước 3 — Cài những thứ GathinTV cần

Copy nguyên dòng sau:

```bash
pkg install nodejs git curl
```

Dán vào Termux → Enter.

Nếu hỏi:

```text
Do you want to continue? [Y/n]
```

nhập:

```text
y
```

rồi Enter.

Đợi cho đến khi lại thấy dấu:

```text
$
```

---

## Kiểm tra Node.js

Chạy:

```bash
node --version
```

Nếu hiện kiểu:

```text
v20.x.x
```

hoặc:

```text
v22.x.x
v24.x.x
```

là được.

Chỉ cần số đầu tiên **từ 20 trở lên**.

Ví dụ:

```text
v24.10.0
```

→ OK.

---

# Bước 4 — Cho Termux quyền lưu file

Bước này để GathinTV có thể lưu backup vào thư mục **Download** của điện thoại.

Chạy:

```bash
termux-setup-storage
```

Android sẽ hiện cửa sổ xin quyền.

Chọn:

**Cho phép**

Nếu điện thoại không hiện gì hoặc bạn lỡ từ chối thì cũng chưa sao. Bộ cài vẫn chạy được, chỉ có file backup sẽ được lưu bên trong Termux thay vì thư mục Download.

---

# Bước 5 — Chạy bộ cài GathinTV

Đây là bước chính.

Copy **nguyên dòng** này:

```bash
curl -fsSL https://raw.githubusercontent.com/twentykhz/macosLG/main/install-android.sh | bash
```

Dán vào Termux → Enter.

Không sửa gì trong dòng trên.

Bộ cài sẽ tự tải GathinTV về điện thoại và kiểm tra file trước khi chạy.

Đợi một chút.

Sau đó menu GathinTV sẽ hiện ra.

---

# Bước 6 — Chọn tình trạng TV

Bộ cài sẽ hỏi TV của bạn thuộc trường hợp nào.

Có 2 trường hợp chính:

## 🟢 TV đã root

Nếu TV của bạn:

- đã root;
- đã từng dùng Homebrew;
- SSH root đang hoạt động;

thì chọn:

```text
TV đã root
```

Bộ cài sẽ **không root lại TV**.

Sau đó nhập IP TV khi được hỏi.

Ví dụ:

```text
192.168.1.11
```

---

## 🔵 TV chưa root

Nếu đây là TV mới, chưa root, trước tiên phải chuẩn bị **Developer Mode** trên TV.

### Trên TV LG

Vào **LG Content Store** và cài:

```text
Developer Mode
```

Mở Developer Mode.

Đăng nhập tài khoản LG Developer.

Sau đó bật:

```text
Dev Mode Status
```

TV sẽ yêu cầu khởi động lại.

Cho TV reboot.

Sau khi TV bật lại:

1. Mở **Developer Mode** lần nữa.
2. Bật **Key Server**.
3. Để nguyên màn hình này.

Bạn cần ghi lại 2 thứ:

```text
IP Address
Passphrase
```

Passphrase thường gồm **6 ký tự**.

Ví dụ:

```text
IP: 192.168.1.11
Passphrase: A1B2C3
```

Sau đó quay lại Termux.

Chọn:

```text
TV chưa root
```

và nhập IP vừa xem trên TV.

---

# Bước 7 — Xác nhận đúng TV

Ở lần kết nối đầu tiên, GathinTV có thể hỏi bạn xác nhận IP.

Ví dụ:

```text
Kiem tra IP tren chinh TV cua ban: 192.168.1.11

Nhap YES hoac CO neu day la TV cua ban:
```

Kiểm tra IP trên TV một lần nữa.

Nếu đúng thì nhập:

```text
CO
```

hoặc:

```text
YES
```

rồi Enter.

---

# Bước 8 — Nếu TV chưa root, nhập Passphrase

Bộ cài sẽ hỏi passphrase của Developer Mode.

Nhập đúng 6 ký tự đang hiện trên TV.

Ví dụ:

```text
A1B2C3
```

### ⚠️ Lưu ý

Khi nhập password hoặc passphrase trong Termux, có thể:

```text
không hiện chữ
không hiện dấu *
không hiện gì cả
```

Đây là **bình thường**.

Cứ nhập đúng rồi bấm Enter.

---

# Bước 9 — Để bộ cài chạy

Từ đây cứ làm theo những gì GathinTV hỏi trên màn hình.

Trong lúc cài:

- Không tắt TV
- Không rút điện TV
- Không tắt Wi-Fi
- Không đóng Termux
- Không để điện thoại chuyển sang chế độ tiết kiệm pin quá mạnh

TV có thể tự reboot trong quá trình cài.

Đó là bình thường.

Khi bộ cài báo hoàn tất thì mới đóng Termux.

---

# Sau này muốn mở lại GathinTV

Không cần chạy lại lệnh cài từ đầu.

Mở Termux rồi chạy:

```bash
cd "$HOME/.gathintv"
```

Enter.

Sau đó:

```bash
./GathinTV-AutoSetup.sh
```

Enter.

Menu GathinTV sẽ hiện lại.

---

# Chỉ kiểm tra TV

Nếu TV đã root và bạn chỉ muốn kiểm tra xem mọi thứ có hoạt động không:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh --mode Doctor --host 192.168.1.11
```

Thay:

```text
192.168.1.11
```

bằng IP TV của bạn.

Doctor chỉ kiểm tra, không cài lại TV.

---

# Backup TV

Chạy:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh --mode Backup --host 192.168.1.11
```

Nếu đã cấp quyền bộ nhớ ở **Bước 4**, backup thường nằm trong:

```text
Download/GathinTV-Backups
```

Nếu chưa cấp quyền thì GathinTV sẽ lưu backup bên trong Termux và báo đường dẫn trên màn hình.

Không nên chia sẻ file backup của TV lên mạng.

---

# TV đã root và muốn cài lại GathinTV

Chạy:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh --mode Restore --host 192.168.1.11 --trust-new-host
```

Nhớ thay IP bằng IP TV của bạn.

Lệnh này dành cho **TV đã root**.

Nó không chạy exploit root lại.

---

# ❓ Một số lỗi thường gặp

## `command not found`

Ví dụ:

```text
node: command not found
```

Chạy lại:

```bash
pkg install nodejs git curl
```

---

## Không kết nối được TV

Kiểm tra:

**Điện thoại và TV phải cùng Wi-Fi.**

Ví dụ:

```text
Điện thoại: 192.168.1.25
TV:         192.168.1.11
```

Như vậy thường là cùng mạng.

Nếu TV đang dùng:

```text
192.168.1.xxx
```

nhưng điện thoại lại là:

```text
192.168.50.xxx
```

thì hãy kiểm tra lại mạng.

---

## `ECONNREFUSED ...:22`

Nếu bạn chọn **TV đã root** nhưng gặp:

```text
connect ECONNREFUSED 192.168.x.x:22
```

thì TV hiện không có SSH root hoạt động.

Nếu TV thực sự chưa root → chạy lại và chọn:

```text
TV chưa root
```

Nếu TV đã root → kiểm tra SSH/Homebrew trên TV.

---

## Không thấy chữ khi nhập mật khẩu

Bình thường.

Terminal cố tình ẩn mật khẩu.

Nhập xong → Enter.

---

## Termux bị đóng giữa chừng

Mở lại Termux.

Chạy:

```bash
cd "$HOME/.gathintv"
./GathinTV-AutoSetup.sh
```

Không chạy root lại nếu TV đã root thành công.

---

# 🚀 Tóm tắt cho người không muốn đọc nhiều

### Lần đầu dùng Android

Mở Termux và chạy lần lượt **4 dòng**:

```bash
pkg update
```

```bash
pkg install nodejs git curl
```

```bash
termux-setup-storage
```

```bash
curl -fsSL https://raw.githubusercontent.com/twentykhz/macosLG/main/install-android.sh | bash
```

Sau đó:

```text
Nhập IP TV
      ↓
Chọn TV đã root / chưa root
      ↓
Làm theo hướng dẫn trên màn hình
      ↓
Xong
```

---

# Nếu TV chưa root, nhớ chuẩn bị trước

```text
LG Content Store
      ↓
Developer Mode
      ↓
Đăng nhập
      ↓
Dev Mode Status → ON
      ↓
TV reboot
      ↓
Mở lại Developer Mode
      ↓
Key Server → ON
      ↓
Lấy IP + Passphrase
      ↓
Quay lại Termux
```

---

# Nguồn

Project:

https://github.com/twentykhz/macosLG

Termux:

https://github.com/termux/termux-app

https://f-droid.org/packages/com.termux/
