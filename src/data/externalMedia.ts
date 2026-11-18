export type GalleryCategory = 'Todas' | 'Azul cobalto' | 'Monocromo' | 'Geometría';

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
    id: 'art-of-light',
    title: 'El arte de la luz · Arquitectura minimalista',
    author: 'Modo Haus',
    url: 'https://www.youtube.com/watch?v=jXhICLmbEPM',
    duration: '04:18',
  },
  {
    id: 'modern-minimalist',
    title: 'Recorrido arquitectónico · Geometría y sombra',
    author: 'Modo Haus',
    url: 'https://www.youtube.com/watch?v=6Hr5zoCt7lM',
    duration: '05:42',
  },
];

export const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'valencia-arcos-azul',
    title: 'Estructura laminar sobre espejo de agua',
    category: 'Azul cobalto',
    location: 'Valencia, España',
    year: '2024',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Museo_Pr%C3%ADncipe_Felipe%2C_Ciudad_de_las_Artes_y_las_Ciencias%2C_Valencia%2C_Espa%C3%B1a%2C_2014-06-29%2C_DD_56.JPG/1280px-Museo_Pr%C3%ADncipe_Felipe%2C_Ciudad_de_las_Artes_y_las_Ciencias%2C_Valencia%2C_Espa%C3%B1a%2C_2014-06-29%2C_DD_56.JPG',
    alt: 'Fachada blanca contemporánea reflejada sobre lámina de agua azul bajo cielo despejado en Valencia',
    aspectHint: '16:10',
  },
  {
    id: 'hamburg-cristal-azul',
    title: 'Onda vítrea y horizonte cobalto',
    category: 'Azul cobalto',
    location: 'Hamburgo, Alemania',
    year: '2023',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/Hamburg%2C_Elbphilharmonie_--_2023_--_6573.jpg/1280px-Hamburg%2C_Elbphilharmonie_--_2023_--_6573.jpg',
    alt: 'Fachada de vidrio curvo con reflejos de cielo azul intenso en la Filarmónica del Elba',
    aspectHint: '4:3',
  },
  {
    id: 'escalera-monocromo',
    title: 'Diagonales en hormigón y sombra',
    category: 'Monocromo',
    location: 'Archivo europeo',
    year: '2024',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Stairs%2C_modern_architecture_Fortepan_16075.jpg/1280px-Stairs%2C_modern_architecture_Fortepan_16075.jpg',
    alt: 'Fotografía en blanco y negro de escalera minimalista con contraste geométrico marcado',
    aspectHint: '4:3',
  },
  {
    id: 'bonn-torre-bw',
    title: 'Retícula vertical en blanco y negro',
    category: 'Monocromo',
    location: 'Bonn, Alemania',
    year: '2023',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Bonn%2C_Post-Tower_--_2017_--_2128_%28bw%29.jpg/1280px-Bonn%2C_Post-Tower_--_2017_--_2128_%28bw%29.jpg',
    alt: 'Torre de vidrio en blanco y negro fotografiada en contrapicado con líneas limpias',
    aspectHint: '4:3',
  },
  {
    id: 'valencia-paseo-nocturno',
    title: 'Simetría nocturna en azul profundo',
    category: 'Azul cobalto',
    location: 'Valencia, España',
    year: '2024',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/Nightwalk_to_the_City_of_Arts_and_Sciences_%28Valencia%29_-_Spain_Paseo_hacia_la_ciudad_de_las_artes_y_las_ciencias_%2832244618773%29.jpg/1280px-Nightwalk_to_the_City_of_Arts_and_Sciences_%28Valencia%29_-_Spain_Paseo_hacia_la_ciudad_de_las_artes_y_las_ciencias_%2832244618773%29.jpg',
    alt: 'Pasarela iluminada en tonos azul cobalto y blanco frente a arquitectura moderna nocturna',
    aspectHint: '4:3',
  },
  {
    id: 'sydney-velas-blancas',
    title: 'Bóvedas blancas sobre cielo limpio',
    category: 'Geometría',
    location: 'Sídney, Australia',
    year: '2024',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a8/Sydney_%28AU%29%2C_Opera_House_--_2019_--_3049.jpg/1280px-Sydney_%28AU%29%2C_Opera_House_--_2019_--_3049.jpg',
    alt: 'Cubiertas blancas curvas recortadas sobre cielo azul puro',
    aspectHint: '4:3',
  },
  {
    id: 'hamburg-prisma-norte',
    title: 'Plano inclinado y reflejo marino',
    category: 'Geometría',
    location: 'Hamburgo, Alemania',
    year: '2023',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Hamburg%2C_Elbphilharmonie_--_2023_--_6575.jpg/1280px-Hamburg%2C_Elbphilharmonie_--_2023_--_6575.jpg',
    alt: 'Detalle geométrico de fachada acristalada azulada bajo cielo claro',
    aspectHint: '4:3',
  },
  {
    id: 'rascacielos-cielo-azul',
    title: 'Volumen ortogonal en cian y blanco',
    category: 'Geometría',
    location: 'Distrito financiero',
    year: '2025',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/DFC_3488_Modern_high-rise_office_building_framed_against_a_bright_blue_sky_with_scattered_clouds.jpg/1280px-DFC_3488_Modern_high-rise_office_building_framed_against_a_bright_blue_sky_with_scattered_clouds.jpg',
    alt: 'Edificio moderno de líneas puras enmarcado contra cielo azul brillante',
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

    // YouTube watch, short, or embed URLs
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

    // Vimeo URLs
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

    // Direct video file stream (.mp4, .webm, .ogg, .m4v)
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
