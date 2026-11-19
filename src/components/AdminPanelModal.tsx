import type {User} from 'firebase/auth';
import {signInWithPopup} from 'firebase/auth';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Cloud,
  Download,
  Film,
  Image as ImageIcon,
  LogOut,
  MessageCircle,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {useEffect, useMemo, useRef, useState, type FormEvent} from 'react';
import {
  getGalleryItemThumbnail,
  isKnownVideoUrl,
  isValidHttpsUrl,
  isVideoGalleryItem,
  normalizeExternalMediaInput,
  normalizeImageUrl,
  parseExternalVideoUrl,
  type GalleryCategory,
  type GalleryItem,
  type GalleryMediaType,
} from '../data/externalMedia';
import type {SiteContentConfig} from '../data/siteConfig';
import {auth, googleProvider} from '../firebase';
import {
  buildOriginForwardWhatsappUrl,
  deleteContactInquiry,
  LINKED_ADMIN_EMAIL,
  markInquiryDispatched,
  ORIGIN_WHATSAPP,
  subscribeToContactInquiries,
  WHATSAPP_ADVISORS,
  type StoredContactInquiry,
} from '../services/contactRoutingService';
import {BrandLogo} from './BrandLogo';

type EditorTab = 'hero' | 'gallery' | 'sections' | 'inquiries';

interface AdminPanelModalProps {
  isOpen: boolean;
  initialTab?: EditorTab;
  editingGalleryItemId?: string | null;
  config: SiteContentConfig;
  adminUser: string;
  firebaseUser: User | null;
  onClose: () => void;
  onPublishConfig: (next: SiteContentConfig) => Promise<void>;
  onResetConfig: () => Promise<void>;
  onLogout: () => void;
}

export function AdminPanelModal({
  isOpen,
  initialTab = 'hero',
  editingGalleryItemId = null,
  config,
  adminUser,
  firebaseUser,
  onClose,
  onPublishConfig,
  onResetConfig,
  onLogout,
}: AdminPanelModalProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
  const [draft, setDraft] = useState<SiteContentConfig>(config);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [connectingGoogle, setConnectingGoogle] = useState(false);
  const [inquiries, setInquiries] = useState<StoredContactInquiry[]>([]);

  // Add / edit single gallery item form
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    editingGalleryItemId
  );
  const [itemMediaType, setItemMediaType] =
    useState<GalleryMediaType>('image');
  const [imgUrl, setImgUrl] = useState('');
  const [itemVideoUrl, setItemVideoUrl] = useState('');
  const [imgTitle, setImgTitle] = useState('');
  const [imgCategory, setImgCategory] =
    useState<Exclude<GalleryCategory, 'Todas'>>('Movilidad primal');
  const [imgLocation, setImgLocation] = useState('');
  const [imgYear, setImgYear] = useState('2026');
  const [imgAlt, setImgAlt] = useState('');

  const parsedGalleryVideo = useMemo(() => {
    if (itemMediaType !== 'video' || !itemVideoUrl.trim()) return null;
    return parseExternalVideoUrl(itemVideoUrl, {allowGenericDirectUrl: true});
  }, [itemMediaType, itemVideoUrl]);

  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    setDraft(config);

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (justOpened) {
      setActiveTab(initialTab);
      setErrorMsg(null);
      setSavedFeedback(null);
    }

    if (editingGalleryItemId && justOpened) {
      const target = config.galleryItems.find(
        (g) => g.id === editingGalleryItemId
      );
      if (target) {
        const isVideo = isVideoGalleryItem(target);
        setSelectedItemId(target.id);
        setItemMediaType(isVideo ? 'video' : 'image');
        setImgUrl(target.imageUrl || '');
        setItemVideoUrl(target.videoUrl || '');
        setImgTitle(target.title);
        setImgCategory(target.category);
        setImgLocation(target.location);
        setImgYear(target.year);
        setImgAlt(target.alt);
      }
    } else if (justOpened) {
      resetItemForm();
    }
  }, [isOpen, initialTab, editingGalleryItemId, config]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !firebaseUser) {
      setInquiries([]);
      return;
    }
    const unsub = subscribeToContactInquiries((items) => {
      setInquiries(items);
    });
    return () => unsub();
  }, [isOpen, firebaseUser]);

  if (!isOpen) return null;

  function resetItemForm() {
    setSelectedItemId(null);
    setItemMediaType('image');
    setImgUrl('');
    setItemVideoUrl('');
    setImgTitle('');
    setImgCategory('Movilidad primal');
    setImgLocation('');
    setImgYear(String(new Date().getFullYear()));
    setImgAlt('');
  }

  function flashSaved(msg: string) {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 3000);
  }

  async function ensureCloudAuth(): Promise<boolean> {
    if (auth.currentUser) return true;
    setConnectingGoogle(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error al autenticar con Google.';
      if (msg.includes('unauthorized-domain')) {
        setErrorMsg(
          'Este dominio aún no está autorizado en Firebase Auth. Agrégalo en Firebase Console → Authentication → Settings → Authorized domains.'
        );
      } else {
        setErrorMsg(
          'Conecta tu cuenta de Google autorizada (taroret134@gmail.com) para publicar cambios para todos los visitantes.'
        );
      }
      return false;
    } finally {
      setConnectingGoogle(false);
    }
  }

  async function persistChanges(
    nextConfig: SiteContentConfig,
    successText: string
  ): Promise<boolean> {
    setErrorMsg(null);
    const authed = await ensureCloudAuth();
    if (!authed) return false;

    setSaving(true);
    try {
      await onPublishConfig(nextConfig);
      flashSaved(successText);
      return true;
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      if (raw.includes('Quota exceeded')) {
        setErrorMsg(
          'Se alcanzó el límite diario gratuito de escrituras en Firestore. Se restablecerá mañana.'
        );
      } else if (raw.includes('Missing or insufficient permissions')) {
        setErrorMsg(
          'Tu cuenta de Google actual no tiene permisos de administrador. Inicia sesión con taroret134@gmail.com.'
        );
      } else {
        setErrorMsg('No se pudo publicar en la nube. Revisa tu conexión.');
      }
      return false;
    } finally {
      setSaving(false);
    }
  }

  const handleSaveGeneral = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (draft.logoUrl.trim() && !isValidHttpsUrl(draft.logoUrl)) {
      setActiveTab('hero');
      setErrorMsg('La URL del logo oficial debe comenzar con https:// o http://.');
      return;
    }
    const parsedVideo = parseExternalVideoUrl(draft.videoUrl);
    if (!parsedVideo) {
      setActiveTab('hero');
      setErrorMsg(
        'El enlace del video debe ser una URL válida de YouTube, Facebook, Instagram, Vimeo o archivo MP4/WebM (https://).'
      );
      return;
    }
    await persistChanges(
      draft,
      'Publicado en la nube: todos los visitantes ya ven los cambios.'
    );
  };

  const handleSaveWebhook = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmed = (draft.whatsappWebhookUrl ?? '').trim();
    if (trimmed && !/^https:\/\/.+/.test(trimmed)) {
      setErrorMsg(
        'La URL del webhook debe comenzar con https:// (o déjala vacía para desactivarla).'
      );
      return;
    }
    await persistChanges(
      {...draft, whatsappWebhookUrl: trimmed},
      trimmed
        ? 'Webhook de WhatsApp conectado y publicado.'
        : 'Webhook de WhatsApp desactivado.'
    );
  };

  const handleSaveGalleryItem = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!imgTitle.trim()) {
      setErrorMsg('Escribe un título para el ejercicio o elemento.');
      return;
    }

    let effectiveMediaType = itemMediaType;
    let finalImageUrl = normalizeImageUrl(imgUrl);
    let finalVideoUrl: string | undefined;

    if (effectiveMediaType === 'image' && isKnownVideoUrl(finalImageUrl)) {
      effectiveMediaType = 'video';
      finalVideoUrl = finalImageUrl;
      finalImageUrl = '';
    }

    if (effectiveMediaType === 'video') {
      const candidateVideo = normalizeExternalMediaInput(
        finalVideoUrl || itemVideoUrl
      );
      const parsed = parseExternalVideoUrl(candidateVideo, {
        allowGenericDirectUrl: true,
      });
      if (!parsed) {
        setErrorMsg(
          'Ingresa un enlace válido de video o reel de YouTube, Facebook, Instagram, Vimeo o MP4/WebM (https://).'
        );
        return;
      }
      if (finalImageUrl && !isValidHttpsUrl(finalImageUrl)) {
        setErrorMsg(
          'Si agregas una imagen de portada opcional, debe ser una URL válida (https://...).'
        );
        return;
      }
      if (!finalImageUrl && parsed.thumbnailUrl) {
        finalImageUrl = parsed.thumbnailUrl;
      }
      finalVideoUrl = candidateVideo;
    } else {
      if (!isValidHttpsUrl(finalImageUrl)) {
        setErrorMsg(
          'Ingresa una URL externa válida (https://...) para la imagen.'
        );
        return;
      }
    }

    let nextItems: GalleryItem[];
    if (selectedItemId) {
      nextItems = draft.galleryItems.map((item) =>
        item.id === selectedItemId
          ? {
              ...item,
              mediaType: effectiveMediaType,
              imageUrl: finalImageUrl,
              ...(finalVideoUrl ? {videoUrl: finalVideoUrl} : {videoUrl: ''}),
              title: imgTitle.trim(),
              category: imgCategory,
              location:
                imgLocation.trim() ||
                (effectiveMediaType === 'video'
                  ? 'Enlace de video'
                  : 'Enlace externo'),
              year:
                imgYear.trim() ||
                (effectiveMediaType === 'video'
                  ? 'Video'
                  : String(new Date().getFullYear())),
              alt: imgAlt.trim() || imgTitle.trim(),
            }
          : item
      );
    } else {
      const newItem: GalleryItem = {
        id: `${effectiveMediaType === 'video' ? 'vid' : 'img'}-${Date.now()}`,
        mediaType: effectiveMediaType,
        imageUrl: finalImageUrl,
        ...(finalVideoUrl ? {videoUrl: finalVideoUrl} : {}),
        title: imgTitle.trim(),
        category: imgCategory,
        location:
          imgLocation.trim() ||
          (effectiveMediaType === 'video'
            ? 'Enlace de video'
            : 'Enlace externo'),
        year:
          imgYear.trim() ||
          (effectiveMediaType === 'video'
            ? 'Video'
            : String(new Date().getFullYear())),
        alt: imgAlt.trim() || imgTitle.trim(),
        aspectHint: effectiveMediaType === 'video' ? '16:9' : '4:3',
        isCustom: true,
      };
      nextItems = [newItem, ...draft.galleryItems];
    }

    const updated = {...draft, galleryItems: nextItems};
    const ok = await persistChanges(
      updated,
      selectedItemId
        ? 'Elemento actualizado y publicado para todos.'
        : effectiveMediaType === 'video'
          ? 'Video añadido y publicado para todos.'
          : 'Imagen añadida y publicada para todos.'
    );
    if (ok) {
      setDraft(updated);
      resetItemForm();
    }
  };

  const handleStartEditItem = (item: GalleryItem) => {
    const isVideo = isVideoGalleryItem(item);
    setSelectedItemId(item.id);
    setItemMediaType(isVideo ? 'video' : 'image');
    setImgUrl(item.imageUrl || '');
    setItemVideoUrl(item.videoUrl || '');
    setImgTitle(item.title);
    setImgCategory(item.category);
    setImgLocation(item.location);
    setImgYear(item.year);
    setImgAlt(item.alt);
    setErrorMsg(null);
  };

  const handleDeleteItem = async (id: string) => {
    const nextItems = draft.galleryItems.filter((item) => item.id !== id);
    const updated = {...draft, galleryItems: nextItems};
    const ok = await persistChanges(updated, 'Imagen eliminada para todos.');
    if (ok) {
      setDraft(updated);
      if (selectedItemId === id) {
        resetItemForm();
      }
    }
  };

  const handleMoveItem = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.galleryItems.length) return;
    const nextItems = [...draft.galleryItems];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(target, 0, moved);
    const updated = {...draft, galleryItems: nextItems};
    const ok = await persistChanges(updated, 'Orden actualizado en la nube.');
    if (ok) {
      setDraft(updated);
    }
  };

  const handleReset = async () => {
    const authed = await ensureCloudAuth();
    if (!authed) return;
    setSaving(true);
    try {
      await onResetConfig();
      flashSaved('Contenido restaurado y publicado para todos.');
    } catch {
      setErrorMsg('No se pudo restaurar el contenido en la nube.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nice-config.json';
    link.click();
    URL.revokeObjectURL(url);
    flashSaved('Configuración descargada en JSON.');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-panel-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-[#07090E] px-6 py-4 text-white">
          <div>
            <h2 id="admin-panel-title" className="text-lg font-semibold">
              Panel de administración
            </h2>
            <p className="text-xs text-slate-400">
              Administrador: <span className="text-white">{adminUser}</span> ·
              Los cambios publicados se sincronizan en tiempo real con todos los
              visitantes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-[#3B82F6] hover:text-[#60A5FA]"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Exportar JSON</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Cloud Publish Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#F4F7FC] px-6 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Cloud className="h-4 w-4 text-[#2563EB]" aria-hidden="true" />
            {firebaseUser ? (
              <span>
                Publicación en la nube conectada como{' '}
                <strong className="text-[#07090E]">{firebaseUser.email}</strong>
              </span>
            ) : (
              <span>
                Conecta tu cuenta Google autorizada para guardar cambios globales
                en la web pública.
              </span>
            )}
          </div>

          {!firebaseUser && (
            <button
              type="button"
              onClick={() => void ensureCloudAuth()}
              disabled={connectingGoogle}
              className="rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              {connectingGoogle ? 'Conectando...' : 'Conectar cuenta Google'}
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3">
          <div
            role="tablist"
            className="flex flex-wrap gap-1 rounded-lg bg-slate-200/70 p-1"
          >
            {(
              [
                {id: 'hero', label: 'Portada y Video'},
                {id: 'gallery', label: 'Galería (Fotos y Videos)'},
                {id: 'sections', label: 'Enfoque, Contacto y Pie'},
                {
                  id: 'inquiries',
                  label: `Consultas (${inquiries.length})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setErrorMsg(null);
                }}
                className={`whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#07090E] text-white'
                    : 'text-slate-600 hover:text-[#07090E]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleReset()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 transition-colors hover:text-[#2563EB] disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Restaurar valores iniciales</span>
          </button>
        </div>

        {/* Feedback Banner */}
        {(savedFeedback || errorMsg) && (
          <div className="border-b border-slate-200 px-6 py-2.5">
            {savedFeedback && (
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]">
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>{savedFeedback}</span>
              </p>
            )}
            {errorMsg && (
              <p role="alert" className="text-xs font-semibold text-red-600">
                {errorMsg}
              </p>
            )}
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'hero' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#07090E]">
                    Nombre de marca (Barra superior y pie)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={draft.brandName}
                    onChange={(e) =>
                      setDraft({...draft, brandName: e.target.value})
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#07090E]">
                    Antetítulo del héroe
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={draft.heroKicker}
                    onChange={(e) =>
                      setDraft({...draft, heroKicker: e.target.value})
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-4">
                  <BrandLogo
                    src={draft.logoUrl}
                    alt={`Vista previa del logo de ${draft.brandName}`}
                    sizeClass="h-12 w-12"
                  />
                  <div className="min-w-0 flex-1">
                    <label className="block text-xs font-semibold text-[#07090E]">
                      URL del logo oficial (HTTPS)
                    </label>
                    <input
                      type="url"
                      maxLength={1000}
                      value={draft.logoUrl}
                      onChange={(e) =>
                        setDraft({...draft, logoUrl: e.target.value})
                      }
                      placeholder="https://..."
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#07090E]">
                    Título principal del héroe
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={draft.heroTitle}
                    onChange={(e) =>
                      setDraft({...draft, heroTitle: e.target.value})
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#07090E]">
                    Texto del botón principal
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={draft.heroCtaLabel}
                    onChange={(e) =>
                      setDraft({...draft, heroCtaLabel: e.target.value})
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#07090E]">
                  Descripción del héroe
                </label>
                <textarea
                  rows={3}
                  maxLength={600}
                  value={draft.heroDescription}
                  onChange={(e) =>
                    setDraft({...draft, heroDescription: e.target.value})
                  }
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-[#07090E]">
                  Video incrustado mediante enlace externo
                </h3>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#07090E]">
                      URL del video (YouTube, Facebook, Instagram, Vimeo o MP4)
                    </label>
                    <input
                      type="url"
                      required
                      maxLength={1000}
                      value={draft.videoUrl}
                      onChange={(e) =>
                        setDraft({...draft, videoUrl: e.target.value})
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#07090E]">
                      Título del video
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={draft.videoTitle}
                      onChange={(e) =>
                        setDraft({...draft, videoTitle: e.target.value})
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#07090E]">
                  Tres bloques inferiores de la portada
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {draft.heroPillars.map((pillar, idx) => (
                    <div
                      key={pillar.id}
                      className="space-y-2 rounded-lg border border-slate-200 p-3"
                    >
                      <input
                        type="text"
                        maxLength={120}
                        value={pillar.title}
                        onChange={(e) => {
                          const next = [...draft.heroPillars];
                          next[idx] = {...pillar, title: e.target.value};
                          setDraft({...draft, heroPillars: next});
                        }}
                        className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs font-semibold focus:border-[#2563EB] focus:outline-none"
                      />
                      <textarea
                        rows={3}
                        maxLength={400}
                        value={pillar.description}
                        onChange={(e) => {
                          const next = [...draft.heroPillars];
                          next[idx] = {
                            ...pillar,
                            description: e.target.value,
                          };
                          setDraft({...draft, heroPillars: next});
                        }}
                        className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-xs focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || connectingGoogle}
                  className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {saving ? 'Publicando...' : 'Guardar y publicar portada'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-8">
              <form
                onSubmit={handleSaveGeneral}
                className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#07090E]">
                    Encabezado de la sección galería
                  </h3>
                  <button
                    type="submit"
                    disabled={saving || connectingGoogle}
                    className="rounded-lg bg-[#07090E] px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2563EB] disabled:opacity-60"
                  >
                    {saving ? 'Publicando...' : 'Publicar textos'}
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    maxLength={120}
                    value={draft.galleryKicker}
                    onChange={(e) =>
                      setDraft({...draft, galleryKicker: e.target.value})
                    }
                    placeholder="Antetítulo"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#2563EB] focus:outline-none"
                  />
                  <input
                    type="text"
                    maxLength={200}
                    value={draft.galleryTitle}
                    onChange={(e) =>
                      setDraft({...draft, galleryTitle: e.target.value})
                    }
                    placeholder="Título de galería"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <textarea
                  rows={2}
                  maxLength={600}
                  value={draft.galleryDescription}
                  onChange={(e) =>
                    setDraft({...draft, galleryDescription: e.target.value})
                  }
                  placeholder="Descripción"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#2563EB] focus:outline-none"
                />
              </form>

              <form
                onSubmit={handleSaveGalleryItem}
                className="space-y-4 rounded-xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#07090E]">
                    {selectedItemId
                      ? 'Editar elemento seleccionado'
                      : 'Añadir foto o video mediante enlace externo'}
                  </h3>

                  <div className="flex items-center gap-3">
                    <div
                      role="group"
                      aria-label="Tipo de elemento"
                      className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setItemMediaType('image');
                          setErrorMsg(null);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                          itemMediaType === 'image'
                            ? 'bg-[#07090E] text-white'
                            : 'text-slate-600 hover:text-[#07090E]'
                        }`}
                      >
                        <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Imagen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setItemMediaType('video');
                          if (imgYear === String(new Date().getFullYear())) {
                            setImgYear('Video');
                          }
                          setErrorMsg(null);
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                          itemMediaType === 'video'
                            ? 'bg-[#2563EB] text-white'
                            : 'text-slate-600 hover:text-[#07090E]'
                        }`}
                      >
                        <Film className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Video (YT / FB / IG)</span>
                      </button>
                    </div>

                    {selectedItemId && (
                      <button
                        type="button"
                        onClick={resetItemForm}
                        className="text-xs font-medium text-slate-500 hover:text-[#07090E]"
                      >
                        Cancelar edición
                      </button>
                    )}
                  </div>
                </div>

                {itemMediaType === 'video' ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#07090E]">
                        URL del video o reel (YouTube, Facebook, Instagram, Vimeo o MP4)
                      </label>
                      <input
                        type="text"
                        inputMode="url"
                        required
                        maxLength={1000}
                        value={itemVideoUrl}
                        onChange={(e) =>
                          setItemVideoUrl(normalizeExternalMediaInput(e.target.value))
                        }
                        placeholder="https://www.youtube.com/watch?v=... | instagram.com/reel/... | facebook.com/..."
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                      />
                      {itemVideoUrl.trim() && (
                        <p
                          className={`mt-1.5 text-xs ${
                            parsedGalleryVideo
                              ? 'font-medium text-[#2563EB]'
                              : 'text-red-600'
                          }`}
                        >
                          {parsedGalleryVideo
                            ? `Plataforma detectada: ${parsedGalleryVideo.platformLabel} (se reproduce directo en la galería)`
                            : 'Enlace no reconocido. Para Instagram usa un Reel o publicación (/reel/ o /p/); para Facebook usa /watch, /videos o /reel.'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#07090E]">
                        URL de portada o miniatura (opcional)
                      </label>
                      <input
                        type="url"
                        maxLength={1000}
                        value={imgUrl}
                        onChange={(e) => setImgUrl(e.target.value)}
                        placeholder="https://... (opcional; YouTube la genera sola)"
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                      />
                      <p className="mt-1.5 text-xs text-slate-500">
                        Si se deja vacío en Facebook o Instagram, el reproductor
                        se muestra directamente dentro de la tarjeta de galería.
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {itemMediaType === 'image' && (
                    <div>
                      <label className="block text-xs font-semibold text-[#07090E]">
                        URL externa de la imagen (o pega un enlace de video)
                      </label>
                      <input
                        type="text"
                        inputMode="url"
                        required
                        maxLength={1000}
                        value={imgUrl}
                        onChange={(e) => {
                          const normalized = normalizeExternalMediaInput(
                            e.target.value
                          );
                          if (isKnownVideoUrl(normalized)) {
                            setItemMediaType('video');
                            setItemVideoUrl(normalized);
                            setImgUrl('');
                            if (imgYear === String(new Date().getFullYear())) {
                              setImgYear('Video');
                            }
                            flashSaved(
                              'Se detectó un enlace de video; cambiado automáticamente a modo Video.'
                            );
                          } else {
                            setImgUrl(normalizeImageUrl(normalized));
                          }
                        }}
                        placeholder="https://..."
                        className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                  )}

                  <div className={itemMediaType === 'video' ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-[#07090E]">
                      Título del ejercicio o práctica
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={160}
                      value={imgTitle}
                      onChange={(e) => setImgTitle(e.target.value)}
                      placeholder="Movilidad articular en cuadrupedia"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#07090E]">
                      Categoría
                    </label>
                    <select
                      value={imgCategory}
                      onChange={(e) =>
                        setImgCategory(
                          e.target.value as Exclude<GalleryCategory, 'Todas'>
                        )
                      }
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                    >
                      <option value="Movilidad primal">Movilidad primal</option>
                      <option value="Fuerza funcional">Fuerza funcional</option>
                      <option value="Rehabilitación">Rehabilitación</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#07090E]">
                      Área o sede
                    </label>
                    <input
                      type="text"
                      maxLength={120}
                      value={imgLocation}
                      onChange={(e) => setImgLocation(e.target.value)}
                      placeholder="Sala funcional · Sede Central"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#07090E]">
                      Nivel / Año
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={imgYear}
                      onChange={(e) => setImgYear(e.target.value)}
                      placeholder="2026"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#07090E]">
                    Descripción alternativa (accesibilidad)
                  </label>
                  <input
                    type="text"
                    maxLength={300}
                    value={imgAlt}
                    onChange={(e) => setImgAlt(e.target.value)}
                    placeholder="Descripción breve del ejercicio o técnica"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || connectingGoogle}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {saving
                        ? 'Publicando...'
                        : selectedItemId
                          ? 'Actualizar y publicar'
                          : itemMediaType === 'video'
                            ? 'Añadir video y publicar'
                            : 'Añadir imagen y publicar'}
                    </span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[#07090E]">
                  Elementos actuales en galería ({draft.galleryItems.length})
                </h3>
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {draft.galleryItems.map((item, idx) => {
                    const isVideo = isVideoGalleryItem(item);
                    const thumb = isVideo
                      ? getGalleryItemThumbnail(item)
                      : item.imageUrl;
                    const parsedVid =
                      isVideo && item.videoUrl
                        ? parseExternalVideoUrl(item.videoUrl)
                        : null;
                    return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-4 p-3 sm:flex-nowrap"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {thumb ? (
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                            <img
                              src={thumb}
                              alt={item.title}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                            {isVideo && (
                              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-[#07090E] text-[#60A5FA]">
                            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#07090E]">
                            {item.title}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {isVideo
                              ? `Video (${parsedVid?.platformLabel ?? 'Externo'})`
                              : 'Imagen'}{' '}
                            · {item.category} · {item.location} · {item.year}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void handleMoveItem(idx, -1)}
                          disabled={idx === 0 || saving}
                          aria-label="Subir posición"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleMoveItem(idx, 1)}
                          disabled={
                            idx === draft.galleryItems.length - 1 || saving
                          }
                          aria-label="Bajar posición"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditItem(item)}
                          aria-label={`Editar ${item.title}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#2563EB]"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteItem(item.id)}
                          disabled={saving}
                          aria-label={`Eliminar ${item.title}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sections' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              <div className="space-y-4 rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-[#07090E]">
                  Sección Enfoque
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    maxLength={120}
                    value={draft.approachKicker}
                    onChange={(e) =>
                      setDraft({...draft, approachKicker: e.target.value})
                    }
                    placeholder="Antetítulo"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                  <input
                    type="text"
                    maxLength={200}
                    value={draft.approachTitle}
                    onChange={(e) =>
                      setDraft({...draft, approachTitle: e.target.value})
                    }
                    placeholder="Título"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <textarea
                  rows={2}
                  maxLength={600}
                  value={draft.approachDescription}
                  onChange={(e) =>
                    setDraft({...draft, approachDescription: e.target.value})
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                />

                <div className="space-y-3 pt-2">
                  {draft.approachItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-3"
                    >
                      <input
                        type="text"
                        maxLength={120}
                        value={item.title}
                        onChange={(e) => {
                          const next = [...draft.approachItems];
                          next[idx] = {...item, title: e.target.value};
                          setDraft({...draft, approachItems: next});
                        }}
                        className="rounded border border-slate-300 px-2.5 py-1.5 text-xs font-semibold focus:border-[#2563EB] focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        maxLength={400}
                        value={item.description}
                        onChange={(e) => {
                          const next = [...draft.approachItems];
                          next[idx] = {...item, description: e.target.value};
                          setDraft({...draft, approachItems: next});
                        }}
                        className="rounded border border-slate-300 px-2.5 py-1.5 text-xs sm:col-span-2 focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-[#07090E]">
                  Sección Contacto y Pie de página
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    maxLength={200}
                    value={draft.contactTitle}
                    onChange={(e) =>
                      setDraft({...draft, contactTitle: e.target.value})
                    }
                    placeholder="Título de contacto"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                  <input
                    type="email"
                    maxLength={160}
                    value={draft.contactEmail}
                    onChange={(e) =>
                      setDraft({...draft, contactEmail: e.target.value})
                    }
                    placeholder="Correo electrónico"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
                <textarea
                  rows={2}
                  maxLength={600}
                  value={draft.contactDescription}
                  onChange={(e) =>
                    setDraft({...draft, contactDescription: e.target.value})
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <input
                    type="text"
                    maxLength={160}
                    value={draft.contactLocation}
                    onChange={(e) =>
                      setDraft({...draft, contactLocation: e.target.value})
                    }
                    placeholder="Ubicación"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                  <input
                    type="text"
                    maxLength={300}
                    value={draft.footerTagline}
                    onChange={(e) =>
                      setDraft({...draft, footerTagline: e.target.value})
                    }
                    placeholder="Nota del pie"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                  <input
                    type="text"
                    maxLength={120}
                    value={draft.footerCopyright}
                    onChange={(e) =>
                      setDraft({...draft, footerCopyright: e.target.value})
                    }
                    placeholder="Copyright"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || connectingGoogle}
                  className="rounded-lg bg-[#2563EB] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-60"
                >
                  {saving ? 'Publicando...' : 'Guardar y publicar secciones'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'inquiries' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-[#F4F7FC] p-4 text-xs text-slate-700">
                <p className="font-semibold text-[#07090E]">
                  Distribución por turnos desde {ORIGIN_WHATSAPP} y correo vinculado
                </p>
                <p className="mt-1 leading-relaxed">
                  Cada consulta del formulario se envía a{' '}
                  <strong className="text-[#07090E]">{LINKED_ADMIN_EMAIL}</strong>{' '}
                  y se asigna rotativamente con origen{' '}
                  <strong className="text-[#07090E]">{ORIGIN_WHATSAPP}</strong>{' '}
                  hacia:{' '}
                  {WHATSAPP_ADVISORS.map((a) => `Turno ${a.slot}: ${a.display}`).join(
                    ' · '
                  )}
                  .
                </p>
              </div>

              <form
                onSubmit={(e) => void handleSaveWebhook(e)}
                className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold text-[#07090E]">
                      Automatización directa desde {ORIGIN_WHATSAPP} (Webhook HTTPS opcional)
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Si conectas Make, Zapier, n8n o WhatsApp Business Cloud API con el
                      número {ORIGIN_WHATSAPP}, el sitio enviará un POST automático con el
                      cliente y el turno asignado sin intervención manual.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    maxLength={1000}
                    value={draft.whatsappWebhookUrl ?? ''}
                    onChange={(e) =>
                      setDraft({...draft, whatsappWebhookUrl: e.target.value})
                    }
                    placeholder="https://hook.us1.make.com/... (opcional)"
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-[#2563EB] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={saving || connectingGoogle}
                    className="whitespace-nowrap rounded-lg bg-[#07090E] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#2563EB] disabled:opacity-60"
                  >
                    {saving ? 'Guardando...' : 'Guardar webhook'}
                  </button>
                </div>
              </form>

              {!firebaseUser ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                  <p>
                    Conecta tu cuenta Google ({LINKED_ADMIN_EMAIL}) arriba para
                    consultar las solicitudes recibidas en la nube.
                  </p>
                </div>
              ) : inquiries.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
                  Aún no hay consultas registradas en Firestore.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
                  {inquiries.map((inq) => {
                    const cleanDigits = inq.phone.replace(/\D/g, '');
                    const replyWa = cleanDigits
                      ? `https://wa.me/${cleanDigits}?text=${encodeURIComponent(
                          `Hola ${inq.name}, te saludamos de ${draft.brandName} respecto a tu consulta.`
                        )}`
                      : '';
                    const originForwardWa = buildOriginForwardWhatsappUrl(
                      inq,
                      draft.brandName
                    );
                    return (
                      <div
                        key={inq.id}
                        className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-start"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-[#07090E]">
                              {inq.name}
                            </span>
                            <span className="rounded bg-[#2563EB]/10 px-2 py-0.5 text-xs font-semibold text-[#2563EB]">
                              {inq.senderWhatsapp || ORIGIN_WHATSAPP} → Turno {inq.turnSlot} · {inq.assignedWhatsapp}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                inq.dispatched
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {inq.dispatched ? 'Reenviado' : 'Pendiente'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600">
                            Correo: {inq.email} · Teléfono: {inq.phone}
                          </p>
                          <p className="pt-1 text-sm text-[#07090E]">
                            {inq.message}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(inq.createdAtMs).toLocaleString('es-SV')}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <a
                            href={originForwardWa}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => void markInquiryDispatched(inq.id, true)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
                          >
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>
                              Reenviar a Turno {inq.turnSlot}
                            </span>
                          </a>
                          <button
                            type="button"
                            onClick={() =>
                              void markInquiryDispatched(inq.id, !inq.dispatched)
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-[#07090E] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>
                              {inq.dispatched ? 'Reenviado' : 'Marcar listo'}
                            </span>
                          </button>
                          {replyWa && (
                            <a
                              href={replyWa}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#07090E] transition-colors hover:border-[#2563EB] hover:text-[#2563EB]"
                            >
                              <MessageCircle
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              <span>Cliente</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => void deleteContactInquiry(inq.id)}
                            aria-label={`Eliminar consulta de ${inq.name}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
