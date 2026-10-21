/** Demo warehouse: District 1, Ho Chi Minh City (Sprint 7). */
export const WAREHOUSE_COORDS = { latitude: 10.7769, longitude: 106.7009 };

export const SHIPPING_TIERS = [
  { maxKm: 5, fee: 15000, label: 'Nội thành — giao trong 2 giờ' },
  { maxKm: 20, fee: 25000, label: 'Ngoại thành — giao trong ngày' },
  { maxKm: 100, fee: 40000, label: 'Liên tỉnh gần — 1–2 ngày' },
  { maxKm: Infinity, fee: 60000, label: 'Liên tỉnh xa — 3–5 ngày' },
];

export const DEFAULT_SHIPPING_FEE = 30000;

/** Haversine distance in kilometres (straight-line, not a road route). */
export const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  // Floating point rounding at antipodal coordinates must not produce NaN.
  const clamped = Math.max(0, Math.min(1, a));
  return 6371 * 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
};

export const getShippingTier = (distanceKm: number) =>
  SHIPPING_TIERS.find(tier => distanceKm <= tier.maxKm) ??
  SHIPPING_TIERS[SHIPPING_TIERS.length - 1];
