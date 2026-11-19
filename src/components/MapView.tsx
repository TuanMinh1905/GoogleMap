'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Marker, Priority } from '@/types';
import { getPriorityColor } from '@/lib/utils';

function createMarkerIcon(priority: Priority): L.DivIcon {
  const color = getPriorityColor(priority);
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position:relative;width:30px;height:42px;">
        <svg viewBox="0 0 30 42" width="30" height="42">
          <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="${color}" stroke="white" stroke-width="2"/>
          <circle cx="15" cy="15" r="7" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
}

const currentLocationIcon = L.divIcon({
  className: 'current-location-marker',
  html: `
    <div style="position:relative;">
      <div class="current-loc-pulse"></div>
      <div style="width:18px;height:18px;background:#4285F4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 2px rgba(66,133,244,0.3);position:relative;z-index:2;"></div>
    </div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const searchPreviewIcon = L.divIcon({
  className: 'search-preview-marker',
  html: `
    <div style="position:relative;width:30px;height:42px;">
      <svg viewBox="0 0 30 42" width="30" height="42">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 27 15 27s15-16.5 15-27C30 6.7 23.3 0 15 0z" fill="#EF4444" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="15" r="7" fill="white"/>
      </svg>
    </div>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -42],
});

interface MapViewProps {
  markers: Marker[];
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (marker: Marker) => void;
  flyToPosition: { lat: number; lng: number; zoom?: number } | null;
  onFlyComplete: () => void;
  searchPreviewPosition?: { lat: number; lng: number } | null;
}

export default function MapView({
  markers,
  onMapClick,
  onMarkerClick,
  flyToPosition,
  onFlyComplete,
  searchPreviewPosition,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const currentLocMarkerRef = useRef<L.Marker | null>(null);
  const searchPreviewMarkerRef = useRef<L.Marker | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);

  // Keep refs up to date
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    }).setView([10.7769, 106.7009], 12);

    L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickRef.current(e.latlng.lat, e.latlng.lng);
    });

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Force recalc after container is properly sized
    setTimeout(() => map.invalidateSize(), 0);

    // Get current location
    let watchId: number | undefined;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Guard: map may have been removed by cleanup (e.g. React Strict Mode)
          if (!mapRef.current) return;
          const { latitude, longitude } = pos.coords;
          setCurrentPosition({ lat: latitude, lng: longitude });
          mapRef.current.setView([latitude, longitude], 13);
        },
        () => { },
        { enableHighAccuracy: true, timeout: 10000 }
      );

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCurrentPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => { },
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update current location marker
  useEffect(() => {
    if (!mapRef.current || !currentPosition) return;

    if (currentLocMarkerRef.current) {
      currentLocMarkerRef.current.setLatLng([currentPosition.lat, currentPosition.lng]);
    } else {
      currentLocMarkerRef.current = L.marker(
        [currentPosition.lat, currentPosition.lng],
        { icon: currentLocationIcon, zIndexOffset: 1000 }
      ).addTo(mapRef.current);
    }
  }, [currentPosition]);

  // Update markers on map
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    markers.forEach((marker) => {
      const leafletMarker = L.marker([marker.lat, marker.lng], {
        icon: createMarkerIcon(marker.priority),
      });

      leafletMarker.bindPopup(`
        <div style="min-width:160px;">
          <strong style="font-size:14px;">${marker.name}</strong>
          ${marker.address ? `<br><span style="color:#666;font-size:12px;">${marker.address}</span>` : ''}
          ${marker.note ? `<br><em style="color:#999;font-size:11px;">📝 ${marker.note}</em>` : ''}
        </div>
      `);

      leafletMarker.on('click', () => onMarkerClickRef.current(marker));
      markersLayerRef.current!.addLayer(leafletMarker);
    });
  }, [markers]);

  // Fly to position — nếu có vị trí hiện tại, fitBounds để hiện cả 2 điểm
  useEffect(() => {
    if (!mapRef.current || !flyToPosition) return;

    if (currentPosition) {
      const destLat = flyToPosition.lat;
      const destLng = flyToPosition.lng;
      const curLat = currentPosition.lat;
      const curLng = currentPosition.lng;

      // Tính khoảng cách đơn giản (độ)
      const dist = Math.sqrt(
        Math.pow(destLat - curLat, 2) + Math.pow(destLng - curLng, 2)
      );

      if (dist > 0.01) {
        // Xa hơn ~1km → fitBounds để hiện cả 2 điểm
        const bounds = L.latLngBounds(
          [destLat, destLng],
          [curLat, curLng]
        );
        mapRef.current.fitBounds(bounds, {
          padding: [80, 80],
          animate: true,
          duration: 1,
          maxZoom: flyToPosition.zoom || 16,
        });
      } else {
        // Gần → zoom vào thẳng
        mapRef.current.flyTo([destLat, destLng], flyToPosition.zoom || 16, { duration: 1 });
      }
    } else {
      mapRef.current.flyTo(
        [flyToPosition.lat, flyToPosition.lng],
        flyToPosition.zoom || 16,
        { duration: 1 }
      );
    }
    onFlyComplete();
  }, [flyToPosition, onFlyComplete, currentPosition]);

  // Search preview pin (đỏ) — hiện khi tìm kiếm, xóa khi không có
  useEffect(() => {
    if (!mapRef.current) return;

    if (searchPreviewPosition) {
      if (searchPreviewMarkerRef.current) {
        searchPreviewMarkerRef.current.setLatLng([
          searchPreviewPosition.lat,
          searchPreviewPosition.lng,
        ]);
      } else {
        searchPreviewMarkerRef.current = L.marker(
          [searchPreviewPosition.lat, searchPreviewPosition.lng],
          { icon: searchPreviewIcon, zIndexOffset: 500 }
        ).addTo(mapRef.current);
      }
    } else {
      if (searchPreviewMarkerRef.current) {
        searchPreviewMarkerRef.current.remove();
        searchPreviewMarkerRef.current = null;
      }
    }
  }, [searchPreviewPosition]);

  const goToCurrentLocation = useCallback(() => {
    if (!mapRef.current || !currentPosition) return;
    mapRef.current.flyTo([currentPosition.lat, currentPosition.lng], 15, {
      duration: 1,
    });
  }, [currentPosition]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Nút vị trí hiện tại */}
      <button
        onClick={goToCurrentLocation}
        className="absolute bottom-24 right-3 z-[1000] w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
        title="Vị trí hiện tại (M)"
      >
        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
        </svg>
      </button>
    </div>
  );
}

