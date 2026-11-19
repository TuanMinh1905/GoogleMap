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
import { supabase } from '@/lib/supabase';

// ===== localStorage cache (offline fallback) =====
const STORAGE_KEY = 'ggmap_markers';

function getCachedMarkers(): Marker[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setCachedMarkers(markers: Marker[]): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(markers)); } catch {}
}

// ===== Supabase CRUD =====
async function fetchMarkersFromDB(): Promise<Marker[]> {
  const { data, error } = await supabase
    .from('markers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Marker[];
}

async function insertMarkerToDB(marker: Omit<Marker, 'id' | 'created_at'>): Promise<Marker> {
  const { data, error } = await supabase
    .from('markers')
    .insert([marker])
    .select()
    .single();
  if (error) throw error;
  return data as Marker;
}

async function updateMarkerInDB(id: string, data: Partial<Omit<Marker, 'id' | 'created_at'>>): Promise<void> {
  const { error } = await supabase.from('markers').update(data).eq('id', id);
  if (error) throw error;
}

async function deleteMarkerFromDB(id: string): Promise<void> {
  const { error } = await supabase.from('markers').delete().eq('id', id);
  if (error) throw error;
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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<Partial<Marker>>({});
  const [editingMarker, setEditingMarker] = useState<Marker | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [searchPreview, setSearchPreview] = useState<{ lat: number; lng: number; address: string; city: string } | null>(null);

  // ===== Load markers: Supabase → cache localStorage =====
  useEffect(() => {
    // Hiện cache ngay để UI không trắng
    const cached = getCachedMarkers();
    if (cached.length > 0) setMarkers(cached);

    fetchMarkersFromDB()
      .then((data) => {
        setMarkers(data);
        setCachedMarkers(data);
      })
      .catch(() => {
        // Nếu offline / lỗi → giữ cache
      })
      .finally(() => setLoading(false));
  }, []);

  // ===== Realtime sync =====
  useEffect(() => {
    const channel = supabase
      .channel('markers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'markers' }, () => {
        fetchMarkersFromDB().then((data) => {
          setMarkers(data);
          setCachedMarkers(data);
        }).catch(() => {});
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // ===== Theo dõi vị trí hiện tại =====
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setCurrentPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // ===== Phím tắt =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case '/':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('input[placeholder*="Tìm kiếm"]')?.focus();
          break;
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            document.querySelector<HTMLInputElement>('input[placeholder*="Tìm kiếm"]')?.focus();
          }
          break;
        case 'Escape':
          setShowForm(false);
          setShowInfo(false);
          if (showList) setShowList(false);
          break;
        case 'l': case 'L': setShowList((p) => !p); break;
        case 'i': case 'I': setShowInfo((p) => !p); break;
        case 'm': case 'M':
          if (currentPosition) setFlyTo({ ...currentPosition, zoom: 15 });
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
      lat, lng,
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
    setSearchPreview({ lat, lng, address: result.display_name, city: getCityFromAddress(result.address) });
  }, []);

  const handleSaveSearchPreview = useCallback(() => {
    if (!searchPreview) return;
    setFormData({ lat: searchPreview.lat, lng: searchPreview.lng, address: searchPreview.address, city: searchPreview.city });
    setFormMode('add');
    setEditingMarker(null);
    setShowForm(true);
  }, [searchPreview]);

  const handleMarkerClick = useCallback((marker: Marker) => {
    setFlyTo({ lat: marker.lat, lng: marker.lng, zoom: 16 });
  }, []);

  const handleEditMarker = useCallback((marker: Marker) => {
    setEditingMarker(marker);
    setFormData(marker);
    setFormMode('edit');
    setShowForm(true);
  }, []);

  const handleSaveMarker = async (data: Omit<Marker, 'id' | 'created_at'>) => {
    if (formMode === 'add') {
      try {
        const newMarker = await insertMarkerToDB(data);
        const updated = [newMarker, ...markers];
        setMarkers(updated);
        setCachedMarkers(updated);
      } catch (err) {
        console.error('Lỗi lưu Supabase:', err);
        alert('Không thể lưu — kiểm tra kết nối mạng');
        return;
      }
    } else if (editingMarker) {
      try {
        await updateMarkerInDB(editingMarker.id, data);
        const updated = markers.map((m) => m.id === editingMarker.id ? { ...m, ...data } : m);
        setMarkers(updated);
        setCachedMarkers(updated);
        setEditingMarker(null);
      } catch (err) {
        console.error('Lỗi cập nhật Supabase:', err);
        alert('Không thể cập nhật — kiểm tra kết nối mạng');
        return;
      }
    }
    setShowForm(false);
  };

  const handleDeleteMarker = async () => {
    if (!editingMarker) return;
    const confirmed = window.confirm(`Xóa điểm "${editingMarker.name}"?`);
    if (!confirmed) return;
    try {
      await deleteMarkerFromDB(editingMarker.id);
      const updated = markers.filter((m) => m.id !== editingMarker.id);
      setMarkers(updated);
      setCachedMarkers(updated);
      setShowForm(false);
      setEditingMarker(null);
    } catch (err) {
      console.error('Lỗi xóa Supabase:', err);
      alert('Không thể xóa — kiểm tra kết nối mạng');
    }
  };

  // ===== Render =====
  return (
    <PinAuth>
      <div className="h-screen w-screen overflow-hidden relative">
        {/* Loading indicator */}
        {loading && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[2000] bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin h-3.5 w-3.5 border-2 border-blue-500 border-t-transparent rounded-full" />
            Đang tải dữ liệu...
          </div>
        )}

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
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          onClose={() => { setShowForm(false); setEditingMarker(null); setSearchPreview(null); }}
          onSave={(data) => { handleSaveMarker(data); setSearchPreview(null); }}
          onDelete={formMode === 'edit' ? handleDeleteMarker : undefined}
          initialData={formData}
          mode={formMode}
        />

        {/* Modal hướng dẫn */}
        <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
      </div>
    </PinAuth>
  );
}
