import type { ReactNode } from 'react';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';
import { QueryProvider } from '@/components/providers/QueryProvider';

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-900">
        <StorefrontHeader />
        <main className="flex-1">{children}</main>
        <StorefrontFooter />
      </div>
    </QueryProvider>
  );
}
