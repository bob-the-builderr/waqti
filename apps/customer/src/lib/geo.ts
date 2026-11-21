/** Straight-line distance in km between two points. */
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** The area whose centre is nearest to a point on the map. */
export function nearestZone<Z extends { lat?: number | null; lng?: number | null }>(zones: Z[], lat: number, lng: number): Z | null {
  let best: Z | null = null;
  let bestKm = Infinity;
  for (const z of zones) {
    if (z.lat == null || z.lng == null) continue;
    const km = distanceKm(lat, lng, z.lat, z.lng);
    if (km < bestKm) {
      best = z;
      bestKm = km;
    }
  }
  return best;
}
