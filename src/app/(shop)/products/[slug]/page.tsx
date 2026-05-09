import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/products/server';
import { formatPriceCents } from '@/lib/format';
import { Card } from '@/components/ui/card';
import { ProductGallery } from './ProductGallery';
import { AddToCartForm } from './AddToCartForm';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Product not found' };

  return {
    title: product.seo_title || product.title,
    description:
      product.seo_description || product.short_description || product.title,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = (product.images ?? []).slice().sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  const inventory = product.inventory_count ?? 0;
  const tracksInventory = product.inventory_track !== false;
  const inStock = !tracksInventory || inventory > 0;
  const maxQuantity = tracksInventory ? inventory : null;
  const onSale =
    typeof product.compare_at_price_cents === 'number' &&
    product.compare_at_price_cents > product.price_cents;

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        <Link href="/" className="hover:underline">
          Home
        </Link>
        {' / '}
        {product.category ? (
          <>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:underline"
            >
              {product.category.name}
            </Link>
            {' / '}
          </>
        ) : null}
        <span className="text-slate-700 dark:text-slate-300">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={images} title={product.title} />

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {product.title}
            </h1>
            {product.short_description && (
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                {product.short_description}
              </p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-slate-900 dark:text-white">
              {formatPriceCents(product.price_cents)}
            </span>
            {onSale && (
              <span className="text-lg text-slate-500 line-through dark:text-slate-400">
                {formatPriceCents(product.compare_at_price_cents ?? 0)}
              </span>
            )}
          </div>

          <p
            className={
              inStock
                ? 'text-sm font-medium text-green-700 dark:text-green-400'
                : 'text-sm font-medium text-red-600 dark:text-red-400'
            }
          >
            {inStock
              ? tracksInventory && inventory <= 5
                ? `Only ${inventory} left in stock`
                : 'In stock'
              : 'Out of stock'}
          </p>

          <AddToCartForm
            productId={product.id}
            inStock={inStock}
            maxQuantity={maxQuantity}
          />

          {product.description && (
            <Card className="p-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Description
              </h2>
              <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
                {product.description}
              </p>
            </Card>
          )}
        </div>
      </div>

      {Array.isArray(product.related_products) && product.related_products.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-white">
            You might also like
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {product.related_products.map((rp) => (
              <Link
                key={rp.id}
                href={`/products/${rp.slug}`}
                className="rounded-lg border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
                  {rp.title}
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  {formatPriceCents(rp.price_cents)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
