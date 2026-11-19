# Quy ước UI/UX - GG Map

> Tài liệu này mô tả quy ước cho từng phần giao diện.
> Mục đích: Khi quá lâu nhìn lại hoặc người ngoài đọc, sẽ hiểu rõ từng phần hoạt động ra sao.
>
> **Đồng bộ**: Nội dung này phải khớp với `APP_RULES` trong `src/components/InfoModal.tsx`.
> Khi sửa ở đây → sửa cả InfoModal, và ngược lại.

---

## 🔐 PinAuth (Màn hình xác thực)

**File**: `src/components/PinAuth.tsx`

| Thuộc tính | Giá trị |
|---|---|
| PIN hiện tại | `1905` |
| Lưu trữ | `localStorage` key `ggmap_authenticated` |
| Số ô nhập | 4 ô, mỗi ô 1 số |
| Hành vi sai PIN | Rung (shake), xóa hết, focus ô đầu |
| Hành vi đúng PIN | Lưu localStorage, render children |
| Hỗ trợ paste | Có (paste 4 số → check ngay) |

**Thay đổi PIN**: Sửa biến `CORRECT_PIN` trong file component.

---

## 🗺️ MapView (Bản đồ)

**File**: `src/components/MapView.tsx`

| Thuộc tính | Giá trị |
|---|---|
| Map provider | Leaflet + OpenStreetMap tiles (`tile.openstreetmap.de`) |
| Default center | HCM (10.7769, 106.7009) |
| Auto center | GPS vị trí hiện tại (nếu cho phép) |
| Zoom controls | Góc dưới phải |
| Marker icons | SVG custom, màu theo priority |
| Current location | Chấm xanh dương + pulse animation |
| Click action | Reverse geocode (Photon) → mở form thêm điểm mới |
| **Search preview pin** | Pin đỏ (#EF4444) tạm thời — hiện khi chọn kết quả tìm kiếm, biến mất khi lưu/bỏ qua |

**Marker Colors**:
- 🔴 `#EF4444` — Urgent (Gấp)
- 🟡 `#F59E0B` — Normal (Bình thường)
- 🟢 `#22C55E` — Whenever (Khi nào tiện)
- 📍 `#EF4444` — Search preview (pin tạm, chưa lưu)

---

## 🔍 SearchBar (Thanh tìm kiếm)

**File**: `src/components/SearchBar.tsx`

| Thuộc tính | Giá trị |
|---|---|
| API | **Photon** (`photon.komoot.io`) |
| Debounce | 1500ms |
| Location bias | HCM (lat=10.78, lon=106.7) |
| Max results | 5 |
| Position | Top center, floating trên map |
| Menu button (☰) | Toggle sidebar/bottom sheet |
| **Chọn kết quả** | Fly đến vị trí + hiện search preview pin đỏ — **không** mở form ngay |
| **Nút X (clear)** | Xóa query + xóa search preview pin |

**Lưu ý**: Không dùng Nominatim (ISP block). Photon không hỗ trợ `lang=vi`.

---

## 📝 MarkerForm (Form thêm/sửa điểm)

**File**: `src/components/MarkerForm.tsx`

| Thuộc tính | Giá trị |
|---|---|
| Modes | `add` (thêm mới) / `edit` (chỉnh sửa) |
| Required fields | Tên điểm |
| Optional fields | Địa chỉ, ghi chú, ưu tiên |
| Default priority | `normal` (Bình thường) |
| Auto-fill | Địa chỉ + tọa độ từ map click / search |
| Hiển thị | Modal từ dưới lên (mobile), center (desktop) |
| Nút Xóa | Chỉ hiển thị ở mode `edit` |
| **Autocomplete** | Gõ ≥ 3 ký tự → 1500ms debounce → Photon search → danh sách gợi ý inline |

**Autocomplete flow**:
1. User gõ ≥ 3 ký tự
2. Debounce 1500ms
3. Gọi `searchAddress()` → Photon API
4. Hiển thị danh sách gợi ý inline (không absolute, tránh bị clip bởi overflow)
5. User chọn → fill address + lat/lng + city
6. Nếu không có kết quả → hiện "Không tìm thấy — thử gõ tên khác"

---

## 📋 MarkerList (Danh sách điểm)

**File**: `src/components/MarkerList.tsx`

### Mobile (< 640px): Bottom Sheet
| Thuộc tính | Giá trị |
|---|---|
| Thu gọn | 56px (chỉ thấy header) |
| Mở rộng | 65vh |
| Toggle | Bấm vào thanh handle |

### Desktop (≥ 640px): Sidebar
| Thuộc tính | Giá trị |
|---|---|
| Width | 320px (w-80) |
| Position | Fixed left |
| Toggle | Nút ☰ trên search bar / nút × |

### Chung
| Thuộc tính | Giá trị |
|---|---|
| Sắp xếp | 📏 Khoảng cách / 🔥 Ưu tiên / 🔤 Tên |
| Nhóm | Theo thành phố (tự động) |
| Hiển thị | Tên, ghi chú, priority badge, khoảng cách |
| Click | Bay đến điểm trên bản đồ |
| Edit | Hover → hiện nút ✏️ |

---

## ℹ️ InfoModal (Quy tắc & Hướng dẫn)

**File**: `src/components/InfoModal.tsx`

| Thuộc tính | Giá trị |
|---|---|
| Tabs | Bản đồ / Tìm kiếm / Danh sách / Phím tắt |
| Position | Center modal |
| Z-index | 3000 (cao nhất) |
| Trigger | Nút ℹ️ trên map / phím `I` |

**Quy tắc cập nhật**: Khi thêm tính năng mới, **PHẢI** thêm mô tả vào `APP_RULES` object trong file này.

**Mục đích nút ℹ️**: Chỉ chiếm 1 nút nhỏ trên giao diện. Khi cần hiểu app hoạt động ra sao → ấn vào đọc. Không chiếm không gian thường xuyên.
