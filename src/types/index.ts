export type Priority = 'urgent' | 'normal' | 'whenever';

export interface Marker {
  id: string;
  name: string;
  address: string;
  note: string;
  priority: Priority;
  lat: number;
  lng: number;
  city: string;
  created_at: string;
}

export interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    state?: string;
    county?: string;
    country?: string;
  };
}

