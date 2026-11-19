import {useEffect, useState} from 'react';

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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const cleanSrc = src.trim();

  if (!cleanSrc || failed) {
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
      src={cleanSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg border border-white/15 bg-[#07090E] object-cover ${sizeClass}`}
    />
  );
}
