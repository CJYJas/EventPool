import React, { useMemo, useState } from 'react';
import { ArrowRight, CalendarPlus, MapPin, Plus, ShieldCheck, Users, X } from 'lucide-react';
import { Card } from '../../components/Card';
import { FormField, fieldInputClass } from '../../components/FormField';
import { ResourceImage } from '../../components/ResourceImage';
import { InlineAlert } from '../../components/StateBlocks';
import { StatusBadge } from '../../components/StatusBadge';
import { getResourceAvailability, useApp } from '../../context/AppContext';
import { REFERENCE_TODAY } from '../../data/seedData';

export const BorrowFormPage: React.FC = () => {
  const {
    selectedResourceId,
    resources,
    events,
    currentUser,
    navigate,
    createEvent,
    submitBorrowRequest,
    getClubById,
    getResourceById,
  } = useApp();

  const resource = getResourceById(selectedResourceId) || resources[0];
  const ownerClub = getClubById(resource?.clubId);
  const borrowerClubId = currentUser?.clubId || 'club-pekom';
  const borrowerClub = getClubById(borrowerClubId);

  const clubEvents = useMemo(
    () => events.filter((ev) => ev.clubId === borrowerClubId),
    [events, borrowerClubId]
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(
    clubEvents[0]?.id || ''
  );
  const [eventName, setEventName] = useState(clubEvents[0]?.name || '');
  const [quantity, setQuantity] = useState<number>(
    Math.min(12, resource?.availableUnits || 1)
  );
  const [purpose, setPurpose] = useState(clubEvents[0]?.purpose || '');
  const [wouldOtherwisePurchase, setWouldOtherwisePurchase] = useState<
    boolean | null
  >(null);
  const [remarks, setRemarks] = useState('');
  const [pickupDate, setPickupDate] = useState('2026-11-18');
  const [expectedReturnDate, setExpectedReturnDate] = useState('2026-11-20');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  // Inline create-event modal route
  const [newEventOpen, setNewEventOpen] = useState(false);
  const [newEvtName, setNewEvtName] = useState('');
  const [newEvtDate, setNewEvtDate] = useState('2026-11-25');
  const [newEvtPurpose, setNewEvtPurpose] = useState('');
  const [newEvtDesc, setNewEvtDesc] = useState('');
  const [newEvtError, setNewEvtError] = useState('');

  if (!resource) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12">
        <p className="text-sm text-[#4A554E]">Resource not found.</p>
      </div>
    );
  }

  const availability = getResourceAvailability(resource, ownerClub);

  const handleSelectExistingEvent = (evtId: string) => {
    setSelectedEventId(evtId);
    const found = clubEvents.find((e) => e.id === evtId);
    if (found) {
      setEventName(found.name);
      setPurpose(found.purpose);
      setFieldErrors((prev) => ({ ...prev, eventName: '', purpose: '' }));
    }
  };

  const handleCreateInlineEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setNewEvtError('');
    if (!newEvtName.trim() || !newEvtDate || !newEvtPurpose.trim()) {
      setNewEvtError('Event name, date, and purpose are required.');
      return;
    }
    const created = createEvent({
      clubId: borrowerClubId,
      name: newEvtName,
      date: newEvtDate,
      purpose: newEvtPurpose,
      description: newEvtDesc,
    });
    setSelectedEventId(created.id);
    setEventName(created.name);
    setPurpose(created.purpose);
    setNewEvtName('');
    setNewEvtPurpose('');
    setNewEvtDesc('');
    setNewEventOpen(false);
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!eventName.trim()) {
      errs.eventName = 'Please select an existing event or enter an event name.';
    }
    if (
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      quantity > resource.availableUnits
    ) {
      errs.quantity = `Enter a quantity between 1 and ${resource.availableUnits}.`;
    }
    if (!purpose.trim()) {
      errs.purpose = 'Please describe how the borrowed equipment will be used.';
    }
    if (wouldOtherwisePurchase === null) {
      errs.purchase =
        'Please indicate whether your club would otherwise purchase this item.';
    }
    if (!pickupDate) {
      errs.pickupDate = 'Pickup date is required.';
    } else if (pickupDate < REFERENCE_TODAY) {
      errs.pickupDate = `Pickup date cannot be earlier than ${REFERENCE_TODAY}.`;
    }
    if (!expectedReturnDate) {
      errs.expectedReturnDate = 'Expected return date is required.';
    } else if (pickupDate && expectedReturnDate <= pickupDate) {
      errs.expectedReturnDate = 'Expected return date must be after the pickup date.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) {
      setFormError('Please fix the highlighted fields before submitting.');
      return;
    }

    const result = submitBorrowRequest({
      resourceId: resource.id,
      eventId: selectedEventId || undefined,
      eventName,
      requestedQuantity: quantity,
      purpose,
      wouldOtherwisePurchase: Boolean(wouldOtherwisePurchase),
      remarks,
      pickupDate,
      expectedReturnDate,
    });
    if (!result.ok) {
      setFormError(result.error || 'Could not submit request.');
      return;
    }
    navigate('my_club');
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
                  {borrowerClub?.acronym} · Universiti Malaya
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
              className="w-full h-10 px-3.5 rounded-xl bg-white border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
            >
              <option value="">Choose from {borrowerClub?.acronym} events...</option>
              {clubEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.date})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Event name *
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => {
                  setEventName(e.target.value);
                  setFieldErrors((p) => ({ ...p, eventName: '' }));
                }}
                placeholder="e.g. UM Tech Hackathon 2026"
                className={`w-full h-11 px-3.5 rounded-xl border text-sm text-[#1F3626] focus:outline-none ${
                  fieldErrors.eventName
                    ? 'border-[#8C2220] bg-[#FDF2F2]/40'
                    : 'border-[#D4D1C7] focus:border-[#2D4A35]'
                }`}
              />
              {fieldErrors.eventName && (
                <p className="text-[11px] font-medium text-[#8C2220] mt-1">
                  {fieldErrors.eventName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Requested quantity *
              </label>
              <input
                type="number"
                min={1}
                max={Math.max(1, resource.availableUnits)}
                value={quantity}
                onChange={(e) => {
                  setQuantity(Number(e.target.value) || 0);
                  setFieldErrors((p) => ({ ...p, quantity: '' }));
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
                setFieldErrors((p) => ({ ...p, purpose: '' }));
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
                  setFieldErrors((p) => ({ ...p, purchase: '' }));
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
                  setFieldErrors((p) => ({ ...p, purchase: '' }));
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
                value={pickupDate}
                onChange={(e) => {
                  setPickupDate(e.target.value);
                  setFieldErrors((p) => ({ ...p, pickupDate: '' }));
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
                value={expectedReturnDate}
                onChange={(e) => {
                  setExpectedReturnDate(e.target.value);
                  setFieldErrors((p) => ({ ...p, expectedReturnDate: '' }));
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
                onClick={() =>
                  navigate('resource_detail', { resourceId: resource.id })
                }
                className="px-5 h-10 rounded-xl border border-[#D4D1C7] text-sm font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                Submit Request
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
                Owned by {ownerClub?.acronym} · {resource.category}
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
                  {quantity} {resource.name}
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
                <span className="font-semibold text-[#1F3626]">
                  {borrowerClub?.acronym}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6B766E]">Status after submission</span>
                <StatusBadge status="Pending" />
              </div>
            </div>
            <p className="text-[11px] text-[#6B766E] pt-2 border-t border-[#EFECE3] leading-relaxed">
              Submitting creates a Pending request. Stock is only reserved once{' '}
              {ownerClub?.acronym} approves. Please wait for approval before
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
                  Added to {borrowerClub?.acronym} Events and linked to this request
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
                  className="px-5 h-9 rounded-xl bg-[#2D4A35] text-white text-xs font-semibold cursor-pointer"
                >
                  Create &amp; Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
