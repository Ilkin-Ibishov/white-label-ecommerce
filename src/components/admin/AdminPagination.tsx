'use client';

// Gamma Sprint 1.3 - Reusable pagination control for admin tables.

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total?: number;
  perPage?: number;
}

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
  total,
  perPage,
}: AdminPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const canPrev = page > 1;
  const canNext = page < safeTotalPages;

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-3 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:flex-row">
      <div>
        {typeof total === 'number' && typeof perPage === 'number' ? (
          <span>
            Showing{' '}
            <strong>
              {(page - 1) * perPage + 1}–
              {Math.min(page * perPage, total)}
            </strong>{' '}
            of <strong>{total}</strong>
          </span>
        ) : (
          <span>
            Page <strong>{page}</strong> of <strong>{safeTotalPages}</strong>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
