import {ExternalLink, Film, Link2} from 'lucide-react';
import {useMemo, useState} from 'react';
import {
  DEFAULT_VIDEO_PRESETS,
  parseExternalVideoUrl,
  type VideoSourcePreset,
} from '../data/externalMedia';

interface ExternalVideoPlayerProps {
  videoUrl: string;
  videoTitle: string;
  isAdmin: boolean;
  onSelectPreset: (preset: VideoSourcePreset) => void;
  onOpenAdminVideoEditor: () => void;
}

export function ExternalVideoPlayer({
  videoUrl,
  videoTitle,
  isAdmin,
  onSelectPreset,
  onOpenAdminVideoEditor,
}: ExternalVideoPlayerProps) {
  const [videoError, setVideoError] = useState(false);

  const parsed = useMemo(() => {
    setVideoError(false);
    return parseExternalVideoUrl(videoUrl);
  }, [videoUrl]);

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/15 bg-black shadow-2xl">
        {parsed && !videoError ? (
          parsed.kind === 'iframe' ? (
            <iframe
              key={parsed.embedUrl}
              src={parsed.embedUrl}
              title={videoTitle}
              className={`h-full w-full border-0 ${
                parsed.platform === 'instagram' ? 'bg-white' : ''
              }`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          ) : (
            <video
              key={parsed.embedUrl}
              src={parsed.embedUrl}
              controls
              playsInline
              preload="metadata"
              onError={() => setVideoError(true)}
              className="h-full w-full bg-black object-cover"
            />
          )
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#0B111D] px-6 text-center">
            <Film className="h-8 w-8 text-[#3B82F6]" aria-hidden="true" />
            <p className="text-sm font-medium text-white">
              Video temporalmente no disponible desde el enlace externo.
            </p>
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenAdminVideoEditor}
                className="rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
              >
                Actualizar enlace externo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unboxed external origin bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-white">{videoTitle}</span>
          <span aria-hidden="true" className="text-slate-500">
            ·
          </span>
          <span className="font-mono text-slate-400">
            {parsed ? parsed.hostLabel : 'enlace externo'}
          </span>
          {parsed && (
            <>
              <span aria-hidden="true" className="text-slate-500">
                ·
              </span>
              <a
                href={parsed.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#60A5FA] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
              >
                <span>Abrir origen</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin &&
            DEFAULT_VIDEO_PRESETS.map((preset, idx) => {
              const isActive = preset.url === videoUrl;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset)}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6] ${
                    isActive
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white/10 text-slate-300 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  0{idx + 1}. {preset.duration}
                </button>
              );
            })}

          {isAdmin && (
            <button
              type="button"
              onClick={onOpenAdminVideoEditor}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/15 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:border-[#3B82F6] hover:text-[#60A5FA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B82F6]"
            >
              <Link2 className="h-3 w-3" aria-hidden="true" />
              <span>Cambiar enlace</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
