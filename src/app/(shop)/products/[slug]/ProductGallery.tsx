'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ProductImage } from '@/lib/products/types';

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const safeIndex = Math.min(activeIndex, Math.max(0, images.length - 1));
  const active = images[safeIndex];

  if (!images.length) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800">
        No image available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
        {active?.url ? (
          <Image
            src={active.url}
            alt={active.alt_text || title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
            className="object-cover"
            unoptimized
          />
        ) : null}
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2">
          {images.map((image, index) => (
            <li key={image.id ?? `${image.url}-${index}`}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1}`}
                className={cn(
                  'relative aspect-square w-full overflow-hidden rounded-md border-2 bg-slate-100 dark:bg-slate-800',
                  index === safeIndex
                    ? 'border-primary'
                    : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
                )}
              >
                <Image
                  src={image.url}
                  alt={image.alt_text || `${title} ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                  unoptimized
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProductGallery;
