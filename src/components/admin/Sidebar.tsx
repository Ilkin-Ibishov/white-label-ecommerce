'use client';

// Gamma Sprint 1.3 - G12: Admin sidebar navigation.
// Desktop: persistent 240px rail. Tablet/mobile: hidden behind a hamburger
// trigger and slid in via a backdrop drawer.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  ListOrdered,
  Package,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { storeConfig } from '../../../config/store.config';

const NAV_ITEMS = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/products',
    label: 'Products',
    icon: Package,
  },
  {
    href: '/admin/categories',
    label: 'Categories',
    icon: Boxes,
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: ListOrdered,
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
] as const;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile/tablet backdrop */}
      {isOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-sm font-semibold"
            onClick={onClose}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-800 text-white">
              {storeConfig.name.charAt(0)}
            </span>
            <span className="truncate">{storeConfig.name}</span>
          </Link>
          <button
            type="button"
            className="rounded p-1 text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <SidebarLink
                  href={item.href}
                  label={item.label}
                  Icon={item.icon}
                  onNavigate={onClose}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
          <p>Sprint 1.3 — Admin</p>
          <p className="mt-1">{storeConfig.name}</p>
        </div>
      </aside>
    </>
  );
}

function SidebarLink({
  href,
  label,
  Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const active =
    pathname === href ||
    (pathname?.startsWith(`${href}/`) ?? false) ||
    (href === '/admin/dashboard' && pathname === '/admin');
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-slate-800 text-white'
          : 'text-slate-300 hover:bg-slate-900 hover:text-white'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
