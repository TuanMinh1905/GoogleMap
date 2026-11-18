export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return '#EF4444';
    case 'normal':
      return '#F59E0B';
    case 'whenever':
      return '#22C55E';
    default:
      return '#6B7280';
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'Gấp';
    case 'normal':
      return 'Bình thường';
    case 'whenever':
      return 'Khi nào tiện';
    default:
      return 'Không rõ';
  }
}

export function getCityFromAddress(address: Record<string, string | undefined>): string {
  return address?.city || address?.town || address?.county || address?.state || 'Khác';
}

