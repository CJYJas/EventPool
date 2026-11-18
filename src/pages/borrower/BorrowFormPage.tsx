import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CalendarPlus, CheckCircle2, MapPin, Plus, ShieldCheck, Users, X } from 'lucide-react';
import { Card } from '../../components/Card';
import { FormField, fieldInputClass } from '../../components/FormField';
import { ResourceImage } from '../../components/ResourceImage';
import { EmptyState, ErrorRetryState, InlineAlert, LoadingSkeleton } from '../../components/StateBlocks';
import { StatusBadge } from '../../components/StatusBadge';
import { getResourceAvailability, useApp } from '../../context/AppContext';
import { useResourceDetail } from '../../hooks/useResourceDetail';
import {
  addDaysISO,
  buildBorrowPayload,
  createClubEvent,
  describeBorrowError,
  fetchClubEvents,
  getRequestBlocker,
  submitBorrowingRequest,
  todayISO,
  validateBorrowForm,
  type BorrowFormErrors,
  type BorrowSubmission,
} from '../../services/borrowing';
import type { ClubEvent } from '../../types/eventpool';

export const BorrowFormPage: React.FC = () => {
  const { selectedResourceId, currentUser, navigate } = useApp();
  const { resource, club: ownerClub, status: loadStatus, error: loadError, reload } =
    useResourceDetail(selectedResourceId);

  const borrowerName = currentUser?.name || 'Your club';

  // Events come from GET /api/events (scoped to the signed-in club)
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [eventsStatus, setEventsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const loadEvents = useCallback(async () => {
    setEventsStatus('loading');
    try {
      setEvents(await fetchClubEvents());
      setEventsStatus('ready');
    } catch {
      setEventsStatus('error');
    }
  }, []);
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [purpose, setPurpose] = useState('');
  const [wouldOtherwisePurchase, setWouldOtherwisePurchase] = useState<boolean | null>(null);
  const [remarks, setRemarks] = useState('');
  const [pickupDate, setPickupDate] = useState(() => addDaysISO(1));
  const [expectedReturnDate, setExpectedReturnDate] = useState(() => addDaysISO(3));

  const [fieldErrors, setFieldErrors] = useState<BorrowFormErrors & Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<BorrowSubmission | null>(null);

  // Inline create-event modal
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newEvtName, setNewEvtName] = useState('');
  const [newEvtDate, setNewEvtDate] = useState(() => addDaysISO(7));
  const [newEvtPurpose, setNewEvtPurpose] = useState('');
  const [newEvtDesc, setNewEvtDesc] = useState('');
  const [newEvtError, setNewEvtError] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  const backToResource = () =>
    selectedResourceId
      ? navigate('resource_detail', { resourceId: selectedResourceId })
      : navigate('marketplace');

  if (loadStatus === 'not_found') {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          title="Resource not found"
          description="This resource may have been removed or archived by its owner club."
          actionLabel="Browse Marketplace"
          onAction={() => navigate('marketplace')}
        />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12">
        {loadStatus === 'error' ? (
          <ErrorRetryState message={loadError} onRetry={reload} />
        ) : (
          <LoadingSkeleton rows={4} />
        )}
      </div>
    );
  }

  const availability = getResourceAvailability(resource, ownerClub);
  const blocker = getRequestBlocker(resource, ownerClub, currentUser, availability);
  const ownerName = ownerClub?.name || 'the owner club';
  const selectedEvent = events.find((ev) => ev.id === selectedEventId);

  if (blocker) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12">
        <EmptyState
          title="This resource cannot be requested"
          description={blocker}
          actionLabel="Back to resource"
          onAction={backToResource}
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white rounded-3xl border border-[#E5E2D9] p-8 text-center space-y-4" role="status">
          <div className="w-14 h-14 rounded-full bg-[#EEF3EC] text-[#2D4A35] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F3626]">Request submitted</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-[#4A554E]">
            Status: <StatusBadge status={submitted.status as 'Pending'} />
          </div>
          <p className="text-sm text-[#4A554E] leading-relaxed">
            Your request for {quantity} x {resource.name} has been sent to {ownerName}. Stock is only
            reserved once they approve it, so wait for approval before collecting.
          </p>
          {submitted.requestId && (
            <p className="text-xs text-[#6B766E] font-mono">Reference: {submitted.requestId}</p>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('marketplace')}
              className="px-5 h-10 rounded-xl border border-[#D4D1C7] text-sm font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
            >
              Back to Marketplace
            </button>
            <button
              type="button"
              onClick={() => navigate('my_club')}
              className="px-5 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold cursor-pointer"
            >
              Go to My Club
            </button>
          </div>
        </div>
      </div>
    );
  }

  const clearError = (key: string) => setFieldErrors((p) => ({ ...p, [key]: undefined }));

  const handleSelectExistingEvent = (evtId: string) => {
    setSelectedEventId(evtId);
    clearError('eventId');
    const found = events.find((e) => e.id === evtId);
    if (found && !purpose.trim()) {
      setPurpose(found.purpose);
      clearError('purpose');
    }
  };

  const handleCreateInlineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewEvtError('');
    if (!newEvtName.trim() || !newEvtDate || !newEvtPurpose.trim()) {
      setNewEvtError('Event name, date, and purpose are required.');
      return;
    }
    setCreatingEvent(true);
    try {
      const created = await createClubEvent({
        name: newEvtName,
        date: newEvtDate,
        purpose: newEvtPurpose,
        description: newEvtDesc,
      });
      setEvents((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      setSelectedEventId(created.id);
      clearError('eventId');
      if (!purpose.trim()) setPurpose(created.purpose);
      setNewEvtName('');
      setNewEvtPurpose('');
      setNewEvtDesc('');
      setNewEventOpen(false);
    } catch (err) {
      setNewEvtError(describeBorrowError(err).replace('submit your request', 'create the event'));
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    const values = {
      eventId: selectedEventId,
      quantity,
      purpose,
      wouldHavePurchased: wouldOtherwisePurchase,
      pickupDate,
      expectedReturnDate,
    };
    const errors = validateBorrowForm(values, resource.availableUnits, todayISO());
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setFormError('Please fix the highlighted fields before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      setSubmitted(await submitBorrowingRequest(buildBorrowPayload(resource.id, values, remarks)));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(describeBorrowError(err));
      reload(); // stock may have changed - refresh the resource
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs text-[#6B766E] mb-1">
            Marketplace / {resource.name} / Request to borrow
          </p>
          <h1 className="text-3xl font-bold text-[#1F3626]">
            Borrowing Request Form
          </h1>
          <p className="text-sm text-[#4A554E] mt-1">
            Make room for your next event. Put shared resources to good use.
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#DCE7D8] text-xs font-semibold text-[#23452C] self-start sm:self-auto">
          Borrowing request
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Card */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="lg:col-span-8 bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-8 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EFECE3]">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#EEF3EC] flex items-center justify-center text-[#2D4A35]">
                <Users className="w-5 h-5" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B766E]">
                  Requesting on behalf of
                </p>
                <p className="text-sm font-bold text-[#1F3626]">
                  {borrowerName} · Universiti Malaya
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#DCE7D8] text-xs font-semibold text-[#23452C]">
              Authorized representative
            </span>
          </div>

          {formError && <InlineAlert message={formError} />}

          {/* Existing Event Selector + Create Event Route */}
          <div className="p-4 rounded-2xl bg-[#FAF8F2] border border-[#EFECE3] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-[#1F3626]">
                Select an existing club event or create a new one *
              </label>
              <button
                type="button"
                onClick={() => setNewEventOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2D4A35] hover:underline cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create new event
              </button>
            </div>

            <select
              value={selectedEventId}
              onChange={(e) => handleSelectExistingEvent(e.target.value)}
              disabled={eventsStatus === 'loading'}
              aria-label="Club event"
              aria-invalid={fieldErrors.eventId ? true : undefined}
              className={`w-full h-10 px-3.5 rounded-xl bg-white border text-sm text-[#1F3626] focus:outline-none ${
                fieldErrors.eventId ? 'border-[#8C2220]' : 'border-[#D4D1C7] focus:border-[#2D4A35]'
              }`}
            >
              <option value="">
                {eventsStatus === 'loading' ? 'Loading events...' : 'Choose from your club events...'}
              </option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.date})
                </option>
              ))}
            </select>
            {eventsStatus === 'error' && (
              <p className="text-[11px] font-medium text-[#8C2220]">
                Could not load your events.{' '}
                <button type="button" onClick={loadEvents} className="underline cursor-pointer">
                  Retry
                </button>
              </p>
            )}
            {eventsStatus === 'ready' && events.length === 0 && (
              <p className="text-[11px] text-[#6B766E]">
                Your club has no events yet. Use "Create new event" to add one.
              </p>
            )}
            {fieldErrors.eventId && (
              <p className="text-[11px] font-medium text-[#8C2220]">{fieldErrors.eventId}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <p className="block text-xs font-semibold text-[#1F3626] mb-1.5">Selected event</p>
              <div className="w-full min-h-11 px-3.5 py-2.5 rounded-xl border border-[#EFECE3] bg-[#FAF8F2] text-sm text-[#1F3626]">
                {selectedEvent ? (
                  <span>
                    {selectedEvent.name}{' '}
                    <span className="text-[#6B766E] font-mono text-xs">({selectedEvent.date})</span>
                  </span>
                ) : (
                  <span className="text-[#6B766E]">No event selected</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Requested quantity *
              </label>
              <input
                type="number"
                min={1}
                max={Math.max(1, resource.availableUnits)}
                value={Number.isNaN(quantity) ? '' : quantity}
                onChange={(e) => {
                  setQuantity(e.target.value === '' ? Number.NaN : Number(e.target.value));
                  clearError('quantity');
                }}
                className={`w-full h-11 px-3.5 rounded-xl border text-sm font-semibold text-[#1F3626] tabular-nums focus:outline-none ${
                  fieldErrors.quantity
                    ? 'border-[#8C2220] bg-[#FDF2F2]/40'
                    : 'border-[#D4D1C7] focus:border-[#2D4A35]'
                }`}
              />
              {fieldErrors.quantity ? (
                <p className="text-[11px] font-medium text-[#8C2220] mt-1">
                  {fieldErrors.quantity}
                </p>
              ) : (
                <p className="text-[11px] text-[#6B766E] mt-1 tabular-nums">
                  Enter 1–{resource.availableUnits}. {resource.availableUnits}{' '}
                  currently available.
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
              Purpose of borrowing *
            </label>
            <textarea
              rows={3}
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                clearError('purpose');
              }}
              placeholder="Explain how this equipment will be used and handled during your event..."
              className={`w-full p-3.5 rounded-xl border text-sm text-[#1F3626] focus:outline-none ${
                fieldErrors.purpose
                  ? 'border-[#8C2220] bg-[#FDF2F2]/40'
                  : 'border-[#D4D1C7] focus:border-[#2D4A35]'
              }`}
            />
            {fieldErrors.purpose && (
              <p className="text-[11px] font-medium text-[#8C2220] mt-1">
                {fieldErrors.purpose}
              </p>
            )}
          </div>

          {/* Required "Would your club otherwise purchase this item?" Yes/No control */}
          <div
            className={`p-4 rounded-2xl border ${
              fieldErrors.purchase
                ? 'border-[#8C2220] bg-[#FDF2F2]/40'
                : 'border-[#EFECE3] bg-[#FAF8F2]'
            }`}
          >
            <p className="text-xs font-semibold text-[#1F3626]">
              Would your club otherwise purchase this item? *
            </p>
            <p className="text-[11px] text-[#6B766E] mt-0.5">
              Used to measure expenditure avoided across UM clubs (no borrowing fee is deducted).
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => {
                  setWouldOtherwisePurchase(true);
                  clearError('purchase');
                }}
                className={`px-5 h-9 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  wouldOtherwisePurchase === true
                    ? 'bg-[#2D4A35] text-white border-[#2D4A35]'
                    : 'bg-white text-[#1F3626] border-[#D4D1C7] hover:bg-[#F2EFE6]'
                }`}
              >
                Yes, we would buy new
              </button>
              <button
                type="button"
                onClick={() => {
                  setWouldOtherwisePurchase(false);
                  clearError('purchase');
                }}
                className={`px-5 h-9 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  wouldOtherwisePurchase === false
                    ? 'bg-[#2D4A35] text-white border-[#2D4A35]'
                    : 'bg-white text-[#1F3626] border-[#D4D1C7] hover:bg-[#F2EFE6]'
                }`}
              >
                No, we would manage without
              </button>
            </div>
            {fieldErrors.purchase && (
              <p className="text-[11px] font-medium text-[#8C2220] mt-2">
                {fieldErrors.purchase}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Pickup date *
              </label>
              <input
                type="date"
                min={todayISO()}
                value={pickupDate}
                onChange={(e) => {
                  setPickupDate(e.target.value);
                  clearError('pickupDate');
                }}
                className={`w-full h-11 px-3.5 rounded-xl border text-sm font-mono text-[#1F3626] tabular-nums focus:outline-none ${
                  fieldErrors.pickupDate
                    ? 'border-[#8C2220] bg-[#FDF2F2]/40'
                    : 'border-[#D4D1C7] focus:border-[#2D4A35]'
                }`}
              />
              {fieldErrors.pickupDate ? (
                <p className="text-[11px] font-medium text-[#8C2220] mt-1">
                  {fieldErrors.pickupDate}
                </p>
              ) : (
                <p className="text-[11px] text-[#6B766E] mt-1">
                  Collect from the owner&apos;s storage location.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Expected return date *
              </label>
              <input
                type="date"
                min={pickupDate || todayISO()}
                value={expectedReturnDate}
                onChange={(e) => {
                  setExpectedReturnDate(e.target.value);
                  clearError('expectedReturnDate');
                }}
                className={`w-full h-11 px-3.5 rounded-xl border text-sm font-mono text-[#1F3626] tabular-nums focus:outline-none ${
                  fieldErrors.expectedReturnDate
                    ? 'border-[#8C2220] bg-[#FDF2F2]/40'
                    : 'border-[#D4D1C7] focus:border-[#2D4A35]'
                }`}
              />
              {fieldErrors.expectedReturnDate ? (
                <p className="text-[11px] font-medium text-[#8C2220] mt-1">
                  {fieldErrors.expectedReturnDate}
                </p>
              ) : (
                <p className="text-[11px] text-[#6B766E] mt-1">
                  Must be after the pickup date.
                </p>
              )}
            </div>
          </div>

          <FormField label="Request remarks (optional)">
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Preferred pickup timing or logistics notes for owner club..."
              className={fieldInputClass(false)}
            />
          </FormField>

          <div className="rounded-2xl bg-[#DCE7D8] p-4 flex items-start gap-3 text-xs text-[#2D4A35]">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Your personal contact details are not public. Coordination details
              are shared only with authorized club representatives.
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <span className="text-xs text-[#6B766E]">* Required fields</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={backToResource}
                className="px-5 h-10 rounded-xl border border-[#D4D1C7] text-sm font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] disabled:bg-[#9BA89E] disabled:cursor-not-allowed text-white text-sm font-semibold cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </form>

        {/* Right Summary Column */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-3xl border border-[#E5E2D9] overflow-hidden">
            <div className="h-40">
              <ResourceImage
                src={resource.images[0]}
                alt={resource.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold text-[#1F3626]">
                  {resource.name}
                </h2>
                <StatusBadge status={availability} />
              </div>
              <p className="text-xs text-[#6B766E]">
                Owned by {ownerClub?.name || 'UM Club'} · {resource.category}
              </p>
              <p className="text-xs text-[#4A554E] tabular-nums">
                Condition: {resource.condition} · {resource.availableUnits}{' '}
                available
              </p>
              <p className="text-xs text-[#6B766E] flex items-center gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                {resource.location}
              </p>
            </div>
          </div>

          <Card padding="md" className="space-y-3">
            <h3 className="text-base font-bold text-[#1F3626]">
              Your request at a glance
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#6B766E]">Quantity</span>
                <span className="font-semibold text-[#1F3626] tabular-nums">
                  {Number.isNaN(quantity) ? 0 : quantity} {resource.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B766E]">Borrowing period</span>
                <span className="font-semibold text-[#1F3626] font-mono tabular-nums">
                  {pickupDate} → {expectedReturnDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B766E]">Would otherwise buy</span>
                <span className="font-semibold text-[#1F3626]">
                  {wouldOtherwisePurchase === null
                    ? 'Not selected'
                    : wouldOtherwisePurchase
                    ? 'Yes'
                    : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B766E]">Borrower</span>
                <span className="font-semibold text-[#1F3626]">{borrowerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B766E]">Status after submission</span>
                <StatusBadge status="Pending" />
              </div>
            </div>
            <p className="text-[11px] text-[#6B766E] pt-2 border-t border-[#EFECE3] leading-relaxed">
              Submitting creates a Pending request. Stock is only reserved once{' '}
              {ownerName} approves. Please wait for approval before
              collecting.
            </p>
          </Card>
        </div>
      </div>

      {/* Inline Create Event Modal */}
      {newEventOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-7 relative shadow-xl">
            <button
              type="button"
              onClick={() => setNewEventOpen(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-9 h-9 rounded-xl bg-[#EEF3EC] flex items-center justify-center text-[#2D4A35]">
                <CalendarPlus className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#1F3626]">
                  Create Club Event
                </h2>
                <p className="text-xs text-[#6B766E]">
                  Added to your club events and linked to this request
                </p>
              </div>
            </div>

            <form
              onSubmit={handleCreateInlineEvent}
              noValidate
              className="space-y-3.5 mt-4"
            >
              {newEvtError && <InlineAlert message={newEvtError} />}
              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={newEvtName}
                  onChange={(e) => setNewEvtName(e.target.value)}
                  placeholder="e.g. FSKTM Charity Night"
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Event Date *
                </label>
                <input
                  type="date"
                  required
                  min={todayISO()}
                  value={newEvtDate}
                  onChange={(e) => setNewEvtDate(e.target.value)}
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
                  value={newEvtPurpose}
                  onChange={(e) => setNewEvtPurpose(e.target.value)}
                  placeholder="Why this event is being organized..."
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1F3626] mb-1">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  value={newEvtDesc}
                  onChange={(e) => setNewEvtDesc(e.target.value)}
                  placeholder="Venue, expected attendees, or schedule notes..."
                  className="w-full p-3 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setNewEventOpen(false)}
                  className="px-4 h-9 rounded-xl border border-[#D4D1C7] text-xs font-medium text-[#3D4B41] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="px-5 h-9 rounded-xl bg-[#2D4A35] disabled:bg-[#9BA89E] text-white text-xs font-semibold cursor-pointer"
                >
                  {creatingEvent ? 'Creating...' : 'Create & Select'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
