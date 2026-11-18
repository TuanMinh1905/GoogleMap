# GG Map - Bản đồ cá nhân

## 🎯 Mục đích

Ứng dụng web cá nhân giúp **đánh dấu và quản lý các địa điểm cần đến**.
Khi có việc đi gần một trong các điểm đã đánh dấu, có thể sắp xếp tiện đường ghé qua → tiết kiệm thời gian di chuyển.

## 🛠️ Tech Stack

| Công nghệ | Vai trò | Chi phí |
|---|---|---|
| **Next.js 16** + TypeScript | Frontend framework | Miễn phí |
| **Tailwind CSS 4** | Styling (mobile-first) | Miễn phí |
| **Leaflet** + OpenStreetMap | Bản đồ tương tác | Miễn phí |
| **Nominatim API** | Tìm kiếm địa chỉ (geocoding) | Miễn phí |
| **Supabase** | Database PostgreSQL (đồng bộ nhiều thiết bị) | Free tier |
| **Vercel** | Hosting & Deploy | Free tier |

## 📂 Cấu trúc dự án

```
GGMap/
├── docs/                    # Tài liệu dự án
│   ├── SUMMARY.md           # File này - tổng quan dự án
│   ├── RULES.md             # Quy tắc code
│   └── CONVENTIONS.md       # Quy ước UI/UX
├── supabase/
│   └── schema.sql           # SQL tạo bảng database
├── src/
│   ├── app/
│   │   ├── globals.css      # CSS toàn cục + animations
│   │   ├── layout.tsx       # Root layout (metadata, Leaflet CSS)
│   │   └── page.tsx         # Trang chính - kết hợp tất cả components
│   ├── components/
│   │   ├── PinAuth.tsx      # Màn hình nhập PIN bảo vệ
│   │   ├── MapView.tsx      # Bản đồ Leaflet + markers
│   │   ├── SearchBar.tsx    # Thanh tìm kiếm địa chỉ
│   │   ├── MarkerForm.tsx   # Form thêm/sửa điểm
│   │   ├── MarkerList.tsx   # Bottom sheet (mobile) + Sidebar (desktop)
│   │   └── InfoModal.tsx    # Modal hiển thị quy tắc/hướng dẫn
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   ├── geocoding.ts     # Nominatim search & reverse geocode
│   │   └── utils.ts         # Tính khoảng cách, format, colors
│   └── types/
│       └── index.ts         # TypeScript interfaces
├── .env.local.example       # Template biến môi trường
├── package.json
├── next.config.ts
└── tsconfig.json
```

## 🔄 Luồng hoạt động chính

1. **Mở app** → Nhập PIN (1905) → Truy cập bản đồ
2. **Bản đồ** auto center vào vị trí GPS hiện tại
3. **Thêm điểm**: Chạm bản đồ HOẶC tìm kiếm địa chỉ
4. **Xem danh sách**: Kéo bottom sheet (mobile) hoặc mở sidebar (desktop)
5. **Sắp xếp**: Theo khoảng cách / ưu tiên / tên, nhóm theo thành phố
6. **Chỉnh sửa / Xóa** điểm qua form

## 💾 Database Schema

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID (PK) | ID tự động |
| `name` | TEXT | Tên điểm (bắt buộc) |
| `address` | TEXT | Địa chỉ chi tiết |
| `note` | TEXT | Ghi chú |
| `priority` | TEXT | `urgent` / `normal` / `whenever` |
| `lat` | DOUBLE | Vĩ độ |
| `lng` | DOUBLE | Kinh độ |
| `city` | TEXT | Thành phố (tự động từ geocoding) |
| `created_at` | TIMESTAMPTZ | Thời gian tạo |

## ⌨️ Phím tắt

| Phím | Chức năng |
|---|---|
| `/` hoặc `Ctrl+K` | Focus ô tìm kiếm |
| `Escape` | Đóng dialog/panel |
| `L` | Mở/đóng danh sách |
| `M` | Về vị trí hiện tại |
| `I` | Mở/đóng hướng dẫn |

## 🔐 Bảo mật

- PIN: `1905` (thay đổi trong `src/components/PinAuth.tsx`)
- Lưu trạng thái đăng nhập trong `localStorage`
- Supabase RLS enabled (policy cho phép tất cả vì PIN auth ở client)

