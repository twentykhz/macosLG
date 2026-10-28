# Thay đổi phiên bản 3.4.2

- Sửa nhập liệu Termux: chọn tiếng Việt/Anh, mô tả rõ TV đã root/chưa root; nhập sai menu/model/firmware được hỏi lại. Hướng dẫn phân biệt model, phiên bản phần mềm và passphrase Developer Mode; chặn dùng passphrase làm model trước khi kết nối TV.

**Tiếng Việt** | [English](CHANGELOG-v3.4.2.en.md)

- Thêm mục Rollback trong menu setup Windows và Android, dùng chung recovery core. Chọn snapshot trước khi chạy tool, kể cả sau khi đã cài thành công.
- Hiện danh sách backup theo đúng địa chỉ TV, model và thời điểm; yêu cầu `CO/YES` trước khi khôi phục, không chọn backup ngầm.
- Hỗ trợ chọn file session/snapshot hoặc thư mục backup, đường dẫn có dấu cách và kiểm tra `DryRun` không thay đổi TV.
- Giữ kiểm tra fingerprint, model/firmware/board, root, checksum, engine rollback và phạm vi file. Không biến rollback thành reset xuất xưởng hoặc unroot.
- Dịch tài liệu 3.4.1 sang tiếng Việt, giữ các bản tiếng Anh riêng; bổ sung hướng dẫn rollback hai ngôn ngữ.
- Giữ tag/artifact/checksum 3.4.1; phát hành 3.4.2 với bootstrap được pin riêng.

[Hướng dẫn rollback](ROLLBACK.vi.md) · [Audit 3.4.1](PYTHON-COMPATIBILITY.md)
- Bản sửa YouTube trong 3.4.2: gỡ YouTube gốc/bản không khớp trước khi cài YouTube AdFree 0.5.3; kiểm tra phiên bản sau cài và giữ nguyên AdFree đã đúng bản. `--no-extra-apps` bỏ qua bước này. Rollback snapshot không phục hồi gói YouTube gốc hoặc dữ liệu đăng nhập; có thể cài lại bản gốc từ LG Content Store.
