import { SearchResult } from '@/types';

export async function searchAddress(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=vn&limit=5&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'vi',
        },
      }
    );

    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<SearchResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'vi',
        },
      }
    );

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

