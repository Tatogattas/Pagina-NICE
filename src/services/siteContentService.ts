import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import {
  isKnownVideoUrl,
  normalizeExternalMediaInput,
  normalizeImageUrl,
} from '../data/externalMedia';
import {
  DEFAULT_SITE_CONFIG,
  type SiteContentConfig,
} from '../data/siteConfig';
import {auth, db, handleFirestoreError, OperationType} from '../firebase';

const SITE_DOC_COLLECTION = 'siteContent';
const SITE_DOC_ID = 'main';
const SITE_DOC_PATH = `${SITE_DOC_COLLECTION}/${SITE_DOC_ID}`;

function clampStr(value: string, max: number, fallback = ''): string {
  const clean = typeof value === 'string' ? value.trim() : fallback;
  return clean.slice(0, max);
}

/**
 * Sanitizes incoming config strictly to the field lengths and array limits
 * declared in firebase-blueprint.json and enforced by firestore.rules.
 */
export function sanitizeSiteConfig(
  raw: SiteContentConfig
): SiteContentConfig {
  return {
    brandName: clampStr(raw.brandName, 80, DEFAULT_SITE_CONFIG.brandName) || DEFAULT_SITE_CONFIG.brandName,
    logoUrl: (() => {
      const candidate = clampStr(raw.logoUrl ?? DEFAULT_SITE_CONFIG.logoUrl, 1000);
      if (!candidate) return '';
      return /^https?:\/\/.+/.test(candidate) ? candidate : DEFAULT_SITE_CONFIG.logoUrl;
    })(),
    heroKicker: clampStr(raw.heroKicker, 120),
    heroTitle: clampStr(raw.heroTitle, 200, DEFAULT_SITE_CONFIG.heroTitle) || DEFAULT_SITE_CONFIG.heroTitle,
    heroDescription: clampStr(raw.heroDescription, 600),
    heroCtaLabel: clampStr(raw.heroCtaLabel, 60, DEFAULT_SITE_CONFIG.heroCtaLabel) || DEFAULT_SITE_CONFIG.heroCtaLabel,
    videoUrl:
      clampStr(raw.videoUrl, 1000, DEFAULT_SITE_CONFIG.videoUrl) ||
      DEFAULT_SITE_CONFIG.videoUrl,
    videoTitle: clampStr(raw.videoTitle, 200),
    heroPillars: (Array.isArray(raw.heroPillars) ? raw.heroPillars : [])
      .slice(0, 6)
      .map((p, idx) => ({
        id: clampStr(p.id || `pillar-${idx + 1}`, 64),
        title: clampStr(p.title, 120),
        description: clampStr(p.description, 400),
      })),
    galleryJumpCtaLabel:
      clampStr(
        raw.galleryJumpCtaLabel ?? DEFAULT_SITE_CONFIG.galleryJumpCtaLabel ?? '',
        100
      ) ||
      DEFAULT_SITE_CONFIG.galleryJumpCtaLabel ||
      'Agenda tu valoración · Ir a Contacto',
    ctaLockDelaySeconds: (() => {
      const val = Number(raw.ctaLockDelaySeconds);
      if (!Number.isFinite(val)) return DEFAULT_SITE_CONFIG.ctaLockDelaySeconds ?? 30;
      return Math.min(3600, Math.max(5, Math.round(val)));
    })(),
    ctaUnlockCooldownSeconds: (() => {
      const val = Number(raw.ctaUnlockCooldownSeconds);
      if (!Number.isFinite(val)) return DEFAULT_SITE_CONFIG.ctaUnlockCooldownSeconds ?? 60;
      return Math.min(3600, Math.max(10, Math.round(val)));
    })(),
    ctaAdminUnlockEpoch: (() => {
      const val = Number(raw.ctaAdminUnlockEpoch);
      if (!Number.isFinite(val) || val < 0) return 0;
      return Math.min(9999999999999, Math.round(val));
    })(),
    galleryKicker: clampStr(raw.galleryKicker, 120),
    galleryTitle: clampStr(raw.galleryTitle, 200, DEFAULT_SITE_CONFIG.galleryTitle) || DEFAULT_SITE_CONFIG.galleryTitle,
    galleryDescription: clampStr(raw.galleryDescription, 600),
    galleryItems: (Array.isArray(raw.galleryItems) ? raw.galleryItems : [])
      .slice(0, 50)
      .map((item, idx) => {
        const normalizedImage = normalizeImageUrl(item.imageUrl || '');
        const normalizedVideo = normalizeExternalMediaInput(item.videoUrl || '');
        const inferredVideo =
          !normalizedVideo && normalizedImage && isKnownVideoUrl(normalizedImage)
            ? normalizedImage
            : normalizedVideo;
        const cleanVideoUrl = clampStr(inferredVideo, 1000);
        const cleanImageUrl = clampStr(
          normalizedImage === cleanVideoUrl ? '' : normalizedImage,
          1000
        );
        const mediaType =
          item.mediaType === 'video' || Boolean(cleanVideoUrl)
            ? 'video'
            : 'image';
        return {
          id: clampStr(item.id || `media-${idx + 1}`, 100),
          mediaType,
          title: clampStr(item.title, 160),
          category: item.category,
          location: clampStr(item.location, 120),
          year: clampStr(item.year, 16),
          imageUrl: cleanImageUrl,
          ...(cleanVideoUrl ? {videoUrl: cleanVideoUrl} : {}),
          alt: clampStr(item.alt, 300),
          aspectHint: clampStr(item.aspectHint || '4:3', 20),
          ...(item.isCustom ? {isCustom: true} : {}),
        };
      }),
    approachKicker: clampStr(raw.approachKicker, 120),
    approachTitle: clampStr(raw.approachTitle, 200, DEFAULT_SITE_CONFIG.approachTitle) || DEFAULT_SITE_CONFIG.approachTitle,
    approachDescription: clampStr(raw.approachDescription, 600),
    approachItems: (Array.isArray(raw.approachItems) ? raw.approachItems : [])
      .slice(0, 10)
      .map((a, idx) => ({
        id: clampStr(a.id || `approach-${idx + 1}`, 64),
        title: clampStr(a.title, 120),
        description: clampStr(a.description, 400),
      })),
    contactKicker: clampStr(raw.contactKicker, 120),
    contactTitle: clampStr(raw.contactTitle, 200, DEFAULT_SITE_CONFIG.contactTitle) || DEFAULT_SITE_CONFIG.contactTitle,
    contactDescription: clampStr(raw.contactDescription, 600),
    contactEmail: clampStr(raw.contactEmail, 160),
    contactLocation: clampStr(raw.contactLocation, 160),
    locationKicker: clampStr(
      raw.locationKicker ?? DEFAULT_SITE_CONFIG.locationKicker ?? '',
      120
    ),
    locationTitle: clampStr(
      raw.locationTitle ?? DEFAULT_SITE_CONFIG.locationTitle ?? '',
      200
    ),
    locationDescription: clampStr(
      raw.locationDescription ?? DEFAULT_SITE_CONFIG.locationDescription ?? '',
      600
    ),
    locationAddress: clampStr(
      raw.locationAddress ?? DEFAULT_SITE_CONFIG.locationAddress ?? '',
      240
    ),
    locationMapsUrl: (() => {
      const candidate = clampStr(raw.locationMapsUrl ?? '', 1000);
      if (!candidate) return '';
      return /^https:\/\/.+/.test(candidate) ? candidate : '';
    })(),
    locationLat:
      typeof raw.locationLat === 'number' &&
      Number.isFinite(raw.locationLat) &&
      raw.locationLat >= -90 &&
      raw.locationLat <= 90
        ? Number(raw.locationLat.toFixed(6))
        : null,
    locationLng:
      typeof raw.locationLng === 'number' &&
      Number.isFinite(raw.locationLng) &&
      raw.locationLng >= -180 &&
      raw.locationLng <= 180
        ? Number(raw.locationLng.toFixed(6))
        : null,
    whatsappWebhookUrl: (() => {
      const candidate = clampStr(raw.whatsappWebhookUrl ?? '', 1000);
      if (!candidate) return '';
      return /^https:\/\/.+/.test(candidate) ? candidate : '';
    })(),
    footerTagline: clampStr(raw.footerTagline, 300),
    footerCopyright: clampStr(raw.footerCopyright, 120),
  };
}

export function subscribeToSiteContent(
  onData: (config: SiteContentConfig) => void,
  onSyncError?: (err: Error) => void
): Unsubscribe {
  const ref = doc(db, SITE_DOC_COLLECTION, SITE_DOC_ID);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        return;
      }
      const data = snapshot.data() as Partial<SiteContentConfig>;
      const merged: SiteContentConfig = {
        ...DEFAULT_SITE_CONFIG,
        ...data,
        logoUrl:
          typeof data.logoUrl === 'string' && data.logoUrl.trim()
            ? data.logoUrl
            : DEFAULT_SITE_CONFIG.logoUrl,
        whatsappWebhookUrl:
          typeof data.whatsappWebhookUrl === 'string'
            ? data.whatsappWebhookUrl
            : '',
        locationMapsUrl:
          typeof data.locationMapsUrl === 'string' &&
          data.locationMapsUrl.trim()
            ? data.locationMapsUrl
            : DEFAULT_SITE_CONFIG.locationMapsUrl || '',
        locationLat:
          typeof data.locationLat === 'number' &&
          Number.isFinite(data.locationLat)
            ? data.locationLat
            : (DEFAULT_SITE_CONFIG.locationLat ?? null),
        locationLng:
          typeof data.locationLng === 'number' &&
          Number.isFinite(data.locationLng)
            ? data.locationLng
            : (DEFAULT_SITE_CONFIG.locationLng ?? null),
        heroPillars: Array.isArray(data.heroPillars)
          ? data.heroPillars
          : DEFAULT_SITE_CONFIG.heroPillars,
        galleryItems: Array.isArray(data.galleryItems)
          ? data.galleryItems
          : DEFAULT_SITE_CONFIG.galleryItems,
        galleryJumpCtaLabel:
          typeof data.galleryJumpCtaLabel === 'string' &&
          data.galleryJumpCtaLabel.trim()
            ? data.galleryJumpCtaLabel
            : DEFAULT_SITE_CONFIG.galleryJumpCtaLabel || '',
        ctaLockDelaySeconds:
          typeof data.ctaLockDelaySeconds === 'number' &&
          Number.isFinite(data.ctaLockDelaySeconds) &&
          data.ctaLockDelaySeconds >= 5
            ? Math.round(data.ctaLockDelaySeconds)
            : (DEFAULT_SITE_CONFIG.ctaLockDelaySeconds ?? 30),
        ctaUnlockCooldownSeconds:
          typeof data.ctaUnlockCooldownSeconds === 'number' &&
          Number.isFinite(data.ctaUnlockCooldownSeconds) &&
          data.ctaUnlockCooldownSeconds >= 10
            ? Math.round(data.ctaUnlockCooldownSeconds)
            : (DEFAULT_SITE_CONFIG.ctaUnlockCooldownSeconds ?? 60),
        ctaAdminUnlockEpoch:
          typeof data.ctaAdminUnlockEpoch === 'number' &&
          Number.isFinite(data.ctaAdminUnlockEpoch) &&
          data.ctaAdminUnlockEpoch >= 0
            ? Math.round(data.ctaAdminUnlockEpoch)
            : 0,
        approachItems: Array.isArray(data.approachItems)
          ? data.approachItems
          : DEFAULT_SITE_CONFIG.approachItems,
      };
      onData(merged);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, SITE_DOC_PATH);
      } catch (wrapped) {
        if (onSyncError && wrapped instanceof Error) {
          onSyncError(wrapped);
        }
      }
    }
  );
}

export async function publishSiteContent(
  nextConfig: SiteContentConfig
): Promise<SiteContentConfig> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error(
      'Debes conectar tu cuenta de administrador de Google para publicar cambios globales.'
    );
  }

  const sanitized = sanitizeSiteConfig(nextConfig);
  const payload = {
    ...sanitized,
    updatedByUid: currentUser.uid,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, SITE_DOC_COLLECTION, SITE_DOC_ID), payload);
    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, SITE_DOC_PATH);
  }
}
