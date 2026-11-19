'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import PinAuth from '@/components/PinAuth';
import SearchBar from '@/components/SearchBar';
import MarkerForm from '@/components/MarkerForm';
import MarkerList from '@/components/MarkerList';
import InfoModal from '@/components/InfoModal';
import { reverseGeocode } from '@/lib/geocoding';
import { getCityFromAddress } from '@/lib/utils';
import { Marker, SearchResult } from '@/types';

// ===== localStorage storage =====
const STORAGE_KEY = 'ggmap_markers';

function getMarkersFromStorage(): Marker[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveMarkersToStorage(markers: Marker[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch {
    // quota exceeded - ignore
  }
}

// Dynamic import để tránh SSR (Leaflet cần window/document)
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3" />
        <p className="text-sm text-gray-400">Đang tải bản đồ...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<Marker>>({});
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [flyTo, setFlyTo] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  // Preview pin đỏ khi tìm kiếm (chưa lưu)
  const [searchPreview, setSearchPreview] = useState<{
    lat: number;
    lng: number;
    address: string;
    city: string;
  } | null>(null);

  // ===== Load markers từ localStorage =====
  useEffect(() => {
    setMarkers(getMarkersFromStorage());
  }, []);

  // ===== Theo dõi vị trí hiện tại =====
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setCurrentPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ===== Phím tắt =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bỏ qua khi đang gõ trong input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case '/':
          e.preventDefault();
          document
            .querySelector<HTMLInputElement>('input[placeholder*="Tìm kiếm"]')
            ?.focus();
          break;
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document
              .querySelector<HTMLInputElement>(
                'input[placeholder*="Tìm kiếm"]'
              )
              ?.focus();
          }
          break;
        case 'Escape':
          setShowForm(false);
          setShowInfo(false);
          if (showList) setShowList(false);
          break;
        case 'l':
        case 'L':
          setShowList((prev) => !prev);
          break;
        case 'i':
        case 'I':
          setShowInfo((prev) => !prev);
          break;
        case 'm':
        case 'M':
          if (currentPosition) {
            setFlyTo({ ...currentPosition, zoom: 15 });
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPosition, showList]);

  // ===== Handlers =====
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const result = await reverseGeocode(lat, lng);

    setFormData({
      lat,
      lng,
      address: result?.display_name || '',
      city: result?.address ? getCityFromAddress(result.address) : '',
    });
    setFormMode('add');
    setEditingMarker(null);
    setShowForm(true);
  }, []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Fly đến vị trí tìm kiếm
    setFlyTo({ lat, lng, zoom: 16 });

    // Hiện preview pin đỏ, chưa mở form
    setSearchPreview({
      lat,
      lng,
      address: result.display_name,
      city: getCityFromAddress(result.address),
    });
  }, []);

  const handleMarkerClick = useCallback((marker: Marker) => {
    setFlyTo({ lat: marker.lat, lng: marker.lng, zoom: 16 });
  }, []);

  const handleSaveSearchPreview = useCallback(() => {
    if (!searchPreview) return;
    setFormData({
      lat: searchPreview.lat,
      lng: searchPreview.lng,
      address: searchPreview.address,
      city: searchPreview.city,
    });
    setFormMode('add');
    setEditingMarker(null);
    setShowForm(true);
  }, [searchPreview]);

  const handleEditMarker = useCallback((marker: Marker) => {
    setEditingMarker(marker);
    setFormData(marker);
    setFormMode('edit');
    setShowForm(true);
  }, []);

  const handleSaveMarker = async (
    data: Omit<Marker, 'id' | 'created_at'>
  ) => {
    const currentMarkers = getMarkersFromStorage();

    if (formMode === 'add') {
      const newMarker: Marker = {
        ...data,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      const updated = [newMarker, ...currentMarkers];
      saveMarkersToStorage(updated);
      setMarkers(updated);
    } else if (editingMarker) {
      const updated = currentMarkers.map((m) =>
        m.id === editingMarker.id ? { ...m, ...data } : m
      );
      saveMarkersToStorage(updated);
      setMarkers(updated);
      setEditingMarker(null);
    }

    setShowForm(false);
  };

  const handleDeleteMarker = async () => {
    if (!editingMarker) return;

    const confirmed = window.confirm(
      `Xóa điểm "${editingMarker.name}"?`
    );
    if (!confirmed) return;

    const currentMarkers = getMarkersFromStorage();
    const updated = currentMarkers.filter((m) => m.id !== editingMarker.id);
    saveMarkersToStorage(updated);
    setMarkers(updated);
    setShowForm(false);
    setEditingMarker(null);
  };

  // ===== Render =====
  return (
    <PinAuth>
      <div className="h-screen w-screen overflow-hidden relative">
        {/* Bản đồ */}
        <MapView
          markers={markers}
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          flyToPosition={flyTo}
          onFlyComplete={() => setFlyTo(null)}
          searchPreviewPosition={searchPreview}
        />

        {/* Thanh tìm kiếm */}
        <SearchBar
          onSelectResult={handleSearchSelect}
          onMenuClick={() => setShowList((prev) => !prev)}
          onClear={() => setSearchPreview(null)}
        />

        {/* Nút "Lưu địa chỉ" — hiện khi có search preview */}
        {searchPreview && !showForm && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-[1000] flex flex-col items-center gap-2 animate-slide-up">
            <div className="bg-white rounded-xl shadow-lg px-4 py-2 max-w-xs w-full text-center">
              <p className="text-xs text-gray-500 truncate">{searchPreview.address.split(',').slice(0, 3).join(',')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSearchPreview(null)}
                className="px-4 py-2.5 bg-white text-gray-600 rounded-xl shadow-lg text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-200"
              >
                ✕ Bỏ qua
              </button>
              <button
                onClick={handleSaveSearchPreview}
                className="px-5 py-2.5 bg-red-500 text-white rounded-xl shadow-lg text-sm font-semibold hover:bg-red-600 active:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                </svg>
                Lưu địa chỉ
              </button>
            </div>
          </div>
        )}

        {/* Nút hướng dẫn (ℹ️) */}
        <button
          onClick={() => setShowInfo(true)}
          className="absolute bottom-20 left-3 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors sm:bottom-24 sm:left-auto sm:right-3"
          title="Quy tắc & Hướng dẫn (I)"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Danh sách marker */}
        <MarkerList
          markers={markers}
          currentPosition={currentPosition}
          onMarkerClick={handleMarkerClick}
          onEditMarker={handleEditMarker}
          isOpen={showList}
          onToggle={() => setShowList((prev) => !prev)}
        />

        {/* Form thêm/sửa marker */}
        <MarkerForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setEditingMarker(null);
            setSearchPreview(null);
          }}
          onSave={(data) => {
            handleSaveMarker(data);
            setSearchPreview(null);
          }}
          onDelete={formMode === 'edit' ? handleDeleteMarker : undefined}
          initialData={formData}
          mode={formMode}
        />

        {/* Modal hướng dẫn */}
        <InfoModal
          isOpen={showInfo}
          onClose={() => setShowInfo(false)}
        />
      </div>
    </PinAuth>
  );
}
