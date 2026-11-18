import {RotateCcw, X} from 'lucide-react';
import {useEffect, useState, type FormEvent} from 'react';
import type {GalleryCategory, GalleryItem} from '../data/externalMedia';
import {isValidHttpsUrl, parseExternalVideoUrl} from '../data/externalMedia';

interface ExternalLinkModalProps {
  isOpen: boolean;
  currentVideoUrl: string;
  currentVideoTitle: string;
  onClose: () => void;
  onSaveVideo: (url: string, title: string) => void;
  onAddGalleryItem: (item: GalleryItem) => void;
  onResetAll: () => void;
}

export function ExternalLinkModal({
  isOpen,
  currentVideoUrl,
  currentVideoTitle,
  onClose,
  onSaveVideo,
  onAddGalleryItem,
  onResetAll,
}: ExternalLinkModalProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video');

  // Video form state
  const [videoUrl, setVideoUrl] = useState(currentVideoUrl);
  const [videoTitle, setVideoTitle] = useState(currentVideoTitle);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Image form state
  const [imageUrl, setImageUrl] = useState('');
  const [imageTitle, setImageTitle] = useState('');
  const [imageLocation, setImageLocation] = useState('');
  const [imageCategory, setImageCategory] =
    useState<Exclude<GalleryCategory, 'Todas'>>('Azul cobalto');
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    setVideoUrl(currentVideoUrl);
    setVideoTitle(currentVideoTitle);
  }, [currentVideoUrl, currentVideoTitle, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVideoSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseExternalVideoUrl(videoUrl);
    if (!parsed) {
      setVideoError(
        'Ingresa una URL válida de YouTube, Vimeo o un archivo de video externo (https://).'
      );
      return;
    }
    setVideoError(null);
    onSaveVideo(
      videoUrl.trim(),
      videoTitle.trim() || 'Video externo incrustado'
    );
    onClose();
  };

  const handleImageSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValidHttpsUrl(imageUrl)) {
      setImageError('Ingresa una URL externa válida que comience con https://.');
      return;
    }
    if (!imageTitle.trim()) {
      setImageError('Escribe un título breve para identificar la fotografía.');
      return;
    }
    setImageError(null);
    onAddGalleryItem({
      id: `custom-${Date.now()}`,
      title: imageTitle.trim(),
      category: imageCategory,
      location: imageLocation.trim() || 'Enlace externo',
      year: String(new Date().getFullYear()),
      imageUrl: imageUrl.trim(),
      alt: `${imageTitle.trim()} — imagen externa`,
      aspectHint: '4:3',
      isCustom: true,
    });
    setImageUrl('');
    setImageTitle('');
    setImageLocation('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-links-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="modal-links-title"
              className="text-xl font-semibold tracking-tight text-[#07090E]"
            >
              Enlaces multimedia externos
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Todo el contenido se enlaza desde orígenes remotos sin subir
              archivos al servidor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#07090E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Mode Switch */}
        <div
          role="tablist"
          className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'video'}
            onClick={() => setActiveTab('video')}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'video'
                ? 'bg-[#07090E] text-white'
                : 'text-slate-600 hover:text-[#07090E]'
            }`}
          >
            Video de portada
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'image'}
            onClick={() => setActiveTab('image')}
            className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'image'
                ? 'bg-[#07090E] text-white'
                : 'text-slate-600 hover:text-[#07090E]'
            }`}
          >
            Añadir imagen a galería
          </button>
        </div>

        {activeTab === 'video' ? (
          <form onSubmit={handleVideoSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="hero-video-url"
                className="block text-xs font-semibold text-[#07090E]"
              >
                Enlace externo del video (YouTube, Vimeo o MP4/WebM)
              </label>
              <input
                id="hero-video-url"
                type="url"
                required
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="hero-video-title"
                className="block text-xs font-semibold text-[#07090E]"
              >
                Título descriptivo
              </label>
              <input
                id="hero-video-title"
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Arquitectura en movimiento"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            {videoError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {videoError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onResetAll();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#07090E]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Restaurar valores</span>
              </button>

              <button
                type="submit"
                className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              >
                Aplicar enlace
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleImageSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="gallery-image-url"
                className="block text-xs font-semibold text-[#07090E]"
              >
                URL externa de la imagen (HTTPS)
              </label>
              <input
                id="gallery-image-url"
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="gallery-image-title"
                className="block text-xs font-semibold text-[#07090E]"
              >
                Título de la obra
              </label>
              <input
                id="gallery-image-title"
                type="text"
                required
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder="Pabellón de vidrio y cobalto"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="gallery-image-category"
                  className="block text-xs font-semibold text-[#07090E]"
                >
                  Categoría
                </label>
                <select
                  id="gallery-image-category"
                  value={imageCategory}
                  onChange={(e) =>
                    setImageCategory(
                      e.target.value as Exclude<GalleryCategory, 'Todas'>
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#07090E] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="Azul cobalto">Azul cobalto</option>
                  <option value="Monocromo">Monocromo</option>
                  <option value="Geometría">Geometría</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="gallery-image-location"
                  className="block text-xs font-semibold text-[#07090E]"
                >
                  Ubicación o fuente
                </label>
                <input
                  id="gallery-image-location"
                  type="text"
                  value={imageLocation}
                  onChange={(e) => setImageLocation(e.target.value)}
                  placeholder="Madrid, España"
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
                />
              </div>
            </div>

            {imageError && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {imageError}
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
              >
                Agregar a la galería
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
