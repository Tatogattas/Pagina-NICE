import {
  AdvancedMarker,
  APILoadingStatus,
  ColorScheme,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  RenderingType,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  ExternalLink,
  MapPin,
  Navigation,
  Pencil,
} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import type {SiteContentConfig} from '../data/siteConfig';
import {DEFAULT_SITE_CONFIG} from '../data/siteConfig';
import {
  buildNavigationLinks,
  buildStaticMapThumbnailUrl,
  getGoogleMapsApiKey,
  type GeoCoords,
} from '../utils/mapsLinks';
import {MapsApiProvider} from './MapsApiProvider';

interface LocationSectionProps {
  config: SiteContentConfig;
  isAdmin: boolean;
  onEditLocation: () => void;
}

interface MapCameraSyncProps {
  center: GeoCoords;
  zoom: number;
}

function MapCameraSync({center, zoom}: MapCameraSyncProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center.lat, center.lng, zoom]);

  return null;
}

interface LocationVisualProps {
  apiKey: string;
  brandName: string;
  addressLabel: string;
  center: GeoCoords;
  hasCustomCoords: boolean;
  googleMapsUrl: string;
}

function StaticMapThumbnailLayer({
  apiKey,
  brandName,
  addressLabel,
  center,
  hasCustomCoords,
}: Omit<LocationVisualProps, 'googleMapsUrl'>) {
  const staticUrl = useMemo(
    () =>
      buildStaticMapThumbnailUrl({
        apiKey,
        center,
        hasCustomCoords,
        queryLabel: addressLabel,
        zoom: hasCustomCoords ? 17 : 15,
        size: '640x440',
      }),
    [apiKey, center.lat, center.lng, hasCustomCoords, addressLabel]
  );

  const [failedUrl, setFailedUrl] = useState<string>('');
  const canShowImage = Boolean(staticUrl) && failedUrl !== staticUrl;

  if (!canShowImage) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#EEF3FA]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(37,99,235,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(37,99,235,0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    );
  }

  return (
    <img
      key={staticUrl}
      src={staticUrl}
      alt={`Foto estática de Google Maps de ${brandName} (${addressLabel})`}
      decoding="async"
      onError={() => setFailedUrl(staticUrl)}
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
    />
  );
}

interface StaticLocationPhotoCardProps extends LocationVisualProps {
  onEnableInteractive?: () => void;
}

function StaticLocationPhotoCard({
  apiKey,
  brandName,
  addressLabel,
  center,
  hasCustomCoords,
  googleMapsUrl,
  onEnableInteractive,
}: StaticLocationPhotoCardProps) {
  return (
    <div className="group relative flex h-[380px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-[#E8EDF5] p-4 text-[#07090E] shadow-sm transition-colors hover:border-[#2563EB] sm:h-[440px] sm:p-5">
      <StaticMapThumbnailLayer
        apiKey={apiKey}
        brandName={brandName}
        addressLabel={addressLabel}
        center={center}
        hasCustomCoords={hasCustomCoords}
      />

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir ubicación de ${brandName} en Google Maps`}
        className="absolute inset-0 z-10"
      />

      <div className="pointer-events-none relative z-20 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#07090E] shadow-xs">
          <MapPin className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
          <span>Google Maps · Vista estática</span>
        </span>

        <div className="pointer-events-auto flex items-center gap-2">
          {onEnableInteractive && (
            <button
              type="button"
              onClick={onEnableInteractive}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#07090E] shadow-xs transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
            >
              <Compass className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
              <span>Mapa interactivo</span>
            </button>
          )}
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir ${brandName} en Google Maps`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-[#07090E] shadow-xs transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-20 mt-auto flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-md backdrop-blur-xs transition-colors hover:border-[#2563EB] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#07090E]">{brandName}</p>
          <p className="mt-0.5 truncate text-xs text-slate-600">{addressLabel}</p>
          {hasCustomCoords && (
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
            </p>
          )}
        </div>
        <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-xs font-semibold text-white transition-colors group-hover:bg-[#1D4ED8]">
          <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Cómo llegar</span>
        </span>
      </a>
    </div>
  );
}

interface InteractiveMapCanvasProps extends LocationVisualProps {
  explicitCustomCoords: boolean;
  customMapsUrl: string;
  searchQueryForResolution: string;
  onResolvedCoords: (coords: GeoCoords | null) => void;
  onShowStaticPhoto: () => void;
}

function InteractiveMapCanvas({
  apiKey,
  brandName,
  addressLabel,
  center,
  hasCustomCoords,
  explicitCustomCoords,
  googleMapsUrl,
  searchQueryForResolution,
  onResolvedCoords,
  onShowStaticPhoto,
}: InteractiveMapCanvasProps) {
  const status = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);
  const [tilesLoaded, setTilesLoaded] = useState(false);

  // If the admin updated the address or place link without explicit numeric coordinates,
  // resolve real coordinates cleanly via Places API (New) Place.searchByText.
  useEffect(() => {
    if (explicitCustomCoords) {
      onResolvedCoords(null);
      return;
    }
    const cleanQuery = searchQueryForResolution.trim();
    const defaultLabel = DEFAULT_SITE_CONFIG.locationAddress?.trim() || '';
    if (
      !placesLib ||
      !cleanQuery ||
      cleanQuery === defaultLabel ||
      cleanQuery === brandName.trim()
    ) {
      onResolvedCoords(null);
      return;
    }

    let cancelled = false;
    void placesLib.Place.searchByText({
      textQuery: cleanQuery,
      fields: ['location'],
      region: 'SV',
    })
      .then(
        (res: {
          places?: Array<{
            location?: {lat: () => number; lng: () => number} | null;
          }>;
        }) => {
          if (cancelled) return;
          const loc = res.places?.[0]?.location;
          if (loc) {
            onResolvedCoords({
              lat: Number(loc.lat().toFixed(6)),
              lng: Number(loc.lng().toFixed(6)),
            });
          }
        }
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    placesLib,
    explicitCustomCoords,
    searchQueryForResolution,
    brandName,
    onResolvedCoords,
  ]);

  if (
    status === APILoadingStatus.FAILED ||
    status === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <StaticLocationPhotoCard
        apiKey={apiKey}
        brandName={brandName}
        addressLabel={addressLabel}
        center={center}
        hasCustomCoords={hasCustomCoords}
        googleMapsUrl={googleMapsUrl}
      />
    );
  }

  const targetZoom = hasCustomCoords ? 17 : 15;

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#E8EDF5] shadow-sm sm:h-[440px]">
      {/* Immediate Google Maps Static thumbnail behind interactive tiles so updates or loading never flash black */}
      <StaticMapThumbnailLayer
        apiKey={apiKey}
        brandName={brandName}
        addressLabel={addressLabel}
        center={center}
        hasCustomCoords={hasCustomCoords}
      />

      <div
        className={`relative z-10 h-full w-full transition-opacity duration-300 ${
          tilesLoaded ? 'opacity-100' : 'opacity-95'
        }`}
      >
        <GoogleMap
          mapId="DEMO_MAP_ID"
          renderingType={RenderingType.RASTER}
          colorScheme={ColorScheme.LIGHT}
          defaultCenter={center}
          defaultZoom={targetZoom}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{width: '100%', height: '100%'}}
          className="h-full w-full"
          onTilesLoaded={() => setTilesLoaded(true)}
        >
          <MapCameraSync center={center} zoom={targetZoom} />

          <AdvancedMarker
            ref={markerRef}
            position={center}
            title={`${brandName} — ${addressLabel}`}
            onClick={() => setInfoWindowOpen((prev) => !prev)}
          >
            <Pin
              background="#2563EB"
              borderColor="#07090E"
              glyphColor="#FFFFFF"
              scale={1.15}
            />
          </AdvancedMarker>

          {infoWindowOpen && marker && (
            <InfoWindow
              anchor={marker}
              maxWidth={260}
              onCloseClick={() => setInfoWindowOpen(false)}
            >
              <div className="p-1 text-left">
                <p className="text-xs font-semibold text-[#07090E]">
                  {brandName}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">{addressLabel}</p>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  <span>Cómo llegar</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      <button
        type="button"
        onClick={onShowStaticPhoto}
        className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#07090E] shadow-xs transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
      >
        <MapPin className="h-3.5 w-3.5 text-[#2563EB]" aria-hidden="true" />
        <span>Ver foto estática</span>
      </button>

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 bottom-3 z-20 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
      >
        <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Abrir ruta en Google Maps</span>
      </a>
    </div>
  );
}

export function LocationSection({
  config,
  isAdmin,
  onEditLocation,
}: LocationSectionProps) {
  const apiKey = getGoogleMapsApiKey();
  const [resolvedCoords, setResolvedCoords] = useState<GeoCoords | null>(null);
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const nav = useMemo(
    () => buildNavigationLinks(config, resolvedCoords),
    [config, resolvedCoords]
  );

  const kicker = config.locationKicker?.trim() || 'Ubicación · Cómo llegar';
  const title =
    config.locationTitle?.trim() || `Visita ${config.brandName}`;
  const description =
    config.locationDescription?.trim() ||
    'Consulta nuestra ubicación en Google Maps y toca cualquiera de los accesos para abrir indicaciones paso a paso en tu aplicación de navegación preferida.';

  const searchQueryForResolution =
    config.locationAddress?.trim() || nav.urlPlaceQuery || '';

  return (
    <section
      id="ubicacion"
      aria-labelledby="ubicacion-heading"
      className="border-t border-slate-200 bg-[#F4F7FC]"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Left Panel: Architectural Info + Compatible Navigation App Buttons */}
          <div className="lg:col-span-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-[#2563EB]">{kicker}</p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={onEditLocation}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                >
                  <Pencil className="h-3 w-3" aria-hidden="true" />
                  <span>Editar mapa</span>
                </button>
              )}
            </div>

            <h2
              id="ubicacion-heading"
              className="mt-2 text-3xl font-semibold tracking-tight text-[#07090E]"
              style={{textWrap: 'balance'}}
            >
              {title}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              {description}
            </p>

            {/* Tap-ready Address + Route Card */}
            <div className="mt-7 rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]/10 text-[#2563EB]">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-500">
                    Dirección de referencia
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-[#07090E]">
                    {nav.queryLabel}
                  </p>
                  {nav.hasCustomCoords && (
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      GPS: {nav.center.lat.toFixed(5)},{' '}
                      {nav.center.lng.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 space-y-2.5">
                <a
                  href={nav.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
                >
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  <span>Cómo llegar con Google Maps</span>
                </a>

                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={nav.wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#07090E] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
                  >
                    <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Waze</span>
                  </a>
                  <a
                    href={nav.appleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#07090E] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
                  >
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Apple Maps</span>
                  </a>
                  <a
                    href={nav.geoUri}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#07090E] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Otras apps</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Default Static Google Maps Photo with Optional Interactive Toggle */}
          <div className="lg:col-span-7">
            {apiKey && showInteractiveMap ? (
              <MapsApiProvider>
                <InteractiveMapCanvas
                  apiKey={apiKey}
                  brandName={config.brandName}
                  addressLabel={nav.queryLabel}
                  center={nav.center}
                  hasCustomCoords={nav.hasCustomCoords}
                  explicitCustomCoords={nav.explicitCustomCoords}
                  customMapsUrl={config.locationMapsUrl?.trim() || ''}
                  googleMapsUrl={nav.googleMapsUrl}
                  searchQueryForResolution={searchQueryForResolution}
                  onResolvedCoords={setResolvedCoords}
                  onShowStaticPhoto={() => setShowInteractiveMap(false)}
                />
              </MapsApiProvider>
            ) : (
              <StaticLocationPhotoCard
                apiKey={apiKey}
                brandName={config.brandName}
                addressLabel={nav.queryLabel}
                center={nav.center}
                hasCustomCoords={nav.hasCustomCoords}
                googleMapsUrl={nav.googleMapsUrl}
                onEnableInteractive={
                  apiKey ? () => setShowInteractiveMap(true) : undefined
                }
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
