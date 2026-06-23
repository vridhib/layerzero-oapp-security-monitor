import { Globe, Activity, Search, X } from 'lucide-react';
import { SUPPORTED_CHAINS } from '@/lib/constants';
import { toTitleCase } from '@/utils/helperFunctions';


interface FilterSectionProps {
  /** Currently selected chain (empty string = all chains). */
  chain: string;
  /** Currently selected health status (empty string = all). */
  isHealthy: string;
  /** Current search query. */
  searchInput: string;
  /** Callback when chain filter changes. */
  onChainChange: (value: string) => void;
  /** Callback when health filter changes. */
  onHealthChange: (value: string) => void;
  /** Callback when search input changes. */
  onSearchChange: (value: string) => void;
  /** Callback when search is submitted (Enter or button click). */
  onSearchSubmit: () => void;
  /** Callback to reset all filters. */
  onClearFilters: () => void;
  /** Boolean that indicates whether any filter is active. */
  hasFilters: boolean;
}

/**
 * Filter and search bar for the public monitor page.
 *
 * Provides three controls:
 * 1. Chain filter: dropdown to filter by supported chain.
 * 2. Health status filter: dropdown for "All", "Healthy", or "Unhealthy".
 * 3. Search input: text search for contract address or name.
 *
 * The "Clear Filters" button appears only when any filter is active and resets
 * all filters to their default values.
 *
 * @component
 * @param props - The {@link FilterSectionProps} object.
 * @returns The rendered filter section.
 *
 * @see {@link SUPPORTED_CHAINS} for the list of chains.
 * @see {@link toTitleCase} for formatting chain names.
 */
export function FilterSection({
  chain,
  isHealthy,
  searchInput,
  onChainChange,
  onHealthChange,
  onSearchChange,
  onSearchSubmit,
  onClearFilters,
  hasFilters
}: FilterSectionProps) {
  return (
    <div className="relative bg-indigo-900/40 backdrop-blur-sm border border-indigo-700/50 rounded-2xl p-5 mb-8">
      <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1/4 h-1 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />

      <div className="flex flex-wrap items-end gap-4">
        {/* Chain Filter */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-1.5">
            Chain
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
            <select
              value={chain}
              onChange={(e) => onChainChange(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer text-sm"
            >
              <option value="">All Chains</option>
              {SUPPORTED_CHAINS.map(c => (
                <option key={c} value={c} className="bg-indigo-900">{toTitleCase(c)}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Health Status Filter */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-1.5">
            Health Status
          </label>
          <div className="relative">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
            <select
              value={isHealthy}
              onChange={(e) => onHealthChange(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer text-sm"
            >
              <option value="">All Status</option>
              <option value="true">Healthy</option>
              <option value="false">Unhealthy</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-indigo-300 text-xs font-semibold tracking-wider uppercase mb-1.5">
            Search
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
              <input
                type="text"
                placeholder="Address or name..."
                value={searchInput}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-indigo-800/50 border border-indigo-700/50 text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
            <button
              onClick={onSearchSubmit}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="self-end px-4 py-2.5 rounded-xl bg-indigo-700/50 text-indigo-300 hover:text-white hover:bg-indigo-600/50 border border-indigo-600/30 transition-all duration-200 text-sm font-medium flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}