import { ChevronLeft, ChevronRight } from 'lucide-react';


interface PaginationControlsProps {
  /** Current active page number. */
  currentPage: number;
  /** Total number of pages. */
  totalPages: number;
  /** Total number of records across all pages. */
  totalRecords: number;
  /** Boolean that indicates whether a previous page exists. */
  hasPrevious: boolean;
  /** Boolean that indicates whether a next page exists. */
  hasNext: boolean;
  /** Callback to navigate to a specific page. */
  onPageChange: (page: number) => void;
  /** Callback to navigate to the previous page. */
  onPrev: () => void;
  /** Callback to navigate to the next page. */
  onNext: () => void;
}

/**
 * Pagination controls for the public monitor table.
 *
 * Renders Previous/Next buttons, a page number selector with ellipsis for large
 * page ranges, and a total record counter. The page number logic calculates a
 * sliding window of page buttons around the current page.
 *
 * @component
 * @param props - The {@link PaginationControlsProps} object.
 * @returns The rendered pagination controls.
 */
export function PaginationControls({
  currentPage,
  totalPages,
  totalRecords,
  hasPrevious,
  hasNext,
  onPageChange,
  onPrev,
  onNext
}: PaginationControlsProps) {
  const getPageNumbers = () => {
    if (totalPages === 0) return [];
    if (totalPages === 1) return [1];

    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);

    const leftEllipsis = start > 2 ? ['...'] : [];
    const rightEllipsis = end < totalPages - 1 ? ['...'] : [];

    return [1, ...leftEllipsis, ...middle, ...rightEllipsis, totalPages];
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mt-8">
      <div className="text-sm text-indigo-300">
        Total records: <span className="text-white font-medium">{totalRecords}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={!hasPrevious}
          className="px-4 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white hover:bg-indigo-700/50 hover:border-indigo-600/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-800/50 flex items-center gap-2 text-sm font-medium"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>

        <div className="flex gap-1.5">
          {getPageNumbers().map((p, idx) => (
            <button
              key={idx}
              onClick={() => typeof p === 'number' && onPageChange(p)}
              disabled={p === '...'}
              className={`
                  min-w-[40px] h-10 rounded-xl text-sm font-medium transition-all duration-200
                  ${p === currentPage
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20'
                  : p === '...'
                    ? 'text-indigo-400 cursor-default'
                    : 'bg-indigo-800/50 border border-indigo-700/50 text-indigo-300 hover:bg-indigo-700/50 hover:text-white'
                }
                `}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="px-4 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white hover:bg-indigo-700/50 hover:border-indigo-600/50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-800/50 flex items-center gap-2 text-sm font-medium"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}