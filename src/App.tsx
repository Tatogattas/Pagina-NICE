import {onAuthStateChanged, signInWithPopup, signOut, type User} from 'firebase/auth';
import {
  ArrowDown,
  CheckCircle2,
  Lock,
  LogOut,
  Pencil,
  SlidersHorizontal,
} from 'lucide-react';
import {useEffect, useMemo, useState, type FormEvent} from 'react';
import {AdminLoginModal} from './components/AdminLoginModal';
import {AdminPanelModal} from './components/AdminPanelModal';
import {BrandLogo} from './components/BrandLogo';
import {ExternalVideoPlayer} from './components/ExternalVideoPlayer';
import {GalleryGrid} from './components/GalleryGrid';
import {LightboxModal} from './components/LightboxModal';
import {
  type GalleryCategory,
  type GalleryItem,
  type VideoSourcePreset,
} from './data/externalMedia';
import {
  DEFAULT_SITE_CONFIG,
  type SiteContentConfig,
} from './data/siteConfig';
import {auth, googleProvider} from './firebase';
import {
  publishSiteContent,
  subscribeToSiteContent,
} from './services/siteContentService';

const ADMIN_SESSION_KEY = 'monolito_admin_session_v1';

export default function App() {
  const [siteConfig, setSiteConfig] =
    useState<SiteContentConfig>(DEFAULT_SITE_CONFIG);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [adminUser, setAdminUser] = useState<string | null>(() => {
    try {
      const savedUser = localStorage.getItem(ADMIN_SESSION_KEY);
      return savedUser === 'tatogattas' ? savedUser : null;
    } catch {
      return null;
    }
  });

  const isAdmin = adminUser === 'tatogattas';

  const [activeCategory, setActiveCategory] =
    useState<GalleryCategory>('Todas');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Admin panel modal state
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [adminPanelTab, setAdminPanelTab] = useState<
    'hero' | 'gallery' | 'sections'
  >('hero');
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactReference, setContactReference] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Real-time subscription to global published site content in Firestore
  useEffect(() => {
    const unsubscribe = subscribeToSiteContent((remoteConfig) => {
      setSiteConfig(remoteConfig);
    });
    return () => unsubscribe();
  }, []);

  // Track Firebase Auth user for cloud publishing
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    try {
      if (adminUser) {
        localStorage.setItem(ADMIN_SESSION_KEY, adminUser);
      } else {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [adminUser]);

  useEffect(() => {
    const cleanLogo = siteConfig.logoUrl?.trim();
    if (!cleanLogo) return;
    const iconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (iconLink) {
      iconLink.href = cleanLogo;
    }
  }, [siteConfig.logoUrl]);

  const visibleGalleryItems = useMemo(
    () =>
      activeCategory === 'Todas'
        ? siteConfig.galleryItems
        : siteConfig.galleryItems.filter(
            (item) => item.category === activeCategory
          ),
    [siteConfig.galleryItems, activeCategory]
  );

  const openAdminEditor = (
    tab: 'hero' | 'gallery' | 'sections',
    itemId: string | null = null
  ) => {
    if (!isAdmin) {
      setIsLoginModalOpen(true);
      return;
    }
    setAdminPanelTab(tab);
    setEditingGalleryId(itemId);
    setIsAdminPanelOpen(true);
  };

  const handlePublishConfig = async (nextConfig: SiteContentConfig) => {
    const published = await publishSiteContent(nextConfig);
    setSiteConfig(published);
  };

  const handleSelectVideoPreset = async (preset: VideoSourcePreset) => {
    if (!isAdmin) return;
    if (!auth.currentUser) {
      try {
        await signInWithPopup(auth, googleProvider);
      } catch {
        openAdminEditor('hero');
        return;
      }
    }
    await handlePublishConfig({
      ...siteConfig,
      videoUrl: preset.url,
      videoTitle: preset.title,
    });
  };

  const handleRemoveGalleryItem = async (id: string) => {
    if (!isAdmin) return;
    if (!auth.currentUser) {
      openAdminEditor('gallery');
      return;
    }
    await handlePublishConfig({
      ...siteConfig,
      galleryItems: siteConfig.galleryItems.filter((item) => item.id !== id),
    });
  };

  const handleResetConfig = async () => {
    if (!isAdmin) return;
    await handlePublishConfig(DEFAULT_SITE_CONFIG);
    setActiveCategory('Todas');
  };

  const handleLoginSuccess = (username: string) => {
    setAdminUser(username);
    setAdminPanelTab('hero');
    setEditingGalleryId(null);
    setIsAdminPanelOpen(true);
  };

  const handleLogout = () => {
    setAdminUser(null);
    setIsAdminPanelOpen(false);
    void signOut(auth);
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
          {/* Zone 1: Single-line Wordmark + Official Logo */}
          <a
            href="#video"
            className="inline-flex items-center gap-3 font-display text-lg font-semibold tracking-tight text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#3B82F6]"
          >
            <BrandLogo
              src={siteConfig.logoUrl}
              alt={`Logo oficial de ${siteConfig.brandName}`}
              sizeClass="h-9 w-9"
            />
            <span>{siteConfig.brandName}</span>
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
            {isAdmin ? (
              <button
                type="button"
                onClick={() => openAdminEditor('hero')}
                className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Editar sitio</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white transition-colors hover:border-[#3B82F6] hover:bg-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Acceso admin</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Admin Active Toolbar (visible strictly when logged in as tatogattas) */}
      {isAdmin && (
        <div className="border-b border-[#2563EB]/30 bg-[#0D1526] text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-2.5 text-xs lg:px-10">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#60A5FA]">
                Modo administrador
              </span>
              <span aria-hidden="true" className="text-slate-500">
                ·
              </span>
              <span className="text-slate-300">
                {adminUser}{' '}
                {firebaseUser
                  ? '(Publicación global activa)'
                  : '(Conecta Google para publicar)'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openAdminEditor('hero')}
                className="inline-flex items-center gap-1 font-medium text-white transition-colors hover:text-[#60A5FA]"
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
                <span>Portada y video</span>
              </button>
              <button
                type="button"
                onClick={() => openAdminEditor('gallery')}
                className="inline-flex items-center gap-1 font-medium text-white transition-colors hover:text-[#60A5FA]"
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
                <span>Fotos y videos</span>
              </button>
              <button
                type="button"
                onClick={() => openAdminEditor('sections')}
                className="inline-flex items-center gap-1 font-medium text-white transition-colors hover:text-[#60A5FA]"
              >
                <Pencil className="h-3 w-3" aria-hidden="true" />
                <span>Textos y contacto</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1 font-medium text-white transition-colors hover:bg-red-600"
              >
                <LogOut className="h-3 w-3" aria-hidden="true" />
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section: Deep Obsidian Black + Embedded External Video */}
        <section
          id="video"
          aria-labelledby="hero-heading"
          className="bg-[#07090E] text-white"
        >
          <div className="mx-auto max-w-7xl px-6 pt-12 pb-16 lg:px-10 lg:pt-20 lg:pb-24">
            <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="flex flex-col justify-between lg:col-span-5">
                <div>
                  <p className="text-xs font-medium tracking-wide text-[#60A5FA]">
                    {siteConfig.heroKicker}
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
                    {siteConfig.heroTitle}
                  </h1>

                  <p className="mt-6 max-w-md text-base leading-relaxed text-slate-300">
                    {siteConfig.heroDescription}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4 pt-2">
                  <a
                    href="#galeria"
                    className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
                  >
                    <span>{siteConfig.heroCtaLabel}</span>
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </a>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => openAdminEditor('hero')}
                      className="whitespace-nowrap rounded-lg border border-white/15 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-[#3B82F6] hover:text-[#60A5FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
                    >
                      Editar portada y video
                    </button>
                  )}
                </div>
              </div>

              <div className="lg:col-span-7">
                <ExternalVideoPlayer
                  videoUrl={siteConfig.videoUrl}
                  videoTitle={siteConfig.videoTitle}
                  isAdmin={isAdmin}
                  onSelectPreset={(p) => void handleSelectVideoPreset(p)}
                  onOpenAdminVideoEditor={() => openAdminEditor('hero')}
                />
              </div>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-8 border-t border-white/10 pt-8 md:grid-cols-3">
              {siteConfig.heroPillars.map((pillar) => (
                <div key={pillar.id}>
                  <h2 className="text-sm font-semibold text-white">
                    {pillar.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Section: Crisp White Canvas */}
        <GalleryGrid
          kicker={siteConfig.galleryKicker}
          title={siteConfig.galleryTitle}
          description={siteConfig.galleryDescription}
          items={siteConfig.galleryItems}
          isAdmin={isAdmin}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onSelectImage={handleOpenLightbox}
          onEditItem={(item) => openAdminEditor('gallery', item.id)}
          onRemoveItem={(id) => void handleRemoveGalleryItem(id)}
          onOpenAddImage={() => openAdminEditor('gallery', null)}
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
                  {siteConfig.approachKicker}
                </p>
                <h2
                  id="enfoque-heading"
                  className="mt-2 text-3xl font-semibold tracking-tight text-[#07090E]"
                  style={{textWrap: 'balance'}}
                >
                  {siteConfig.approachTitle}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-600">
                  {siteConfig.approachDescription}
                </p>
              </div>

              <div className="divide-y divide-slate-200 lg:col-span-7">
                {siteConfig.approachItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={
                      idx === 0
                        ? 'pb-6'
                        : idx === siteConfig.approachItems.length - 1
                          ? 'pt-6'
                          : 'py-6'
                    }
                  >
                    <h3 className="text-base font-semibold text-[#07090E]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </div>
                ))}
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
              <p className="text-xs font-medium text-[#2563EB]">
                {siteConfig.contactKicker}
              </p>
              <h2
                id="contacto-heading"
                className="mt-2 text-3xl font-semibold tracking-tight text-[#07090E]"
                style={{textWrap: 'balance'}}
              >
                {siteConfig.contactTitle}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-600">
                {siteConfig.contactDescription}
              </p>
              <div className="mt-8 space-y-2 border-t border-slate-200 pt-6 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-[#07090E]">Correo:</span>{' '}
                  {siteConfig.contactEmail}
                </p>
                <p>
                  <span className="font-medium text-[#07090E]">Ubicación:</span>{' '}
                  {siteConfig.contactLocation}
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
                        placeholder="clara@correo.com"
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
                      placeholder="Cuéntanos sobre tus objetivos físicos, lesiones previas o consulta..."
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
            <BrandLogo
              src={siteConfig.logoUrl}
              alt={`Logo oficial de ${siteConfig.brandName}`}
              sizeClass="h-8 w-8"
            />
            <span className="font-display font-semibold tracking-tight text-white">
              {siteConfig.brandName}
            </span>
            <span aria-hidden="true" className="text-slate-600">
              ·
            </span>
            <span className="text-xs text-slate-400">
              {siteConfig.footerTagline}
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
            <span className="text-slate-500">
              {siteConfig.footerCopyright}
            </span>
          </div>
        </div>
      </footer>

      {/* Lightbox Viewer (available to all visitors) */}
      <LightboxModal
        items={visibleGalleryItems}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(nextIdx) => setLightboxIndex(nextIdx)}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        logoUrl={siteConfig.logoUrl}
        brandName={siteConfig.brandName}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Admin Full Site Editor Modal */}
      {isAdmin && adminUser && (
        <AdminPanelModal
          isOpen={isAdminPanelOpen}
          initialTab={adminPanelTab}
          editingGalleryItemId={editingGalleryId}
          config={siteConfig}
          adminUser={adminUser}
          firebaseUser={firebaseUser}
          onClose={() => {
            setIsAdminPanelOpen(false);
            setEditingGalleryId(null);
          }}
          onPublishConfig={handlePublishConfig}
          onResetConfig={handleResetConfig}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
