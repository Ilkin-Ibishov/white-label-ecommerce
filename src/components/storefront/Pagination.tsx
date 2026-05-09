import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PaginationProps {
  /** Current 1-based page. */
  page: number;
  totalPages: number;
  /** Path to link to (without query string). */
  pathname: string;
  /** Existing query parameters that should be preserved. */
  searchParams: Record<string, string | string[] | undefined>;
}

function buildHref(
  pathname: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'page' || value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function Pagination({ page, totalPages, pathname, searchParams }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const visible = getVisiblePages(page, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <PageLink
        href={buildHref(pathname, searchParams, prevPage)}
        disabled={page <= 1}
        ariaLabel="Previous page"
      >
        Prev
      </PageLink>
      {visible.map((entry, index) =>
        entry === 'ellipsis' ? (
          <span
            key={`ellipsis-${index}`}
            className="px-2 text-sm text-slate-500 dark:text-slate-400"
          >
            …
          </span>
        ) : (
          <PageLink
            key={entry}
            href={buildHref(pathname, searchParams, entry)}
            active={entry === page}
            ariaLabel={`Page ${entry}`}
          >
            {entry}
          </PageLink>
        )
      )}
      <PageLink
        href={buildHref(pathname, searchParams, nextPage)}
        disabled={page >= totalPages}
        ariaLabel="Next page"
      >
        Next
      </PageLink>
    </nav>
  );
}

interface PageLinkProps {
  href: string;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}

function PageLink({ href, active, disabled, ariaLabel, children }: PageLinkProps) {
  const className = cn(
    'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-transparent px-3 text-sm transition-colors',
    active
      ? 'border-primary bg-primary text-primary-foreground'
      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800',
    disabled && 'pointer-events-none opacity-40'
  );

  if (disabled) {
    return (
      <span className={className} aria-disabled="true" aria-label={ariaLabel}>
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={className}>
      {children}
    </Link>
  );
}

function getVisiblePages(page: number, totalPages: number): Array<number | 'ellipsis'> {
  const window = 1;
  const pages = new Set<number>();
  pages.add(1);
  pages.add(totalPages);
  for (let p = page - window; p <= page + window; p += 1) {
    if (p > 1 && p < totalPages) pages.add(p);
  }
  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result: Array<number | 'ellipsis'> = [];
  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push('ellipsis');
    }
    result.push(sorted[i]);
  }
  return result;
}

export default Pagination;
