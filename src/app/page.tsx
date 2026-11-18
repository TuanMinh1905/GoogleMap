'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import PinAuth from '@/components/PinAuth';
import SearchBar from '@/components/SearchBar';
import MarkerForm from '@/components/MarkerForm';
import MarkerList from '@/components/MarkerList';
import InfoModal from '@/components/InfoModal';
import { supabase } from '@/lib/supabase';
import { reverseGeocode } from '@/lib/geocoding';
import { getCityFromAddress } from '@/lib/utils';
import { Marker, SearchResult } from '@/types';

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

  // ===== Fetch markers từ Supabase =====
  const fetchMarkers = useCallback(async () => {
    const { data, error } = await supabase
      .from('markers')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setMarkers(data);
    }
  }, []);

  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

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

    setFlyTo({ lat, lng, zoom: 16 });

    setFormData({
      lat,
      lng,
      address: result.display_name,
      city: getCityFromAddress(result.address),
    });
    setFormMode('add');
    setEditingMarker(null);
    setShowForm(true);
  }, []);

  const handleMarkerClick = useCallback((marker: Marker) => {
    setFlyTo({ lat: marker.lat, lng: marker.lng, zoom: 16 });
  }, []);

  const handleEditMarker = useCallback((marker: Marker) => {
    setEditingMarker(marker);
    setFormData(marker);
    setFormMode('edit');
    setShowForm(true);
  }, []);

  const handleSaveMarker = async (
    data: Omit<Marker, 'id' | 'created_at'>
  ) => {
    if (formMode === 'add') {
      const { error } = await supabase.from('markers').insert([data]);
      if (!error) {
        await fetchMarkers();
        setShowForm(false);
      }
    } else if (editingMarker) {
      const { error } = await supabase
        .from('markers')
        .update(data)
        .eq('id', editingMarker.id);
      if (!error) {
        await fetchMarkers();
        setShowForm(false);
        setEditingMarker(null);
      }
    }
  };

  const handleDeleteMarker = async () => {
    if (!editingMarker) return;

    const confirmed = window.confirm(
      `Xóa điểm "${editingMarker.name}"?`
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from('markers')
      .delete()
      .eq('id', editingMarker.id);

    if (!error) {
      await fetchMarkers();
      setShowForm(false);
      setEditingMarker(null);
    }
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
        />

        {/* Thanh tìm kiếm */}
        <SearchBar
          onSelectResult={handleSearchSelect}
          onMenuClick={() => setShowList((prev) => !prev)}
        />

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
          }}
          onSave={handleSaveMarker}
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
