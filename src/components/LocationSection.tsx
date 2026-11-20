import {
  AdvancedMarker,
  APILoadingStatus,
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  ExternalLink,
  MapPin,
  Navigation,
  Pencil,
} from 'lucide-react';
import {useMemo, useState} from 'react';
import type {SiteContentConfig} from '../data/siteConfig';
import {buildNavigationLinks, getGoogleMapsApiKey} from '../utils/mapsLinks';

interface LocationSectionProps {
  config: SiteContentConfig;
  isAdmin: boolean;
  onEditLocation: () => void;
}

interface InteractiveMapCanvasProps {
  brandName: string;
  addressLabel: string;
  center: {lat: number; lng: number};
  hasCustomCoords: boolean;
  googleMapsUrl: string;
}

function InteractiveMapCanvas({
  brandName,
  addressLabel,
  center,
  hasCustomCoords,
  googleMapsUrl,
}: InteractiveMapCanvasProps) {
  const status = useApiLoadingStatus();
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowOpen, setInfoWindowOpen] = useState(true);

  if (
    status === APILoadingStatus.FAILED ||
    status === APILoadingStatus.AUTH_FAILURE
  ) {
    return (
      <FallbackLocationVisual
        brandName={brandName}
        addressLabel={addressLabel}
        center={center}
        hasCustomCoords={hasCustomCoords}
        googleMapsUrl={googleMapsUrl}
      />
    );
  }

  return (
    <div className="relative h-[380px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm sm:h-[440px]">
      <GoogleMap
        key={`${center.lat.toFixed(6)},${center.lng.toFixed(6)},${hasCustomCoords ? 'custom' : 'default'}`}
        mapId="DEMO_MAP_ID"
        defaultCenter={center}
        defaultZoom={hasCustomCoords ? 16 : 12}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{width: '100%', height: '100%'}}
        className="h-full w-full"
      >
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
              <p className="text-xs font-semibold text-[#07090E]">{brandName}</p>
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

      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-lg bg-[#07090E]/92 px-3.5 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-xs transition-colors hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
      >
        <Navigation className="h-3.5 w-3.5 text-[#60A5FA]" aria-hidden="true" />
        <span>Abrir ruta en Google Maps</span>
      </a>
    </div>
  );
}

function FallbackLocationVisual({
  brandName,
  addressLabel,
  center,
  hasCustomCoords,
  googleMapsUrl,
}: InteractiveMapCanvasProps) {
  return (
    <a
      href={googleMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir ubicación de ${brandName} en Google Maps`}
      className="group relative flex h-[380px] w-full flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#07090E] p-7 text-white transition-colors hover:border-[#2563EB] sm:h-[440px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(96,165,250,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(96,165,250,0.22) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[#60A5FA]">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Google Maps · Navegación directa</span>
        </span>
        <ExternalLink
          className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
          aria-hidden="true"
        />
      </div>

      <div className="relative my-auto flex flex-col items-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2563EB]/20 text-[#60A5FA] ring-1 ring-[#3B82F6]/40 transition-transform group-hover:scale-105">
          <MapPin className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="mt-4 text-lg font-semibold tracking-tight text-white">
          {brandName}
        </p>
        <p className="mt-1 max-w-sm text-sm text-slate-300">{addressLabel}</p>
        {hasCustomCoords && (
          <p className="mt-2 font-mono text-xs text-slate-400">
            {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
          </p>
        )}
      </div>

      <div className="relative flex items-center justify-center">
        <span className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition-colors group-hover:bg-[#1D4ED8]">
          <Navigation className="h-4 w-4" aria-hidden="true" />
          <span>Toca aquí para ver cómo llegar</span>
        </span>
      </div>
    </a>
  );
}

export function LocationSection({
  config,
  isAdmin,
  onEditLocation,
}: LocationSectionProps) {
  const apiKey = getGoogleMapsApiKey();
  const nav = useMemo(() => buildNavigationLinks(config), [config]);

  const kicker = config.locationKicker?.trim() || 'Ubicación · Cómo llegar';
  const title =
    config.locationTitle?.trim() || `Visita ${config.brandName}`;
  const description =
    config.locationDescription?.trim() ||
    'Consulta nuestra ubicación en Google Maps y toca cualquiera de los accesos para abrir indicaciones paso a paso en tu aplicación de navegación preferida.';

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

          {/* Right Panel: Interactive Google Map */}
          <div className="lg:col-span-7">
            {apiKey ? (
              <APIProvider
                apiKey={apiKey}
                language="es"
                region="SV"
                libraries={['marker', 'places']}
              >
                <InteractiveMapCanvas
                  brandName={config.brandName}
                  addressLabel={nav.queryLabel}
                  center={nav.center}
                  hasCustomCoords={nav.hasCustomCoords}
                  googleMapsUrl={nav.googleMapsUrl}
                />
              </APIProvider>
            ) : (
              <FallbackLocationVisual
                brandName={config.brandName}
                addressLabel={nav.queryLabel}
                center={nav.center}
                hasCustomCoords={nav.hasCustomCoords}
                googleMapsUrl={nav.googleMapsUrl}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
