import type {SiteContentConfig} from '../data/siteConfig';

export interface GeoCoords {
  lat: number;
  lng: number;
}

export const DEFAULT_REFERENCE_CENTER: GeoCoords = {
  lat: 13.67923,
  lng: -89.192044,
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

export function extractGoogleMapsQuery(input: string): string {
  const text = input.trim();
  if (!text) return '';
  try {
    const url = new URL(text);
    const paramQuery =
      url.searchParams.get('q') ||
      url.searchParams.get('query') ||
      url.searchParams.get('destination') ||
      url.searchParams.get('daddr');
    if (paramQuery && paramQuery.trim()) {
      return paramQuery.trim();
    }
    const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/i);
    if (placeMatch?.[1]) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
    }
    const searchMatch = url.pathname.match(/\/maps\/search\/([^/]+)/i);
    if (searchMatch?.[1]) {
      return decodeURIComponent(searchMatch[1].replace(/\+/g, ' ')).trim();
    }
  } catch {
    // Not a full URL
  }
  return '';
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
  >,
  resolvedCoords?: GeoCoords | null
) {
  const explicitCustomCoords = hasValidCoordinates(
    config.locationLat,
    config.locationLng
  );
  const hasResolvedCoords =
    !explicitCustomCoords &&
    Boolean(resolvedCoords && hasValidCoordinates(resolvedCoords.lat, resolvedCoords.lng));
  const hasCustomCoords = explicitCustomCoords || hasResolvedCoords;

  const center: GeoCoords = explicitCustomCoords
    ? {lat: config.locationLat as number, lng: config.locationLng as number}
    : hasResolvedCoords && resolvedCoords
      ? {lat: resolvedCoords.lat, lng: resolvedCoords.lng}
      : DEFAULT_REFERENCE_CENTER;

  const customMapsUrl = config.locationMapsUrl?.trim() || '';
  const urlPlaceQuery = extractGoogleMapsQuery(customMapsUrl);
  const queryLabel =
    config.locationAddress?.trim() ||
    urlPlaceQuery ||
    config.contactLocation?.trim() ||
    config.brandName;

  const destinationParam = hasCustomCoords
    ? `${center.lat},${center.lng}`
    : queryLabel;

  const googleMapsUrl = /^https:\/\/.+/.test(customMapsUrl)
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
    explicitCustomCoords,
    center,
    queryLabel,
    urlPlaceQuery,
    googleMapsUrl,
    wazeUrl,
    appleMapsUrl,
    geoUri,
  };
}

export interface StaticMapThumbnailOptions {
  apiKey: string;
  center: GeoCoords;
  hasCustomCoords: boolean;
  queryLabel?: string;
  zoom?: number;
  size?: string;
}

export function buildStaticMapThumbnailUrl({
  apiKey,
  center,
  hasCustomCoords,
  queryLabel,
  zoom,
  size = '640x420',
}: StaticMapThumbnailOptions): string {
  const cleanKey = apiKey.trim();
  if (!cleanKey) return '';

  const locationTarget =
    hasCustomCoords || !queryLabel?.trim()
      ? `${center.lat.toFixed(6)},${center.lng.toFixed(6)}`
      : queryLabel.trim();

  const resolvedZoom = zoom ?? (hasCustomCoords ? 17 : 15);

  const params = new URLSearchParams();
  params.set('center', locationTarget);
  params.set('zoom', String(resolvedZoom));
  params.set('size', size);
  params.set('scale', '2');
  params.set('maptype', 'roadmap');
  params.set('language', 'es');
  params.set('region', 'SV');
  params.set('markers', `color:0x2563EB|${locationTarget}`);
  params.set('solution_id', 'gmp_git_agentskills_v1');
  params.set('key', cleanKey);

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function parseGoogleMapsCoordinates(input: string): GeoCoords | null {
  const text = input.trim();
  if (!text) return null;

  // Pattern 1: @lat,lng (Google Maps share URLs)
  const atMatch = text.match(/@(-?\d+(?:\.\d+)?),\s*\+?\s*(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number.parseFloat(atMatch[1]);
    const lng = Number.parseFloat(atMatch[2]);
    if (hasValidCoordinates(lat, lng)) {
      return {lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6))};
    }
  }

  // Pattern 2: q=lat,lng | query=lat,lng | ll=lat,lng | sll=lat,lng | center=lat,lng | destination=lat,lng | daddr=lat,lng | !3dlat!4dlng
  const paramMatch =
    text.match(
      /(?:[?&](?:q|query|ll|sll|center|destination|daddr)=)(-?\d+(?:\.\d+)?),\s*\+?\s*(-?\d+(?:\.\d+)?)/
    ) || text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (paramMatch) {
    const lat = Number.parseFloat(paramMatch[1]);
    const lng = Number.parseFloat(paramMatch[2]);
    if (hasValidCoordinates(lat, lng)) {
      return {lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6))};
    }
  }

  // Pattern 3: /maps/place/.../lat,lng or /maps/dir/.../lat,lng or /maps/search/lat,+-lng
  const pathCoordMatch = text.match(
    /\/(?:place|dir|search)\/(?:[^/]+\/)*(-?\d+\.\d+),\s*\+?\s*(-?\d+\.\d+)/
  );
  if (pathCoordMatch) {
    const lat = Number.parseFloat(pathCoordMatch[1]);
    const lng = Number.parseFloat(pathCoordMatch[2]);
    if (hasValidCoordinates(lat, lng)) {
      return {lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6))};
    }
  }

  // Pattern 4: plain "lat, lng"
  const plainMatch = text.match(/^(-?\d+(?:\.\d+)?)\s*,\s*\+?\s*(-?\d+(?:\.\d+)?)$/);
  if (plainMatch) {
    const lat = Number.parseFloat(plainMatch[1]);
    const lng = Number.parseFloat(plainMatch[2]);
    if (hasValidCoordinates(lat, lng)) {
      return {lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6))};
    }
  }

  return null;
}
