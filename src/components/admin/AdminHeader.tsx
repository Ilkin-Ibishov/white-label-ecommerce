'use client';

// Gamma Sprint 1.3 - G12: Admin header. Hosts hamburger trigger (mobile),
// breadcrumb-style title, current user email, and logout.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { adminLogout } from '@/lib/admin/api';

interface AdminHeaderProps {
  userEmail: string | null;
  onMenuClick: () => void;
  MenuIcon: React.ComponentType<{ className?: string }>;
}

export function AdminHeader({
  userEmail,
  onMenuClick,
  MenuIcon,
}: AdminHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await adminLogout();
      toast.success('Signed out');
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Logout failed');
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        aria-label="Open navigation"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <h1 className="text-base font-semibold text-slate-900 dark:text-white">
        Admin
      </h1>

      <div className="ml-auto flex items-center gap-3">
        {userEmail ? (
          <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:inline">
            {userEmail}
          </span>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {loggingOut ? 'Signing out…' : 'Logout'}
        </Button>
      </div>
    </header>
  );
}
