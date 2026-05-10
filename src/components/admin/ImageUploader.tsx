'use client';

// Gamma Sprint 1.3 - G15: Multi-image manager.
// The Sprint 1.3 backend doesn't ship a /api/admin/upload endpoint yet (the
// delegation prompt lists it as a future Alpha task), so this widget accepts
// hosted image URLs (e.g. Supabase Storage public links). It supports adding,
// reordering by primary selection, and removing entries while showing live
// previews.

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  primaryUrl: string;
  gallery: string[];
  onChange: (next: { primaryUrl: string; gallery: string[] }) => void;
  disabled?: boolean;
}

export function ImageUploader({
  primaryUrl,
  gallery,
  onChange,
  disabled,
}: ImageUploaderProps) {
  const [draft, setDraft] = useState('');

  const allImages = primaryUrl
    ? [primaryUrl, ...gallery.filter((url) => url !== primaryUrl)]
    : gallery;

  const addImage = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (allImages.includes(trimmed)) {
      setDraft('');
      return;
    }
    if (!primaryUrl) {
      onChange({ primaryUrl: trimmed, gallery });
    } else {
      onChange({ primaryUrl, gallery: [...gallery, trimmed] });
    }
    setDraft('');
  };

  const removeImage = (url: string) => {
    if (url === primaryUrl) {
      const [next, ...rest] = gallery;
      onChange({ primaryUrl: next ?? '', gallery: rest ?? [] });
    } else {
      onChange({
        primaryUrl,
        gallery: gallery.filter((g) => g !== url),
      });
    }
  };

  const setPrimary = (url: string) => {
    if (url === primaryUrl) return;
    const oldPrimary = primaryUrl;
    const nextGallery = gallery.filter((g) => g !== url);
    if (oldPrimary) nextGallery.unshift(oldPrimary);
    onChange({ primaryUrl: url, gallery: nextGallery });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://example.com/image.jpg"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={disabled}
          aria-label="Image URL"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addImage();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addImage}
          disabled={disabled || !draft.trim()}
        >
          <Plus className="mr-2 h-4 w-4" /> Add image
        </Button>
      </div>

      {allImages.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No images yet. Paste a hosted image URL above.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {allImages.map((url) => {
            const isPrimary = url === primaryUrl;
            return (
              <li
                key={url}
                className={cn(
                  'group relative overflow-hidden rounded-md border bg-slate-50 dark:bg-slate-900',
                  isPrimary
                    ? 'border-primary'
                    : 'border-slate-200 dark:border-slate-800'
                )}
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={url}
                    alt="Product image"
                    fill
                    sizes="200px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-between gap-1 p-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPrimary(url)}
                    disabled={disabled || isPrimary}
                    className={cn(
                      'inline-flex items-center gap-1 rounded px-1 py-0.5',
                      isPrimary
                        ? 'text-primary'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    )}
                  >
                    <Star
                      className={cn(
                        'h-3.5 w-3.5',
                        isPrimary ? 'fill-current' : ''
                      )}
                    />
                    {isPrimary ? 'Primary' : 'Set primary'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    disabled={disabled}
                    className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-slate-500 hover:text-red-600"
                    aria-label={`Remove ${url}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        The primary image is used for product cards and order summaries. Drag
        support and direct file upload arrive once the upload API is shipped.
      </p>
    </div>
  );
}
