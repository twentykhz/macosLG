# Thay đổi phiên bản 3.4.2

**Tiếng Việt** | [English](CHANGELOG-v3.4.2.en.md)

- Thêm mục Rollback trong menu setup Windows và Android, dùng chung recovery core. Chọn snapshot trước khi chạy tool, kể cả sau khi đã cài thành công.
- Hiện danh sách backup theo đúng địa chỉ TV, model và thời điểm; yêu cầu `CO/YES` trước khi khôi phục, không chọn backup ngầm.
- Hỗ trợ chọn file session/snapshot hoặc thư mục backup, đường dẫn có dấu cách và kiểm tra `DryRun` không thay đổi TV.
- Giữ kiểm tra fingerprint, model/firmware/board, root, checksum, engine rollback và phạm vi file. Không biến rollback thành reset xuất xưởng hoặc unroot.
- Dịch tài liệu 3.4.1 sang tiếng Việt, giữ các bản tiếng Anh riêng; bổ sung hướng dẫn rollback hai ngôn ngữ.
- Giữ tag/artifact/checksum 3.4.1; phát hành 3.4.2 với bootstrap được pin riêng.

[Hướng dẫn rollback](ROLLBACK.vi.md) · [Audit 3.4.1](PYTHON-COMPATIBILITY.md)
