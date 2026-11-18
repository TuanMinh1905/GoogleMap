'use client';

import { useState } from 'react';
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

export default function MarkerList({
  markers,
  currentPosition,
  onMarkerClick,
  onEditMarker,
  isOpen,
  onToggle,
}: MarkerListProps) {
  const [sortBy, setSortBy] = useState<'distance' | 'priority' | 'name'>('distance');

  const sortedMarkers = [...markers].sort((a, b) => {
    if (sortBy === 'distance' && currentPosition) {
      const distA = calculateDistance(currentPosition.lat, currentPosition.lng, a.lat, a.lng);
      const distB = calculateDistance(currentPosition.lat, currentPosition.lng, b.lat, b.lng);
      return distA - distB;
    }
    if (sortBy === 'priority') {
      const order: Record<string, number> = { urgent: 0, normal: 1, whenever: 2 };
      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
    }
    return a.name.localeCompare(b.name, 'vi');
  });

  const groupedMarkers = sortedMarkers.reduce(
    (groups, marker) => {
      const city = marker.city || 'Khác';
      if (!groups[city]) groups[city] = [];
      groups[city].push(marker);
      return groups;
    },
    {} as Record<string, Marker[]>
  );

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
      {/* ===== MOBILE: Bottom Sheet ===== */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[1001] bg-white rounded-t-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out sm:hidden ${
          isOpen ? 'h-[65vh]' : 'h-[56px]'
        }`}
      >
        {/* Handle */}
        <button
          className="w-full flex justify-center pt-2 pb-1"
          onClick={onToggle}
        >
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </button>

        {/* Header */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">
            📍 {markers.length} điểm đã lưu
          </h3>
          {isOpen && <SortButtons />}
        </div>

        {/* List */}
        {isOpen && (
          <div className="overflow-y-auto h-[calc(100%-72px)] px-3 pb-8">
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
    ? calculateDistance(
        currentPosition.lat,
        currentPosition.lng,
        marker.lat,
        marker.lng
      )
    : null;

  return (
    <div
      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer mb-0.5 group transition-colors"
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
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all flex-shrink-0"
            title="Chỉnh sửa"
          >
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

