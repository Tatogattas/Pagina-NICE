export type GalleryCategory =
  | 'Todas'
  | 'Movilidad primal'
  | 'Fuerza funcional'
  | 'Rehabilitación';

export interface GalleryItem {
  id: string;
  title: string;
  category: Exclude<GalleryCategory, 'Todas'>;
  location: string;
  year: string;
  imageUrl: string;
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
  embedUrl: string;
  hostLabel: string;
  originalUrl: string;
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
    id: 'kettlebell-bent-press',
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

export function isValidHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function extractDomainLabel(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return 'enlace externo';
  }
}

export function parseExternalVideoUrl(rawUrl: string): ParsedVideoSource | null {
  const trimmed = rawUrl.trim();
  if (!isValidHttpsUrl(trimmed)) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      let videoId = url.searchParams.get('v') || '';
      if (!videoId && url.pathname.includes('/embed/')) {
        videoId = url.pathname.split('/embed/')[1]?.split('/')[0] || '';
      }
      if (!videoId && url.pathname.includes('/shorts/')) {
        videoId = url.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      }
      if (videoId) {
        return {
          kind: 'iframe',
          embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`,
          hostLabel: 'youtube-nocookie.com',
          originalUrl: trimmed,
        };
      }
    }

    if (host === 'youtu.be') {
      const videoId = url.pathname.replace(/^\//, '').split('/')[0];
      if (videoId) {
        return {
          kind: 'iframe',
          embedUrl: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1`,
          hostLabel: 'youtube-nocookie.com',
          originalUrl: trimmed,
        };
      }
    }

    if (host.includes('vimeo.com')) {
      const segments = url.pathname.split('/').filter(Boolean);
      const vimeoId = segments[segments.length - 1];
      if (vimeoId && /^\d+$/.test(vimeoId)) {
        return {
          kind: 'iframe',
          embedUrl: `https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`,
          hostLabel: 'player.vimeo.com',
          originalUrl: trimmed,
        };
      }
    }

    return {
      kind: 'video',
      embedUrl: trimmed,
      hostLabel: extractDomainLabel(trimmed),
      originalUrl: trimmed,
    };
  } catch {
    return null;
  }
}
