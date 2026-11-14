import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  FilterX,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { ResourceCard } from '../../components/ResourceCard';
import {
  EmptyState,
  ErrorRetryState,
  LoadingSkeleton,
} from '../../components/StateBlocks';
import { getResourceAvailability, useApp } from '../../context/AppContext';
import type { ResourceAvailability, ResourceCategory } from '../../types/eventpool';

const CATEGORIES: Array<'All Categories' | ResourceCategory> = [
  'All Categories',
  'Furniture',
  'Audio Equipment',
  'Lighting',
  'Electronics',
  'Decorations',
];

const AVAILABILITIES: Array<'All Availability' | ResourceAvailability> = [
  'All Availability',
  'Available',
  'Reserved',
  'Borrowed',
  'Unavailable',
];

const PAGE_SIZE = 8;

export const MarketplacePage: React.FC = () => {
  const {
    clubs,
    resources,
    marketplaceSearch,
    setMarketplaceSearch,
    navigate,
    getClubById,
  } = useApp();

  const [category, setCategory] = useState<'All Categories' | ResourceCategory>(
    'All Categories'
  );
  const [availability, setAvailability] = useState<
    'All Availability' | ResourceAvailability
  >('All Availability');
  const [owningClubId, setOwningClubId] = useState<string>('All Clubs');
  const [location, setLocation] = useState<string>('All Locations');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const handleRefreshResources = () => {
    setLoadError('');
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
    }, 220);
  };

  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const activeResources = useMemo(
    () => resources.filter((r) => !r.archived),
    [resources]
  );

  const uniqueLocations = useMemo(() => {
    const locs = Array.from(new Set(activeResources.map((r) => r.location)));
    return ['All Locations', ...locs];
  }, [activeResources]);

  const filtered = useMemo(() => {
    const q = marketplaceSearch.trim().toLowerCase();
    return activeResources.filter((res) => {
      const club = getClubById(res.clubId);
      const status = getResourceAvailability(res, club);

      if (category !== 'All Categories' && res.category !== category) {
        return false;
      }
      if (availability !== 'All Availability' && status !== availability) {
        return false;
      }
      if (owningClubId !== 'All Clubs' && res.clubId !== owningClubId) {
        return false;
      }
      if (location !== 'All Locations' && res.location !== location) {
        return false;
      }
      if (!q) return true;
      return (
        res.name.toLowerCase().includes(q) ||
        res.category.toLowerCase().includes(q) ||
        res.location.toLowerCase().includes(q) ||
        (club?.acronym.toLowerCase().includes(q) ?? false) ||
        (club?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [
    activeResources,
    marketplaceSearch,
    category,
    availability,
    owningClubId,
    location,
    getClubById,
  ]);

  const appliedFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (marketplaceSearch.trim()) {
      chips.push({
        key: 'search',
        label: `Search: "${marketplaceSearch.trim()}"`,
        clear: () => setMarketplaceSearch(''),
      });
    }
    if (category !== 'All Categories') {
      chips.push({
        key: 'category',
        label: `Category: ${category}`,
        clear: () => setCategory('All Categories'),
      });
    }
    if (availability !== 'All Availability') {
      chips.push({
        key: 'availability',
        label: `Status: ${availability}`,
        clear: () => setAvailability('All Availability'),
      });
    }
    if (owningClubId !== 'All Clubs') {
      const club = getClubById(owningClubId);
      chips.push({
        key: 'club',
        label: `Owner: ${club?.acronym || owningClubId}`,
        clear: () => setOwningClubId('All Clubs'),
      });
    }
    if (location !== 'All Locations') {
      chips.push({
        key: 'location',
        label: `Location: ${location}`,
        clear: () => setLocation('All Locations'),
      });
    }
    return chips;
  }, [
    marketplaceSearch,
    category,
    availability,
    owningClubId,
    location,
    setMarketplaceSearch,
    getClubById,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [marketplaceSearch, category, availability, owningClubId, location]);

  const clearFilters = () => {
    setMarketplaceSearch('');
    setCategory('All Categories');
    setAvailability('All Availability');
    setOwningClubId('All Clubs');
    setLocation('All Locations');
    setPage(1);
  };

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb="Home / Marketplace"
        title="Browse Resources"
        subtitle="Find reusable event equipment shared by UM student clubs"
      />

      {/* Filter Bar */}
      <div className="bg-[#E7E3D8] rounded-2xl p-3.5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#737B74] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={marketplaceSearch}
            onChange={(e) => setMarketplaceSearch(e.target.value)}
            placeholder="Search equipment..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-white text-sm text-[#1F3626] placeholder:text-[#737B74] border border-transparent focus:border-[#2D4A35] focus:outline-none"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative" ref={catRef}>
          <button
            type="button"
            onClick={() => setCategoryOpen((v) => !v)}
            className="h-10 px-4 rounded-full bg-white text-sm font-medium text-[#1F3626] border border-[#DCD7C9] flex items-center gap-2.5 cursor-pointer whitespace-nowrap"
          >
            <span>{category}</span>
            <ChevronDown className="w-4 h-4 text-[#6B766E]" />
          </button>

          {categoryOpen && (
            <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl border border-[#E5E2D9] shadow-lg py-1.5 z-30">
              {CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setCategoryOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between cursor-pointer ${
                      selected
                        ? 'bg-[#DCE7D8] text-[#1F3626] font-semibold'
                        : 'text-[#3D4B41] hover:bg-[#FAF8F2]'
                    }`}
                  >
                    <span>{cat}</span>
                    {selected && <Check className="w-4 h-4 text-[#2D4A35]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Owning Club Filter */}
        <select
          value={owningClubId}
          onChange={(e) => setOwningClubId(e.target.value)}
          aria-label="Filter by owning club"
          className="h-10 px-4 rounded-full bg-white text-sm font-medium text-[#1F3626] border border-[#DCD7C9] focus:border-[#2D4A35] focus:outline-none max-w-[190px] cursor-pointer"
        >
          <option value="All Clubs">All Owning Clubs</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.acronym}
            </option>
          ))}
        </select>

        <select
          value={availability}
          onChange={(e) =>
            setAvailability(
              e.target.value as 'All Availability' | ResourceAvailability
            )
          }
          aria-label="Filter by availability"
          className="h-10 px-4 rounded-full bg-white text-sm font-medium text-[#1F3626] border border-[#DCD7C9] focus:border-[#2D4A35] focus:outline-none cursor-pointer"
        >
          {AVAILABILITIES.map((av) => (
            <option key={av} value={av}>
              {av}
            </option>
          ))}
        </select>

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          aria-label="Filter by location"
          className="h-10 px-4 rounded-full bg-white text-sm font-medium text-[#1F3626] border border-[#DCD7C9] focus:border-[#2D4A35] focus:outline-none max-w-[200px] cursor-pointer"
        >
          {uniqueLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={clearFilters}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FilterX className="w-4 h-4" />
          Clear Filters
        </button>
      </div>

      {/* Applied Filters Summary */}
      {appliedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#6B766E] font-medium">Applied filters:</span>
          {appliedFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={f.clear}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE7D8] text-[#1F3626] font-medium hover:bg-[#CBDAC5] cursor-pointer"
            >
              <span>{f.label}</span>
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      )}

      {/* Results Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-[#1F3626]">
          {appliedFilters.length > 0 ? 'Filtered Resources' : 'Available Resources'}
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-xs text-[#6B766E] tabular-nums">
            {filtered.length === 0
              ? 'Showing 0 resources'
              : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                  safePage * PAGE_SIZE,
                  filtered.length
                )} of ${filtered.length} resources`}
          </p>
          <button
            type="button"
            onClick={handleRefreshResources}
            aria-label="Refresh resources"
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full border border-[#D4D1C7] bg-white text-xs font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Resource Cards Grid or Loading / Error / No-Results State */}
      {loadError ? (
        <ErrorRetryState
          message={loadError}
          onRetry={handleRefreshResources}
        />
      ) : isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : pageItems.length === 0 ? (
        <EmptyState
          title="No matching resources found"
          description="No equipment matches your currently applied filters. Try removing one or more filters to explore all shared UM club resources."
          actionLabel="Clear All Filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pageItems.map((res) => {
            const club = getClubById(res.clubId);
            const status = getResourceAvailability(res, club);
            return (
              <ResourceCard
                key={res.id}
                resource={res}
                club={club}
                availability={status}
                onSelect={() =>
                  navigate('resource_detail', { resourceId: res.id })
                }
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-[#4A554E] hover:bg-[#EFECE3] disabled:opacity-40 cursor-pointer"
          >
            &lsaquo;
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(
            (pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                className={`w-9 h-9 rounded-full text-sm font-semibold tabular-nums cursor-pointer ${
                  pageNum === safePage
                    ? 'bg-[#2D4A35] text-white'
                    : 'text-[#4A554E] hover:bg-[#EFECE3]'
                }`}
              >
                {pageNum}
              </button>
            )
          )}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-[#4A554E] hover:bg-[#EFECE3] disabled:opacity-40 cursor-pointer"
          >
            &rsaquo;
          </button>
        </div>
      )}
    </div>
  );
};
