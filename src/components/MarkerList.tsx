'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Marker } from '@/types';
import {
  calculateDistance,
  formatDistance,
  getPriorityColor,
  getPriorityLabel,
} from '@/lib/utils';

interface MarkerListProps {
  markers: Marker[];
  currentPosition: { lat: number; lng: number } | null;
  onMarkerClick: (marker: Marker) => void;
  onEditMarker: (marker: Marker) => void;
  isOpen: boolean;
  onToggle: () => void;
}

// 3 snap points tính từ bottom (px): collapsed, half, full
const SNAP_COLLAPSED = 56;   // chỉ hiện handle + header
const SNAP_HALF      = 0.45; // 45% chiều cao màn hình
const SNAP_FULL      = 0.85; // 85% chiều cao màn hình

export default function MarkerList({
  markers,
  currentPosition,
  onMarkerClick,
  onEditMarker,
  isOpen,
  onToggle,
}: MarkerListProps) {
  const [sortBy, setSortBy] = useState<'distance' | 'priority' | 'name'>('distance');

  // height tính từ bottom (px)
  const [sheetH, setSheetH] = useState(SNAP_COLLAPSED);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const isDragging = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Snap points tuyệt đối (px) - tính lại mỗi khi window resize
  const getSnaps = useCallback(() => {
    const wh = window.innerHeight;
    return [SNAP_COLLAPSED, Math.round(wh * SNAP_HALF), Math.round(wh * SNAP_FULL)];
  }, []);

  // Khi isOpen thay đổi từ ngoài (nút ☰ hoặc phím L)
  useEffect(() => {
    const snaps = getSnaps();
    if (isOpen) {
      // Nếu đang collapsed → mở lên half
      setSheetH((h) => (h <= SNAP_COLLAPSED ? snaps[1] : h));
    } else {
      setSheetH(SNAP_COLLAPSED);
    }
  }, [isOpen, getSnaps]);

  // Snap tới điểm gần nhất
  const snapTo = useCallback((h: number) => {
    const snaps = getSnaps();
    const nearest = snaps.reduce((prev, curr) =>
      Math.abs(curr - h) < Math.abs(prev - h) ? curr : prev
    );
    setSheetH(nearest);
    // Đồng bộ trạng thái isOpen với parent
    if (nearest <= SNAP_COLLAPSED && isOpen) onToggle();
    if (nearest > SNAP_COLLAPSED && !isOpen) onToggle();
  }, [getSnaps, isOpen, onToggle]);

  /* ---- Touch handlers ---- */
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragStartH.current = sheetH;
  }, [sheetH]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const dy = dragStartY.current - e.touches[0].clientY; // kéo lên → dy dương
    const newH = Math.max(SNAP_COLLAPSED, Math.min(window.innerHeight * 0.9, dragStartH.current + dy));
    setSheetH(newH);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setSheetH((h) => {
      const snaps = getSnaps();
      const nearest = snaps.reduce((prev, curr) =>
        Math.abs(curr - h) < Math.abs(prev - h) ? curr : prev
      );
      // Đồng bộ isOpen
      if (nearest <= SNAP_COLLAPSED && isOpen) setTimeout(onToggle, 0);
      if (nearest > SNAP_COLLAPSED && !isOpen) setTimeout(onToggle, 0);
      return nearest;
    });
  }, [getSnaps, isOpen, onToggle]);

  /* ---- Mouse handlers (desktop drag) ---- */
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    dragStartH.current = sheetH;

    const onMove = (ev: MouseEvent) => {
      const dy = dragStartY.current - ev.clientY;
      const newH = Math.max(SNAP_COLLAPSED, Math.min(window.innerHeight * 0.9, dragStartH.current + dy));
      setSheetH(newH);
    };
    const onUp = () => {
      isDragging.current = false;
      setSheetH((h) => {
        const snaps = getSnaps();
        const nearest = snaps.reduce((prev, curr) =>
          Math.abs(curr - h) < Math.abs(prev - h) ? curr : prev
        );
        if (nearest <= SNAP_COLLAPSED && isOpen) setTimeout(onToggle, 0);
        if (nearest > SNAP_COLLAPSED && !isOpen) setTimeout(onToggle, 0);
        return nearest;
      });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [sheetH, getSnaps, isOpen, onToggle]);

  /* ---- Click handle (tap để toggle) ---- */
  const handleTap = useCallback(() => {
    // Chỉ toggle nếu không đang drag
    if (isDragging.current) return;
    const snaps = getSnaps();
    setSheetH((h) => {
      let next: number;
      if (h <= SNAP_COLLAPSED) next = snaps[1];         // collapsed → half
      else if (h < snaps[2] - 20) next = snaps[2];     // half → full
      else next = SNAP_COLLAPSED;                        // full → collapsed
      if (next <= SNAP_COLLAPSED && isOpen) setTimeout(onToggle, 0);
      if (next > SNAP_COLLAPSED && !isOpen) setTimeout(onToggle, 0);
      return next;
    });
  }, [getSnaps, isOpen, onToggle]);

  /* ---- Sorted & grouped markers ---- */
  const sortedMarkers = [...markers].sort((a, b) => {
    if (sortBy === 'distance' && currentPosition) {
      return calculateDistance(currentPosition.lat, currentPosition.lng, a.lat, a.lng)
           - calculateDistance(currentPosition.lat, currentPosition.lng, b.lat, b.lng);
    }
    if (sortBy === 'priority') {
      const order: Record<string, number> = { urgent: 0, normal: 1, whenever: 2 };
      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
    }
    return a.name.localeCompare(b.name, 'vi');
  });

  const groupedMarkers = sortedMarkers.reduce((groups, marker) => {
    const city = marker.city || 'Khác';
    if (!groups[city]) groups[city] = [];
    groups[city].push(marker);
    return groups;
  }, {} as Record<string, Marker[]>);

  const isExpanded = sheetH > SNAP_COLLAPSED;

  const SortButtons = () => (
    <div className="flex gap-1">
      {([
        { key: 'distance' as const, icon: '📏', label: 'Gần nhất' },
        { key: 'priority' as const, icon: '🔥', label: 'Ưu tiên' },
        { key: 'name' as const, icon: '🔤', label: 'Tên' },
      ]).map(({ key, icon, label }) => (
        <button
          key={key}
          onClick={() => setSortBy(key)}
          className={`px-2 py-1 text-xs rounded-lg transition-colors ${
            sortBy === key
              ? 'bg-blue-100 text-blue-700 font-medium'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
          title={label}
        >
          {icon} <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );

  const MarkerItems = () => (
    <>
      {Object.entries(groupedMarkers).map(([city, cityMarkers]) => (
        <div key={city} className="mb-4">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            {city} ({cityMarkers.length})
          </h4>
          {cityMarkers.map((marker) => (
            <MarkerCard
              key={marker.id}
              marker={marker}
              currentPosition={currentPosition}
              onClick={() => onMarkerClick(marker)}
              onEdit={() => onEditMarker(marker)}
            />
          ))}
        </div>
      ))}

      {markers.length === 0 && (
        <div className="text-center text-gray-400 py-10">
          <p className="text-4xl mb-3">📍</p>
          <p className="font-medium">Chưa có điểm nào</p>
          <p className="text-sm mt-1">Chạm vào bản đồ hoặc tìm kiếm để thêm</p>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ===== MOBILE: Bottom Sheet with drag ===== */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] sm:hidden"
        style={{
          height: `${sheetH}px`,
          transition: isDragging.current ? 'none' : 'height 0.28s cubic-bezier(0.32,0.72,0,1)',
          willChange: 'height',
        }}
      >
        {/* Drag handle — vùng kéo rộng, dễ chạm */}
        <div
          className="w-full flex flex-col items-center pt-2 pb-1 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onClick={handleTap}
          style={{ touchAction: 'none' }}
        >
          <div className="w-10 h-1.5 bg-gray-300 rounded-full mb-1" />
        </div>

        {/* Header */}
        <div
          className="px-4 pb-2 flex items-center justify-between cursor-pointer select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onClick={handleTap}
          style={{ touchAction: 'none' }}
        >
          <h3 className="font-semibold text-gray-800 text-sm">
            📍 {markers.length} điểm đã lưu
          </h3>
          {isExpanded && <SortButtons />}
        </div>

        {/* List — chỉ scroll khi expanded */}
        {isExpanded && (
          <div
            className="overflow-y-auto px-3 pb-8"
            style={{ height: `calc(${sheetH}px - 72px)`, overscrollBehavior: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          >
            <MarkerItems />
          </div>
        )}
      </div>

      {/* ===== DESKTOP: Sidebar ===== */}
      <div
        className={`hidden sm:flex flex-col fixed left-0 top-0 bottom-0 z-[1001] bg-white shadow-lg transition-all duration-300 ease-out overflow-hidden ${
          isOpen ? 'w-80' : 'w-0'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-gray-800">📍 {markers.length} điểm đã lưu</h3>
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sort */}
        <div className="p-3 border-b border-gray-100 flex-shrink-0">
          <SortButtons />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-3">
          <MarkerItems />
        </div>
      </div>
    </>
  );
}

/* ===== Marker Card Component ===== */
function MarkerCard({
  marker,
  currentPosition,
  onClick,
  onEdit,
}: {
  marker: Marker;
  currentPosition: { lat: number; lng: number } | null;
  onClick: () => void;
  onEdit: () => void;
}) {
  const distance = currentPosition
    ? calculateDistance(currentPosition.lat, currentPosition.lng, marker.lat, marker.lng)
    : null;

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl active:bg-gray-100 hover:bg-gray-50 cursor-pointer mb-0.5 group transition-colors"
      onClick={onClick}
    >
      <div
        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-white shadow-sm"
        style={{ backgroundColor: getPriorityColor(marker.priority) }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <h5 className="font-medium text-gray-800 text-sm truncate">
            {marker.name}
          </h5>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-all flex-shrink-0 opacity-60 group-hover:opacity-100"
            title="Chỉnh sửa"
          >
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {marker.note && (
          <p className="text-xs text-gray-400 truncate mt-0.5 italic">
            📝 {marker.note}
          </p>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
            style={{
              backgroundColor: getPriorityColor(marker.priority) + '18',
              color: getPriorityColor(marker.priority),
            }}
          >
            {getPriorityLabel(marker.priority)}
          </span>
          {distance !== null && (
            <span className="text-[10px] text-gray-400 font-medium">
              📏 {formatDistance(distance)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
