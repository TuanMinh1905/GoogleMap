# Quy tắc Code - GG Map

> Tài liệu này định nghĩa các quy tắc code mà tất cả các task phải tuân thủ.
> Mục đích: giữ codebase nhất quán, dễ bảo trì, không loãng hệ thống.

---

## 1. Cấu trúc thư mục

| Thư mục | Nội dung | Lưu ý |
|---|---|---|
| `src/app/` | Next.js App Router pages | Chỉ chứa page, layout, CSS |
| `src/components/` | React components | Mỗi component 1 file |
| `src/lib/` | Utility functions, API clients | Không chứa React components |
| `src/types/` | TypeScript types/interfaces | Export tập trung |
| `docs/` | Tài liệu dự án | Luôn update khi có thay đổi |
| `supabase/` | Database schema & migrations | Dự phòng cho tương lai |

## 2. Quy tắc đặt tên

- **Components**: PascalCase → `MarkerForm.tsx`
- **Functions / variables**: camelCase → `fetchMarkers()`
- **Types / Interfaces**: PascalCase → `Marker`, `Priority`
- **Files components**: PascalCase → `MapView.tsx`
- **Files utilities**: camelCase → `geocoding.ts`
- **CSS classes**: Tailwind utility (không custom CSS trừ khi bắt buộc)

## 3. Quy tắc Component

- Mỗi component có **1 mục đích rõ ràng** (Single Responsibility)
- Props được define bằng `interface` với tên `ComponentNameProps`
- State management: React hooks (`useState`, `useEffect`, `useCallback`)
- **KHÔNG** nested component definitions → tách file riêng
- **PHẢI** có `'use client'` directive cho client components
- **PHẢI** dùng `dynamic import` với `ssr: false` cho components dùng browser APIs (Leaflet, geolocation)

## 4. Quy tắc Styling

- **Mobile-first** responsive design
- Tailwind CSS làm chính, custom CSS chỉ cho animations & Leaflet overrides
- Z-index hierarchy (không được vi phạm):
  - Map: `z-1`
  - Controls (search, buttons): `z-[1000]`
  - Panels (sidebar, bottom sheet): `z-[1001]`
  - Modals (form): `z-[2000]`
  - Info modal: `z-[3000]`

## 5. Quy tắc Storage & API

### localStorage (hiện tại)
- Key markers: `ggmap_markers` — JSON array
- Key auth: `ggmap_authenticated` — boolean
- **Luôn** wrap `localStorage` access trong `try/catch` (quota, SSR)
- **Luôn** check `typeof window !== 'undefined'` trước khi truy cập
- Sau mỗi mutation (add/edit/delete) → save toàn bộ array rồi `setMarkers()`

### Geocoding (Photon API)
- Base URL: `https://photon.komoot.io`
- Search: `/api/?q=...&limit=5&lat=10.78&lon=106.7`
- Reverse: `/reverse?lat=...&lon=...`
- Timeout: `AbortSignal.timeout(8000)`
- **KHÔNG** dùng `lang=vi` (trả 400)
- **KHÔNG** dùng Nominatim (ISP Việt Nam block)
- Error handling: trả `[]` hoặc `null`, không throw

### Supabase (tương lai — chưa dùng)
- File client: `src/lib/supabase.ts`
- Schema: `supabase/schema.sql`
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Khi bật lại: thêm `isSupabaseConfigured()` check, dùng localStorage làm fallback

## 6. Quy tắc Git

- Commit message bằng **tiếng Việt**
- Format: `emoji Mô tả ngắn gọn`
- Ví dụ:
  - `🎉 Khởi tạo dự án GG Map`
  - `✨ Thêm tính năng tìm kiếm địa chỉ`
  - `🐛 Sửa lỗi marker không hiển thị`
  - `💄 Cải thiện giao diện bottom sheet`
  - `📝 Cập nhật tài liệu`
  - `♻️ Refactor component MarkerList`
  - `🔧 Thay đổi cấu hình`
  - `🗑️ Xóa code/file thừa`
- Sau commit → **tự động push** (`git push`)

## 7. Quy tắc khi thêm tính năng mới

1. Tạo component trong `src/components/`
2. Thêm types nếu cần trong `src/types/index.ts`
3. Import và sử dụng trong `page.tsx`
4. Cập nhật `InfoModal.tsx` — thêm mô tả cho tính năng mới vào `APP_RULES`
5. Cập nhật `docs/SUMMARY.md` — phản ánh đúng hiện trạng
6. Cập nhật `docs/CONVENTIONS.md` — thêm section cho component mới
7. Cập nhật `docs/RULES.md` — nếu có pattern/quy tắc mới
8. Commit bằng tiếng Việt + auto push

## 8. Quy tắc KHÔNG được làm

- ❌ Không thêm dependency mà chưa được đồng ý
- ❌ Không dùng API trả phí
- ❌ Không hardcode secrets (trừ PIN đã quy ước)
- ❌ Không xóa file docs/ — chỉ cập nhật
- ❌ Không thay đổi z-index hierarchy mà không cập nhật tài liệu
- ❌ Không dùng Nominatim (bị block)
- ❌ Không tạo API routes nếu có thể gọi trực tiếp từ client
