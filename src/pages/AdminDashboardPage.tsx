import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Edit3,
  Plus,
  Power,
  RotateCcw,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import { Button } from '../components/Button';
import {
  CreateClubModal,
  DeactivateClubModal,
  EditClubModal,
} from '../components/ClubAdminModals';
import { ClubLogo } from '../components/ClubLogo';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useApp } from '../context/AppContext';
import type { Club } from '../types/eventpool';

export const AdminDashboardPage: React.FC = () => {
  const {
    currentUser,
    clubs,
    resources,
    requests,
    accessRequests,
    navigate,
    reactivateClub,
    processAccessRequest,
    getClubById,
    getResourceById,
  } = useApp();

  if (currentUser?.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#1F3626]">Access Restricted</h2>
        <p className="text-sm text-[#4A554E] leading-relaxed">
          The Admin Dashboard is strictly reserved for Universiti Malaya System Administrators. Club accounts cannot access this portal.
        </p>
        <div className="pt-3">
          <Button onClick={() => navigate('home')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  const [requestFilter, setRequestFilter] = useState<
    'All' | 'Pending' | 'Active' | 'Completed'
  >('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [deactivatingClub, setDeactivatingClub] = useState<Club | null>(null);

  const metrics = useMemo(() => {
    const totalClubs = clubs.length;
    const activeClubs = clubs.filter((c) => c.status === 'Active').length;
    const inactiveClubs = clubs.filter((c) => c.status === 'Inactive').length;
    const activeResources = resources.filter((r) => !r.archived);
    const totalUnits = activeResources.reduce((s, r) => s + r.totalUnits, 0);
    const totalBorrowing = requests.length;
    const pendingRequests = requests.filter((r) => r.status === 'Pending').length;
    const completedRequests = requests.filter(
      (r) => r.status === 'Completed'
    ).length;

    return {
      totalClubs,
      activeClubs,
      inactiveClubs,
      totalListings: activeResources.length,
      totalUnits,
      totalBorrowing,
      pendingRequests,
      completedRequests,
    };
  }, [clubs, resources, requests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (requestFilter === 'All') return true;
      if (requestFilter === 'Pending') return req.status === 'Pending';
      if (requestFilter === 'Completed') return req.status === 'Completed';
      return ['Approved', 'Borrowed', 'Return Pending'].includes(req.status);
    });
  }, [requests, requestFilter]);

  const pendingAccess = useMemo(
    () => accessRequests.filter((a) => a.status === 'Pending'),
    [accessRequests]
  );

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <PageHeader
        breadcrumb="Home / Admin Dashboard"
        title="Admin Dashboard"
        subtitle="Universiti Malaya platform overview across total & active clubs, shared resources, and borrowing requests."
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('clubs')}>
              <Users className="w-4 h-4 text-[#2D4A35]" />
              All Clubs ({metrics.totalClubs})
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4" />
              Create Club Account
            </Button>
          </>
        }
      />

      {/* Top Required KPIs: Total/Active Clubs, Resources, Borrowing Requests, Pending Requests, Completed Requests */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => navigate('clubs')}
          className="text-left bg-white hover:border-[#2D4A35] transition-colors rounded-2xl border border-[#E5E2D9] p-5 cursor-pointer"
        >
          <p className="text-xs font-medium text-[#6B766E]">
            Active / Total Clubs
          </p>
          <p className="text-2xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {metrics.activeClubs}/{metrics.totalClubs}{' '}
            <span className="text-base font-semibold text-[#2D4A35]">
              Active
            </span>
          </p>
          <p className="text-xs text-[#6B766E] mt-1 tabular-nums">
            {metrics.inactiveClubs} inactive · Click to view list
          </p>
        </button>

        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">Resources</p>
          <p className="text-2xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {metrics.totalListings}
          </p>
          <p className="text-xs text-[#6B766E] mt-1 tabular-nums">
            {metrics.totalUnits} total units listed
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">
            Borrowing Requests
          </p>
          <p className="text-2xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {metrics.totalBorrowing}
          </p>
          <p className="text-xs text-[#6B766E] mt-1">
            Platform-wide total
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">Pending Requests</p>
          <p className="text-2xl font-bold text-[#7F4F16] mt-1.5 tabular-nums">
            {metrics.pendingRequests}
          </p>
          <p className="text-xs text-[#6B766E] mt-1">
            Awaiting club decision
          </p>
        </div>

        <div className="bg-[#E3ECE0] rounded-2xl border border-[#C9DBC4] p-5 col-span-2 md:col-span-1">
          <p className="text-xs font-medium text-[#2D4A35]">
            Completed Requests
          </p>
          <p className="text-2xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {metrics.completedRequests}
          </p>
          <p className="text-xs text-[#2D4A35] mt-1">
            Verified sharing cycles
          </p>
        </div>
      </div>

      {/* Main Split: Clubs Directory Overview + Club Access Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clubs Summary Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EFECE3] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#1F3626]">
                Registered Clubs Overview
              </h2>
              <p className="text-xs text-[#6B766E]">
                Click any club to inspect its resources, borrowing requests, pending requests, and completed requests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('clubs')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D4A35] hover:underline cursor-pointer whitespace-nowrap"
            >
              Manage Clubs
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFECE3] bg-[#FAF8F2] text-[11px] font-semibold uppercase tracking-wider text-[#6B766E]">
                  <th className="py-3 px-6">Club</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Resources</th>
                  <th className="py-3 px-3 text-right">Borrowing</th>
                  <th className="py-3 px-3 text-right">Pending</th>
                  <th className="py-3 px-3 text-right">Completed</th>
                  <th className="py-3 px-6 text-right">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE6] text-sm">
                {clubs.map((club) => {
                  const resCount = resources.filter(
                    (r) => r.clubId === club.id && !r.archived
                  ).length;
                  const clubReqs = requests.filter(
                    (r) => r.ownerClubId === club.id || r.borrowerClubId === club.id
                  );
                  const pendingCount = clubReqs.filter(
                    (r) => r.status === 'Pending'
                  ).length;
                  const completedCount = clubReqs.filter(
                    (r) => r.status === 'Completed'
                  ).length;

                  return (
                    <tr
                      key={club.id}
                      onClick={() =>
                        navigate('club_detail', { clubId: club.id })
                      }
                      className="hover:bg-[#FAF8F2] cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <ClubLogo club={club} size="sm" />
                          <div>
                            <p className="font-semibold text-[#1F3626]">
                              {club.acronym}
                            </p>
                            <p className="text-xs text-[#6B766E]">
                              {club.representativeName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={club.status} />
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold tabular-nums">
                        {resCount}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold tabular-nums">
                        {clubReqs.length}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-[#7F4F16] tabular-nums">
                        {pendingCount}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-[#23452C] tabular-nums">
                        {completedCount}
                      </td>
                      <td
                        className="py-3.5 px-6 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingClub(club)}
                            title="Edit club details"
                            className="p-1.5 rounded-lg border border-[#D4D1C7] text-[#3D4B41] hover:bg-[#F2EFE6] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {club.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => setDeactivatingClub(club)}
                              title="Deactivate club"
                              className="p-1.5 rounded-lg border border-[#F0B7B4] text-[#8C2220] hover:bg-[#FDF2F2] cursor-pointer"
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => reactivateClub(club.id)}
                              title="Reactivate club"
                              className="p-1.5 rounded-lg border border-[#B6E8B8] text-[#175B2B] hover:bg-[#EEF9EE] cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Public Club Access Requests Queue (Separate from Create Club Account) */}
        <div className="bg-white rounded-3xl border border-[#E5E2D9] p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#1F3626]">
                Club Access Requests
              </h2>
              <p className="text-xs text-[#6B766E]">
                Inbound requests from unregistered clubs
              </p>
            </div>
            <span className="text-xs font-semibold text-[#7F4F16] tabular-nums">
              {pendingAccess.length} pending
            </span>
          </div>

          {accessRequests.length === 0 ? (
            <p className="text-sm text-[#6B766E] py-6">
              No inbound club access requests.
            </p>
          ) : (
            <div className="space-y-3 flex-1">
              {accessRequests.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-[#EFECE3] bg-[#FAF8F2]/80 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#1F3626]">
                        {item.clubName}
                      </p>
                      <p className="text-xs text-[#6B766E]">
                        {item.representativeName} · {item.email}
                      </p>
                      <p className="text-[11px] text-[#858F87] mt-0.5 tabular-nums">
                        Submitted {item.submittedAt}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {item.status === 'Pending' && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => processAccessRequest(item.id, 'approve')}
                        className="flex-1 inline-flex items-center justify-center gap-1 h-8 rounded-lg bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve &amp; Activate
                      </button>
                      <button
                        type="button"
                        onClick={() => processAccessRequest(item.id, 'decline')}
                        className="inline-flex items-center justify-center gap-1 px-3 h-8 rounded-lg border border-[#D4D1C7] text-xs font-medium text-[#4A554E] hover:bg-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Platform Borrowing Requests Log */}
      <div className="bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EFECE3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1F3626]">
              Platform Borrowing Requests
            </h2>
            <p className="text-xs text-[#6B766E]">
              Monitor all inter-club equipment requests across UM.
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#F2EFE6] p-1 rounded-xl">
            {(['All', 'Pending', 'Active', 'Completed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setRequestFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  requestFilter === tab
                    ? 'bg-white text-[#1F3626] shadow-sm'
                    : 'text-[#6B766E] hover:text-[#1F3626]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EFECE3] bg-[#FAF8F2] text-[11px] font-semibold uppercase tracking-wider text-[#6B766E]">
                <th className="py-3 px-6">Resource</th>
                <th className="py-3 px-4">Borrower → Owner</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Pickup → Return</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE6] text-sm">
              {filteredRequests.map((req) => {
                const res = getResourceById(req.resourceId);
                const owner = getClubById(req.ownerClubId);
                const borrower = getClubById(req.borrowerClubId);
                return (
                  <tr
                    key={req.id}
                    onClick={() =>
                      navigate('request_detail', { requestId: req.id })
                    }
                    className="hover:bg-[#FAF8F2] cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-6 font-semibold text-[#1F3626] tabular-nums">
                      {req.requestedQuantity} {res?.name || 'Resource'}
                    </td>
                    <td
                      className="py-3.5 px-4 text-xs text-[#4A554E]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          borrower &&
                          navigate('club_detail', { clubId: borrower.id })
                        }
                        className="font-semibold text-[#1F3626] hover:underline cursor-pointer"
                      >
                        {borrower?.acronym}
                      </button>{' '}
                      →{' '}
                      <button
                        type="button"
                        onClick={() =>
                          owner && navigate('club_detail', { clubId: owner.id })
                        }
                        className="font-semibold text-[#2D4A35] hover:underline cursor-pointer"
                      >
                        {owner?.acronym}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#1F3626]">
                      {req.eventName}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-[#6B766E] tabular-nums">
                      {req.pickupDate} → {req.expectedReturnDate}
                    </td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={req.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Club Modals */}
      <CreateClubModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditClubModal club={editingClub} onClose={() => setEditingClub(null)} />
      <DeactivateClubModal
        club={deactivatingClub}
        pendingCount={
          deactivatingClub
            ? requests.filter(
                (r) =>
                  (r.ownerClubId === deactivatingClub.id ||
                    r.borrowerClubId === deactivatingClub.id) &&
                  r.status === 'Pending'
              ).length
            : 0
        }
        onClose={() => setDeactivatingClub(null)}
      />
    </div>
  );
};
