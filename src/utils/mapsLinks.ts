import type {SiteContentConfig} from '../data/siteConfig';

export interface GeoCoords {
  lat: number;
  lng: number;
}

export const DEFAULT_REFERENCE_CENTER: GeoCoords = {
  lat: 13.6929,
  lng: -89.2182,
};

export function getGoogleMapsApiKey(): string {
  const env = import.meta.env as Record<string, string | undefined>;
  const viteKey = env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const rawKey = env.GOOGLE_MAPS_API_KEY?.trim();
  return viteKey || rawKey || '';
}

export function hasValidCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function buildNavigationLinks(
  config: Pick<
    SiteContentConfig,
    | 'brandName'
    | 'contactLocation'
    | 'locationAddress'
    | 'locationMapsUrl'
    | 'locationLat'
    | 'locationLng'
  >
) {
  const hasCustomCoords = hasValidCoordinates(
    config.locationLat,
    config.locationLng
  );
  const center: GeoCoords = hasCustomCoords
    ? {lat: config.locationLat as number, lng: config.locationLng as number}
    : DEFAULT_REFERENCE_CENTER;

  const queryLabel =
    config.locationAddress?.trim() ||
    config.contactLocation?.trim() ||
    config.brandName;

  const customMapsUrl = config.locationMapsUrl?.trim() || '';
  const destinationParam = hasCustomCoords
    ? `${center.lat},${center.lng}`
    : queryLabel;

  const googleMapsUrl =
    /^https:\/\/.+/.test(customMapsUrl)
      ? customMapsUrl
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          destinationParam
        )}`;

  const wazeUrl = hasCustomCoords
    ? `https://waze.com/ul?ll=${center.lat},${center.lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(queryLabel)}&navigate=yes`;

  const appleMapsUrl = hasCustomCoords
    ? `https://maps.apple.com/?daddr=${center.lat},${center.lng}&q=${encodeURIComponent(
        config.brandName
      )}`
    : `https://maps.apple.com/?daddr=${encodeURIComponent(queryLabel)}`;

  const geoUri = hasCustomCoords
    ? `geo:${center.lat},${center.lng}?q=${center.lat},${center.lng}(${encodeURIComponent(
        config.brandName
      )})`
    : `geo:0,0?q=${encodeURIComponent(queryLabel)}`;

  return {
    hasCustomCoords,
    center,
    queryLabel,
    googleMapsUrl,
    wazeUrl,
    appleMapsUrl,
    geoUri,
  };
}

export function parseGoogleMapsCoordinates(input: string): GeoCoords | null {
  const text = input.trim();
  if (!text) return null;

  // Pattern 1: @lat,lng (Google Maps share URLs)
  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number.parseFloat(atMatch[1]);
    const lng = Number.parseFloat(atMatch[2]);
    if (hasValidCoordinates(lat, lng)) {
      return {lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6))};
    }
  }

  // Pattern 2: q=lat,lng | ll=lat,lng | destination=lat,lng | !3dlat!4dlng
  const paramMatch =
    text.match(/(?:[?&](?:q|ll|destination)=)(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
    text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (paramMatch) {
    const lat = Number.parseFloat(paramMatch[1]);
    const lng = Number.parseFloat(paramMatch[2]);
    if (hasValidCoordinates(lat, lng)) {
      return {lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6))};
    }
  }

  // Pattern 3: plain "lat, lng"
  const plainMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (plainMatch) {
    const lat = Number.parseFloat(plainMatch[1]);
    const lng = Number.parseFloat(plainMatch[2]);
    if (hasValidCoordinates(lat, lng)) {
      return {lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6))};
    }
  }

  return null;
}
