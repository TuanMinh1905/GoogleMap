# GG Map — Agent Rules

> File này được Antigravity tự động load từ `.agents/AGENTS.md`.
> Mọi AI agent làm việc trên project này **PHẢI** tuân thủ.

---

## 📋 Quy tắc bắt buộc sau mỗi task quan trọng

> **PHẢI** thực hiện đầy đủ 4 bước này sau khi hoàn thành mỗi task quan trọng (fix bug, thêm tính năng, refactor lớn...).
> Thứ tự thực hiện: 2 → 3 → 4 → 1 (cập nhật docs trước, push cuối cùng).

### 1. 🚀 Auto Push lên GitHub — Commit bằng tiếng Việt

- Commit message bằng **tiếng Việt**, format: `emoji Mô tả ngắn gọn`
- Emoji theo loại thay đổi:
  - `🎉` Khởi tạo / milestone
  - `✨` Tính năng mới
  - `🐛` Sửa lỗi
  - `💄` Giao diện / UI
  - `♻️` Refactor
  - `📝` Tài liệu
  - `🔧` Config / build
  - `🗑️` Xóa code / file thừa
- Sau commit → **tự động `git push`** (không cần hỏi)

### 2. 📄 Cập nhật Summary (`docs/SUMMARY.md`)

- Mục đích: Conversation mới hoặc agent khác đọc file này sẽ hiểu rõ hệ thống
- Phải phản ánh đúng hiện trạng:
  - Tech stack đang dùng (API nào, storage nào)
  - Cấu trúc thư mục
  - Luồng hoạt động chính
  - Database/storage schema
  - Phím tắt
  - Bảo mật
- Khi thay đổi tech (ví dụ: Nominatim → Photon, Supabase → localStorage) → **PHẢI** cập nhật ngay

### 3. 📐 Cập nhật Quy tắc UI (`docs/CONVENTIONS.md` + `InfoModal.tsx`)

- Mục đích: Người ngoài hoặc quay lại sau lâu → đọc hiểu từng phần hoạt động ra sao
- **Hai nơi phải đồng bộ**:
  - `docs/CONVENTIONS.md` — Tài liệu chi tiết cho developer
  - `src/components/InfoModal.tsx` — Nút ℹ️ trên app cho người dùng (mỗi Tab/Container có mô tả riêng)
- Khi thêm component/tab mới → thêm section vào cả 2 file
- Khi thay đổi hành vi component → cập nhật cả 2 file
- InfoModal là **nút bấm** trên giao diện, chỉ chiếm không gian khi user ấn vào đọc

### 4. 📏 Cập nhật Rule Code (`docs/RULES.md`)

- Mục đích: Mọi task sau tuân thủ, không làm loãng/loạn hệ thống
- Bao gồm:
  - Cấu trúc thư mục
  - Quy tắc đặt tên
  - Quy tắc component
  - Quy tắc styling (z-index, mobile-first)
  - Quy tắc storage/API
  - Quy tắc Git
  - Quy tắc thêm tính năng mới
- Khi thêm pattern mới (ví dụ: thêm API mới, thêm quy tắc z-index) → **PHẢI** bổ sung vào RULES.md

---

## 📂 Đọc thêm

- Tổng quan hệ thống: [`docs/SUMMARY.md`](docs/SUMMARY.md)
- Quy tắc code: [`docs/RULES.md`](docs/RULES.md)
- Quy ước UI/UX: [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)
