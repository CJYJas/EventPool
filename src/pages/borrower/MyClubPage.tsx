import React, { useMemo, useState } from 'react';
import {
  Box,
  Calendar,
  Check,
  CheckCircle2,
  Edit3,
  History,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ClubLogo } from '../../components/ClubLogo';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { RequestRow } from '../../components/RequestRow';
import { ResourceImage } from '../../components/ResourceImage';
import { EmptyState, InlineAlert } from '../../components/StateBlocks';
import { StatusBadge } from '../../components/StatusBadge';
import {
  getOverdueDays,
  getResourceAvailability,
  isRequestOverdue,
  useApp,
} from '../../context/AppContext';
import { IMAGES } from '../../data/seedData';
import type { ClubEvent, Resource, ResourceCategory } from '../../types/eventpool';

const CATEGORY_DEFAULT_IMAGE: Record<ResourceCategory, string> = {
  Furniture: IMAGES.chairs,
  'Audio Equipment': IMAGES.speaker,
  Lighting: IMAGES.lights,
  Electronics: IMAGES.projector,
  Decorations: IMAGES.easels,
};

export const MyClubPage: React.FC = () => {
  const {
    currentUser,
    events,
    resources,
    requests,
    navigate,
    getClubById,
    getResourceById,
    approveBorrowRequest,
    rejectBorrowRequest,
    cancelBorrowRequest,
    markPickedUp,
    markReturned,
    confirmReturnVerification,
    addResource,
    editResourceQuantity,
    updateResource,
    toggleResourceAvailability,
    archiveResource,
    createEvent,
    updateEvent,
    deleteEvent,
    updateOwnClubProfile,
  } = useApp();

  const club = getClubById(currentUser?.clubId || 'club-pekom');
  const isOwnRep =
    currentUser?.role === 'club_rep' && currentUser.clubId === club?.id;

  // Subtabs under MyClub: Operations | Events | Club Profile
  const [activeSubtab, setActiveSubtab] = useState<
    'operations' | 'events' | 'profile'
  >('operations');

  // Separated Borrowing Requests Tabs: Incoming (as owner) | Outgoing (as borrower)
  const [requestDirectionTab, setRequestDirectionTab] = useState<
    'incoming' | 'outgoing'
  >('incoming');

  // Verify Return state
  const [selectedVerifyId, setSelectedVerifyId] = useState<string | null>(null);
  const [reusableCount, setReusableCount] = useState<number>(8);
  const [damagedCount, setDamagedCount] = useState<number>(1);
  const [missingCount, setMissingCount] = useState<number>(1);
  const [verifyError, setVerifyError] = useState('');

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [addSuccessName, setAddSuccessName] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<
    'All' | 'Completed' | 'Cancelled' | 'Rejected'
  >('All');
  const [actionResource, setActionResource] = useState<Resource | null>(null);
  const [editQtyResource, setEditQtyResource] = useState<Resource | null>(null);
  const [editQtyValue, setEditQtyValue] = useState<number>(1);
  const [editQtyError, setEditQtyError] = useState('');
  const [archiveConfirmResource, setArchiveConfirmResource] =
    useState<Resource | null>(null);
  const [blockedResource, setBlockedResource] = useState<Resource | null>(null);
  const [cancelConfirmReqId, setCancelConfirmReqId] = useState<string | null>(
    null
  );
  const [rejectConfirmReqId, setRejectConfirmReqId] = useState<string | null>(
    null
  );
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Add Resource Form State (Complete form!)
  const [newResName, setNewResName] = useState('');
  const [newResCategory, setNewResCategory] =
    useState<ResourceCategory>('Decorations');
  const [newResCondition, setNewResCondition] = useState<
    'Excellent' | 'Good' | 'Fair'
  >('Good');
  const [newResLocation, setNewResLocation] = useState(
    club?.storageLocation || ''
  );
  const [newResQty, setNewResQty] = useState(2);
  const [newResDesc, setNewResDesc] = useState('');
  const [newResRemarks, setNewResRemarks] = useState('');
  const [newResCostMYR, setNewResCostMYR] = useState<string>('');
  const [newResWeightKg, setNewResWeightKg] = useState<string>('');
  const [newResImage, setNewResImage] = useState<string>('');
  const [addResError, setAddResError] = useState('');

  // Edit Resource Form State
  const [editResourceModal, setEditResourceModal] = useState<Resource | null>(null);
  const [editResName, setEditResName] = useState('');
  const [editResCategory, setEditResCategory] = useState<ResourceCategory>('Decorations');
  const [editResCondition, setEditResCondition] = useState<'Excellent' | 'Good' | 'Fair'>('Good');
  const [editResLocation, setEditResLocation] = useState('');
  const [editResQty, setEditResQty] = useState(1);
  const [editResDesc, setEditResDesc] = useState('');
  const [editResRemarks, setEditResRemarks] = useState('');
  const [editResCostMYR, setEditResCostMYR] = useState<string>('');
  const [editResWeightKg, setEditResWeightKg] = useState<string>('');
  const [editResImage, setEditResImage] = useState<string>('');
  const [editResError, setEditResError] = useState('');

  // Event Modal State
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ClubEvent | null>(null);
  const [evtName, setEvtName] = useState('');
  const [evtDate, setEvtDate] = useState('2026-11-25');
  const [evtPurpose, setEvtPurpose] = useState('');
  const [evtDesc, setEvtDesc] = useState('');
  const [evtError, setEvtError] = useState('');

  // Club Profile Edit State
  const [profileEditing, setProfileEditing] = useState(false);
  const [profName, setProfName] = useState(club?.name || '');
  const [profDesc, setProfDesc] = useState(club?.description || '');
  const [profEmail, setProfEmail] = useState(club?.contactEmail || '');
  const [profPhone, setProfPhone] = useState(club?.picPhone || '');
  const [profLoc, setProfLoc] = useState(club?.storageLocation || '');
  const [profLogoUrl, setProfLogoUrl] = useState(club?.logoUrl || '');
  const [profError, setProfError] = useState('');

  React.useEffect(() => {
    if (club) {
      setNewResLocation(club.storageLocation);
      setProfName(club.name);
      setProfDesc(club.description);
      setProfEmail(club.contactEmail);
      setProfPhone(club.picPhone);
      setProfLoc(club.storageLocation);
      setProfLogoUrl(club.logoUrl || '');
    }
  }, [club?.id]);

  const myResources = useMemo(
    () => resources.filter((r) => r.clubId === club?.id && !r.archived),
    [resources, club]
  );

  const clubEvents = useMemo(
    () => events.filter((e) => e.clubId === club?.id),
    [events, club]
  );

  // Active & Pending requests split by direction
  const incomingRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.ownerClubId === club?.id &&
          ['Pending', 'Approved', 'Borrowed', 'Return Pending'].includes(
            r.status
          )
      ),
    [requests, club]
  );

  const outgoingRequests = useMemo(
    () =>
      requests.filter(
        (r) =>
          r.borrowerClubId === club?.id &&
          ['Pending', 'Approved', 'Borrowed', 'Return Pending'].includes(
            r.status
          )
      ),
    [requests, club]
  );

  const pendingIncoming = useMemo(
    () => incomingRequests.filter((r) => r.status === 'Pending'),
    [incomingRequests]
  );

  const returnsToVerify = useMemo(
    () =>
      requests.filter(
        (r) => r.ownerClubId === club?.id && r.status === 'Return Pending'
      ),
    [requests, club]
  );

  const activeBorrowingLending = useMemo(
    () =>
      requests.filter(
        (r) =>
          (r.ownerClubId === club?.id || r.borrowerClubId === club?.id) &&
          ['Approved', 'Borrowed', 'Return Pending'].includes(r.status)
      ),
    [requests, club]
  );

  const historyRecords = useMemo(
    () =>
      requests.filter(
        (r) =>
          (r.ownerClubId === club?.id || r.borrowerClubId === club?.id) &&
          ['Completed', 'Cancelled', 'Rejected'].includes(r.status)
      ),
    [requests, club]
  );

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'All') return historyRecords;
    return historyRecords.filter((r) => r.status === historyFilter);
  }, [historyRecords, historyFilter]);

  const activeReturnItem =
    returnsToVerify.find((r) => r.id === selectedVerifyId) ||
    returnsToVerify[0];

  React.useEffect(() => {
    if (activeReturnItem) {
      if (activeReturnItem.requestedQuantity === 10) {
        setReusableCount(8);
        setDamagedCount(1);
        setMissingCount(1);
      } else {
        setReusableCount(activeReturnItem.requestedQuantity);
        setDamagedCount(0);
        setMissingCount(0);
      }
      setVerifyError('');
    }
  }, [activeReturnItem?.id, activeReturnItem?.requestedQuantity]);

  if (!club) return null;

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReturnItem) return;
    setVerifyError('');
    const result = confirmReturnVerification(activeReturnItem.id, {
      reusable: reusableCount,
      damaged: damagedCount,
      missing: missingCount,
    });
    if (!result.ok) {
      setVerifyError(result.error || 'Invalid verification counts.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewResImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetAddResourceForm = () => {
    setNewResName('');
    setNewResCategory('Decorations');
    setNewResCondition('Good');
    setNewResLocation(club.storageLocation);
    setNewResQty(2);
    setNewResDesc('');
    setNewResRemarks('');
    setNewResCostMYR('');
    setNewResWeightKg('');
    setNewResImage('');
    setAddResError('');
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    setAddResError('');
    if (!newResName.trim() || !newResDesc.trim() || !newResLocation.trim()) {
      setAddResError(
        'Please provide resource name, description, and storage location.'
      );
      return;
    }
    if (newResQty < 1) {
      setAddResError('Total quantity must be at least 1.');
      return;
    }

    const parsedCost = newResCostMYR.trim()
      ? Number(newResCostMYR)
      : undefined;
    const parsedWeight = newResWeightKg.trim()
      ? Number(newResWeightKg)
      : undefined;

    if (parsedCost !== undefined && (Number.isNaN(parsedCost) || parsedCost < 0)) {
      setAddResError('Estimated unit cost (MYR) must be a valid positive number.');
      return;
    }
    if (
      parsedWeight !== undefined &&
      (Number.isNaN(parsedWeight) || parsedWeight < 0)
    ) {
      setAddResError('Estimated weight (kg) must be a valid positive number.');
      return;
    }

    addResource({
      clubId: club.id,
      name: newResName,
      category: newResCategory,
      condition: newResCondition,
      location: newResLocation,
      totalUnits: newResQty,
      description: newResDesc,
      remarks: newResRemarks.trim() || 'Return clean and complete to storeroom.',
      estimatedUnitCostRM: parsedCost,
      estimatedUnitWeightKg: parsedWeight,
      imageUrl: newResImage || CATEGORY_DEFAULT_IMAGE[newResCategory],
    });
    setAddSuccessName(newResName.trim());
    resetAddResourceForm();
  };

  const openEditResource = (r: Resource) => {
    setEditResourceModal(r);
    setEditResName(r.name);
    setEditResCategory(r.category);
    setEditResCondition(r.condition);
    setEditResLocation(r.location);
    setEditResQty(r.totalUnits);
    setEditResDesc(r.description || '');
    setEditResRemarks(r.remarks || '');
    setEditResCostMYR(r.estimatedUnitCostRM ? String(r.estimatedUnitCostRM) : '');
    setEditResWeightKg(r.estimatedUnitWeightKg ? String(r.estimatedUnitWeightKg) : '');
    setEditResImage(r.images[0] || '');
    setEditResError('');
  };

  const handleEditResourceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditResImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editResourceModal) return;
    setEditResError('');
    if (!editResName.trim() || !editResDesc.trim() || !editResLocation.trim()) {
      setEditResError('Please provide resource name, description, and storage location.');
      return;
    }
    const committed = editResourceModal.reservedUnits + editResourceModal.borrowedUnits;
    if (editResQty < committed) {
      setEditResError(`Total quantity cannot be less than ${committed} currently reserved or borrowed units.`);
      return;
    }

    const parsedCost = editResCostMYR.trim() ? Number(editResCostMYR) : undefined;
    const parsedWeight = editResWeightKg.trim() ? Number(editResWeightKg) : undefined;

    const res = updateResource(editResourceModal.id, {
      name: editResName.trim(),
      category: editResCategory,
      condition: editResCondition,
      location: editResLocation.trim(),
      totalUnits: editResQty,
      description: editResDesc.trim(),
      remarks: editResRemarks.trim(),
      estimatedUnitCostRM: parsedCost,
      estimatedUnitWeightKg: parsedWeight,
      imageUrl: editResImage || undefined,
    });

    if (!res.ok) {
      setEditResError(res.error || 'Failed to update resource.');
      return;
    }

    setEditResourceModal(null);
  };

  const openCreateEvent = () => {
    setEditingEvent(null);
    setEvtName('');
    setEvtDate('2026-11-25');
    setEvtPurpose('');
    setEvtDesc('');
    setEvtError('');
    setEventModalOpen(true);
  };

  const openEditEvent = (ev: ClubEvent) => {
    setEditingEvent(ev);
    setEvtName(ev.name);
    setEvtDate(ev.date);
    setEvtPurpose(ev.purpose);
    setEvtDesc(ev.description || '');
    setEvtError('');
    setEventModalOpen(true);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEvtError('');
    if (!evtName.trim() || !evtDate || !evtPurpose.trim()) {
      setEvtError('Event name, date, and purpose are required.');
      return;
    }
    if (editingEvent) {
      updateEvent(editingEvent.id, {
        name: evtName,
        date: evtDate,
        purpose: evtPurpose,
        description: evtDesc,
      });
    } else {
      createEvent({
        clubId: club.id,
        name: evtName,
        date: evtDate,
        purpose: evtPurpose,
        description: evtDesc,
      });
    }
    setEventModalOpen(false);
  };

  const handleProfileLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProfError('Please select a valid image file (PNG, JPG, or WEBP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setProfError('Profile picture must be 3 MB or smaller.');
      return;
    }
    setProfError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfError('');
    if (
      !profName.trim() ||
      !profDesc.trim() ||
      !profEmail.trim() ||
      !profPhone.trim()
    ) {
      setProfError('All club profile fields are required.');
      return;
    }
    const res = updateOwnClubProfile(club.id, {
      name: profName,
      description: profDesc,
      contactEmail: profEmail,
      picPhone: profPhone,
      storageLocation: profLoc,
      logoUrl: profLogoUrl,
    });
    if (!res.ok) {
      setProfError(res.error || 'Could not update club profile.');
      return;
    }
    setProfileEditing(false);
  };

  const displayedDirectionalRequests =
    requestDirectionTab === 'incoming' ? incomingRequests : outgoingRequests;

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1F3626]">Club Management</h1>
          <p className="text-sm text-[#4A554E] mt-0.5">
            A good day to share.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Subtabs: Operations | Events | Club Profile */}
          <div className="flex items-center gap-1 bg-[#EAE6DA] p-1 rounded-full">
            <button
              type="button"
              onClick={() => setActiveSubtab('operations')}
              className={`px-4 h-8 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                activeSubtab === 'operations'
                  ? 'bg-white text-[#1F3626] shadow-sm'
                  : 'text-[#4A554E] hover:text-[#1F3626]'
              }`}
            >
              Requests &amp; Inventory
            </button>
            <button
              type="button"
              onClick={() => setActiveSubtab('events')}
              className={`px-4 h-8 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap tabular-nums ${
                activeSubtab === 'events'
                  ? 'bg-white text-[#1F3626] shadow-sm'
                  : 'text-[#4A554E] hover:text-[#1F3626]'
              }`}
            >
              Events ({clubEvents.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubtab('profile')}
              className={`px-4 h-8 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
                activeSubtab === 'profile'
                  ? 'bg-white text-[#1F3626] shadow-sm'
                  : 'text-[#4A554E] hover:text-[#1F3626]'
              }`}
            >
              Club Profile
            </button>
          </div>

          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-[#D4D1C7] bg-white hover:bg-[#FAF8F2] text-sm font-medium text-[#1F3626] cursor-pointer whitespace-nowrap"
          >
            <History className="w-4 h-4 text-[#4A554E]" />
            View history
          </button>
          <button
            type="button"
            onClick={() => {
              setAddSuccessName(null);
              setAddOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Resources
          </button>
        </div>
      </div>

      {activeSubtab === 'operations' && (
        <>
          {/* 4 KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#E5E2D9] px-5 py-4 flex items-center gap-3.5">
              <span className="text-3xl font-bold text-[#1F3626] tabular-nums">
                {String(pendingIncoming.length).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium text-[#4A554E]">
                Incoming requests
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E2D9] px-5 py-4 flex items-center gap-3.5">
              <span className="text-3xl font-bold text-[#1F3626] tabular-nums">
                {String(activeBorrowingLending.length).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium text-[#4A554E]">
                Active loans
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E2D9] px-5 py-4 flex items-center gap-3.5">
              <span className="text-3xl font-bold text-[#1F3626] tabular-nums">
                {String(returnsToVerify.length).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium text-[#4A554E]">
                Return to verify
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E2D9] px-5 py-4 flex items-center gap-3.5">
              <span className="text-3xl font-bold text-[#1F3626] tabular-nums">
                {String(myResources.length).padStart(2, '0')}
              </span>
              <span className="text-sm font-medium text-[#4A554E]">
                Resource listings
              </span>
            </div>
          </div>

          {/* Middle Row: Incoming (as owner) / Outgoing (as borrower) Tabs + Verify a Return */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Incoming / Outgoing Borrowing Requests with Count Badges */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E2D9] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-[#F2EFE6] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setRequestDirectionTab('incoming')}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      requestDirectionTab === 'incoming'
                        ? 'bg-white text-[#1F3626] shadow-sm'
                        : 'text-[#6B766E] hover:text-[#1F3626]'
                    }`}
                  >
                    <span>Incoming (as owner)</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#DCE7D8] text-[#1F3626] text-[11px] font-bold tabular-nums">
                      {incomingRequests.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRequestDirectionTab('outgoing')}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      requestDirectionTab === 'outgoing'
                        ? 'bg-white text-[#1F3626] shadow-sm'
                        : 'text-[#6B766E] hover:text-[#1F3626]'
                    }`}
                  >
                    <span>Outgoing (as borrower)</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-[#EFECE3] text-[#1F3626] text-[11px] font-bold tabular-nums">
                      {outgoingRequests.length}
                    </span>
                  </button>
                </div>

                <span className="text-xs text-[#6B766E] tabular-nums">
                  {requestDirectionTab === 'incoming'
                    ? `${pendingIncoming.length} awaiting your decision`
                    : `${outgoingRequests.length} active or pending`}
                </span>
              </div>

              {displayedDirectionalRequests.length === 0 ? (
                <EmptyState
                  title={
                    requestDirectionTab === 'incoming'
                      ? 'No incoming requests'
                      : 'No outgoing borrowing requests'
                  }
                  description={
                    requestDirectionTab === 'incoming'
                      ? 'Requests from other UM student clubs to borrow your equipment will appear here.'
                      : 'Browse the Marketplace to submit a borrowing request for an upcoming club event.'
                  }
                />
              ) : (
                <div className="divide-y divide-[#EFECE3]">
                  {displayedDirectionalRequests.map((req) => {
                    const isOwner = req.ownerClubId === club.id;
                    const partner = getClubById(
                      isOwner ? req.borrowerClubId : req.ownerClubId
                    );
                    const res = getResourceById(req.resourceId);
                    const overdue = isRequestOverdue(req);
                    const overdueDays = getOverdueDays(req);

                    return (
                      <RequestRow
                        key={req.id}
                        request={req}
                        title={`${partner?.acronym} · ${req.requestedQuantity} ${
                          res?.name || 'resource'
                        }`}
                        subtitle={`${req.eventName} · ${req.pickupDate} → ${req.expectedReturnDate}`}
                        overdue={overdue}
                        overdueDays={overdueDays}
                        onViewDetails={() =>
                          navigate('request_detail', { requestId: req.id })
                        }
                        actions={
                          <>
                            {isOwner && req.status === 'Pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectRemarks('');
                                    setRejectConfirmReqId(req.id);
                                  }}
                                  className="px-3.5 h-8 rounded-full border border-[#D4D1C7] text-xs font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => approveBorrowRequest(req.id)}
                                  className="px-4 h-8 rounded-full bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                                >
                                  Approve
                                </button>
                              </>
                            )}
                            {isOwner && req.status === 'Approved' && (
                              <button
                                type="button"
                                onClick={() => markPickedUp(req.id)}
                                className="px-3.5 h-8 rounded-full bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                              >
                                Mark Picked Up
                              </button>
                            )}
                            {isOwner && req.status === 'Return Pending' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVerifyId(req.id);
                                  const panel = document.getElementById('verify-return-panel');
                                  if (panel) {
                                    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                    panel.classList.add('ring-4', 'ring-[#2D4A35]/40');
                                    setTimeout(() => {
                                      panel.classList.remove('ring-4', 'ring-[#2D4A35]/40');
                                    }, 1500);
                                  }
                                }}
                                className="px-3.5 h-8 rounded-full border border-[#2D4A35] text-xs font-semibold text-[#2D4A35] hover:bg-[#EEF3EC] cursor-pointer"
                              >
                                Verify Return &rarr;
                              </button>
                            )}

                            {!isOwner &&
                              (req.status === 'Pending' ||
                                req.status === 'Approved') && (
                                <button
                                  type="button"
                                  onClick={() => setCancelConfirmReqId(req.id)}
                                  className="px-3.5 h-8 rounded-full border border-[#F0B7B4] text-xs font-medium text-[#8C2220] hover:bg-[#FDF2F2] cursor-pointer"
                                >
                                  Cancel Request
                                </button>
                              )}
                            {!isOwner && req.status === 'Approved' && (
                              <button
                                type="button"
                                onClick={() => markPickedUp(req.id)}
                                className="px-3.5 h-8 rounded-full bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                              >
                                Confirm Pickup
                              </button>
                            )}
                            {!isOwner && req.status === 'Borrowed' && (
                              <button
                                type="button"
                                onClick={() => markReturned(req.id)}
                                className="px-3.5 h-8 rounded-full bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                              >
                                Mark Returned
                              </button>
                            )}
                          </>
                        }
                      />
                    );
                  })}
                </div>
              )}

              <p className="text-[11px] text-[#6B766E] pt-1">
                Completed, Cancelled, and Rejected records are automatically saved to history.
              </p>
            </div>

            {/* Verify a return */}
            <div
              id="verify-return-panel"
              className="lg:col-span-5 bg-[#DCE7D8] rounded-3xl border border-[#C9DBC4] p-6 space-y-4 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#1F3626]">
                    Verify a return
                  </h2>
                  {activeReturnItem ? (
                    <p className="text-sm font-semibold text-[#1F3626] mt-0.5 tabular-nums">
                      {getClubById(activeReturnItem.borrowerClubId)?.acronym} –{' '}
                      {activeReturnItem.requestedQuantity}{' '}
                      {getResourceById(
                        activeReturnItem.resourceId
                      )?.name || 'resource'}
                    </p>
                  ) : (
                    <p className="text-xs text-[#4A554E] mt-1">
                      All returned items have been verified.
                    </p>
                  )}
                </div>
                <Box className="w-5 h-5 text-[#2D4A35]" />
              </div>

              {/* Multi-item queue switcher when there are 2 or more pending returns */}
              {returnsToVerify.length > 1 && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-white/60 border border-[#C9DBC4]">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[#2D4A35]">
                    <span>Items to verify ({returnsToVerify.length})</span>
                    <span className="text-[10px] text-[#526356] font-normal">Click item to switch</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {returnsToVerify.map((item, idx) => {
                      const isSelected = item.id === activeReturnItem?.id;
                      const res = getResourceById(item.resourceId);
                      const borrowerClub = getClubById(item.borrowerClubId);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedVerifyId(item.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#2D4A35] text-white shadow-sm ring-2 ring-[#2D4A35]/30'
                              : 'bg-white hover:bg-[#F4F8F3] text-[#1F3626] border border-[#C9DBC4]'
                          }`}
                        >
                          #{idx + 1} {borrowerClub?.acronym}: {res?.name || 'Resource'} ({item.requestedQuantity})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeReturnItem && (
                <form onSubmit={handleVerifySubmit} className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#1F3626] mb-1">
                        Reusable
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={activeReturnItem.requestedQuantity}
                        value={reusableCount}
                        onChange={(e) =>
                          setReusableCount(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="w-full h-10 px-3 rounded-xl bg-white border border-[#B9CEB3] text-sm font-semibold text-[#1F3626] tabular-nums focus:border-[#2D4A35] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1F3626] mb-1">
                        Damaged
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={activeReturnItem.requestedQuantity}
                        value={damagedCount}
                        onChange={(e) =>
                          setDamagedCount(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="w-full h-10 px-3 rounded-xl bg-white border border-[#B9CEB3] text-sm font-semibold text-[#1F3626] tabular-nums focus:border-[#2D4A35] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1F3626] mb-1">
                        Missing
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={activeReturnItem.requestedQuantity}
                        value={missingCount}
                        onChange={(e) =>
                          setMissingCount(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="w-full h-10 px-3 rounded-xl bg-white border border-[#B9CEB3] text-sm font-semibold text-[#1F3626] tabular-nums focus:border-[#2D4A35] focus:outline-none"
                      />
                    </div>
                  </div>

                  {verifyError && <InlineAlert message={verifyError} />}

                  <p className="text-[11px] text-[#3D4B41] leading-relaxed tabular-nums">
                    Confirm &rarr; Completed. Only {reusableCount} verified
                    reusable items replenish available stock; damaged/missing
                    stay excluded.
                  </p>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 h-10 rounded-full bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    Confirm verification
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Bottom Row: Active borrowing & lending + My resource inventory */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Active borrowing & lending */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E2D9] p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#1F3626]">
                Active borrowing &amp; lending
              </h2>

              {activeBorrowingLending.length === 0 ? (
                <p className="text-sm text-[#6B766E] py-6">
                  No active borrowing or lending items at the moment.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[11px] font-semibold uppercase tracking-wider text-[#6B766E] border-b border-[#EFECE3]">
                        <th className="py-2.5 pr-4">Resource / Direction</th>
                        <th className="py-2.5 px-3">Pickup → Return</th>
                        <th className="py-2.5 px-3">Request State</th>
                        <th className="py-2.5 pl-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EFE6] text-sm">
                      {activeBorrowingLending.map((req) => {
                        const res = getResourceById(req.resourceId);
                        const isOwner = req.ownerClubId === club.id;
                        const partner = getClubById(
                          isOwner ? req.borrowerClubId : req.ownerClubId
                        );
                        const overdue = isRequestOverdue(req);
                        return (
                          <tr key={req.id}>
                            <td className="py-3 pr-4">
                              <p className="font-semibold text-[#1F3626] tabular-nums">
                                {req.requestedQuantity}{' '}
                                {res?.name || 'Resource'}
                              </p>
                              <p className="text-xs text-[#6B766E]">
                                {isOwner
                                  ? `Lending to ${partner?.acronym}`
                                  : `Borrowing from ${partner?.acronym}`}
                                {req.returnedDate
                                  ? ` · Returned ${req.returnedDate}`
                                  : ''}
                              </p>
                            </td>
                            <td className="py-3 px-3 text-xs font-mono text-[#4A554E] tabular-nums whitespace-nowrap">
                              {req.pickupDate} → {req.expectedReturnDate}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <StatusBadge status={req.status} />
                                {overdue && <StatusBadge status="Overdue" />}
                              </div>
                            </td>
                            <td className="py-3 pl-3 text-right">
                              {req.status === 'Approved' && (
                                <button
                                  type="button"
                                  onClick={() => markPickedUp(req.id)}
                                  className="px-3 py-1 rounded-lg border border-[#D4D1C7] text-xs font-medium text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer whitespace-nowrap"
                                >
                                  Mark Picked Up
                                </button>
                              )}
                              {req.status === 'Borrowed' && (
                                <button
                                  type="button"
                                  onClick={() => markReturned(req.id)}
                                  className="px-3 py-1 rounded-lg border border-[#D4D1C7] text-xs font-medium text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer whitespace-nowrap"
                                >
                                  Mark Returned
                                </button>
                              )}
                              {req.status === 'Return Pending' && (
                                <span className="text-[11px] text-[#6B766E]">
                                  {isOwner ? 'Verify above' : 'Pending check'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* My resource inventory */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E5E2D9] p-6 space-y-4">
              <h2 className="text-lg font-bold text-[#1F3626]">
                My resource inventory
              </h2>

              <div className="divide-y divide-[#F2EFE6] max-h-[250px] overflow-y-auto pr-2">
                {myResources.map((res) => {
                  const availability = getResourceAvailability(res, club);
                  return (
                    <div
                      key={res.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1F3626] truncate">
                          {res.name}
                        </p>
                        <p className="text-xs text-[#6B766E] tabular-nums">
                          {res.totalUnits} total · {res.availableUnits} available ·{' '}
                          {res.reservedUnits} reserved · {res.borrowedUnits}{' '}
                          borrowed
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={availability} />
                        <button
                          type="button"
                          aria-label={`Actions for ${res.name}`}
                          onClick={() => setActionResource(res)}
                          className="w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-[#6B766E] pt-1">
                Availability &ne; request status. Archive keeps history.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Subtab 2: Events under MyClub */}
      {activeSubtab === 'events' && (
        <section className="bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#EFECE3] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-[#1F3626]">
                {club.acronym} Events
              </h2>
              <p className="text-xs text-[#6B766E] mt-0.5">
                Manage upcoming and past club events linked to resource borrowing requests.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateEvent}
              className="inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </button>
          </div>

          {clubEvents.length === 0 ? (
            <div className="p-8">
              <EmptyState
                title="No club events created yet"
                description="Create an event so your team can attach borrowing requests directly to upcoming activities."
                actionLabel="Create First Event"
                onAction={openCreateEvent}
              />
            </div>
          ) : (
            <div className="divide-y divide-[#F2EFE6]">
              {clubEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F2]"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-[#1F3626]">
                        {ev.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-[#2D4A35] tabular-nums">
                        <Calendar className="w-3.5 h-3.5" />
                        {ev.date}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A554E]">
                      <span className="font-semibold text-[#1F3626]">Purpose:</span>{' '}
                      {ev.purpose}
                    </p>
                    {ev.description && (
                      <p className="text-xs text-[#6B766E]">{ev.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => openEditEvent(ev)}
                      className="inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl border border-[#D4D1C7] text-xs font-semibold text-[#1F3626] hover:bg-white cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete the event "${ev.name}"?`)) {
                          deleteEvent(ev.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Subtab 3: Club Profile View & Edit (Restricted to own representative) */}
      {activeSubtab === 'profile' && (
        <section className="bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-8 max-w-3xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#EFECE3]">
            <div className="flex items-center gap-3.5">
              <ClubLogo club={club} size="md" />
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-[#1F3626]">
                    Club Profile
                  </h2>
                  <StatusBadge status={club.status} />
                </div>
                <p className="text-xs text-[#6B766E] mt-1">
                  Only authorized representatives of {club.acronym} can update this profile.
                </p>
              </div>
            </div>

            {!profileEditing && isOwnRep && (
              <button
                type="button"
                onClick={() => setProfileEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>

          {!isOwnRep && (
            <InlineAlert
              tone="info"
              message="Read-only preview: Sign in as this club's representative to edit its profile details."
            />
          )}

          {profError && <InlineAlert message={profError} />}

          {profileEditing && isOwnRep ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#EFECE3] flex flex-wrap items-center gap-4">
                <ClubLogo
                  club={{ ...club, logoUrl: profLogoUrl || undefined }}
                  size="lg"
                />
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs font-semibold text-[#1F3626]">
                    Club Profile Picture / Logo
                  </p>
                  <p className="text-[11px] text-[#6B766E] mt-0.5">
                    PNG, JPG, or WEBP up to 3 MB. Shown on your club profile and resource listings.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <label className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-lg bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Upload New Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfileLogoUpload}
                        className="sr-only"
                      />
                    </label>
                    {profLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setProfLogoUrl('')}
                        className="inline-flex items-center gap-1 px-3 h-8 rounded-lg border border-[#D4D1C7] bg-white hover:bg-[#F2EFE6] text-xs font-medium text-[#4A554E] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Club Name *
                </label>
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={profDesc}
                  onChange={(e) => setProfDesc(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={profEmail}
                    onChange={(e) => setProfEmail(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                    PIC Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm font-mono text-[#1F3626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Storeroom / Collection Location *
                </label>
                <input
                  type="text"
                  required
                  value={profLoc}
                  onChange={(e) => setProfLoc(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfLogoUrl(club.logoUrl || '');
                    setProfError('');
                    setProfileEditing(false);
                  }}
                  className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-xs font-medium text-[#3D4B41] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-[#6B766E]">
                  Club Name
                </dt>
                <dd className="mt-1 font-semibold text-[#1F3626]">
                  {club.name} ({club.acronym})
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-[#6B766E]">
                  Description
                </dt>
                <dd className="mt-1 text-[#4A554E] leading-relaxed">
                  {club.description}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#6B766E]">
                  Contact Email
                </dt>
                <dd className="mt-1 font-medium text-[#1F3626]">
                  {club.contactEmail}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#6B766E]">
                  PIC Phone Number
                </dt>
                <dd className="mt-1 font-mono font-medium text-[#1F3626]">
                  {club.picPhone}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#6B766E]">
                  Primary Storeroom
                </dt>
                <dd className="mt-1 text-[#1F3626]">{club.storageLocation}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-[#6B766E]">
                  Account Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge status={club.status} />
                </dd>
              </div>
            </dl>
          )}
        </section>
      )}

      {/* Modal 1: Complete Add a Resource Form + Save-Success State */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-7 relative shadow-xl my-8">
            <button
              type="button"
              onClick={() => {
                setAddSuccessName(null);
                setAddOpen(false);
              }}
              className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {addSuccessName ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#EEF3EC] text-[#2D4A35] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1F3626]">
                    Resource saved!
                  </h2>
                  <p className="text-sm text-[#4A554E] mt-1">
                    <span className="font-semibold text-[#1F3626]">
                      {addSuccessName}
                    </span>{' '}
                    has been added to {club.acronym}&apos;s inventory and is now
                    visible in the Marketplace.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAddSuccessName(null)}
                    className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-xs font-semibold text-[#1F3626] cursor-pointer"
                  >
                    Add Another Resource
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddSuccessName(null);
                      setAddOpen(false);
                    }}
                    className="px-5 h-10 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-[#1F3626]">
                  Add a resource
                </h2>
                <p className="text-xs text-[#6B766E] mt-1">
                  Publish reusable equipment under {club.acronym}.
                </p>

                {addResError && (
                  <div className="mt-3">
                    <InlineAlert message={addResError} />
                  </div>
                )}

                <form
                  onSubmit={handleAddResource}
                  noValidate
                  className="mt-4 space-y-3.5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                      Resource Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newResName}
                      onChange={(e) => setNewResName(e.target.value)}
                      placeholder="e.g. Event banner stands"
                      className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                        Category *
                      </label>
                      <select
                        value={newResCategory}
                        onChange={(e) =>
                          setNewResCategory(e.target.value as ResourceCategory)
                        }
                        className="w-full h-10 px-3 rounded-xl border border-[#D4D1C7] text-sm bg-white text-[#1F3626]"
                      >
                        <option value="Decorations">Decorations</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Audio Equipment">Audio Equipment</option>
                        <option value="Lighting">Lighting</option>
                        <option value="Electronics">Electronics</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                        Condition *
                      </label>
                      <select
                        value={newResCondition}
                        onChange={(e) =>
                          setNewResCondition(
                            e.target.value as 'Excellent' | 'Good' | 'Fair'
                          )
                        }
                        className="w-full h-10 px-3 rounded-xl border border-[#D4D1C7] text-sm bg-white text-[#1F3626]"
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                        Total Quantity *
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={newResQty}
                        onChange={(e) =>
                          setNewResQty(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm font-semibold tabular-nums text-[#1F3626]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                      Pickup / Storage Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={newResLocation}
                      onChange={(e) => setNewResLocation(e.target.value)}
                      placeholder="e.g. PEKOM Storeroom · Block A"
                      className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                      Description *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newResDesc}
                      onChange={(e) => setNewResDesc(e.target.value)}
                      placeholder="Dimensions, included accessories, or setup details..."
                      className="w-full p-3 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                      Handling Remarks
                    </label>
                    <input
                      type="text"
                      value={newResRemarks}
                      onChange={(e) => setNewResRemarks(e.target.value)}
                      placeholder="e.g. Wipe clean and return in original crate"
                      className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                        Est. Unit Cost (MYR, optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={newResCostMYR}
                        onChange={(e) => setNewResCostMYR(e.target.value)}
                        placeholder="e.g. 85"
                        className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm font-mono tabular-nums text-[#1F3626]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                        Est. Weight (kg, optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.1"
                        value={newResWeightKg}
                        onChange={(e) => setNewResWeightKg(e.target.value)}
                        placeholder="e.g. 2.5"
                        className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm font-mono tabular-nums text-[#1F3626]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                      Resource Image (optional upload)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-4 h-10 rounded-xl border border-[#D4D1C7] bg-[#FAF8F2] hover:bg-[#EFECE3] text-xs font-semibold text-[#1F3626] cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <div className="w-12 h-10 rounded-xl overflow-hidden border border-[#E5E2D9] shrink-0">
                        <ResourceImage
                          src={newResImage || CATEGORY_DEFAULT_IMAGE[newResCategory]}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[11px] text-[#6B766E]">
                        {newResImage ? 'Custom image uploaded' : 'Using category photo'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setAddOpen(false)}
                      className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-xs font-medium text-[#3D4B41] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
                    >
                      Save Resource
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal 2: History (Completed, Cancelled, Rejected) */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-7 relative shadow-xl">
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold text-[#1F3626]">
              Request &amp; resource history
            </h2>
            <p className="text-xs text-[#6B766E] mt-1">
              Completed, Cancelled, and Rejected records for {club.acronym}.
            </p>

            <div className="flex items-center gap-1.5 mt-4 bg-[#F2EFE6] p-1 rounded-xl w-fit">
              {(['All', 'Completed', 'Cancelled', 'Rejected'] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setHistoryFilter(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                      historyFilter === tab
                        ? 'bg-white text-[#1F3626] shadow-sm'
                        : 'text-[#6B766E] hover:text-[#1F3626]'
                    }`}
                  >
                    {tab}
                  </button>
                )
              )}
            </div>

            <div className="mt-4 max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {filteredHistory.length === 0 ? (
                <p className="text-sm text-[#6B766E] py-6 text-center">
                  No {historyFilter.toLowerCase()} records yet.
                </p>
              ) : (
                filteredHistory.map((req) => {
                  const res = getResourceById(req.resourceId);
                  const isOwner = req.ownerClubId === club.id;
                  const partner = getClubById(
                    isOwner ? req.borrowerClubId : req.ownerClubId
                  );
                  return (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#EFECE3] flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-[#1F3626] tabular-nums">
                          {isOwner ? 'Lent to' : 'Borrowed from'}{' '}
                          {partner?.acronym} · {req.requestedQuantity}{' '}
                          {res?.name || 'Resource'}
                        </p>
                        <p className="text-[11px] text-[#6B766E] font-mono tabular-nums mt-0.5">
                          {req.eventName} · {req.pickupDate} →{' '}
                          {req.expectedReturnDate}
                        </p>
                        {req.verification && (
                          <p className="text-[11px] text-[#2D4A35] mt-0.5 tabular-nums">
                            Verified: {req.verification.reusable} reusable ·{' '}
                            {req.verification.damaged} damaged ·{' '}
                            {req.verification.missing} missing
                          </p>
                        )}
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end mt-5">
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="px-5 h-9 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Event Modal */}
      {eventModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-7 relative shadow-xl">
            <button
              type="button"
              onClick={() => setEventModalOpen(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-xl font-bold text-[#1F3626]">
              {editingEvent ? 'Edit Club Event' : 'Create Club Event'}
            </h2>
            <p className="text-xs text-[#6B766E] mt-1">
              {club.acronym} event details
            </p>

            <form
              onSubmit={handleEventSubmit}
              noValidate
              className="mt-4 space-y-3.5"
            >
              {evtError && <InlineAlert message={evtError} />}
              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={evtName}
                  onChange={(e) => setEvtName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={evtDate}
                  onChange={(e) => setEvtDate(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm font-mono text-[#1F3626]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Purpose *
                </label>
                <input
                  type="text"
                  required
                  value={evtPurpose}
                  onChange={(e) => setEvtPurpose(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={evtDesc}
                  onChange={(e) => setEvtDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 h-9 rounded-xl border border-[#D4D1C7] text-xs font-medium text-[#3D4B41] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-9 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold cursor-pointer"
                >
                  {editingEvent ? 'Save Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Actions Menu */}
      {actionResource && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xs bg-white rounded-3xl border border-[#E5E2D9] p-6 relative shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold text-[#1F3626]">
                  Resource actions
                </h2>
                <p className="text-xs text-[#6B766E] mt-0.5">
                  {actionResource.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionResource(null)}
                className="text-xs font-medium text-[#6B766E] hover:text-[#1F3626] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  openEditResource(actionResource);
                  setActionResource(null);
                }}
                className="w-full h-10 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold hover:bg-[#233B2A] cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit resource details
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditQtyResource(actionResource);
                  setEditQtyValue(actionResource.totalUnits);
                  setEditQtyError('');
                  setActionResource(null);
                }}
                className="w-full h-10 rounded-xl border border-[#D4D1C7] text-xs font-semibold text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer"
              >
                Edit quantity only
              </button>
              <button
                type="button"
                onClick={() => {
                  toggleResourceAvailability(actionResource.id);
                  setActionResource(null);
                }}
                className="w-full h-10 rounded-xl border border-[#D4D1C7] text-xs font-semibold text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer"
              >
                Toggle availability
              </button>
              <button
                type="button"
                onClick={() => {
                  setArchiveConfirmResource(actionResource);
                  setActionResource(null);
                }}
                className="w-full h-10 rounded-xl border border-[#F0B7B4] text-xs font-semibold text-[#8C2220] hover:bg-[#FDF2F2] cursor-pointer"
              >
                Archive resource
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Resource Details Form */}
      {editResourceModal && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-7 relative shadow-xl my-8">
            <button
              type="button"
              onClick={() => setEditResourceModal(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-xl font-bold text-[#1F3626]">
              Edit Resource Details
            </h2>
            <p className="text-xs text-[#6B766E] mt-1">
              Update details, availability, and inventory for {editResourceModal.name}.
            </p>

            {editResError && (
              <div className="mt-3">
                <InlineAlert message={editResError} />
              </div>
            )}

            <form
              onSubmit={handleEditResourceSubmit}
              noValidate
              className="mt-4 space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Resource Name *
                </label>
                <input
                  type="text"
                  required
                  value={editResName}
                  onChange={(e) => setEditResName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                    Category *
                  </label>
                  <select
                    value={editResCategory}
                    onChange={(e) =>
                      setEditResCategory(e.target.value as ResourceCategory)
                    }
                    className="w-full h-10 px-3 rounded-xl border border-[#D4D1C7] text-sm bg-white text-[#1F3626]"
                  >
                    <option value="Decorations">Decorations</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Audio Equipment">Audio Equipment</option>
                    <option value="Lighting">Lighting</option>
                    <option value="Electronics">Electronics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                    Condition *
                  </label>
                  <select
                    value={editResCondition}
                    onChange={(e) =>
                      setEditResCondition(
                        e.target.value as 'Excellent' | 'Good' | 'Fair'
                      )
                    }
                    className="w-full h-10 px-3 rounded-xl border border-[#D4D1C7] text-sm bg-white text-[#1F3626]"
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                    Total Quantity *
                  </label>
                  <input
                    type="number"
                    min={editResourceModal.reservedUnits + editResourceModal.borrowedUnits}
                    required
                    value={editResQty}
                    onChange={(e) =>
                      setEditResQty(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm font-semibold tabular-nums text-[#1F3626]"
                  />
                  <p className="text-[10px] text-[#6B766E] mt-0.5">
                    Min: {editResourceModal.reservedUnits + editResourceModal.borrowedUnits} (committed)
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Pickup / Storage Location *
                </label>
                <input
                  type="text"
                  required
                  value={editResLocation}
                  onChange={(e) => setEditResLocation(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editResDesc}
                  onChange={(e) => setEditResDesc(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Handling Remarks
                </label>
                <input
                  type="text"
                  value={editResRemarks}
                  onChange={(e) => setEditResRemarks(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                    Unit Cost (RM)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editResCostMYR}
                    onChange={(e) => setEditResCostMYR(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm tabular-nums text-[#1F3626]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                    Unit Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    value={editResWeightKg}
                    onChange={(e) => setEditResWeightKg(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm tabular-nums text-[#1F3626]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Resource Photo
                </label>
                <div className="flex items-center gap-3">
                  {editResImage ? (
                    <img
                      src={editResImage}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-[#D4D1C7]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#F4F1EA] border border-[#D4D1C7] flex items-center justify-center text-[#6B766E]">
                      <Upload className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleEditResourceImageUpload}
                      className="block w-full text-xs text-[#6B766E] file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#EEF3EC] file:text-[#2D4A35] hover:file:bg-[#DFEBDC] cursor-pointer"
                    />
                    <p className="text-[10px] text-[#6B766E] mt-1">
                      PNG, JPG, or WEBP up to 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EFECE3]">
                <button
                  type="button"
                  onClick={() => setEditResourceModal(null)}
                  className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-xs font-semibold text-[#1F3626] hover:bg-[#FAF8F2] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 h-10 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold hover:bg-[#233B2A] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resource Quantity Modal */}
      {editQtyResource && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E2D9] p-6 relative shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-[#1F3626]">
              Edit resource quantity
            </h2>
            <p className="text-xs text-[#6B766E]">{editQtyResource.name}</p>

            <div>
              <input
                type="number"
                min={
                  editQtyResource.reservedUnits + editQtyResource.borrowedUnits
                }
                value={editQtyValue}
                onChange={(e) =>
                  setEditQtyValue(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-full h-11 px-3.5 rounded-xl border border-[#D4D1C7] text-base font-bold text-[#1F3626] tabular-nums"
              />
              <p className="text-[11px] text-[#6B766E] mt-1.5 tabular-nums">
                Total {editQtyResource.totalUnits} · Reserved{' '}
                {editQtyResource.reservedUnits} · Borrowed{' '}
                {editQtyResource.borrowedUnits}
              </p>
              {editQtyError && (
                <p className="text-xs font-medium text-[#8C2220] mt-1">
                  {editQtyError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditQtyResource(null)}
                className="px-4 h-9 rounded-xl border border-[#D4D1C7] text-xs font-medium text-[#3D4B41] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = editResourceQuantity(
                    editQtyResource.id,
                    editQtyValue
                  );
                  if (!res.ok) {
                    setEditQtyError(res.error || 'Cannot update quantity.');
                    return;
                  }
                  setEditQtyResource(null);
                }}
                className="px-5 h-9 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold cursor-pointer"
              >
                Save quantity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(archiveConfirmResource)}
        title="Archive this resource?"
        description={`Archiving hides ${archiveConfirmResource?.name || 'this resource'} from the Marketplace while keeping its borrowing history intact.`}
        confirmLabel="Confirm archive"
        onConfirm={() => {
          if (!archiveConfirmResource) return;
          const result = archiveResource(archiveConfirmResource.id);
          const target = archiveConfirmResource;
          setArchiveConfirmResource(null);
          if (result.blocked) {
            setBlockedResource(target);
          }
        }}
        onClose={() => setArchiveConfirmResource(null)}
      />

      {/* Cancel Request Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(cancelConfirmReqId)}
        tone="danger"
        title="Cancel this borrowing request?"
        description="Cancelling moves this request to your club history as Cancelled and releases any reserved stock."
        confirmLabel="Confirm Cancel"
        onConfirm={() => {
          if (cancelConfirmReqId) cancelBorrowRequest(cancelConfirmReqId);
          setCancelConfirmReqId(null);
        }}
        onClose={() => setCancelConfirmReqId(null)}
      />

      {/* Blocked Archive Modal */}
      {blockedResource && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl border border-[#E5E2D9] p-6 relative shadow-xl space-y-3">
            <h2 className="text-lg font-bold text-[#1F3626]">
              This resource is in use
            </h2>
            <p className="text-xs text-[#4A554E] leading-relaxed">
              Finish its reserved requests or active loan for{' '}
              <span className="font-semibold">{blockedResource.name}</span> before
              archiving. No stock or history has been changed.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setBlockedResource(null)}
                className="px-5 h-9 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Borrow Request Modal with Rejection Remarks */}
      {rejectConfirmReqId && (
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
              Provide a reason or rejection remarks for the borrowing club.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                Rejection Remarks / Reason
              </label>
              <textarea
                rows={3}
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                placeholder="e.g. Resource reserved for internal club event / Maintenance required..."
                className="w-full p-3 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#8C2220] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectConfirmReqId(null)}
                className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-xs font-semibold text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  rejectBorrowRequest(rejectConfirmReqId, rejectRemarks.trim() || undefined);
                  setRejectConfirmReqId(null);
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
