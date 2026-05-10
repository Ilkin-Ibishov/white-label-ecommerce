'use client';

// Gamma Sprint 1.3 - G12: Admin shell wraps the sidebar + header around the
// admin route content. The (admin)/layout.tsx server component delegates to
// this client shell so we can manage drawer state without bloating the layout.

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { AdminHeader } from './AdminHeader';

interface AdminShellProps {
  userEmail: string | null;
  children: React.ReactNode;
}

export function AdminShell({ userEmail, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Login page should not render the sidebar/header chrome.
  if (pathname?.startsWith('/admin/login')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-60">
        <AdminHeader
          userEmail={userEmail}
          onMenuClick={() => setSidebarOpen(true)}
          MenuIcon={Menu}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
