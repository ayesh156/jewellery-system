import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '../../utils/cn';

const PAGE_SIZE_OPTIONS = [6, 12, 18, 24] as const;

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [...PAGE_SIZE_OPTIONS],
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate visible page numbers with ellipsis
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [1];

    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3',
        className
      )}
    >
      {/* Left: Items info + page size */}
      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <span>
          {totalItems > 0 ? (
            <>
              <span className="font-medium text-slate-700 dark:text-slate-300">{startItem}-{endItem}</span>
              {' '}of{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">{totalItems}</span>
            </>
          ) : (
            'No items'
          )}
        </span>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-0.5">
          {pageSizeOptions.map((size) => (
            <button
              key={size}
              onClick={() => {
                onPageSizeChange(size);
                onPageChange(1);
              }}
              className={cn(
                'min-w-[32px] h-7 px-2 rounded-md text-xs font-medium transition-all duration-200',
                pageSize === size
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            currentPage === 1
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
          )}
          aria-label="First page"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            currentPage === 1
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
          )}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {getPageNumbers().map((page, idx) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1 text-slate-400 dark:text-slate-500 select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
              )}
            >
              {page}
            </button>
          )
        )}

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            currentPage === totalPages
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
          )}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            currentPage === totalPages
              ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
          )}
          aria-label="Last page"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
