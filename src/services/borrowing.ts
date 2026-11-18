import type { Club, ClubEvent, CurrentUser, Resource } from '../types/eventpool';
import { ApiError, apiRequest } from './api';

/** Event as returned by GET /api/events. */
export interface ApiEvent {
  eventId: string;
  clubId: string;
  eventName: string;
  eventDate: string;
  purpose: string;
  description?: string;
  createdAt?: string;
}

export function mapApiEvent(e: ApiEvent): ClubEvent {
  return {
    id: e.eventId,
    clubId: e.clubId,
    name: e.eventName,
    date: e.eventDate,
    purpose: e.purpose,
    description: e.description || '',
    createdAt: e.createdAt || '',
  };
}

// ── Dates ────────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** yyyy-mm-dd in the user's local timezone (not UTC, which can be a day off in Malaysia mornings). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now);
}

export function addDaysISO(days: number, now: Date = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  return toISODate(d);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidISODate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

// ── Eligibility ──────────────────────────────────────────────────────────────

/** Why this resource cannot be requested by this user, or null when it can. */
export function getRequestBlocker(
  resource: Resource,
  ownerClub: Club | undefined,
  user: CurrentUser | null,
  availability: string
): string | null {
  if (!user || user.role !== 'club_rep') return 'Only club representatives can submit borrowing requests.';
  if (user.clubId && user.clubId === resource.clubId) {
    return 'This resource belongs to your own club, so it cannot be borrowed.';
  }
  if (resource.archived) return 'This resource has been archived and is no longer available.';
  if (ownerClub?.status === 'Inactive') return 'The owner club is inactive, so its resources cannot be borrowed.';
  if (availability !== 'Available' || resource.availableUnits < 1) {
    return `This resource is currently ${availability === 'Available' ? 'out of stock' : availability}.`;
  }
  return null;
}

// ── Validation ───────────────────────────────────────────────────────────────

export interface BorrowFormValues {
  eventId: string;
  quantity: number;
  purpose: string;
  wouldHavePurchased: boolean | null;
  pickupDate: string;
  expectedReturnDate: string;
}

export type BorrowFormErrors = Partial<
  Record<'eventId' | 'quantity' | 'purpose' | 'purchase' | 'pickupDate' | 'expectedReturnDate', string>
>;

export const MAX_PURPOSE_LENGTH = 500;

export function validateBorrowForm(
  values: BorrowFormValues,
  availableUnits: number,
  today: string = todayISO()
): BorrowFormErrors {
  const errors: BorrowFormErrors = {};

  if (!values.eventId) {
    errors.eventId = 'Select one of your club events, or create a new one.';
  }

  if (!Number.isInteger(values.quantity) || values.quantity < 1) {
    errors.quantity = 'Enter a whole number of at least 1.';
  } else if (values.quantity > availableUnits) {
    errors.quantity = `Only ${availableUnits} available. Enter a quantity between 1 and ${availableUnits}.`;
  }

  const purpose = values.purpose.trim();
  if (!purpose) errors.purpose = 'Please describe how the borrowed equipment will be used.';
  else if (purpose.length > MAX_PURPOSE_LENGTH) {
    errors.purpose = `Keep the purpose under ${MAX_PURPOSE_LENGTH} characters.`;
  }

  if (values.wouldHavePurchased === null) {
    errors.purchase = 'Please indicate whether your club would otherwise purchase this item.';
  }

  if (!values.pickupDate) errors.pickupDate = 'Pickup date is required.';
  else if (!isValidISODate(values.pickupDate)) errors.pickupDate = 'Enter a valid pickup date.';
  else if (values.pickupDate < today) errors.pickupDate = 'Pickup date cannot be in the past.';

  if (!values.expectedReturnDate) errors.expectedReturnDate = 'Expected return date is required.';
  else if (!isValidISODate(values.expectedReturnDate)) {
    errors.expectedReturnDate = 'Enter a valid return date.';
  } else if (!errors.pickupDate && values.expectedReturnDate <= values.pickupDate) {
    errors.expectedReturnDate = 'Expected return date must be after the pickup date.';
  }

  return errors;
}

// ── API ──────────────────────────────────────────────────────────────────────

/**
 * ASSUMED CONTRACT - POST /api/borrowing-requests is not implemented in backend/ yet and the API
 * contract document is not in the repo. Field names follow the FE-03 task text. If M8's endpoint
 * differs, adjust only buildBorrowPayload() and parseBorrowResponse().
 */
export interface BorrowRequestPayload {
  resourceId: string;
  eventId: string;
  quantity: number;
  purpose: string;
  pickupDate: string;
  expectedReturnDate: string;
  wouldHavePurchased: boolean;
  remarks?: string;
}

export function buildBorrowPayload(
  resourceId: string,
  values: BorrowFormValues,
  remarks: string
): BorrowRequestPayload {
  return {
    resourceId,
    eventId: values.eventId,
    quantity: values.quantity,
    purpose: values.purpose.trim(),
    pickupDate: values.pickupDate,
    expectedReturnDate: values.expectedReturnDate,
    wouldHavePurchased: Boolean(values.wouldHavePurchased),
    ...(remarks.trim() ? { remarks: remarks.trim() } : {}),
  };
}

export interface BorrowSubmission {
  requestId?: string;
  status: string;
}

export function parseBorrowResponse(data: any): BorrowSubmission {
  return {
    requestId: data?.requestId ?? data?.borrowingRequestId ?? data?.id,
    status: data?.status ?? 'Pending',
  };
}

export async function submitBorrowingRequest(payload: BorrowRequestPayload): Promise<BorrowSubmission> {
  const data = await apiRequest('/api/borrowing-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseBorrowResponse(data);
}

export async function fetchClubEvents(): Promise<ClubEvent[]> {
  const data = await apiRequest<ApiEvent[]>('/api/events');
  return data.map(mapApiEvent).sort((a, b) => a.date.localeCompare(b.date));
}

export async function createClubEvent(input: {
  name: string;
  date: string;
  purpose: string;
  description?: string;
}): Promise<ClubEvent> {
  const data = await apiRequest<ApiEvent>('/api/events', {
    method: 'POST',
    body: JSON.stringify({
      eventName: input.name.trim(),
      eventDate: input.date,
      purpose: input.purpose.trim(),
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    }),
  });
  return mapApiEvent(data);
}

/** Turn a failed submission into something the user can act on. */
export function describeBorrowError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'NETWORK_ERROR' || err.status === 0) {
      return 'Cannot reach the EventPool server. Check your connection and try again.';
    }
    if (err.status === 404 && /route not found/i.test(err.message)) {
      return 'Borrowing requests are not available on the server yet. Please try again later.';
    }
    if (err.status === 403) return err.message || 'You are not allowed to request this resource.';
    if (err.status === 404) return 'This resource no longer exists.';
    if (err.status === 409) {
      return err.message || 'The requested quantity is no longer available. Refresh and try again.';
    }
    if (err.status >= 500) return 'The server had a problem submitting your request. Please try again.';
    return err.message || 'Could not submit your request.';
  }
  return 'Could not submit your request.';
}
