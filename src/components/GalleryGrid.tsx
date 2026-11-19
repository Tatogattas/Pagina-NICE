import {
  ArrowUpRight,
  Image as ImageIcon,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import {useState} from 'react';
import {
  extractDomainLabel,
  getGalleryItemThumbnail,
  isVideoGalleryItem,
  parseExternalVideoUrl,
  type GalleryCategory,
  type GalleryItem,
} from '../data/externalMedia';

const CATEGORIES: GalleryCategory[] = [
  'Todas',
  'Movilidad primal',
  'Fuerza funcional',
  'Rehabilitación',
];

interface GalleryGridProps {
  kicker: string;
  title: string;
  description: string;
  items: GalleryItem[];
  isAdmin: boolean;
  activeCategory: GalleryCategory;
  onCategoryChange: (category: GalleryCategory) => void;
  onSelectImage: (item: GalleryItem) => void;
  onEditItem: (item: GalleryItem) => void;
  onRemoveItem: (id: string) => void;
  onOpenAddImage: () => void;
}

interface GalleryCardProps {
  item: GalleryItem;
  isFeatured: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

function GalleryCard({
  item,
  isFeatured,
  isAdmin,
  onSelect,
  onEdit,
  onRemove,
}: GalleryCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const isVideo = isVideoGalleryItem(item);
  const parsedVideo =
    isVideo && item.videoUrl ? parseExternalVideoUrl(item.videoUrl) : null;
  const thumbnailUrl = isVideo ? getGalleryItemThumbnail(item) : item.imageUrl;
  const hasThumbnail = Boolean(thumbnailUrl) && !failed;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors duration-200 hover:border-[#2563EB] ${
        isFeatured ? 'md:col-span-2' : ''
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={
          isVideo
            ? `Reproducir video: ${item.title}`
            : `Ampliar imagen: ${item.title}`
        }
        className={`relative w-full overflow-hidden bg-[#0A0E17] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
          isFeatured
            ? 'aspect-[16/10] lg:h-[380px] lg:aspect-auto'
            : 'aspect-[4/3]'
        }`}
      >
        {hasThumbnail && !loaded && (
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-pulse bg-slate-900"
          />
        )}

        {hasThumbnail ? (
          <img
            src={thumbnailUrl}
            alt={item.alt || item.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : isVideo ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#07090E] via-[#0F1B33] to-[#1E3A8A] p-6 text-center text-white">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB] text-white shadow-lg transition-transform duration-200 group-hover:scale-105">
              <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
            </span>
            <div className="max-w-xs space-y-1">
              <p className="text-sm font-semibold leading-snug text-white">
                {item.title}
              </p>
              <p className="font-mono text-xs text-[#93C5FD]">
                {parsedVideo ? parsedVideo.platformLabel : 'Video externo'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#07090E] via-[#0F1B33] to-[#1E3A8A] p-6 text-center text-white">
            <ImageIcon className="h-7 w-7 text-[#60A5FA]" aria-hidden="true" />
            <p className="text-sm font-medium">{item.title}</p>
            <span className="font-mono text-xs text-slate-300">
              {extractDomainLabel(item.imageUrl)}
            </span>
          </div>
        )}

        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent transition-opacity duration-200 ${
            isVideo && hasThumbnail
              ? 'opacity-70 group-hover:opacity-90'
              : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
          }`}
        />

        {isVideo && hasThumbnail ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB]/95 text-white shadow-lg transition-transform duration-200 group-hover:scale-105">
              <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
            </span>
          </div>
        ) : (
          !isVideo && (
            <div className="pointer-events-none absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </div>
          )
        )}
      </button>

      {/* Clean unboxed editorial metadata footer */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-[#07090E]">
            {item.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-[#2563EB]">{item.category}</span>
            {isVideo && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#07090E]">
                  Video {parsedVideo ? `(${parsedVideo.platformLabel})` : ''}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{item.location}</span>
            {item.year && item.year.toLowerCase() !== 'video' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{item.year}</span>
              </>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Editar ${item.title}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Eliminar ${item.title}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export function GalleryGrid({
  kicker,
  title,
  description,
  items,
  isAdmin,
  activeCategory,
  onCategoryChange,
  onSelectImage,
  onEditItem,
  onRemoveItem,
  onOpenAddImage,
}: GalleryGridProps) {
  const filteredItems =
    activeCategory === 'Todas'
      ? items
      : items.filter((item) => item.category === activeCategory);

  return (
    <section
      id="galeria"
      aria-labelledby="galeria-heading"
      className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28"
    >
      <div className="flex flex-col justify-between gap-8 border-b border-slate-200 pb-8 md:flex-row md:items-end">
        <div className="max-w-xl">
          <p className="text-xs font-medium text-[#2563EB]">{kicker}</p>
          <h2
            id="galeria-heading"
            className="mt-2 text-3xl font-semibold tracking-tight text-[#07090E] sm:text-4xl"
            style={{textWrap: 'balance'}}
          >
            {title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Filtrar galería por especialidad"
            className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1"
          >
            {CATEGORIES.map((category) => {
              const isSelected = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onCategoryChange(category)}
                  className={`whitespace-nowrap shrink-0 rounded-md px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
                    isSelected
                      ? 'bg-[#07090E] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#07090E]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAddImage}
              className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#07090E] transition-colors hover:border-[#2563EB] hover:text-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Añadir foto o video</span>
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
          <p className="text-base font-medium text-[#07090E]">
            No hay elementos en la categoría «{activeCategory}».
          </p>
          <button
            type="button"
            onClick={() => onCategoryChange('Todas')}
            className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
          >
            Mostrar todos los elementos
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item, idx) => {
            const isFeatured =
              activeCategory === 'Todas' &&
              idx === 0 &&
              filteredItems.length >= 2;

            return (
              <GalleryCard
                key={item.id}
                item={item}
                isFeatured={isFeatured}
                isAdmin={isAdmin}
                onSelect={() => onSelectImage(item)}
                onEdit={() => onEditItem(item)}
                onRemove={() => onRemoveItem(item.id)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
