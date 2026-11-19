import {useState} from 'react';
import {normalizeImageUrl} from '../data/externalMedia';

interface BrandLogoProps {
  src: string;
  alt: string;
  sizeClass?: string;
}

export function BrandLogo({
  src,
  alt,
  sizeClass = 'h-9 w-9',
}: BrandLogoProps) {
  const [attempt, setAttempt] = useState<{
    url: string;
    stage: 'no-referrer' | 'default-referrer' | 'failed';
  }>({url: '', stage: 'no-referrer'});

  const cleanSrc = normalizeImageUrl(src);
  const currentStage =
    attempt.url === cleanSrc ? attempt.stage : 'no-referrer';

  if (!cleanSrc || currentStage === 'failed') {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#2563EB] font-display text-sm font-bold tracking-tight text-white ${sizeClass}`}
      >
        N
      </span>
    );
  }

  return (
    <img
      key={`${cleanSrc}-${currentStage}`}
      src={cleanSrc}
      alt={alt}
      referrerPolicy={
        currentStage === 'no-referrer'
          ? 'no-referrer'
          : 'strict-origin-when-cross-origin'
      }
      onError={() => {
        if (currentStage === 'no-referrer') {
          setAttempt({url: cleanSrc, stage: 'default-referrer'});
        } else {
          setAttempt({url: cleanSrc, stage: 'failed'});
        }
      }}
      className={`shrink-0 rounded-lg border border-white/15 bg-[#07090E] object-cover ${sizeClass}`}
    />
  );
}
