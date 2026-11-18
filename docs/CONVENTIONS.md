# Quy ước UI/UX - GG Map

> Tài liệu này mô tả quy ước cho từng phần giao diện.
> Mục đích: Khi quá lâu nhìn lại hoặc người ngoài đọc, sẽ hiểu rõ từng phần hoạt động ra sao.

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
| Map provider | Leaflet + OpenStreetMap tiles |
| Default center | HCM (10.7769, 106.7009) |
| Auto center | GPS vị trí hiện tại (nếu cho phép) |
| Zoom controls | Góc dưới phải |
| Marker icons | SVG custom, màu theo priority |
| Current location | Chấm xanh dương + pulse animation |
| Click action | Mở form thêm điểm mới |

**Marker Colors**:
- 🔴 `#EF4444` — Urgent (Gấp)
- 🟡 `#F59E0B` — Normal (Bình thường)
- 🟢 `#22C55E` — Whenever (Khi nào tiện)

---

## 🔍 SearchBar (Thanh tìm kiếm)

**File**: `src/components/SearchBar.tsx`

| Thuộc tính | Giá trị |
|---|---|
| API | Nominatim (OpenStreetMap) |
| Debounce | 400ms |
| Country filter | Việt Nam (`countrycodes=vn`) |
| Max results | 5 |
| Language | Tiếng Việt (`Accept-Language: vi`) |
| Position | Top center, floating trên map |
| Menu button (☰) | Toggle sidebar/bottom sheet |

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

## ℹ️ InfoModal (Hướng dẫn)

**File**: `src/components/InfoModal.tsx`

| Thuộc tính | Giá trị |
|---|---|
| Tabs | Bản đồ / Tìm kiếm / Danh sách / Phím tắt |
| Position | Center modal |
| Z-index | 3000 (cao nhất) |
| Trigger | Nút ℹ️ trên map / phím `I` |

**Quy tắc cập nhật**: Khi thêm tính năng mới, **PHẢI** thêm mô tả vào `APP_RULES` object trong file này.

