import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ResourceImage } from '../../components/ResourceImage';
import { EmptyState, InlineAlert } from '../../components/StateBlocks';
import { StatusBadge } from '../../components/StatusBadge';
import {
  getOverdueDays,
  getResourceAvailability,
  isRequestOverdue,
  useApp,
} from '../../context/AppContext';

export const RequestDetailPage: React.FC = () => {
  const {
    currentUser,
    requests,
    events,
    selectedRequestId,
    navigate,
    getClubById,
    getResourceById,
    getRequestById,
    approveBorrowRequest,
    rejectBorrowRequest,
    cancelBorrowRequest,
    markPickedUp,
    markReturned,
    confirmReturnVerification,
  } = useApp();

  const [queueFilter, setQueueFilter] = useState<'actionable' | 'all'>('all');
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejectionRemarks, setRejectionRemarks] = useState('');

  // Return verification inline form state
  const [reusableCount, setReusableCount] = useState(0);
  const [damagedCount, setDamagedCount] = useState(0);
  const [missingCount, setMissingCount] = useState(0);
  const [verifyError, setVerifyError] = useState('');

  const scopedRequests = useMemo(() => {
    if (!currentUser || currentUser.role === 'admin') {
      return requests;
    }
    return requests.filter(
      (r) =>
        r.ownerClubId === currentUser.clubId ||
        r.borrowerClubId === currentUser.clubId
    );
  }, [requests, currentUser]);

  const actionableRequests = useMemo(() => {
    return scopedRequests.filter((r) => {
      if (currentUser?.role === 'admin') {
        return ['Pending', 'Approved', 'Borrowed', 'Return Pending'].includes(
          r.status
        );
      }
      const isOwner = r.ownerClubId === currentUser?.clubId;
      if (isOwner && (r.status === 'Pending' || r.status === 'Return Pending')) {
        return true;
      }
      return ['Pending', 'Approved', 'Borrowed', 'Return Pending'].includes(
        r.status
      );
    });
  }, [scopedRequests, currentUser]);

  const queueList =
    queueFilter === 'actionable' ? actionableRequests : scopedRequests;

  const activeRequest =
    getRequestById(selectedRequestId) ||
    actionableRequests[0] ||
    scopedRequests[0];

  useEffect(() => {
    if (!activeRequest) return;
    if (activeRequest.requestedQuantity === 10) {
      setReusableCount(8);
      setDamagedCount(1);
      setMissingCount(1);
    } else {
      setReusableCount(activeRequest.requestedQuantity);
      setDamagedCount(0);
      setMissingCount(0);
    }
    setVerifyError('');
  }, [activeRequest?.id, activeRequest?.requestedQuantity]);

  const resource = activeRequest
    ? getResourceById(activeRequest.resourceId)
    : undefined;
  const ownerClub = activeRequest
    ? getClubById(activeRequest.ownerClubId)
    : undefined;
  const borrowerClub = activeRequest
    ? getClubById(activeRequest.borrowerClubId)
    : undefined;
  const linkedEvent = activeRequest?.eventId
    ? events.find((e) => e.id === activeRequest.eventId)
    : undefined;

  const isAdmin = currentUser?.role === 'admin';
  const isOwnerRep =
    currentUser?.role === 'club_rep' &&
    Boolean(activeRequest && currentUser.clubId === activeRequest.ownerClubId);
  const isBorrowerRep =
    currentUser?.role === 'club_rep' &&
    Boolean(
      activeRequest && currentUser.clubId === activeRequest.borrowerClubId
    );

  const overdue = activeRequest ? isRequestOverdue(activeRequest) : false;
  const overdueDays = activeRequest ? getOverdueDays(activeRequest) : 0;

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    setVerifyError('');
    const result = confirmReturnVerification(activeRequest.id, {
      reusable: reusableCount,
      damaged: damagedCount,
      missing: missingCount,
    });
    if (!result.ok) {
      setVerifyError(result.error || 'Invalid return counts.');
    }
  };

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Bar & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() =>
            navigate(isAdmin ? 'admin_dashboard' : 'my_club')
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-[#2D4A35] hover:text-[#1F3626] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAdmin ? 'Back to Admin Dashboard' : 'Back to Club Management'}
        </button>
        <p className="text-xs text-[#6B766E]">
          {isAdmin ? 'Admin' : 'My Club'} / Requests /{' '}
          {activeRequest ? activeRequest.id.toUpperCase() : 'Overview'}
        </p>
      </div>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3626] tracking-tight">
            Borrowing Request Details
          </h1>
          <p className="text-sm text-[#4A554E] mt-1">
            Inspect request metadata, club contacts, pickup dates, and complete lifecycle actions.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#EAE6DA] p-1 rounded-full self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setQueueFilter('actionable')}
            className={`px-4 h-8 rounded-full text-xs font-semibold cursor-pointer tabular-nums ${
              queueFilter === 'actionable'
                ? 'bg-white text-[#1F3626] shadow-sm'
                : 'text-[#4A554E] hover:text-[#1F3626]'
            }`}
          >
            Open &amp; Actionable ({actionableRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setQueueFilter('all')}
            className={`px-4 h-8 rounded-full text-xs font-semibold cursor-pointer tabular-nums ${
              queueFilter === 'all'
                ? 'bg-white text-[#1F3626] shadow-sm'
                : 'text-[#4A554E] hover:text-[#1F3626]'
            }`}
          >
            All Requests ({scopedRequests.length})
          </button>
        </div>
      </div>

      {!activeRequest ? (
        <EmptyState
          title="No borrowing requests found"
          description="There are no borrowing requests matching your club or filter."
          actionLabel="Browse Marketplace"
          onAction={() => navigate('marketplace')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Queue Switcher */}
          <aside className="lg:col-span-4 bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#EFECE3] flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1F3626]">
                Requests Queue
              </h2>
              <span className="text-xs text-[#6B766E] tabular-nums">
                {queueList.length} total
              </span>
            </div>

            {queueList.length === 0 ? (
              <p className="p-6 text-xs text-[#6B766E]">
                No requests in this queue.
              </p>
            ) : (
              <div className="divide-y divide-[#F2EFE6] max-h-[640px] overflow-y-auto">
                {queueList.map((req) => {
                  const res = getResourceById(req.resourceId);
                  const owner = getClubById(req.ownerClubId);
                  const borrower = getClubById(req.borrowerClubId);
                  const isSelected = req.id === activeRequest.id;
                  const itemOverdue = isRequestOverdue(req);

                  return (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() =>
                        navigate('request_detail', { requestId: req.id })
                      }
                      className={`w-full text-left px-5 py-3.5 transition-colors cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-[#EEF3EC] border-l-4 border-l-[#2D4A35]'
                          : 'hover:bg-[#FAF8F2]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-[#1F3626] tabular-nums">
                          {req.requestedQuantity} {res?.name || 'Resource'}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          <StatusBadge status={req.status} />
                          {itemOverdue && <StatusBadge status="Overdue" />}
                        </div>
                      </div>
                      <p className="text-xs text-[#4A554E] truncate">
                        {borrower?.acronym} → {owner?.acronym} · {req.eventName}
                      </p>
                      <p className="text-[11px] font-mono text-[#6B766E] tabular-nums">
                        {req.pickupDate} → {req.expectedReturnDate}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          {/* Right Main Request Detail Card */}
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-8 space-y-6">
              {/* Status & ID Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#EFECE3]">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-mono font-semibold text-[#6B766E] uppercase">
                      {activeRequest.id}
                    </span>
                    <StatusBadge status={activeRequest.status} />
                    {overdue && <StatusBadge status="Overdue" />}
                  </div>
                  <h2 className="text-2xl font-bold text-[#1F3626]">
                    {activeRequest.eventName}
                  </h2>
                  <p className="text-xs text-[#6B766E] tabular-nums">
                    Requested {activeRequest.createdAt} · Last updated{' '}
                    {activeRequest.updatedAt}
                    {overdue ? ` · ${overdueDays} days overdue` : ''}
                  </p>
                </div>

                {/* Primary Lifecycle Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {isOwnerRep && activeRequest.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectionRemarks('');
                          setRejectConfirmOpen(true);
                        }}
                        className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-xs font-semibold text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => approveBorrowRequest(activeRequest.id)}
                        className="px-5 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                      >
                        Approve Request
                      </button>
                    </>
                  )}
                  {(isOwnerRep || isBorrowerRep) &&
                    activeRequest.status === 'Approved' && (
                      <button
                        type="button"
                        onClick={() => markPickedUp(activeRequest.id)}
                        className="px-5 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                      >
                        {isOwnerRep ? 'Mark Picked Up' : 'Confirm Pickup'}
                      </button>
                    )}
                  {isBorrowerRep &&
                    (activeRequest.status === 'Pending' ||
                      activeRequest.status === 'Approved') && (
                      <button
                        type="button"
                        onClick={() => setCancelConfirmOpen(true)}
                        className="px-4 h-10 rounded-xl border border-[#F0B7B4] text-xs font-semibold text-[#8C2220] hover:bg-[#FDF2F2] cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    )}
                  {isBorrowerRep && activeRequest.status === 'Borrowed' && (
                    <button
                      type="button"
                      onClick={() => markReturned(activeRequest.id)}
                      className="px-5 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                    >
                      Mark Returned
                    </button>
                  )}
                </div>
              </div>

              {overdue && (
                <InlineAlert
                  tone="warning"
                  message={`This loan is ${overdueDays} day${
                    overdueDays === 1 ? '' : 's'
                  } past its expected return date (${
                    activeRequest.expectedReturnDate
                  }). Please coordinate immediate return and verification.`}
                />
              )}

              {/* Resource Summary Card */}
              {resource && (
                <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#EFECE3] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-16 rounded-xl overflow-hidden border border-[#E5E2D9] shrink-0">
                      <ResourceImage
                        src={resource.images[0]}
                        alt={resource.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-[#1F3626]">
                          {resource.name}
                        </h3>
                        <StatusBadge
                          status={getResourceAvailability(resource, ownerClub)}
                        />
                      </div>
                      <p className="text-xs text-[#6B766E] tabular-nums">
                        {resource.category} · Condition: {resource.condition} ·{' '}
                        {resource.availableUnits}/{resource.totalUnits} units
                        available
                      </p>
                      <p className="text-xs text-[#6B766E] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#2D4A35]" />
                        {resource.location}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate('resource_detail', { resourceId: resource.id })
                    }
                    className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl border border-[#D4D1C7] bg-white hover:bg-[#F2EFE6] text-xs font-semibold text-[#1F3626] cursor-pointer shrink-0"
                  >
                    View Resource
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Key Metadata Grid */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-2xl border border-[#EFECE3]">
                  <dt className="text-xs font-semibold text-[#6B766E]">
                    Requested Quantity
                  </dt>
                  <dd className="mt-1 text-lg font-bold text-[#1F3626] tabular-nums flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#2D4A35]" />
                    {activeRequest.requestedQuantity} units
                  </dd>
                </div>

                <div className="p-4 rounded-2xl border border-[#EFECE3]">
                  <dt className="text-xs font-semibold text-[#6B766E]">
                    Borrowing Period
                  </dt>
                  <dd className="mt-1 text-sm font-mono font-bold text-[#1F3626] tabular-nums flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2D4A35]" />
                    {activeRequest.pickupDate} → {activeRequest.expectedReturnDate}
                  </dd>
                  {activeRequest.returnedDate && (
                    <p className="text-[11px] text-[#2D4A35] font-mono mt-1 tabular-nums">
                      Returned: {activeRequest.returnedDate}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-2xl border border-[#EFECE3]">
                  <dt className="text-xs font-semibold text-[#6B766E]">
                    Would Otherwise Purchase
                  </dt>
                  <dd className="mt-1 font-bold text-[#1F3626]">
                    {activeRequest.wouldOtherwisePurchase
                      ? 'Yes (avoids new purchase)'
                      : 'No'}
                  </dd>
                </div>
              </dl>

              {/* Purpose, Linked Event & Remarks */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B766E]">
                    Purpose of Borrowing
                  </h3>
                  <p className="mt-1.5 text-sm text-[#1F3626] leading-relaxed">
                    {activeRequest.purpose}
                  </p>
                </div>

                {linkedEvent && (
                  <div className="p-4 rounded-2xl bg-[#EEF3EC]/70 border border-[#D4E2D0] space-y-1">
                    <p className="text-xs font-semibold text-[#2D4A35]">
                      Linked Club Event · {linkedEvent.date}
                    </p>
                    <p className="text-sm font-bold text-[#1F3626]">
                      {linkedEvent.name}
                    </p>
                    <p className="text-xs text-[#4A554E]">
                      {linkedEvent.purpose}
                      {linkedEvent.description
                        ? ` — ${linkedEvent.description}`
                        : ''}
                    </p>
                  </div>
                )}

                {activeRequest.remarks && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6B766E]">
                      Request Remarks
                    </h3>
                    <p className="mt-1 text-sm text-[#4A554E]">
                      {activeRequest.remarks}
                    </p>
                  </div>
                )}

                {activeRequest.status === 'Rejected' && activeRequest.rejectionReason && (
                  <div className="p-4 rounded-2xl bg-[#FDF2F2] border border-[#F0B7B4] space-y-1">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8C2220]">
                      Rejection Remarks
                    </h3>
                    <p className="mt-1 text-sm text-[#4A554E]">
                      {activeRequest.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Owner Return Verification Form (when Return Pending & Owner Rep) */}
              {isOwnerRep && activeRequest.status === 'Return Pending' && (
                <form
                  onSubmit={handleVerifySubmit}
                  className="p-5 rounded-2xl bg-[#DCE7D8] border border-[#C9DBC4] space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#1F3626]">
                        Verify Returned Condition
                      </h3>
                      <p className="text-xs text-[#3D4B41] mt-0.5 tabular-nums">
                        Account for all {activeRequest.requestedQuantity}{' '}
                        borrowed units before marking Completed.
                      </p>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#2D4A35]" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                        Reusable
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={activeRequest.requestedQuantity}
                        value={reusableCount}
                        onChange={(e) =>
                          setReusableCount(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="w-full h-10 px-3 rounded-xl bg-white border border-[#B9CEB3] text-sm font-bold text-[#1F3626] tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                        Damaged
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={activeRequest.requestedQuantity}
                        value={damagedCount}
                        onChange={(e) =>
                          setDamagedCount(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="w-full h-10 px-3 rounded-xl bg-white border border-[#B9CEB3] text-sm font-bold text-[#1F3626] tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                        Missing
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={activeRequest.requestedQuantity}
                        value={missingCount}
                        onChange={(e) =>
                          setMissingCount(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="w-full h-10 px-3 rounded-xl bg-white border border-[#B9CEB3] text-sm font-bold text-[#1F3626] tabular-nums"
                      />
                    </div>
                  </div>

                  {verifyError && <InlineAlert message={verifyError} />}

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Confirm Verification &amp; Complete
                  </button>
                </form>
              )}

              {/* Completed Verification Summary */}
              {activeRequest.verification && (
                <div className="p-4 rounded-2xl bg-[#EEF9EE] border border-[#B6E8B8] space-y-1">
                  <p className="text-xs font-bold text-[#175B2B]">
                    Return Verified · {activeRequest.verification.verifiedAt}
                  </p>
                  <p className="text-xs text-[#175B2B] tabular-nums">
                    {activeRequest.verification.reusable} reusable ·{' '}
                    {activeRequest.verification.damaged} damaged ·{' '}
                    {activeRequest.verification.missing} missing
                  </p>
                </div>
              )}

              {/* Club Contacts (Owner & Borrower) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#EFECE3]">
                {borrowerClub && (
                  <div className="p-4 rounded-2xl border border-[#EFECE3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B766E]">
                        Borrower Club
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          navigate('club_detail', { clubId: borrowerClub.id })
                        }
                        className="text-xs font-semibold text-[#2D4A35] hover:underline cursor-pointer"
                      >
                        View Club
                      </button>
                    </div>
                    <p className="text-sm font-bold text-[#1F3626]">
                      {borrowerClub.acronym} · {borrowerClub.name}
                    </p>
                    <div className="space-y-1 text-xs text-[#4A554E]">
                      <p className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#2D4A35]" />
                        PIC: {borrowerClub.representativeName}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#2D4A35]" />
                        {borrowerClub.contactEmail}
                      </p>
                      <p className="flex items-center gap-1.5 font-mono tabular-nums">
                        <Phone className="w-3.5 h-3.5 text-[#2D4A35]" />
                        {borrowerClub.picPhone}
                      </p>
                    </div>
                  </div>
                )}

                {ownerClub && (
                  <div className="p-4 rounded-2xl border border-[#EFECE3] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6B766E]">
                        Owner Club
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          navigate('club_detail', { clubId: ownerClub.id })
                        }
                        className="text-xs font-semibold text-[#2D4A35] hover:underline cursor-pointer"
                      >
                        View Club
                      </button>
                    </div>
                    <p className="text-sm font-bold text-[#1F3626]">
                      {ownerClub.acronym} · {ownerClub.name}
                    </p>
                    <div className="space-y-1 text-xs text-[#4A554E]">
                      <p className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#2D4A35]" />
                        PIC: {ownerClub.representativeName}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#2D4A35]" />
                        {ownerClub.contactEmail}
                      </p>
                      <p className="flex items-center gap-1.5 font-mono tabular-nums">
                        <Phone className="w-3.5 h-3.5 text-[#2D4A35]" />
                        {ownerClub.picPhone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={cancelConfirmOpen}
        tone="danger"
        title="Cancel this borrowing request?"
        description="Cancelling moves this request to history as Cancelled and releases any reserved stock."
        confirmLabel="Confirm Cancel"
        onConfirm={() => {
          if (activeRequest) cancelBorrowRequest(activeRequest.id);
          setCancelConfirmOpen(false);
        }}
        onClose={() => setCancelConfirmOpen(false)}
      />

      {rejectConfirmOpen && activeRequest && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-7 relative shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-[#1F3626]">
              Reject Borrowing Request
            </h2>
            <p className="text-xs text-[#6B766E]">
              Provide a reason or rejection remarks for {getClubById(activeRequest.borrowerClubId)?.acronym || 'the borrower'}.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                Rejection Remarks / Reason
              </label>
              <textarea
                rows={3}
                value={rejectionRemarks}
                onChange={(e) => setRejectionRemarks(e.target.value)}
                placeholder="e.g. Reserved for club annual showcase / Equipment under maintenance..."
                className="w-full p-3 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#8C2220] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectConfirmOpen(false)}
                className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-xs font-semibold text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  rejectBorrowRequest(activeRequest.id, rejectionRemarks.trim() || undefined);
                  setRejectConfirmOpen(false);
                }}
                className="px-5 h-10 rounded-xl bg-[#8C2220] hover:bg-[#731A19] text-white text-xs font-semibold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
