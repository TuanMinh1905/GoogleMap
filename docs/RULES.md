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
| `supabase/` | Database schema & migrations | |

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

## 5. Quy tắc Supabase

- **Luôn** handle error từ Supabase queries
- Dùng `NEXT_PUBLIC_` prefix cho env vars phía client
- Fetch data trong `useEffect` hoặc `useCallback`
- Sau mỗi mutation (insert/update/delete) → gọi `fetchMarkers()` để refresh

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

## 7. Quy tắc khi thêm tính năng mới

1. Tạo component trong `src/components/`
2. Thêm types nếu cần trong `src/types/index.ts`
3. Import và sử dụng trong `page.tsx`
4. Cập nhật `InfoModal.tsx` (thêm quy tắc cho tính năng mới)
5. Cập nhật `docs/SUMMARY.md`
6. Cập nhật `docs/CONVENTIONS.md` nếu cần
7. Commit với message tiếng Việt

