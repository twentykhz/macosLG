# Xem mã nguồn và build

[Trang chính](../README.md) · [English](DEVELOPMENT.en.md)

Repo là nội dung của **MAC-WebOSTV-Source**. File sinh ra trong **MAC-WebOSTV-Release** là tài sản phát hành, tải ở GitHub Releases. Không thay source tree bằng thư mục Release.

| Đường dẫn | Nội dung |
|---|---|
| `payload/app/` | Toàn bộ HTML/CSS/JavaScript launcher, widget, dock, icon, ảnh và font công khai |
| `payload/advanced/files/` | Dịch vụ remote, hình nền, root bridge, voice và hook khởi động |
| `payload/advanced/map.json` | Ánh xạ file nguồn tới đường dẫn trên TV |
| `payload/home/` | HOME relay và cơ chế khởi chạy launcher |
| `config/launcher.json` | Hai địa điểm mặc định, thành viên mẫu, slideshow |
| `config/profile.json` | Profile phần cứng/API đã kiểm tra |
| `lib/`, `scripts/` | Bộ cài, backup, restore, build và đóng gói PowerShell |
| `test/` | Các kiểm tra tự động không cài lại TV |
| `upstream/`, `THIRD-PARTY.md` | Thành phần ghim phiên bản và nguồn/giấy phép |

Tải source bằng GitHub Code → Download ZIP rồi giải nén, hoặc:

```powershell
git clone https://github.com/twentykhz/macosLG.git
cd macosLG
npm.cmd ci
```

Yêu cầu Node.js 20+ và npm trên Windows, Android/Termux, Linux hoặc macOS. POSIX dùng `npm` thay cho `npm.cmd`; có thể dùng `npm ci --omit=optional --ignore-scripts` để bỏ tối ưu native không bắt buộc. Bộ test phát triển cần thêm Bash/Python 3, riêng test PowerShell chỉ chạy trên Windows. Người dùng release không phải cài dependency bằng npm.

Sửa địa điểm và `family` trong `config/launcher.json`. Mỗi người có `name`, `day`, `month`, `year`; dùng 1–6 người. Thông tin mẫu không phải dữ liệu gia đình chủ TV. Sửa app dock trong `payload/app/config.js`. Không điền IP/khóa QR cố định: dịch vụ trên TV tự tạo token và QR theo IP đích.

```powershell
npm.cmd run build
npm.cmd run verify
npm.cmd test
npm.cmd run package
```

`build` sinh cấu hình, IPK và checksum. `package` dùng Node thuần để tạo ZIP với đường dẫn POSIX, giữ AutoSetup PowerShell tự chứa và sinh thêm `GathinTV-Termux-3.4.0-HASH.tar.gz`, checksum, manifest và `install-android.sh` ghim hash tại thư mục `MAC-WebOSTV-Release` cạnh repo. Runtime điện thoại bỏ test/ảnh tài liệu và native optimization, nhưng dùng cùng source core. Bootstrap được sinh sau tar để tránh hash vòng; không nằm trong chính tar mà nó xác minh. Giữ archive mang hash bất biến trên Releases cho bootstrap đã phát hành. Sau sửa source cần package lại; sửa payload cần build trước.

File AutoSetup tạo lại ở root để tiện kiểm tra nhưng được bỏ qua bởi Git; khi phát hành tải file đó lên Releases, không thêm file lớn sinh tự động vào source commit. Source ZIP của release có dependency production để dùng bộ cài; muốn build từ ZIP vẫn chạy `npm.cmd ci` để có công cụ phát triển.

Chỉ mã dự án thuộc LICENSE; font/artwork/thành phần upstream có giấy phép riêng. Bản 3.1.1 dùng SF Pro theo TV tham chiếu, có Inter dự phòng; giấy phép MIT của mã dự án không áp dụng thay cho điều khoản font bên thứ ba. Kiểm tra `THIRD-PARTY.md` khi thêm tài sản mới.

Không commit `.local`, `node_modules`, khóa SSH, access key/PIN, passphrase, log hoặc backup. Xem [VALIDATION.md](VALIDATION.md) trước khi tuyên bố hỗ trợ model mới. Giữ kiểm tra model/firmware/ABI và xác minh khóa SSH. Thay đổi profile phải có kiểm chứng thực tế, không chỉ đổi tên model trong JSON.
