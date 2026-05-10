import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getCategoryBySlug,
  listProducts,
  type ProductListParams,
} from '@/lib/products/server';
import { ProductCard } from '@/components/product/ProductCard';
import { Pagination } from '@/components/storefront/Pagination';
import { CategoryFilters } from './CategoryFilters';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseInteger(value: string | undefined): number | undefined {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : undefined;
}

function parseSort(value: string | undefined): ProductListParams['sort'] {
  if (
    value === 'price_asc' ||
    value === 'price_desc' ||
    value === 'newest' ||
    value === 'featured'
  ) {
    return value;
  }
  return undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === 'all') {
    return { title: 'All products' };
  }
  const category = await getCategoryBySlug(slug);
  return {
    title: category?.name ?? 'Browse products',
    description: undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;

  const category =
    slug === 'all' || !slug ? null : await getCategoryBySlug(slug);

  const page = parseInteger(pickFirst(sp.page)) ?? 1;
  const search = pickFirst(sp.search) || undefined;
  const minPrice = parseInteger(pickFirst(sp.min_price));
  const maxPrice = parseInteger(pickFirst(sp.max_price));
  const sort = parseSort(pickFirst(sp.sort));

  const { products, meta, error } = await listProducts({
    page,
    perPage: 24,
    category: slug === 'all' ? undefined : slug,
    search,
    minPrice,
    maxPrice,
    sort,
  });

  const heading = category?.name ?? (slug === 'all' ? 'All products' : 'Browse');
  const pathname = `/category/${slug}`;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <nav className="mb-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:underline">
            Home
          </Link>{' '}
          / <span className="text-slate-700 dark:text-slate-300">{heading}</span>
        </nav>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          {heading}
        </h1>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {meta.total.toLocaleString()} product{meta.total === 1 ? '' : 's'}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <CategoryFilters />
        </aside>

        <section>
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              Could not load products: {error}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-slate-700 dark:text-slate-200">
                No products match your filters.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try adjusting search or price range.
              </p>
            </div>
          ) : (
            <div
              data-testid="product-grid"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pagination
              page={meta.page}
              totalPages={meta.total_pages}
              pathname={pathname}
              searchParams={sp}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
