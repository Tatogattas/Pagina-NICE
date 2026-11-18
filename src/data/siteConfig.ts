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
  brandName: 'Monolito',
  heroKicker: 'Arquitectura · Luz · Movimiento',
  heroTitle: 'Formas puras en azul, negro y blanco.',
  heroDescription:
    'Un escaparate visual minimalista construido bajo una premisa técnica estricta: tanto el video principal como la galería fotográfica se enlazan desde servidores externos sin alojar archivos en el servidor propio.',
  heroCtaLabel: 'Explorar galería',
  videoUrl: DEFAULT_VIDEO_PRESETS[0].url,
  videoTitle: DEFAULT_VIDEO_PRESETS[0].title,
  heroPillars: [
    {
      id: 'pillar-1',
      title: '01. Video incrustado por URL',
      description:
        'Compatible con enlaces externos de YouTube, Vimeo o flujos directos en formato MP4 y WebM.',
    },
    {
      id: 'pillar-2',
      title: '02. Rejilla de enlaces remotos',
      description:
        'Fotografía curada en alta resolución servida mediante URLs externas con respaldo visual seguro.',
    },
    {
      id: 'pillar-3',
      title: '03. Cero archivos alojados',
      description:
        'Ningún recurso de imagen o video reside en el servidor de la aplicación, manteniendo el despliegue ligero.',
    },
  ],
  galleryKicker: 'Colección externa',
  galleryTitle: 'Galería visual mediante enlaces remotos',
  galleryDescription:
    'Cada fotografía se carga directamente desde su origen externo en la red. Haz clic en cualquier obra para abrir el visor a pantalla completa.',
  galleryItems: DEFAULT_GALLERY_ITEMS,
  approachKicker: 'Principios de diseño',
  approachTitle: 'Restricción cromática y arquitectura ligera',
  approachDescription:
    'Reducir la interfaz a tres tonos esenciales —blanco puro, negro obsidiana y azul cobalto— dirige toda la atención hacia el movimiento del video y la composición fotográfica.',
  approachItems: [
    {
      id: 'approach-1',
      title: '01. Independencia del servidor',
      description:
        'Todos los medios se referencian únicamente mediante URLs externas verificadas, manteniendo el sitio completamente estático y ligero.',
    },
    {
      id: 'approach-2',
      title: '02. Jerarquía tipográfica y aire',
      description:
        'Cada bloque alterna fondos contrastados y divisores finos en lugar de tarjetas sobrecargadas, priorizando la lectura clara y la proporción visual.',
    },
    {
      id: 'approach-3',
      title: '03. Visor integrado y accesibilidad',
      description:
        'Navegación completa por teclado en la galería ampliada, contraste verificado y compatibilidad automática con preferencias de movimiento reducido.',
    },
  ],
  contactKicker: 'Contacto',
  contactTitle: 'Comparte una obra o solicita una colaboración',
  contactDescription:
    'Envíanos un enlace externo a tu pieza audiovisual o serie fotográfica para incluirla en futuras ediciones de la galería.',
  contactEmail: 'estudio@monolito.example',
  contactLocation: 'Madrid · Valencia',
  footerTagline:
    'Contenido multimedia servido exclusivamente mediante enlaces externos.',
  footerCopyright: '© 2026 Monolito',
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
