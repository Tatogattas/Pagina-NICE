import {ArrowUpRight, Image as ImageIcon, Plus, Trash2} from 'lucide-react';
import {useState} from 'react';
import type {GalleryCategory, GalleryItem} from '../data/externalMedia';
import {extractDomainLabel} from '../data/externalMedia';

const CATEGORIES: GalleryCategory[] = [
  'Todas',
  'Azul cobalto',
  'Monocromo',
  'Geometría',
];

interface GalleryGridProps {
  items: GalleryItem[];
  activeCategory: GalleryCategory;
  onCategoryChange: (category: GalleryCategory) => void;
  onSelectImage: (item: GalleryItem) => void;
  onRemoveCustomItem: (id: string) => void;
  onOpenLinkManager: () => void;
}

interface GalleryCardProps {
  item: GalleryItem;
  isFeatured: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}

function GalleryCard({
  item,
  isFeatured,
  onSelect,
  onRemove,
}: GalleryCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors duration-200 hover:border-[#2563EB] ${
        isFeatured ? 'md:col-span-2' : ''
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Ampliar imagen: ${item.title}`}
        className={`relative w-full overflow-hidden bg-[#0A0E17] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] ${
          isFeatured ? 'aspect-[16/10] lg:h-[380px] lg:aspect-auto' : 'aspect-[4/3]'
        }`}
      >
        {!loaded && !failed && (
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-pulse bg-slate-900"
          />
        )}

        {!failed ? (
          <img
            src={item.imageUrl}
            alt={item.alt}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#07090E] via-[#0F1B33] to-[#1E3A8A] p-6 text-center text-white">
            <ImageIcon className="h-7 w-7 text-[#60A5FA]" aria-hidden="true" />
            <p className="text-sm font-medium">{item.title}</p>
            <span className="font-mono text-xs text-slate-300">
              {extractDomainLabel(item.imageUrl)}
            </span>
          </div>
        )}

        {/* Measured scrim for crisp legible affordance on hover/focus */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" />

        <div className="pointer-events-none absolute right-4 bottom-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </div>
      </button>

      {/* Clean unboxed editorial metadata footer */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-[#07090E]">
            {item.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-[#2563EB]">{item.category}</span>
            <span aria-hidden="true">·</span>
            <span>{item.location}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{item.year}</span>
          </div>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar enlace ${item.title}`}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#07090E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}

export function GalleryGrid({
  items,
  activeCategory,
  onCategoryChange,
  onSelectImage,
  onRemoveCustomItem,
  onOpenLinkManager,
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
      {/* Header + Filter Controls */}
      <div className="flex flex-col justify-between gap-8 border-b border-slate-200 pb-8 md:flex-row md:items-end">
        <div className="max-w-xl">
          <p className="text-xs font-medium text-[#2563EB]">
            Colección externa
          </p>
          <h2
            id="galeria-heading"
            className="mt-2 text-3xl font-semibold tracking-tight text-[#07090E] sm:text-4xl"
            style={{textWrap: 'balance'}}
          >
            Galería visual mediante enlaces remotos
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Cada fotografía se carga directamente desde su origen externo en la
            red. Haz clic en cualquier obra para abrir el visor a pantalla
            completa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Filtrar galería por paleta"
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

          <button
            type="button"
            onClick={onOpenLinkManager}
            className="inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#07090E] transition-colors hover:border-[#2563EB] hover:text-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Añadir imagen</span>
          </button>
        </div>
      </div>

      {/* Responsive Asymmetric Grid */}
      {filteredItems.length === 0 ? (
        <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
          <p className="text-base font-medium text-[#07090E]">
            No hay imágenes en la categoría «{activeCategory}».
          </p>
          <button
            type="button"
            onClick={() => onCategoryChange('Todas')}
            className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
          >
            Mostrar todas las obras
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
                onSelect={() => onSelectImage(item)}
                onRemove={
                  item.isCustom ? () => onRemoveCustomItem(item.id) : undefined
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
