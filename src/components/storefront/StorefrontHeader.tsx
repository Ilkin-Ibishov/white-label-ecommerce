import Link from 'next/link';
import { storeConfig } from '../../../config/store.config';
import { HeaderCart } from '@/components/cart/HeaderCart';

export function StorefrontHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
        >
          {storeConfig.name}
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
            Home
          </Link>
          <Link href="/category/all" className="hover:text-slate-900 dark:hover:text-white">
            Shop
          </Link>
          <Link href="/cart" className="hover:text-slate-900 dark:hover:text-white">
            Cart
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <HeaderCart />
        </div>
      </div>
    </header>
  );
}

export default StorefrontHeader;
