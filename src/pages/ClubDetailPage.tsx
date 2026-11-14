import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  Mail,
  MapPin,
  Phone,
  Power,
  RotateCcw,
  User,
} from 'lucide-react';
import {
  DeactivateClubModal,
  EditClubModal,
} from '../components/ClubAdminModals';
import { ClubLogo } from '../components/ClubLogo';
import { ResourceCard } from '../components/ResourceCard';
import { EmptyState } from '../components/StateBlocks';
import { StatusBadge } from '../components/StatusBadge';
import {
  getResourceAvailability,
  isRequestOverdue,
  useApp,
} from '../context/AppContext';

export const ClubDetailPage: React.FC = () => {
  const {
    selectedClubId,
    clubs,
    resources,
    requests,
    currentUser,
    navigate,
    reactivateClub,
    getClubById,
    getResourceById,
  } = useApp();

  const club = getClubById(selectedClubId) || clubs[0];
  const isAdmin = currentUser?.role === 'admin';
  const isOwnClubRep =
    currentUser?.role === 'club_rep' && currentUser.clubId === club?.id;

  const [requestTab, setRequestTab] = useState<'all' | 'pending' | 'completed'>(
    'all'
  );
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const clubResources = useMemo(
    () =>
      resources.filter((r) => r.clubId === club?.id && !r.archived),
    [resources, club]
  );

  const clubRequests = useMemo(
    () =>
      requests.filter(
        (req) =>
          req.ownerClubId === club?.id || req.borrowerClubId === club?.id
      ),
    [requests, club]
  );

  const pendingRequests = useMemo(
    () => clubRequests.filter((r) => r.status === 'Pending'),
    [clubRequests]
  );

  const completedRequests = useMemo(
    () => clubRequests.filter((r) => r.status === 'Completed'),
    [clubRequests]
  );

  const displayedRequests = useMemo(() => {
    if (requestTab === 'pending') return pendingRequests;
    if (requestTab === 'completed') return completedRequests;
    return clubRequests;
  }, [requestTab, clubRequests, pendingRequests, completedRequests]);

  if (!club) {
    return (
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-12">
        <p className="text-sm text-[#4A554E]">Club not found.</p>
      </div>
    );
  }

  const totalUnits = clubResources.reduce((sum, r) => sum + r.totalUnits, 0);

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('clubs')}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2D4A35] hover:text-[#1F3626] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Clubs
        </button>
        <p className="text-xs text-[#6B766E]">
          Clubs / {club.acronym}{' '}
          {!isAdmin && !isOwnClubRep && '· Read-only profile'}
        </p>
      </div>

      {/* Club Profile Header */}
      <div className="bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <ClubLogo club={club} size="md" />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1F3626]">
                {club.name}
              </h1>
              <StatusBadge status={club.status} />
            </div>
            <p className="text-sm text-[#4A554E] max-w-2xl leading-relaxed">
              {club.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-1 text-xs text-[#6B766E]">
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#2D4A35]" />
                PIC: {club.representativeName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#2D4A35]" />
                {club.contactEmail}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                <Phone className="w-3.5 h-3.5 text-[#2D4A35]" />
                {club.picPhone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#2D4A35]" />
                {club.storageLocation}
              </span>
            </div>
          </div>
        </div>

        {/* Only own club representative can edit own profile; Admin can manage account status */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {isOwnClubRep && (
            <button
              type="button"
              onClick={() => navigate('my_club')}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-[#D4D1C7] text-sm font-medium text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer whitespace-nowrap"
            >
              <Edit3 className="w-4 h-4" />
              Edit Club Profile
            </button>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-[#D4D1C7] text-sm font-medium text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer whitespace-nowrap"
              >
                <Edit3 className="w-4 h-4" />
                Edit Club Details
              </button>
              {club.status === 'Active' ? (
                <button
                  type="button"
                  onClick={() => setDeactivateOpen(true)}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-[#F0B7B4] bg-[#FDF2F2] text-sm font-semibold text-[#8C2220] hover:bg-[#FADDDD] cursor-pointer whitespace-nowrap"
                >
                  <Power className="w-4 h-4" />
                  Deactivate Club
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => reactivateClub(club.id)}
                  className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reactivate Club
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 4 KPI Cards: Resources, Borrowing Requests, Pending Requests, Completed Requests */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">Resources</p>
          <p className="text-3xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {clubResources.length}
          </p>
          <p className="text-xs text-[#6B766E] mt-1 tabular-nums">
            {totalUnits} total units owned
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">Borrowing Requests</p>
          <p className="text-3xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {clubRequests.length}
          </p>
          <p className="text-xs text-[#6B766E] mt-1">
            Total incoming &amp; outgoing
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2D9] p-5">
          <p className="text-xs font-medium text-[#6B766E]">Pending Requests</p>
          <p className="text-3xl font-bold text-[#7F4F16] mt-1.5 tabular-nums">
            {pendingRequests.length}
          </p>
          <p className="text-xs text-[#6B766E] mt-1">Awaiting decision</p>
        </div>

        <div className="bg-[#E3ECE0] rounded-2xl border border-[#C9DBC4] p-5">
          <p className="text-xs font-medium text-[#2D4A35]">Completed Requests</p>
          <p className="text-3xl font-bold text-[#1F3626] mt-1.5 tabular-nums">
            {completedRequests.length}
          </p>
          <p className="text-xs text-[#2D4A35] mt-1">Verified sharing cycles</p>
        </div>
      </div>

      {/* Club's Resources */}
      <section className="bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EFECE3] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1F3626]">
              Club Resources ({clubResources.length})
            </h2>
            <p className="text-xs text-[#6B766E]">
              Equipment currently listed under {club.acronym}.
            </p>
          </div>
        </div>

        {clubResources.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No resources listed yet"
              description="This club has not added any shared event equipment yet."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {clubResources.map((res) => {
              const availability = getResourceAvailability(res, club);
              return (
                <ResourceCard
                  key={res.id}
                  resource={res}
                  club={club}
                  availability={availability}
                  onSelect={() =>
                    navigate('resource_detail', { resourceId: res.id })
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Club's Borrowing, Pending & Completed Requests */}
      <section className="bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EFECE3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#1F3626]">
              Club Borrowing &amp; Lending Requests
            </h2>
            <p className="text-xs text-[#6B766E]">
              Track all borrowing requests, pending approvals, and completed returns for {club.acronym}.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#F2EFE6] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setRequestTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer tabular-nums ${
                requestTab === 'all'
                  ? 'bg-white text-[#1F3626] shadow-sm'
                  : 'text-[#6B766E] hover:text-[#1F3626]'
              }`}
            >
              Borrowing Requests ({clubRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setRequestTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer tabular-nums ${
                requestTab === 'pending'
                  ? 'bg-white text-[#1F3626] shadow-sm'
                  : 'text-[#6B766E] hover:text-[#1F3626]'
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              type="button"
              onClick={() => setRequestTab('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer tabular-nums ${
                requestTab === 'completed'
                  ? 'bg-white text-[#1F3626] shadow-sm'
                  : 'text-[#6B766E] hover:text-[#1F3626]'
              }`}
            >
              Completed ({completedRequests.length})
            </button>
          </div>
        </div>

        {displayedRequests.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#6B766E]">
            No requests in this view for {club.acronym}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EFECE3] bg-[#FAF8F2] text-[11px] font-semibold uppercase tracking-wider text-[#6B766E]">
                  <th className="py-3 px-6">Resource &amp; Direction</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-4">Pickup → Return</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-6 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE6] text-sm">
                {displayedRequests.map((req) => {
                  const res = getResourceById(req.resourceId);
                  const isOwner = req.ownerClubId === club.id;
                  const partner = getClubById(
                    isOwner ? req.borrowerClubId : req.ownerClubId
                  );
                  const overdue = isRequestOverdue(req);
                  return (
                    <tr key={req.id} className="hover:bg-[#FAF8F2]">
                      <td className="py-3.5 px-6">
                        <p className="font-semibold text-[#1F3626] tabular-nums">
                          {req.requestedQuantity} {res?.name || 'Resource'}
                        </p>
                        <p className="text-xs text-[#6B766E]">
                          {isOwner
                            ? `Lending to ${partner?.acronym || 'Club'}`
                            : `Borrowing from ${partner?.acronym || 'Club'}`}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#1F3626]">
                        {req.eventName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#6B766E] font-mono tabular-nums">
                        {req.pickupDate} → {req.expectedReturnDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <StatusBadge status={req.status} />
                          {overdue && <StatusBadge status="Overdue" />}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right text-xs text-[#6B766E] tabular-nums">
                        {req.verification
                          ? `${req.verification.reusable} reusable · ${req.verification.damaged} damaged · ${req.verification.missing} missing`
                          : req.purpose.slice(0, 48)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <EditClubModal
        club={editOpen ? club : null}
        onClose={() => setEditOpen(false)}
      />
      <DeactivateClubModal
        club={deactivateOpen ? club : null}
        pendingCount={pendingRequests.length}
        onClose={() => setDeactivateOpen(false)}
      />
    </div>
  );
};
