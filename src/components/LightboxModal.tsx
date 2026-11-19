import {ChevronLeft, ChevronRight, ExternalLink, Film, X} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {
  extractDomainLabel,
  isVideoGalleryItem,
  parseExternalVideoUrl,
  type GalleryItem,
} from '../data/externalMedia';

interface LightboxModalProps {
  items: GalleryItem[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}

export function LightboxModal({
  items,
  activeIndex,
  onClose,
  onNavigate,
}: LightboxModalProps) {
  const [videoLoadError, setVideoLoadError] = useState(false);

  const isOpen = activeIndex !== null && items[activeIndex] !== undefined;
  const currentItem = isOpen ? items[activeIndex] : null;

  const isVideo = currentItem ? isVideoGalleryItem(currentItem) : false;
  const parsedVideo = useMemo(() => {
    setVideoLoadError(false);
    if (!currentItem || !isVideo || !currentItem.videoUrl) return null;
    return parseExternalVideoUrl(currentItem.videoUrl);
  }, [currentItem, isVideo]);

  useEffect(() => {
    if (!isOpen || activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        onNavigate((activeIndex + 1) % items.length);
      } else if (event.key === 'ArrowLeft') {
        onNavigate((activeIndex - 1 + items.length) % items.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, items.length, onClose, onNavigate]);

  if (!isOpen || !currentItem || activeIndex === null) {
    return null;
  }

  const externalHref =
    (isVideo && (parsedVideo?.originalUrl || currentItem.videoUrl)) ||
    currentItem.imageUrl;

  const hostText =
    isVideo && parsedVideo
      ? `Video · ${parsedVideo.platformLabel}`
      : extractDomainLabel(externalHref);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={currentItem.title}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#05070B]/95 p-4 text-white backdrop-blur-sm md:p-8"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="font-mono tabular-nums text-white">
            {String(activeIndex + 1).padStart(2, '0')} /{' '}
            {String(items.length).padStart(2, '0')}
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span>{currentItem.category}</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="font-mono text-slate-400">{hostText}</span>
        </div>

        <div className="flex items-center gap-3">
          {externalHref && (
            <a
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white transition-colors hover:border-[#3B82F6] hover:text-[#60A5FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
            >
              <span>
                {parsedVideo
                  ? `Abrir en ${parsedVideo.platformLabel}`
                  : 'Abrir enlace original'}
              </span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar visor"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white transition-colors hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Main Media Frame */}
      <div
        className="relative mx-auto my-4 flex w-full max-w-6xl flex-1 items-center justify-center overflow-hidden px-12"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() =>
            onNavigate((activeIndex - 1 + items.length) % items.length)
          }
          aria-label="Elemento anterior"
          className="absolute left-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-black/75 text-white transition-colors hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6] sm:left-2"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        {isVideo ? (
          parsedVideo && !videoLoadError ? (
            parsedVideo.kind === 'iframe' ? (
              <div
                className={
                  parsedVideo.platform === 'instagram'
                    ? 'h-[72vh] max-h-[680px] w-full max-w-[420px] overflow-hidden rounded-xl border border-white/15 bg-white shadow-2xl'
                    : parsedVideo.isVertical
                      ? 'aspect-[9/16] h-[72vh] max-h-[680px] max-w-full overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl'
                      : 'aspect-video w-full max-w-4xl overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl'
                }
              >
                <iframe
                  key={parsedVideo.embedUrl}
                  src={parsedVideo.embedUrl}
                  title={currentItem.title}
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video w-full max-w-4xl overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl">
                <video
                  key={parsedVideo.embedUrl}
                  src={parsedVideo.embedUrl}
                  controls
                  autoPlay
                  playsInline
                  onError={() => setVideoLoadError(true)}
                  className="h-full w-full bg-black object-contain"
                />
              </div>
            )
          ) : (
            <div className="flex aspect-video w-full max-w-2xl flex-col items-center justify-center gap-3 rounded-xl border border-white/15 bg-[#0B111D] p-8 text-center">
              <Film className="h-9 w-9 text-[#3B82F6]" aria-hidden="true" />
              <p className="text-sm font-medium text-white">
                No se pudo cargar el reproductor incrustado.
              </p>
              {externalHref && (
                <a
                  href={externalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  <span>Abrir video en nueva pestaña</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          )
        ) : (
          <img
            src={currentItem.imageUrl}
            alt={currentItem.alt}
            referrerPolicy="no-referrer"
            className="max-h-[74vh] w-auto max-w-full rounded-lg border border-white/10 object-contain"
          />
        )}

        <button
          type="button"
          onClick={() => onNavigate((activeIndex + 1) % items.length)}
          aria-label="Elemento siguiente"
          className="absolute right-0 z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-black/75 text-white transition-colors hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6] sm:right-2"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {/* Caption Bar */}
      <div
        className="mx-auto flex w-full max-w-6xl flex-wrap items-baseline justify-between gap-2 border-t border-white/10 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">
          {currentItem.title}
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{currentItem.location}</span>
          {currentItem.year && currentItem.year.toLowerCase() !== 'video' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{currentItem.year}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
