export type GalleryCategory =
  | 'Todas'
  | 'Movilidad primal'
  | 'Fuerza funcional'
  | 'Rehabilitación';

export type GalleryMediaType = 'image' | 'video';

export type VideoPlatform =
  | 'youtube'
  | 'facebook'
  | 'instagram'
  | 'vimeo'
  | 'direct';

export interface GalleryItem {
  id: string;
  mediaType?: GalleryMediaType;
  title: string;
  category: Exclude<GalleryCategory, 'Todas'>;
  location: string;
  year: string;
  imageUrl: string;
  videoUrl?: string;
  alt: string;
  aspectHint: string;
  isCustom?: boolean;
}

export interface VideoSourcePreset {
  id: string;
  title: string;
  author: string;
  url: string;
  duration: string;
}

export interface ParsedVideoSource {
  kind: 'iframe' | 'video';
  platform: VideoPlatform;
  platformLabel: string;
  embedUrl: string;
  hostLabel: string;
  originalUrl: string;
  isVertical?: boolean;
  thumbnailUrl?: string;
}

export const DEFAULT_VIDEO_PRESETS: VideoSourcePreset[] = [
  {
    id: 'primal-flow',
    title: 'Flujo primal completo · Fuerza y movilidad sin equipo',
    author: 'Movimiento Funcional',
    url: 'https://www.youtube.com/watch?v=H_CEtG4fB64',
    duration: '30:00',
  },
  {
    id: 'primal-daily',
    title: 'Patrones paleo diarios · Sentadilla profunda y columna',
    author: 'Movilidad Natural',
    url: 'https://www.youtube.com/watch?v=PKHMIt2vLgg',
    duration: '12:15',
  },
];

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'sentadilla-unilateral-primal',
    mediaType: 'image',
    title: 'Sentadilla unilateral y control de tobillo',
    category: 'Movilidad primal',
    location: 'Sala funcional NICE',
    year: 'Nivel II',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/42/Fitness_enthusiast_performs_a_single-leg_squat_exercise_in_an_indoor_gym_setting.jpg/1280px-Fitness_enthusiast_performs_a_single-leg_squat_exercise_in_an_indoor_gym_setting.jpg',
    alt: 'Atleta ejecutando sentadilla unilateral para estabilidad articular y fuerza primal',
    aspectHint: '16:10',
  },
  {
    id: 'video-patrones-paleo-diarios',
    mediaType: 'video',
    title: 'Patrones paleo diarios · Sentadilla profunda y columna',
    category: 'Movilidad primal',
    location: 'YouTube · Sesión guiada',
    year: 'Video',
    imageUrl: 'https://i.ytimg.com/vi/PKHMIt2vLgg/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=PKHMIt2vLgg',
    alt: 'Video de ejercicios paleo diarios para movilidad de cadera y columna',
    aspectHint: '16:9',
  },
  {
    id: 'kettlebell-bent-press',
    mediaType: 'image',
    title: 'Press inclinado con kettlebell y rotación torácica',
    category: 'Fuerza funcional',
    location: 'Zona de carga libre',
    year: 'Nivel III',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/e/e5/Kettlebell_Bent_Press.jpg',
    alt: 'Levantamiento técnico con pesa rusa trabajando estabilidad de hombro y columna',
    aspectHint: '4:3',
  },
  {
    id: 'plancha-isometrica-core',
    mediaType: 'image',
    title: 'Plancha isométrica y respiración diafragmática',
    category: 'Movilidad primal',
    location: 'Estudio de suelo',
    year: 'Nivel I',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Fitness_enthusiast_performs_plank_exercise_at_home_on_yoga_mat.jpg/1280px-Fitness_enthusiast_performs_plank_exercise_at_home_on_yoga_mat.jpg',
    alt: 'Ejercicio de plancha sobre colchoneta enfocado en estabilidad del núcleo corporal',
    aspectHint: '4:3',
  },
  {
    id: 'rehabilitacion-clinica-guiada',
    mediaType: 'image',
    title: 'Readaptación funcional asistida tras lesión',
    category: 'Rehabilitación',
    location: 'Área clínica NICE',
    year: 'Clínica',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f9/Spangdahlem_physical_therapy_rehabilitates_Airmen_after_injury_%287270862%29.jpg/1280px-Spangdahlem_physical_therapy_rehabilitates_Airmen_after_injury_%287270862%29.jpg',
    alt: 'Sesión clínica de fisioterapia guiando un patrón de movimiento para recuperación física',
    aspectHint: '4:3',
  },
  {
    id: 'evaluacion-articular-clinica',
    mediaType: 'image',
    title: 'Valoración articular y rango de movimiento',
    category: 'Rehabilitación',
    location: 'Consultorio biomecánico',
    year: 'Clínica',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9f/Spangdahlem_physical_therapy_rehabilitates_Airmen_after_injury_%287270864%29.jpg/1280px-Spangdahlem_physical_therapy_rehabilitates_Airmen_after_injury_%287270864%29.jpg',
    alt: 'Evaluación clínica de movilidad y control motor en sesión de terapia física',
    aspectHint: '4:3',
  },
  {
    id: 'calistenia-barras-exterior',
    mediaType: 'image',
    title: 'Tracción en barra y suspensión al aire libre',
    category: 'Fuerza funcional',
    location: 'Circuito exterior',
    year: 'Nivel II',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/93/Calisthenics-Park_Dovestra%C3%9Fe_Berlin_3v4.jpg/1280px-Calisthenics-Park_Dovestra%C3%9Fe_Berlin_3v4.jpg',
    alt: 'Estación de calistenia con barras para dominadas y trabajo de tracción natural',
    aspectHint: '4:3',
  },
  {
    id: 'kettlebell-potencia-cadera',
    mediaType: 'image',
    title: 'Bisagra de cadera y carga con kettlebell',
    category: 'Fuerza funcional',
    location: 'Sala funcional NICE',
    year: 'Nivel II',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e2/Kettlebell_and_dumbbell_in_front_of_a_woman_in_the_gym.jpg/1280px-Kettlebell_and_dumbbell_in_front_of_a_woman_in_the_gym.jpg',
    alt: 'Preparación de entrenamiento funcional con pesas rusas y mancuernas',
    aspectHint: '4:3',
  },
  {
    id: 'desplazamiento-lumbopelvico',
    mediaType: 'image',
    title: 'Control lumbo-pélvico y extensión dinámica',
    category: 'Movilidad primal',
    location: 'Estudio de suelo',
    year: 'Nivel II',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/Th_RollerFitness_exercise_-_plank_roll-ins.jpg/1280px-Th_RollerFitness_exercise_-_plank_roll-ins.jpg',
    alt: 'Ejercicio dinámico de plancha con desplazamiento para estabilidad abdominal y lumbar',
    aspectHint: '4:3',
  },
];

export function normalizeExternalMediaInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.toLowerCase().includes('<iframe')) {
    const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch?.[1]) {
      return srcMatch[1].trim();
    }
  }
  return trimmed;
}

export function isValidHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(normalizeExternalMediaInput(raw));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function extractDomainLabel(rawUrl: string): string {
  try {
    const u = new URL(normalizeExternalMediaInput(rawUrl));
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'enlace externo';
  }
}

export interface ParseVideoOptions {
  allowGenericDirectUrl?: boolean;
}

const DIRECT_VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|ogg|ogv|m3u8)(\?|#|$)/i;

export function parseExternalVideoUrl(
  rawUrl: string,
  options: ParseVideoOptions = {allowGenericDirectUrl: true}
): ParsedVideoSource | null {
  const trimmed = normalizeExternalMediaInput(rawUrl);
  if (!isValidHttpsUrl(trimmed)) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const path = url.pathname;

    // 1. YouTube (watch, shorts, live, embed, v, youtu.be)
    if (
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtube-nocookie.com' ||
      host.endsWith('.youtube-nocookie.com')
    ) {
      let videoId = url.searchParams.get('v') || '';
      if (!videoId && path.includes('/embed/')) {
        videoId = path.split('/embed/')[1]?.split('/')[0] || '';
      }
      if (!videoId && path.includes('/shorts/')) {
        videoId = path.split('/shorts/')[1]?.split('/')[0] || '';
      }
      if (!videoId && path.includes('/live/')) {
        videoId = path.split('/live/')[1]?.split('/')[0] || '';
      }
      if (!videoId && path.includes('/v/')) {
        videoId = path.split('/v/')[1]?.split('/')[0] || '';
      }
      if (videoId) {
        const cleanId = encodeURIComponent(videoId);
        return {
          kind: 'iframe',
          platform: 'youtube',
          platformLabel: 'YouTube',
          embedUrl: `https://www.youtube.com/embed/${cleanId}?rel=0&playsinline=1`,
          hostLabel: 'youtube.com',
          originalUrl: trimmed,
          isVertical: path.includes('/shorts/'),
          thumbnailUrl: `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
        };
      }
      return null;
    }

    if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
      const videoId = path.replace(/^\//, '').split('/')[0];
      if (videoId) {
        const cleanId = encodeURIComponent(videoId);
        return {
          kind: 'iframe',
          platform: 'youtube',
          platformLabel: 'YouTube',
          embedUrl: `https://www.youtube.com/embed/${cleanId}?rel=0&playsinline=1`,
          hostLabel: 'youtube.com',
          originalUrl: trimmed,
          thumbnailUrl: `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`,
        };
      }
      return null;
    }

    // 2. Facebook (watch, videos, reel, share/v, share/r, fb.watch, plugins/video.php)
    if (
      host === 'fb.watch' ||
      host.endsWith('.fb.watch') ||
      host === 'facebook.com' ||
      host.endsWith('.facebook.com')
    ) {
      if (path.includes('/plugins/video.php') && url.searchParams.has('href')) {
        const hrefTarget = url.searchParams.get('href') || trimmed;
        return {
          kind: 'iframe',
          platform: 'facebook',
          platformLabel: 'Facebook',
          embedUrl: trimmed,
          hostLabel: 'facebook.com',
          originalUrl: hrefTarget,
          isVertical: hrefTarget.includes('/reel/'),
        };
      }

      const isFbVideoLink =
        host.includes('fb.watch') ||
        url.searchParams.has('v') ||
        url.searchParams.has('story_fbid') ||
        /\/(watch|videos|reel|posts|share\/[vr]|video\.php)\b/i.test(path);

      if (isFbVideoLink) {
        return {
          kind: 'iframe',
          platform: 'facebook',
          platformLabel: 'Facebook',
          embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false&width=560`,
          hostLabel: 'facebook.com',
          originalUrl: trimmed,
          isVertical: /\/(reel|share\/r)\b/i.test(path),
        };
      }
      return null;
    }

    // 3. Instagram (p, reel, reels, tv)
    if (
      host === 'instagram.com' ||
      host.endsWith('.instagram.com') ||
      host === 'instagr.am'
    ) {
      const igMatch = path.match(/\/(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
      if (igMatch) {
        const rawKind = igMatch[1].toLowerCase();
        const kindSegment = rawKind === 'reels' ? 'reel' : rawKind;
        const shortcode = encodeURIComponent(igMatch[2]);
        return {
          kind: 'iframe',
          platform: 'instagram',
          platformLabel: 'Instagram',
          embedUrl: `https://www.instagram.com/${kindSegment}/${shortcode}/embed/`,
          hostLabel: 'instagram.com',
          originalUrl: trimmed,
          isVertical: true,
        };
      }
      return null;
    }

    // 4. Vimeo
    if (host.includes('vimeo.com')) {
      const segments = path.split('/').filter(Boolean);
      const vimeoId = segments[segments.length - 1];
      if (vimeoId && /^\d+$/.test(vimeoId)) {
        return {
          kind: 'iframe',
          platform: 'vimeo',
          platformLabel: 'Vimeo',
          embedUrl: `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`,
          hostLabel: 'player.vimeo.com',
          originalUrl: trimmed,
        };
      }
      return null;
    }

    // 5. Direct video file links (.mp4, .webm, etc.)
    if (
      DIRECT_VIDEO_EXT_RE.test(trimmed) ||
      options.allowGenericDirectUrl !== false
    ) {
      return {
        kind: 'video',
        platform: 'direct',
        platformLabel: 'Video directo',
        embedUrl: trimmed,
        hostLabel: extractDomainLabel(trimmed),
        originalUrl: trimmed,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function isKnownVideoUrl(rawUrl: string): boolean {
  const parsed = parseExternalVideoUrl(rawUrl, {allowGenericDirectUrl: false});
  return parsed !== null;
}

export function getItemVideoUrl(item: GalleryItem): string {
  const explicit = item.videoUrl?.trim();
  if (explicit) return normalizeExternalMediaInput(explicit);
  if (item.imageUrl && isKnownVideoUrl(item.imageUrl)) {
    return normalizeExternalMediaInput(item.imageUrl);
  }
  return '';
}

export function isVideoGalleryItem(item: GalleryItem): boolean {
  return item.mediaType === 'video' || Boolean(getItemVideoUrl(item));
}

export function getGalleryItemThumbnail(item: GalleryItem): string {
  const manual = item.imageUrl?.trim();
  if (manual && !isKnownVideoUrl(manual)) {
    return manual;
  }
  const vidUrl = getItemVideoUrl(item);
  if (vidUrl) {
    const parsed = parseExternalVideoUrl(vidUrl);
    if (parsed?.thumbnailUrl) {
      return parsed.thumbnailUrl;
    }
  }
  return '';
}

export function buildAutoplayEmbedUrl(parsed: ParsedVideoSource): string {
  if (parsed.platform === 'youtube' || parsed.platform === 'vimeo') {
    const sep = parsed.embedUrl.includes('?') ? '&' : '?';
    return `${parsed.embedUrl}${sep}autoplay=1`;
  }
  return parsed.embedUrl;
}
