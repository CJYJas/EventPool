import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Plus, RefreshCw, Search } from 'lucide-react';
import { AccessRestricted } from '../components/AccessRestricted';
import { Button } from '../components/Button';
import { CreateClubAccountModal } from '../components/CreateClubAccountModal';
import { PageHeader } from '../components/PageHeader';
import { EmptyState, ErrorRetryState, LoadingSkeleton } from '../components/StateBlocks';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import { ApiError } from '../services/api';
import type { CreatedClub } from '../services/adminClubs';
import { fetchClubDirectory } from '../services/resources';
import type { Club } from '../types/eventpool';

type StatusFilter = 'All' | 'Active' | 'Inactive';

function describeLoadError(err: unknown): string {
  if (err instanceof ApiError && (err.code === 'NETWORK_ERROR' || err.status === 0)) {
    return 'Cannot reach the EventPool server. Check your connection and try again.';
  }
  if (err instanceof ApiError && err.status === 403) return 'Only administrator accounts can view this page.';
  return 'Could not load the club list. Please try again.';
}

const AdminClubsView: React.FC = () => {
  const { cacheRemoteData } = useApp();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [createdNotice, setCreatedNotice] = useState<CreatedClub | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const list = await fetchClubDirectory();
      setClubs(list);
      cacheRemoteData({ clubs: list });
    } catch (err) {
      setClubs([]);
      setLoadError(describeLoadError(err));
    } finally {
      setIsLoading(false);
    }
  }, [cacheRemoteData]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const active = clubs.filter((c) => c.status === 'Active').length;
    return { total: clubs.length, active, inactive: clubs.length - active };
  }, [clubs]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clubs
      .filter((c) => statusFilter === 'All' || c.status === statusFilter)
      .filter(
        (c) =>
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.contactEmail.toLowerCase().includes(q) ||
          c.picPhone.toLowerCase().includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clubs, search, statusFilter]);

  const handleCreated = (club: CreatedClub) => {
    setCreateOpen(false);
    setCreatedNotice(club);
    load(); // the list comes from the server, not from local guesses
  };

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb="Home / Admin / Clubs"
        title="Club Accounts"
        subtitle="View registered UM student clubs and create new club accounts."
        actions={
          <Button size="lg" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Club Account
          </Button>
        }
      />

      {createdNotice && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-[#B6E8B8] bg-[#EEF7EE] p-4 text-sm text-[#175B2B]"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">{createdNotice.clubName} was created.</p>
            <p className="text-xs mt-0.5">
              The representative can now log in with {createdNotice.contactEmail}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreatedNotice(null)}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total clubs', value: totals.total },
          { label: 'Active', value: totals.active },
          { label: 'Inactive', value: totals.inactive },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
            <p className="text-xs font-medium text-[#6B766E]">{kpi.label}</p>
            <p className="text-2xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
              {isLoading ? '-' : kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#EAE6DA] rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737B74] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search clubs"
            placeholder="Search by name, email or phone..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white text-sm text-[#1F3626] placeholder:text-[#737B74] border border-transparent focus:border-[#2D4A35] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-[#DCD7C9]" role="group" aria-label="Filter by status">
          {(['All', 'Active', 'Inactive'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              aria-pressed={statusFilter === tab}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === tab ? 'bg-[#2D4A35] text-white' : 'text-[#4A554E] hover:text-[#1F3626]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EFECE3] flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1F3626]">Registered Clubs</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B766E] tabular-nums" aria-live="polite">
              {isLoading ? 'Loading...' : `Showing ${visible.length} of ${clubs.length} clubs`}
            </span>
            <button
              type="button"
              onClick={load}
              aria-label="Refresh club list"
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#D4D1C7] text-xs font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loadError ? (
          <div className="p-6">
            <ErrorRetryState message={loadError} onRetry={load} />
          </div>
        ) : isLoading ? (
          <div className="p-6">
            <LoadingSkeleton rows={4} />
          </div>
        ) : clubs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No clubs registered yet"
              description="Create the first club account so a representative can log in."
              actionLabel="Create Club Account"
              onAction={() => setCreateOpen(true)}
            />
          </div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No matching clubs"
              description="Try clearing the search or switching the status filter."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearch('');
                setStatusFilter('All');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-[#6B766E] border-b border-[#EFECE3]">
                  <th scope="col" className="py-3 px-6 font-semibold">Club</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Contact email</th>
                  <th scope="col" className="py-3 px-4 font-semibold">PIC contact</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((club) => (
                  <tr key={club.id} className="border-b border-[#F4F1E8] last:border-0 align-top">
                    <td className="py-3.5 px-6">
                      <p className="text-sm font-semibold text-[#1F3626]">{club.name}</p>
                      {club.description && (
                        <p className="text-xs text-[#6B766E] mt-0.5 line-clamp-2 max-w-md">{club.description}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-[#3D4B41] break-all">{club.contactEmail || '-'}</td>
                    <td className="py-3.5 px-4 text-sm text-[#3D4B41] tabular-nums whitespace-nowrap">
                      {club.picPhone || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={club.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CreateClubAccountModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
    </div>
  );
};

/** Admin-only. Anyone else gets the restricted screen, and none of the admin UI or requests run. */
export const AdminClubsPage: React.FC = () => {
  const { currentUser, navigate } = useApp();
  if (currentUser?.role !== 'admin') {
    return <AccessRestricted onHome={() => navigate('home')} />;
  }
  return <AdminClubsView />;
};
