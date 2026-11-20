import {useEffect} from 'react';
import type {SiteContentConfig} from '../data/siteConfig';
import {ORIGIN_WHATSAPP} from '../services/contactRoutingService';
import {buildNavigationLinks} from '../utils/mapsLinks';

interface SeoStructuredDataProps {
  config: SiteContentConfig;
}

export const AEO_FAQ_ITEMS = [
  {
    question: '¿Qué es el entrenamiento paleo en Academia/Clínica NICE?',
    answer:
      'Es un sistema que entrena patrones naturales del cuerpo humano —sentadilla profunda, empuje, tracción, transporte de carga y locomoción— bajo supervisión clínica para recuperar movilidad, postura y fuerza funcional sin dolor.',
  },
  {
    question: '¿Cómo integran fisioterapia clínica y ejercicio funcional?',
    answer:
      'Todo proceso inicia con un diagnóstico biomecánico de cadera, columna torácica y estabilidad escapular para adaptar cada progresión a tu estado articular y objetivos.',
  },
  {
    question: '¿Cómo agendar valoración o abrir la ubicación en mapas?',
    answer:
      'Completa el formulario de Contacto para enviar tus datos al correo vinculado y WhatsApp rotativo, o entra en la pestaña Ubicación para abrir indicaciones paso a paso en Google Maps, Waze o Apple Maps.',
  },
] as const;

function upsertMetaTag(
  attr: 'name' | 'property',
  key: string,
  content: string
) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkTag(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function SeoStructuredData({config}: SeoStructuredDataProps) {
  useEffect(() => {
    const canonicalUrl = window.location.origin + window.location.pathname;
    const nav = buildNavigationLinks(config);

    const pageTitle = `${config.brandName} | Ejercicios Paleo y Clínica`;
    const metaDesc = config.heroDescription.trim().slice(0, 158);
    const ogImage = config.logoUrl.trim();

    document.title = pageTitle;
    upsertMetaTag('name', 'description', metaDesc);
    upsertMetaTag('property', 'og:title', pageTitle);
    upsertMetaTag('property', 'og:description', metaDesc);
    upsertMetaTag('property', 'og:site_name', config.brandName);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('name', 'twitter:title', pageTitle);
    upsertMetaTag('name', 'twitter:description', metaDesc);
    if (ogImage) {
      upsertMetaTag('property', 'og:image', ogImage);
      upsertMetaTag('name', 'twitter:image', ogImage);
    }
    upsertLinkTag('canonical', canonicalUrl);

    if (nav.hasCustomCoords) {
      const geoPos = `${nav.center.lat};${nav.center.lng}`;
      upsertMetaTag('name', 'geo.position', geoPos);
      upsertMetaTag('name', 'ICBM', `${nav.center.lat}, ${nav.center.lng}`);
    }

    const clinicEntity: Record<string, unknown> = {
      '@type': ['MedicalClinic', 'SportsActivityLocation'],
      '@id': `${canonicalUrl}#organization`,
      name: config.brandName,
      url: canonicalUrl,
      description: config.heroDescription,
      telephone: ORIGIN_WHATSAPP,
      email: config.contactEmail,
      hasMap: nav.googleMapsUrl,
      areaServed: 'El Salvador',
      address: {
        '@type': 'PostalAddress',
        streetAddress: nav.queryLabel,
        addressCountry: 'SV',
      },
      medicalSpecialty: ['PhysicalTherapy', 'SportsMedicine'],
      knowsAbout: [
        'Entrenamiento paleo',
        'Movilidad primal',
        'Fuerza funcional',
        'Readaptación clínica',
        'Biomecánica evolutiva',
      ],
      ...(ogImage ? {logo: ogImage, image: ogImage} : {}),
      ...(nav.hasCustomCoords
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: nav.center.lat,
              longitude: nav.center.lng,
            },
          }
        : {}),
    };

    const jsonLdGraph = {
      '@context': 'https://schema.org',
      '@graph': [
        clinicEntity,
        {
          '@type': 'WebSite',
          '@id': `${canonicalUrl}#website`,
          url: canonicalUrl,
          name: config.brandName,
          inLanguage: 'es',
          publisher: {'@id': `${canonicalUrl}#organization`},
        },
        {
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: pageTitle,
          description: metaDesc,
          inLanguage: 'es',
          isPartOf: {'@id': `${canonicalUrl}#website`},
          about: {'@id': `${canonicalUrl}#organization`},
          speakable: {
            '@type': 'SpeakableSpecification',
            cssSelector: [
              '#hero-heading',
              '#enfoque-heading',
              '#ubicacion-heading',
              '.aeo-answer',
            ],
          },
        },
        {
          '@type': 'VideoObject',
          name: config.videoTitle || config.heroTitle,
          description: config.heroDescription,
          contentUrl: config.videoUrl,
          embedUrl: config.videoUrl,
          ...(ogImage ? {thumbnailUrl: ogImage} : {}),
        },
        {
          '@type': 'FAQPage',
          mainEntity: AEO_FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.answer,
            },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Video',
              item: `${canonicalUrl}#video`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Galería',
              item: `${canonicalUrl}#galeria`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'Enfoque',
              item: `${canonicalUrl}#enfoque`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'Contacto',
              item: `${canonicalUrl}#contacto`,
            },
            {
              '@type': 'ListItem',
              position: 5,
              name: 'Ubicación',
              item: `${canonicalUrl}#ubicacion`,
            },
          ],
        },
      ],
    };

    let script = document.getElementById(
      'nice-static-jsonld'
    ) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'nice-static-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLdGraph);
  }, [config]);

  return null;
}
