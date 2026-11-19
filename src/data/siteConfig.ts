import {
  DEFAULT_GALLERY_ITEMS,
  DEFAULT_VIDEO_PRESETS,
  type GalleryItem,
} from './externalMedia';

export interface TextBlockItem {
  id: string;
  title: string;
  description: string;
}

export interface SiteContentConfig {
  brandName: string;
  heroKicker: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaLabel: string;
  videoUrl: string;
  videoTitle: string;
  heroPillars: TextBlockItem[];
  galleryKicker: string;
  galleryTitle: string;
  galleryDescription: string;
  galleryItems: GalleryItem[];
  approachKicker: string;
  approachTitle: string;
  approachDescription: string;
  approachItems: TextBlockItem[];
  contactKicker: string;
  contactTitle: string;
  contactDescription: string;
  contactEmail: string;
  contactLocation: string;
  footerTagline: string;
  footerCopyright: string;
}

export const DEFAULT_SITE_CONFIG: SiteContentConfig = {
  brandName: 'Academia/Clínica NICE',
  heroKicker: 'Movimiento primal · Fuerza · Rehabilitación',
  heroTitle: 'Entrenamiento paleo y clínica del movimiento.',
  heroDescription:
    'En Academia/Clínica NICE integramos biomecánica evolutiva, patrones de locomoción natural y fisioterapia funcional para recuperar movilidad articular, fuerza real y salud física duradera.',
  heroCtaLabel: 'Explorar ejercicios',
  videoUrl: DEFAULT_VIDEO_PRESETS[0].url,
  videoTitle: DEFAULT_VIDEO_PRESETS[0].title,
  heroPillars: [
    {
      id: 'pillar-1',
      title: '01. Sesiones paleo guiadas',
      description:
        'Rutinas de flujo corporal, sentadilla profunda, gateos y estabilidad central reproducidas mediante enlace externo.',
    },
    {
      id: 'pillar-2',
      title: '02. Fuerza y calistenia natural',
      description:
        'Patrones multiarticulares con peso corporal y kettlebell orientados a mejorar postura, potencia y equilibrio.',
    },
    {
      id: 'pillar-3',
      title: '03. Readaptación clínica NICE',
      description:
        'Evaluación biomecánica y progresiones seguras para prevenir lesiones y devolver movilidad a cada articulación.',
    },
  ],
  galleryKicker: 'Archivo visual NICE',
  galleryTitle: 'Ejercicios paleo y readaptación clínica',
  galleryDescription:
    'Explora nuestra galería de movimientos funcionales, control postural y rehabilitación servida mediante enlaces externos. Haz clic en cualquier lámina para ampliarla.',
  galleryItems: DEFAULT_GALLERY_ITEMS,
  approachKicker: 'Metodología NICE',
  approachTitle: 'Movimiento natural respaldado por criterio clínico',
  approachDescription:
    'Entrenamos las capacidades físicas esenciales del cuerpo humano: empujar, traccionar, hacer sentadilla profunda, cargar y desplazarse con fluidez y sin dolor.',
  approachItems: [
    {
      id: 'approach-1',
      title: '01. Diagnóstico biomecánico inicial',
      description:
        'Detectamos asimetrías de cadera, columna torácica y estabilidad escapular antes de incrementar cargas o complejidad.',
    },
    {
      id: 'approach-2',
      title: '02. Entrenamiento paleo progresivo',
      description:
        'Priorizamos movimientos funcionales descalzo o con carga libre que fortalecen tendones, fascia y musculatura estabilizadora.',
    },
    {
      id: 'approach-3',
      title: '03. Clínica y rendimiento en un solo lugar',
      description:
        'Unimos la exigencia técnica de la academia con protocolos clínicos de recuperación para acompañar cada etapa física.',
    },
  ],
  contactKicker: 'Contacto',
  contactTitle: 'Agenda una valoración o consulta clínica',
  contactDescription:
    'Escríbenos para solicitar tu evaluación inicial de movimiento, horarios de sesiones paleo grupales o programas personalizados de rehabilitación.',
  contactEmail: 'clinica@academianice.example',
  contactLocation: 'Academia/Clínica NICE · Sede Central',
  footerTagline:
    'Academia/Clínica NICE — Ejercicios paleo, movilidad natural y clínica funcional.',
  footerCopyright: '© 2026 Academia/Clínica NICE',
};

// SHA-256 hex digests for administrator verification
const ADMIN_USER_HASH =
  '9a60cce4774ce31eee25d952eeeaabb3d27dbabe6d317c6ebe867597276a0d79';
const ADMIN_PASS_HASH =
  'e0bfc07312a7bb8674f719716144fce8076bbf0d03f91011ee53fadfbba3cbab';

async function sha256Hex(input: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const encoded = new TextEncoder().encode(input);
    const digest = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return '';
}

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const cleanUser = username.trim();
  if (!cleanUser || !password) return false;

  const [userHash, passHash] = await Promise.all([
    sha256Hex(cleanUser),
    sha256Hex(password),
  ]);
  return userHash === ADMIN_USER_HASH && passHash === ADMIN_PASS_HASH;
}
