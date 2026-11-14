import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  Edit3,
  Plus,
  Power,
  RefreshCw,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Button } from '../components/Button';
import {
  CreateClubModal,
  DeactivateClubModal,
  EditClubModal,
} from '../components/ClubAdminModals';
import { ClubLogo } from '../components/ClubLogo';
import { PageHeader } from '../components/PageHeader';
import {
  EmptyState,
  ErrorRetryState,
  LoadingSkeleton,
} from '../components/StateBlocks';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import type { Club } from '../types/eventpool';

export const ClubsPage: React.FC = () => {
  const { clubs, resources, requests, currentUser, navigate, reactivateClub } =
    useApp();

  const isAdmin = currentUser?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>(
    'All'
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [deactivatingClub, setDeactivatingClub] = useState<Club | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const handleRefreshClubs = () => {
    setLoadError('');
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
    }, 220);
  };

  const clubStats = useMemo(() => {
    const map = new Map<
      string,
      {
        resourcesCount: number;
        totalUnits: number;
        borrowingRequestsCount: number;
        pendingRequestsCount: number;
        completedRequestsCount: number;
      }
    >();

    clubs.forEach((club) => {
      const clubResources = resources.filter(
        (r) => r.clubId === club.id && !r.archived
      );
      const clubRequests = requests.filter(
        (req) => req.ownerClubId === club.id || req.borrowerClubId === club.id
      );
      map.set(club.id, {
        resourcesCount: clubResources.length,
        totalUnits: clubResources.reduce((sum, r) => sum + r.totalUnits, 0),
        borrowingRequestsCount: clubRequests.length,
        pendingRequestsCount: clubRequests.filter((r) => r.status === 'Pending')
          .length,
        completedRequestsCount: clubRequests.filter(
          (r) => r.status === 'Completed'
        ).length,
      });
    });

    return map;
  }, [clubs, resources, requests]);

  const totals = useMemo(() => {
    const totalClubs = clubs.length;
    const activeClubs = clubs.filter((c) => c.status === 'Active').length;
    const inactiveClubs = clubs.filter((c) => c.status === 'Inactive').length;
    const totalResources = resources.filter((r) => !r.archived).length;
    const totalBorrowing = requests.length;
    const totalPending = requests.filter((r) => r.status === 'Pending').length;
    const totalCompleted = requests.filter((r) => r.status === 'Completed').length;
    return {
      totalClubs,
      activeClubs,
      inactiveClubs,
      totalResources,
      totalBorrowing,
      totalPending,
      totalCompleted,
    };
  }, [clubs, resources, requests]);

  const filteredClubs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clubs.filter((club) => {
      if (statusFilter !== 'All' && club.status !== statusFilter) return false;
      if (!q) return true;
      return (
        club.name.toLowerCase().includes(q) ||
        club.acronym.toLowerCase().includes(q) ||
        club.representativeName.toLowerCase().includes(q) ||
        club.representativeEmail.toLowerCase().includes(q) ||
        club.storageLocation.toLowerCase().includes(q)
      );
    });
  }, [clubs, searchQuery, statusFilter]);

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb="Home / Clubs"
        title="UM Student Clubs"
        subtitle="Browse registered clubs, inspect their shared resources and request history, or manage club accounts."
        actions={
          isAdmin ? (
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Club Account
            </Button>
          ) : undefined
        }
      />

      {/* Platform Summary KPIs: Total/Active Clubs, Resources, Borrowing, Pending, Completed */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">
            Active / Total Clubs
          </p>
          <p className="text-2xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {totals.activeClubs}/{totals.totalClubs}{' '}
            <span className="text-base font-semibold text-[#2D4A35]">Active</span>
          </p>
          <p className="text-xs text-[#6B766E] mt-1 tabular-nums">
            {totals.inactiveClubs} inactive
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">Resources</p>
          <p className="text-2xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {totals.totalResources}
          </p>
          <p className="text-xs text-[#6B766E] mt-1">Active listings</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">Borrowing Requests</p>
          <p className="text-2xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {totals.totalBorrowing}
          </p>
          <p className="text-xs text-[#6B766E] mt-1">All recorded requests</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">Pending Requests</p>
          <p className="text-2xl font-bold text-[#7F4F16] mt-1.5 tabular-nums">
            {totals.totalPending}
          </p>
          <p className="text-xs text-[#6B766E] mt-1">Awaiting approval</p>
        </div>

        <div className="bg-[#E3ECE0] rounded-2xl border border-[#C9DBC4] p-5 col-span-2 sm:col-span-1">
          <p className="text-xs font-medium text-[#2D4A35]">Completed Requests</p>
          <p className="text-2xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {totals.totalCompleted}
          </p>
          <p className="text-xs text-[#2D4A35] mt-1">Verified returns</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#EAE6DA] rounded-2xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#737B74] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clubs, representatives, email, or location..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-white text-sm text-[#1F3626] placeholder:text-[#737B74] border border-transparent focus:border-[#2D4A35] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-xl border border-[#DCD7C9]">
          {(['All', 'Active', 'Inactive'] as const).map((tab) => {
            const count =
              tab === 'All'
                ? totals.totalClubs
                : tab === 'Active'
                ? totals.activeClubs
                : totals.inactiveClubs;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  statusFilter === tab
                    ? 'bg-[#2D4A35] text-white'
                    : 'text-[#4A554E] hover:text-[#1F3626]'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Club List */}
      <div className="bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EFECE3] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1F3626]">Club List</h2>
            <p className="text-xs text-[#6B766E]">
              Click any club row to inspect its resources, borrowing requests, pending requests, and completed requests.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B766E] tabular-nums">
              Showing {filteredClubs.length} of {clubs.length} clubs
            </span>
            <button
              type="button"
              onClick={handleRefreshClubs}
              aria-label="Refresh club directory"
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-[#D4D1C7] text-xs font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loadError ? (
          <div className="p-6">
            <ErrorRetryState message={loadError} onRetry={handleRefreshClubs} />
          </div>
        ) : isLoading ? (
          <div className="p-6">
            <LoadingSkeleton rows={4} />
          </div>
        ) : filteredClubs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No matching clubs found"
              description="Try clearing your search or switching the status filter."
              actionLabel="Reset Filters"
              onAction={() => {
                setSearchQuery('');
                setStatusFilter('All');
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFECE3] bg-[#FAF8F2] text-[11px] font-semibold uppercase tracking-wider text-[#6B766E]">
                  <th className="py-3.5 px-6">Club &amp; Representative</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Resources</th>
                  <th className="py-3.5 px-4 text-right">Borrowing Req.</th>
                  <th className="py-3.5 px-4 text-right">Pending</th>
                  <th className="py-3.5 px-4 text-right">Completed</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE6] text-sm">
                {filteredClubs.map((club) => {
                  const st = clubStats.get(club.id) || {
                    resourcesCount: 0,
                    totalUnits: 0,
                    borrowingRequestsCount: 0,
                    pendingRequestsCount: 0,
                    completedRequestsCount: 0,
                  };

                  return (
                    <tr
                      key={club.id}
                      onClick={() =>
                        navigate('club_detail', { clubId: club.id })
                      }
                      className={`group hover:bg-[#FAF8F2] transition-colors cursor-pointer ${
                        club.status === 'Inactive' ? 'bg-[#FAF9F6]' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-3">
                          <ClubLogo club={club} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-[#1F3626] group-hover:text-[#2D4A35] flex items-center gap-1.5">
                              <span>{club.acronym}</span>
                              <span className="text-xs font-normal text-[#6B766E] truncate max-w-[240px]">
                                · {club.name}
                              </span>
                            </p>
                            <p className="text-xs text-[#6B766E] mt-0.5">
                              {club.representativeName} · {club.representativeEmail}
                            </p>
                            <p className="text-[11px] text-[#858F87] mt-0.5">
                              {club.storageLocation}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <StatusBadge status={club.status} />
                      </td>

                      <td className="py-4 px-4 text-right tabular-nums">
                        <span className="font-semibold text-[#1F3626]">
                          {st.resourcesCount}
                        </span>
                        <span className="block text-[11px] text-[#6B766E]">
                          {st.totalUnits} units
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-[#1F3626] tabular-nums">
                        {st.borrowingRequestsCount}
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-[#7F4F16] tabular-nums">
                        {st.pendingRequestsCount}
                      </td>

                      <td className="py-4 px-4 text-right font-semibold text-[#23452C] tabular-nums">
                        {st.completedRequestsCount}
                      </td>

                      <td
                        className="py-4 px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              navigate('club_detail', { clubId: club.id })
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4D1C7] text-xs font-medium text-[#1F3626] hover:bg-[#F2EFE6] cursor-pointer whitespace-nowrap"
                          >
                            View
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingClub(club)}
                                title="Edit club details"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D4D1C7] text-xs font-medium text-[#3D4B41] hover:bg-[#F2EFE6] cursor-pointer whitespace-nowrap"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit
                              </button>

                              {club.status === 'Active' ? (
                                <button
                                  type="button"
                                  onClick={() => setDeactivatingClub(club)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#F0B7B4] text-xs font-medium text-[#8C2220] hover:bg-[#FDF2F2] cursor-pointer whitespace-nowrap"
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => reactivateClub(club.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#B6E8B8] text-xs font-medium text-[#175B2B] hover:bg-[#EEF9EE] cursor-pointer whitespace-nowrap"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  Reactivate
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateClubModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditClubModal club={editingClub} onClose={() => setEditingClub(null)} />
      <DeactivateClubModal
        club={deactivatingClub}
        pendingCount={
          deactivatingClub
            ? clubStats.get(deactivatingClub.id)?.pendingRequestsCount || 0
            : 0
        }
        onClose={() => setDeactivatingClub(null)}
      />
    </div>
  );
};
