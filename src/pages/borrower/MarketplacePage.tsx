import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { EmptyState, ErrorRetryState } from '../../components/StateBlocks';
import { getResourceAvailability, useApp } from '../../context/AppContext';
import { ApiError } from '../../services/api';
import {
  fetchClubDirectory,
  fetchResourcePage,
  getPageWindow,
  type Pagination,
} from '../../services/resources';
import type {
  Club,
  Resource,
  ResourceAvailability,
  ResourceCategory,
} from '../../types/eventpool';

const ALL_CATEGORIES = 'All Categories';
const ALL_AVAILABILITY = 'All Availability';
const ALL_CLUBS = 'All Clubs';
const ALL_LOCATIONS = 'All Locations';

const CATEGORIES: Array<typeof ALL_CATEGORIES | ResourceCategory> = [
  ALL_CATEGORIES,
  'Furniture',
  'Audio Equipment',
  'Lighting',
  'Electronics',
  'Decorations',
];

const AVAILABILITIES: Array<typeof ALL_AVAILABILITY | ResourceAvailability> = [
  ALL_AVAILABILITY,
  'Available',
  'Reserved',
  'Borrowed',
  'Unavailable',
];

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 300;
const FACET_LIMIT = 100;

function describeLoadError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR' || err.status === 0) {
      return 'Cannot reach the EventPool server. Check your connection and try again.';
    }
    if (err.status >= 500) return 'The server had a problem loading resources. Please try again.';
    return err.message;
  }
  return 'Something went wrong while loading resources.';
}

const CardGridSkeleton: React.FC = () => (
  <div
    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse"
    aria-busy="true"
    aria-label="Loading resources"
  >
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="h-72 rounded-3xl bg-[#EFECE3]/80 border border-[#E5E2D9]" />
    ))}
  </div>
);

export const MarketplacePage: React.FC = () => {
  const {
    marketplaceSearch,
    setMarketplaceSearch,
    navigate,
    getClubById,
    cacheRemoteData,
  } = useApp();

  const [category, setCategory] = useState<string>(ALL_CATEGORIES);
  const [availability, setAvailability] = useState<string>(ALL_AVAILABILITY);
  const [owningClubId, setOwningClubId] = useState<string>(ALL_CLUBS);
  const [location, setLocation] = useState<string>(ALL_LOCATIONS);
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Keyword is sent to the API only after the user stops typing
  const [keyword, setKeyword] = useState(marketplaceSearch.trim());
  useEffect(() => {
    const t = window.setTimeout(() => setKeyword(marketplaceSearch.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [marketplaceSearch]);

  // Page is remembered per filter combination, so changing any filter returns to page 1
  // without firing a second request.
  const filterKey = JSON.stringify([keyword, category, availability, owningClubId, location]);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ key: filterKey, page: next });

  const [items, setItems] = useState<Resource[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  const requestSeq = useRef(0);

  // Resource list: GET /api/resources, or /api/resources/search when a keyword is set
  useEffect(() => {
    const seq = ++requestSeq.current;
    setIsLoading(true);
    setLoadError('');

    fetchResourcePage({
      q: keyword,
      category: category === ALL_CATEGORIES ? undefined : category,
      status: availability === ALL_AVAILABILITY ? undefined : availability,
      clubId: owningClubId === ALL_CLUBS ? undefined : owningClubId,
      location: location === ALL_LOCATIONS ? undefined : location,
      page,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        if (seq !== requestSeq.current) return; // a newer request superseded this one
        // Asked for a page past the end (e.g. results shrank): jump to the last page
        if (result.items.length === 0 && page > 1 && result.pagination.total > 0) {
          setPageState({ key: filterKey, page: result.pagination.totalPages });
          return;
        }
        cacheRemoteData({ resources: result.items });
        setItems(result.items);
        setPagination(result.pagination);
        setIsLoading(false);
      })
      .catch((err) => {
        if (seq !== requestSeq.current) return;
        setItems([]);
        setPagination(null);
        setLoadError(describeLoadError(err));
        setIsLoading(false);
      });
    // filterKey already encodes keyword/category/availability/owningClubId/location
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, page, reloadKey, cacheRemoteData]);

  // One-off facets: club names for the owner filter and the known locations
  useEffect(() => {
    let cancelled = false;
    fetchClubDirectory()
      .then((list) => {
        if (cancelled) return;
        const active = list.filter((c) => c.status === 'Active');
        setClubs(active);
        cacheRemoteData({ clubs: list });
      })
      .catch(() => {
        /* owner filter simply stays empty; the list itself reports its own errors */
      });
    fetchResourcePage({ limit: FACET_LIMIT })
      .then((result) => {
        if (cancelled) return;
        setLocations(
          Array.from(new Set(result.items.map((r) => r.location).filter(Boolean))).sort()
        );
      })
      .catch(() => {
        /* fall back to locations seen in the current results */
      });
    return () => {
      cancelled = true;
    };
  }, [cacheRemoteData]);

  const locationOptions = useMemo(() => {
    const seen = new Set(locations);
    items.forEach((r) => r.location && seen.add(r.location));
    if (location !== ALL_LOCATIONS) seen.add(location);
    return [ALL_LOCATIONS, ...Array.from(seen).sort()];
  }, [locations, items, location]);

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

  const clubName = useCallback(
    (id: string) => clubs.find((c) => c.id === id)?.name || getClubById(id)?.name || id,
    [clubs, getClubById]
  );

  const appliedFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; clear: () => void }> = [];
    if (marketplaceSearch.trim()) {
      chips.push({
        key: 'search',
        label: `Search: "${marketplaceSearch.trim()}"`,
        clear: () => setMarketplaceSearch(''),
      });
    }
    if (category !== ALL_CATEGORIES) {
      chips.push({ key: 'category', label: `Category: ${category}`, clear: () => setCategory(ALL_CATEGORIES) });
    }
    if (availability !== ALL_AVAILABILITY) {
      chips.push({ key: 'availability', label: `Status: ${availability}`, clear: () => setAvailability(ALL_AVAILABILITY) });
    }
    if (owningClubId !== ALL_CLUBS) {
      chips.push({ key: 'club', label: `Owner: ${clubName(owningClubId)}`, clear: () => setOwningClubId(ALL_CLUBS) });
    }
    if (location !== ALL_LOCATIONS) {
      chips.push({ key: 'location', label: `Location: ${location}`, clear: () => setLocation(ALL_LOCATIONS) });
    }
    return chips;
  }, [marketplaceSearch, category, availability, owningClubId, location, setMarketplaceSearch, clubName]);

  const clearFilters = () => {
    setMarketplaceSearch('');
    setKeyword('');
    setCategory(ALL_CATEGORIES);
    setAvailability(ALL_AVAILABILITY);
    setOwningClubId(ALL_CLUBS);
    setLocation(ALL_LOCATIONS);
  };

  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;
  const hasFilters = appliedFilters.length > 0;

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
            aria-label="Search equipment"
            placeholder="Search equipment..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-white text-sm text-[#1F3626] placeholder:text-[#737B74] border border-transparent focus:border-[#2D4A35] focus:outline-none"
          />
        </div>

        {/* Category Dropdown */}
        <div className="relative" ref={catRef}>
          <button
            type="button"
            onClick={() => setCategoryOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={categoryOpen}
            className="h-10 px-4 rounded-full bg-white text-sm font-medium text-[#1F3626] border border-[#DCD7C9] flex items-center gap-2.5 cursor-pointer whitespace-nowrap"
          >
            <span>{category}</span>
            <ChevronDown className="w-4 h-4 text-[#6B766E]" />
          </button>

          {categoryOpen && (
            <div
              role="listbox"
              className="absolute left-0 mt-2 w-52 bg-white rounded-2xl border border-[#E5E2D9] shadow-lg py-1.5 z-30"
            >
              {CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="option"
                    aria-selected={selected}
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
          <option value={ALL_CLUBS}>All Owning Clubs</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>

        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
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
          {locationOptions.map((loc) => (
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
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#6B766E] font-medium">Applied filters:</span>
          {appliedFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={f.clear}
              aria-label={`Remove filter ${f.label}`}
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
          {hasFilters ? 'Filtered Resources' : 'Available Resources'}
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-xs text-[#6B766E] tabular-nums" aria-live="polite">
            {isLoading
              ? 'Loading...'
              : loadError || total === 0
                ? 'Showing 0 resources'
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                    page * PAGE_SIZE,
                    total
                  )} of ${total} resources`}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
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
        <ErrorRetryState message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : isLoading ? (
        <CardGridSkeleton />
      ) : items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="No matching resources found"
            description="No equipment matches your currently applied filters. Try removing one or more filters to explore all shared UM club resources."
            actionLabel="Clear All Filters"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState
            title="No resources have been shared yet"
            description="Once UM clubs list their equipment, it will appear here."
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((res) => {
            const club = getClubById(res.clubId);
            return (
              <ResourceCard
                key={res.id}
                resource={res}
                club={club}
                availability={getResourceAvailability(res, club)}
                onSelect={() => navigate('resource_detail', { resourceId: res.id })}
              />
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loadError && totalPages > 1 && (
        <nav aria-label="Resource pages" className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage(Math.max(1, page - 1))}
            aria-label="Previous page"
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-[#4A554E] hover:bg-[#EFECE3] disabled:opacity-40 cursor-pointer"
          >
            &lsaquo;
          </button>
          {getPageWindow(page, totalPages).map((p, idx) =>
            p === '...' ? (
              <span key={`gap-${idx}`} className="w-6 text-center text-sm text-[#6B766E]">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                disabled={isLoading}
                onClick={() => setPage(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                className={`w-9 h-9 rounded-full text-sm font-semibold tabular-nums cursor-pointer ${
                  p === page ? 'bg-[#2D4A35] text-white' : 'text-[#4A554E] hover:bg-[#EFECE3]'
                }`}
              >
                {p}
              </button>
            )
          )}
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            aria-label="Next page"
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm text-[#4A554E] hover:bg-[#EFECE3] disabled:opacity-40 cursor-pointer"
          >
            &rsaquo;
          </button>
        </nav>
      )}
    </div>
  );
};
