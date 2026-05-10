import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/format';
import type { ProductSummary } from '@/lib/products/types';

interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.image_url;
  const onSale = product.is_on_sale || (product.original_price && product.original_price > product.price);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name_en}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
        {onSale && (
          <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
            Sale
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
          {product.name_en}
        </p>
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-base font-semibold text-slate-900 dark:text-white">
            {product.price} AZN
          </span>
          {onSale && product.original_price && (
            <span className="text-xs text-slate-500 line-through dark:text-slate-400">
              {product.original_price} AZN
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
