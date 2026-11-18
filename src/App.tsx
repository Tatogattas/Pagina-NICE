import {ArrowDown, CheckCircle2, Link2} from 'lucide-react';
import {useEffect, useMemo, useState, type FormEvent} from 'react';
import {ExternalLinkModal} from './components/ExternalLinkModal';
import {ExternalVideoPlayer} from './components/ExternalVideoPlayer';
import {GalleryGrid} from './components/GalleryGrid';
import {LightboxModal} from './components/LightboxModal';
import {
  DEFAULT_GALLERY_ITEMS,
  DEFAULT_VIDEO_PRESETS,
  type GalleryCategory,
  type GalleryItem,
  type VideoSourcePreset,
} from './data/externalMedia';

const STORAGE_KEYS = {
  videoUrl: 'monolito_external_video_url',
  videoTitle: 'monolito_external_video_title',
  customGallery: 'monolito_custom_gallery_items',
};

export default function App() {
  const [videoUrl, setVideoUrl] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.videoUrl) ||
        DEFAULT_VIDEO_PRESETS[0].url
      );
    } catch {
      return DEFAULT_VIDEO_PRESETS[0].url;
    }
  });

  const [videoTitle, setVideoTitle] = useState<string>(() => {
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.videoTitle) ||
        DEFAULT_VIDEO_PRESETS[0].title
      );
    } catch {
      return DEFAULT_VIDEO_PRESETS[0].title;
    }
  });

  const [customItems, setCustomItems] = useState<GalleryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.customGallery);
      return saved ? (JSON.parse(saved) as GalleryItem[]) : [];
    } catch {
      return [];
    }
  });

  const [activeCategory, setActiveCategory] =
    useState<GalleryCategory>('Todas');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactReference, setContactReference] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.videoUrl, videoUrl);
      localStorage.setItem(STORAGE_KEYS.videoTitle, videoTitle);
    } catch {
      // Ignore storage quota errors
    }
  }, [videoUrl, videoTitle]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.customGallery,
        JSON.stringify(customItems)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [customItems]);

  const allGalleryItems = useMemo(
    () => [...customItems, ...DEFAULT_GALLERY_ITEMS],
    [customItems]
  );

  const visibleGalleryItems = useMemo(
    () =>
      activeCategory === 'Todas'
        ? allGalleryItems
        : allGalleryItems.filter((item) => item.category === activeCategory),
    [allGalleryItems, activeCategory]
  );

  const handleSelectVideoPreset = (preset: VideoSourcePreset) => {
    setVideoUrl(preset.url);
    setVideoTitle(preset.title);
  };

  const handleSaveVideo = (url: string, title: string) => {
    setVideoUrl(url);
    setVideoTitle(title);
  };

  const handleAddGalleryItem = (item: GalleryItem) => {
    setCustomItems((prev) => [item, ...prev]);
    setActiveCategory('Todas');
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetAll = () => {
    setVideoUrl(DEFAULT_VIDEO_PRESETS[0].url);
    setVideoTitle(DEFAULT_VIDEO_PRESETS[0].title);
    setCustomItems([]);
    setActiveCategory('Todas');
  };

  const handleOpenLightbox = (item: GalleryItem) => {
    const idx = visibleGalleryItems.findIndex((entry) => entry.id === item.id);
    if (idx >= 0) {
      setLightboxIndex(idx);
    }
  };

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactName.trim()) {
      setContactError('Por favor ingresa tu nombre.');
      return;
    }
    if (!emailPattern.test(contactEmail.trim())) {
      setContactError('Ingresa un correo electrónico válido.');
      return;
    }
    if (contactMessage.trim().length < 10) {
      setContactError('El mensaje debe contener al menos 10 caracteres.');
      return;
    }
    setContactError(null);
    setContactSubmitted(true);
    setContactName('');
    setContactEmail('');
    setContactReference('');
    setContactMessage('');
  };

  return (
    <div className="min-h-screen bg-white text-[#07090E]">
      {/* Strict 3-Zone Top Bar */}
      <header className="border-b border-white/10 bg-[#07090E] text-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-6 lg:px-10">
          {/* Zone 1: Single-line Wordmark */}
          <a
            href="#video"
            className="font-display text-lg font-semibold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3B82F6]"
          >
            Monolito
          </a>

          {/* Zone 2: 4 Concise Single-Line Links */}
          <nav
            aria-label="Navegación principal"
            className="hidden items-center gap-7 text-sm font-medium text-slate-300 md:flex"
          >
            <a
              href="#video"
              className="whitespace-nowrap shrink-0 underline-offset-8 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3B82F6]"
            >
              Video
            </a>
            <a
              href="#galeria"
              className="whitespace-nowrap shrink-0 underline-offset-8 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3B82F6]"
            >
              Galería
            </a>
            <a
              href="#enfoque"
              className="whitespace-nowrap shrink-0 underline-offset-8 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3B82F6]"
            >
              Enfoque
            </a>
            <a
              href="#contacto"
              className="whitespace-nowrap shrink-0 underline-offset-8 transition-colors hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3B82F6]"
            >
              Contacto
            </a>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
            >
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Configurar enlaces</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section: Deep Obsidian Black + Embedded External Video */}
        <section
          id="video"
          aria-labelledby="hero-heading"
          className="bg-[#07090E] text-white"
        >
          <div className="mx-auto max-w-7xl px-6 pt-12 pb-16 lg:px-10 lg:pt-20 lg:pb-24">
            <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
              {/* Left Column: Minimalist Typography & Primary CTA */}
              <div className="flex flex-col justify-between lg:col-span-5">
                <div>
                  <p className="text-xs font-medium tracking-wide text-[#60A5FA]">
                    Arquitectura · Luz · Movimiento
                  </p>

                  <h1
                    id="hero-heading"
                    className="mt-4 font-semibold tracking-tight text-white"
                    style={{
                      fontSize: 'clamp(2.25rem, 4vw, 3.75rem)',
                      lineHeight: 1.06,
                      textWrap: 'balance',
                    }}
                  >
                    Formas puras en azul, negro y blanco.
                  </h1>

                  <p className="mt-6 max-w-md text-base leading-relaxed text-slate-300">
                    Un escaparate visual minimalista construido bajo una premisa
                    técnica estricta: tanto el video principal como la galería
                    fotográfica se enlazan desde servidores externos sin alojar
                    archivos en el servidor propio.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href="#galeria"
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
                  >
                    <span>Explorar galería</span>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="whitespace-nowrap rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-[#3B82F6] hover:text-[#60A5FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
                  >
                    Cambiar video externo
                  </button>
                </div>
              </div>

              {/* Right Column: Dominant 16:9 Embedded External Video */}
              <div className="lg:col-span-7">
                <ExternalVideoPlayer
                  videoUrl={videoUrl}
                  videoTitle={videoTitle}
                  onSelectPreset={handleSelectVideoPreset}
                  onOpenLinkManager={() => setIsLinkModalOpen(true)}
                />
              </div>
            </div>

            {/* Full-Width 3-Column Strip Below Hero Split */}
            <div className="mt-14 grid grid-cols-1 gap-8 border-t border-white/10 pt-8 md:grid-cols-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  01. Video incrustado por URL
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  Compatible con enlaces externos de YouTube, Vimeo o flujos
                  directos en formato MP4 y WebM.
                </p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  02. Rejilla de enlaces remotos
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  Fotografía curada en alta resolución servida mediante URLs
                  externas con respaldo visual seguro.
                </p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  03. Cero archivos alojados
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                  Ningún recurso de imagen o video reside en el servidor de la
                  aplicación, manteniendo el despliegue ligero.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section: Crisp White Canvas */}
        <GalleryGrid
          items={allGalleryItems}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onSelectImage={handleOpenLightbox}
          onRemoveCustomItem={handleRemoveCustomItem}
          onOpenLinkManager={() => setIsLinkModalOpen(true)}
        />

        {/* Editorial Principles Section */}
        <section
          id="enfoque"
          aria-labelledby="enfoque-heading"
          className="border-y border-slate-200 bg-[#F4F7FC]"
        >
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="text-xs font-medium text-[#2563EB]">
                  Principios de diseño
                </p>
                <h2
                  id="enfoque-heading"
                  className="mt-2 text-3xl font-semibold tracking-tight text-[#07090E]"
                  style={{textWrap: 'balance'}}
                >
                  Restricción cromática y arquitectura ligera
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  Reducir la interfaz a tres tonos esenciales —blanco puro,
                  negro obsidiana y azul cobalto— dirige toda la atención hacia
                  el movimiento del video y la composición fotográfica.
                </p>
              </div>

              <div className="divide-y divide-slate-200 lg:col-span-7">
                <div className="pb-6">
                  <h3 className="text-base font-semibold text-[#07090E]">
                    01. Independencia del servidor
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Todos los medios se referencian únicamente mediante URLs
                    externas verificadas. Puedes sustituir el video principal o
                    incorporar nuevas fotografías desde el gestor de enlaces en
                    cualquier momento.
                  </p>
                </div>
                <div className="py-6">
                  <h3 className="text-base font-semibold text-[#07090E]">
                    02. Jerarquía tipográfica y aire
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Cada bloque alterna fondos contrastados y divisores finos en
                    lugar de tarjetas sobrecargadas, priorizando la lectura clara
                    y la proporción visual.
                  </p>
                </div>
                <div className="pt-6">
                  <h3 className="text-base font-semibold text-[#07090E]">
                    03. Visor integrado y accesibilidad
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Navegación completa por teclado en la galería ampliada,
                    contraste verificado y compatibilidad automática con
                    preferencias de movimiento reducido.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Minimalist Contact Section */}
        <section
          id="contacto"
          aria-labelledby="contacto-heading"
          className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24"
        >
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-xs font-medium text-[#2563EB]">Contacto</p>
              <h2
                id="contacto-heading"
                className="mt-2 text-3xl font-semibold tracking-tight text-[#07090E]"
                style={{textWrap: 'balance'}}
              >
                Comparte una obra o solicita una colaboración
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                Envíanos un enlace externo a tu pieza audiovisual o serie
                fotográfica para incluirla en futuras ediciones de la galería.
              </p>
              <div className="mt-8 space-y-2 border-t border-slate-200 pt-6 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-[#07090E]">Estudio:</span>{' '}
                  estudio@monolito.example
                </p>
                <p>
                  <span className="font-medium text-[#07090E]">Ubicación:</span>{' '}
                  Madrid · Valencia
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              {contactSubmitted ? (
                <div className="rounded-xl border border-slate-200 bg-[#F4F7FC] p-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#2563EB]"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-[#07090E]">
                        Mensaje registrado correctamente
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600">
                        Gracias por escribirnos. Revisaremos tu propuesta y nos
                        pondremos en contacto contigo pronto.
                      </p>
                      <button
                        type="button"
                        onClick={() => setContactSubmitted(false)}
                        className="mt-5 rounded-lg bg-[#07090E] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2563EB]"
                      >
                        Enviar otro mensaje
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleContactSubmit}
                  noValidate
                  className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
                >
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-semibold text-[#07090E]"
                      >
                        Nombre completo
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Clara Mendoza"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-semibold text-[#07090E]"
                      >
                        Correo electrónico
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="clara@estudio.com"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-ref"
                      className="block text-xs font-semibold text-[#07090E]"
                    >
                      Enlace externo de referencia (opcional)
                    </label>
                    <input
                      id="contact-ref"
                      type="url"
                      value={contactReference}
                      onChange={(e) => setContactReference(e.target.value)}
                      placeholder="https://..."
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold text-[#07090E]"
                    >
                      Mensaje
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Cuéntanos sobre tu proyecto o serie visual..."
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-[#07090E] placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>

                  {contactError && (
                    <p
                      role="alert"
                      className="text-xs font-medium text-red-600"
                    >
                      {contactError}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
                    >
                      Enviar consulta
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Obsidian Footer */}
      <footer className="bg-[#07090E] text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center lg:px-10">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-display font-semibold tracking-tight text-white">
              Monolito
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-xs text-slate-400">
              Contenido multimedia servido exclusivamente mediante enlaces
              externos.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <a href="#video" className="transition-colors hover:text-white">
              Video
            </a>
            <a href="#galeria" className="transition-colors hover:text-white">
              Galería
            </a>
            <a href="#enfoque" className="transition-colors hover:text-white">
              Enfoque
            </a>
            <a href="#contacto" className="transition-colors hover:text-white">
              Contacto
            </a>
            <span className="text-slate-500">© 2026 Monolito</span>
          </div>
        </div>
      </footer>

      {/* Lightbox Viewer */}
      <LightboxModal
        items={visibleGalleryItems}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(nextIdx) => setLightboxIndex(nextIdx)}
      />

      {/* External Link Manager Modal */}
      <ExternalLinkModal
        isOpen={isLinkModalOpen}
        currentVideoUrl={videoUrl}
        currentVideoTitle={videoTitle}
        onClose={() => setIsLinkModalOpen(false)}
        onSaveVideo={handleSaveVideo}
        onAddGalleryItem={handleAddGalleryItem}
        onResetAll={handleResetAll}
      />
    </div>
  );
}
