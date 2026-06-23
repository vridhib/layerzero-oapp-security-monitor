'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { PaginatedDVNConfigs, Filters, DVNConfig } from '@/types';
import { ContractDetailModal } from './ContractDetailModal';
import { Loader2 } from 'lucide-react';
import { MonitorHeader } from './MonitorHeader';
import { FilterSection } from './FilterSection';
import { ConfigTable } from './ConfigTable';
import { PaginationControls } from './PaginationControls';


/**
 * Public monitor page for the LayerZero OApp Configuration Monitor.
 *
 * Displays a searchable, filterable table of all DVN configurations across
 * supported chains. Users can filter by chain, health status, and search by
 * contract address or name. Clicking "Details" opens a modal with granular 
 * security risk information for each configuration.
 *
 * Data is fetched from the Django backend via `/api/dvn-configs/` with
 * pagination and filter parameters. The table updates on filter changes,
 * search submission, and page navigation.
 *
 * @component
 * @returns The rendered monitor page.
 *
 * @see {@link ContractDetailModal} for the risk breakdown modal.
 * @see {@link FilterSection} for the filter/search UI.
 * @see {@link ConfigTable} for the main data table.
 */
export default function Monitor() {
  const [data, setData] = useState<PaginatedDVNConfigs>({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({
    chain: '',
    is_healthy: '',
    search: '',
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedConfig, setSelectedConfig] = useState<DVNConfig | null>(null);

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(data.count / PAGE_SIZE);

  // Fetch data whenever page or filters change
  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const params: Record<string, string> = {
          page: currentPage.toString(),
        };
        if (filters.chain) params.contract__chain = filters.chain;
        if (filters.is_healthy !== '') params.is_healthy = filters.is_healthy;
        if (filters.search) params.search = filters.search;

        const response = await api.get<PaginatedDVNConfigs>('/dvn-configs/', { params });
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch DVN configs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfigs();
  }, [currentPage, filters]);


  // Handle search submit (enter or button click)
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput }));
    setCurrentPage(1); // reset to first page on new search
  };

  // Handle filter change
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Handle clear filters
  const clearFilters = () => {
    setFilters({ chain: '', is_healthy: '', search: '' });
    setSearchInput('');
    setCurrentPage(1);
  };

  // Page navigation helpers
  const goToNext = () => data.next && setCurrentPage(currentPage + 1);
  const goToPrev = () => data.previous && setCurrentPage(currentPage - 1);


  // UI rendering
  if (loading && data.results.length === 0) {
    return (
      <div className="min-h-screen bg-indigo-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-indigo-950 text-white p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <MonitorHeader />

        {/* Filters and Search */}
        <FilterSection
          chain={filters.chain}
          isHealthy={filters.is_healthy}
          searchInput={searchInput}
          onChainChange={(value) => handleFilterChange('chain', value)}
          onHealthChange={(value) => handleFilterChange('is_healthy', value)}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearch}
          onClearFilters={clearFilters}
          hasFilters={!!(filters.chain || filters.is_healthy || filters.search)}
        />

        {/* Table */}
        <ConfigTable
          configs={data.results}
          onViewDetails={setSelectedConfig}
        />
        {selectedConfig && (
          <ContractDetailModal config={selectedConfig} onClose={() => setSelectedConfig(null)} />
        )}

        {/* Pagination */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={data.count}
          hasPrevious={!!data.previous}
          hasNext={!!data.next}
          onPageChange={setCurrentPage}
          onPrev={goToPrev}
          onNext={goToNext}
        />
      </div>
    </main>
  );
}