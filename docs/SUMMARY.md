# GG Map - Bản đồ cá nhân

## 🎯 Mục đích

Ứng dụng web cá nhân giúp **đánh dấu và quản lý các địa điểm cần đến**.
Khi có việc đi gần một trong các điểm đã đánh dấu, có thể sắp xếp tiện đường ghé qua → tiết kiệm thời gian di chuyển.

## 🛠️ Tech Stack

| Công nghệ | Vai trò | Chi phí |
|---|---|---|
| **Next.js 16** + TypeScript | Frontend framework | Miễn phí |
| **Tailwind CSS 4** | Styling (mobile-first) | Miễn phí |
| **Leaflet** + OpenStreetMap | Bản đồ tương tác (tiles: `tile.openstreetmap.de`) | Miễn phí |
| **Photon API** (`photon.komoot.io`) | Tìm kiếm địa chỉ (geocoding + reverse) | Miễn phí |
| **localStorage** | Lưu trữ markers (offline, single-device) | Miễn phí |
| **Vercel** | Hosting & Deploy (chưa deploy) | Free tier |

> **Lưu ý**: Đã chuyển từ Nominatim → **Photon** vì ISP Việt Nam block `nominatim.openstreetmap.org`.
> Đã chuyển từ Supabase → **localStorage** vì chưa cấu hình Supabase (không có `.env.local`).
> Supabase có thể bật lại trong tương lai nếu cần đồng bộ nhiều thiết bị.

## 📂 Cấu trúc dự án

```
GGMap/
├── AGENTS.md                # Quy tắc cho AI agent (auto-gen bởi Next.js + custom rules)
├── docs/                    # Tài liệu dự án
│   ├── SUMMARY.md           # File này - tổng quan dự án
│   ├── RULES.md             # Quy tắc code
│   └── CONVENTIONS.md       # Quy ước UI/UX cho từng component
├── supabase/
│   └── schema.sql           # SQL tạo bảng (dự phòng cho tương lai)
├── src/
│   ├── app/
│   │   ├── globals.css      # CSS toàn cục + animations
│   │   ├── layout.tsx       # Root layout (metadata, Leaflet CSS)
│   │   └── page.tsx         # Trang chính - kết hợp tất cả components + localStorage CRUD
│   ├── components/
│   │   ├── PinAuth.tsx      # Màn hình nhập PIN bảo vệ
│   │   ├── MapView.tsx      # Bản đồ Leaflet + markers + vị trí hiện tại
│   │   ├── SearchBar.tsx    # Thanh tìm kiếm địa chỉ (Photon API, 1500ms debounce)
│   │   ├── MarkerForm.tsx   # Form thêm/sửa điểm + autocomplete địa chỉ inline
│   │   ├── MarkerList.tsx   # Bottom sheet (mobile) + Sidebar (desktop)
│   │   └── InfoModal.tsx    # Modal hiển thị quy tắc/hướng dẫn (nút ℹ️)
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client (không dùng - giữ cho tương lai)
│   │   ├── geocoding.ts     # Photon API: search + reverse geocode
│   │   └── utils.ts         # Tính khoảng cách, format, colors
│   └── types/
│       └── index.ts         # TypeScript interfaces (Marker, SearchResult, Priority)
├── .env.local.example       # Template biến môi trường (Supabase)
├── package.json
├── next.config.ts
└── tsconfig.json
```

## 🔄 Luồng hoạt động chính

1. **Mở app** → Nhập PIN (1905) → Truy cập bản đồ
2. **Bản đồ** auto center vào vị trí GPS hiện tại
3. **Thêm điểm**:
   - **Cách 1**: Chạm vào bản đồ → reverse geocode tự động điền địa chỉ → mở form
   - **Cách 2**: Gõ tìm kiếm ở SearchBar → chọn kết quả → fly đến vị trí + hiện **pin đỏ preview** → ấn **"Lưu địa chỉ"** mới mở form
   - **Cách 3**: Gõ địa chỉ trong MarkerForm → autocomplete gợi ý → chọn
4. **Xem danh sách**: Kéo bottom sheet (mobile) hoặc mở sidebar (desktop)
5. **Sắp xếp**: Theo khoảng cách / ưu tiên / tên, nhóm theo thành phố
6. **Chỉnh sửa / Xóa** điểm qua form
7. **Quy tắc & Hướng dẫn**: Nút ℹ️ trên bản đồ → xem quy tắc từng phần

## 💾 Storage Schema (localStorage)

**Key**: `ggmap_markers`
**Value**: JSON array of Marker objects

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | string (UUID) | ID tự động (`crypto.randomUUID()`) |
| `name` | string | Tên điểm (bắt buộc) |
| `address` | string | Địa chỉ chi tiết |
| `note` | string | Ghi chú |
| `priority` | `'urgent'` \| `'normal'` \| `'whenever'` | Mức ưu tiên |
| `lat` | number | Vĩ độ |
| `lng` | number | Kinh độ |
| `city` | string | Thành phố (tự động từ geocoding) |
| `created_at` | string (ISO 8601) | Thời gian tạo |

## 🌐 Geocoding API (Photon)

| Endpoint | Chức năng | URL |
|---|---|---|
| Search | Tìm địa chỉ theo text | `https://photon.komoot.io/api/?q=...&limit=5&lat=10.78&lon=106.7` |
| Reverse | Lấy địa chỉ từ tọa độ | `https://photon.komoot.io/reverse?lat=...&lon=...` |

- Bias về HCM (lat=10.78, lon=106.7) để ưu tiên kết quả gần
- Timeout: 8000ms
- **Không hỗ trợ** `lang=vi` (trả 400) → dùng mặc định
- Kết quả trả về GeoJSON → parse thành `SearchResult`

## ⌨️ Phím tắt

| Phím | Chức năng |
|---|---|
| `/` hoặc `Ctrl+K` | Focus ô tìm kiếm |
| `Escape` | Đóng dialog/panel |
| `L` | Mở/đóng danh sách |
| `M` | Về vị trí hiện tại |
| `I` | Mở/đóng hướng dẫn |

## 🔐 Bảo mật

- PIN: `1905` (thay đổi trong `src/components/PinAuth.tsx` biến `CORRECT_PIN`)
- Lưu trạng thái đăng nhập trong `localStorage` key `ggmap_authenticated`
- Không có backend auth — PIN chỉ là client-side gate

## 🔮 Nâng cấp tương lai (nếu cần)

- **Supabase**: Bật lại khi cần đồng bộ nhiều thiết bị — file `supabase/schema.sql` đã sẵn sàng
- **Vercel Deploy**: `vercel` CLI hoặc GitHub integration — Photon API sẽ hoạt động từ Vercel servers
- **Location bias**: Dùng GPS hiện tại thay vì hardcode HCM center
