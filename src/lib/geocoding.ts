import { SearchResult } from '@/types';

/**
 * Dùng Photon API (photon.komoot.io) thay vì Nominatim.
 * Photon dựa trên OSM data nhưng khác domain/infrastructure hoàn toàn.
 * Miễn phí, không cần API key.
 */
const PHOTON = 'https://photon.komoot.io';

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: Record<string, string | undefined>;
}

function photonToSearchResult(f: PhotonFeature): SearchResult {
  const [lon, lat] = f.geometry.coordinates;
  const p = f.properties;

  const parts: string[] = [];
  if (p.housenumber && p.street) parts.push(`${p.housenumber} ${p.street}`);
  else if (p.street) parts.push(p.street);
  else if (p.name) parts.push(p.name);
  if (p.district) parts.push(p.district);
  if (p.city || p.town) parts.push((p.city || p.town)!);
  if (p.state) parts.push(p.state);
  if (p.country) parts.push(p.country);

  return {
    display_name: parts.join(', ') || p.name || 'Không rõ',
    lat: String(lat),
    lon: String(lon),
    address: {
      city: p.city,
      town: p.town,
      state: p.state,
      county: p.county,
      country: p.country,
    },
  };
}

/**
 * Tìm kiếm địa chỉ bằng Photon API
 * Bias về HCM (lat=10.78, lon=106.7) để ưu tiên kết quả gần
 */
export async function searchAddress(query: string): Promise<SearchResult[]> {
  if (!query.trim() || query.trim().length < 3) return [];

  try {
    const url = `${PHOTON}/api/?q=${encodeURIComponent(query)}&limit=5&lat=10.78&lon=106.7`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const features: PhotonFeature[] = data?.features || [];

    return features.map(photonToSearchResult);
  } catch {
    return [];
  }
}

/**
 * Reverse geocode bằng Photon API
 */
export async function reverseGeocode(lat: number, lng: number): Promise<SearchResult | null> {
  try {
    const url = `${PHOTON}/reverse?lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const features: PhotonFeature[] = data?.features || [];
    if (features.length === 0) return null;

    return photonToSearchResult(features[0]);
  } catch {
    return null;
  }
}
