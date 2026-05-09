'use client';

import { useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SORT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to high' },
  { value: 'price_desc', label: 'Price: High to low' },
];

export function CategoryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  // Resetting `key` on the form whenever the URL changes lets us use uncontrolled
  // inputs (defaultValue) without `useEffect` syncing state — keeps us clear of
  // the React 19 `react-hooks/set-state-in-effect` rule.
  const formKey = searchParams.toString();

  const initialSearch = searchParams.get('search') ?? '';
  const initialMin = searchParams.get('min_price') ?? '';
  const initialMax = searchParams.get('max_price') ?? '';
  const initialSort = searchParams.get('sort') ?? 'featured';

  const navigateWith = (next: URLSearchParams) => {
    next.delete('page');
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const buildFromForm = (form: HTMLFormElement, overrides?: Record<string, string>) => {
    const data = new FormData(form);
    const next = new URLSearchParams();
    const search = String(data.get('search') ?? '').trim();
    const minPrice = String(data.get('min_price') ?? '').trim();
    const maxPrice = String(data.get('max_price') ?? '').trim();
    const sort = String(data.get('sort') ?? 'featured');
    if (search) next.set('search', search);
    if (minPrice) next.set('min_price', minPrice);
    if (maxPrice) next.set('max_price', maxPrice);
    const sortValue = overrides?.sort ?? sort;
    if (sortValue && sortValue !== 'featured') next.set('sort', sortValue);
    return next;
  };

  return (
    <form
      key={formKey}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
      onSubmit={(event) => {
        event.preventDefault();
        navigateWith(buildFromForm(event.currentTarget));
      }}
      onReset={(event) => {
        event.preventDefault();
        startTransition(() => {
          router.push(pathname);
        });
      }}
    >
      <div>
        <Label htmlFor="filter-search" className="mb-1 inline-block">
          Search
        </Label>
        <Input
          id="filter-search"
          name="search"
          type="search"
          placeholder="Search products"
          defaultValue={initialSearch}
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700 dark:text-slate-200">
          Price (cents)
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="filter-min-price" className="text-xs">
              Min
            </Label>
            <Input
              id="filter-min-price"
              name="min_price"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="0"
              defaultValue={initialMin}
            />
          </div>
          <div>
            <Label htmlFor="filter-max-price" className="text-xs">
              Max
            </Label>
            <Input
              id="filter-max-price"
              name="max_price"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="999999"
              defaultValue={initialMax}
            />
          </div>
        </div>
      </fieldset>

      <div>
        <Label htmlFor="filter-sort" className="mb-1 inline-block">
          Sort by
        </Label>
        <select
          id="filter-sort"
          name="sort"
          defaultValue={initialSort}
          onChange={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            navigateWith(buildFromForm(form, { sort: event.currentTarget.value }));
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? 'Applying…' : 'Apply'}
        </Button>
        <Button type="reset" variant="outline" disabled={pending}>
          Reset
        </Button>
      </div>
    </form>
  );
}

export default CategoryFilters;
