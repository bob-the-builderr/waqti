/**
 * The one delivery address the app uses until sign-in and saved addresses
 * arrive. Its zone decides the delivery fee.
 */
export const DEFAULT_ADDRESS = {
  label: 'البيت',
  zoneId: 'university',
  areaName: 'حي الجامعة',
  details: 'شارع الجامعة، عمارة 12، الدور التالت',
  landmark: 'جنب الجامع الكبير',
  lat: 29.3065,
  lng: 30.8395,
} as const;
