import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import {
  INITIAL_ACCESS_REQUESTS,
  INITIAL_CLUBS,
  INITIAL_EVENTS,
  INITIAL_REQUESTS,
  INITIAL_RESOURCES,
  REFERENCE_TODAY,
} from '../data/seedData';
import type {
  AppView,
  BorrowRequest,
  Club,
  ClubAccessRequest,
  ClubEvent,
  CurrentUser,
  Resource,
  ResourceAvailability,
  ResourceCategory,
} from '../types/eventpool';
import { setUnauthorizedHandler } from '../services/api';
import { describeAuthError, restoreSession, signIn, signOut, type AuthFailureCode } from '../services/auth';
import { checkViewAccess, homeViewFor } from './viewAccess';

const STORAGE_KEY = 'eventpool_um_state_v5';

interface PersistedState {
  clubs: Club[];
  events: ClubEvent[];
  resources: Resource[];
  requests: BorrowRequest[];
  accessRequests: ClubAccessRequest[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (
        parsed &&
        Array.isArray(parsed.clubs) &&
        Array.isArray(parsed.resources) &&
        Array.isArray(parsed.events)
      ) {
        const seedClubMap = new Map(INITIAL_CLUBS.map((c) => [c.id, c]));
        // currentUser is intentionally not restored from storage: identity comes only from the verified backend profile.
        return {
          clubs: parsed.clubs.map((club) => {
            const seed = seedClubMap.get(club.id);
            if (!seed) return club;
            return {
              ...club,
              logoUrl: 'logoUrl' in club ? club.logoUrl : seed.logoUrl,
            };
          }),
          events: parsed.events,
          resources: parsed.resources,
          requests: parsed.requests,
          accessRequests: parsed.accessRequests,
        };
      }
    }
  } catch {
    // Fallback to seed data
  }
  return {
    clubs: INITIAL_CLUBS,
    events: INITIAL_EVENTS,
    resources: INITIAL_RESOURCES,
    requests: INITIAL_REQUESTS,
    accessRequests: INITIAL_ACCESS_REQUESTS,
  };
}

export function getResourceAvailability(
  resource: Resource,
  club?: Club
): ResourceAvailability {
  if (club && club.status === 'Inactive') return 'Unavailable';
  if (resource.manualUnavailable || resource.archived) return 'Unavailable';
  if (resource.availableUnits > 0) return 'Available';
  if (resource.reservedUnits > 0) return 'Reserved';
  if (resource.borrowedUnits > 0) return 'Borrowed';
  return 'Unavailable';
}

export function isRequestOverdue(req: BorrowRequest): boolean {
  if (!['Approved', 'Borrowed', 'Return Pending'].includes(req.status)) {
    return false;
  }
  return req.expectedReturnDate < REFERENCE_TODAY;
}

export function getOverdueDays(req: BorrowRequest): number {
  if (!isRequestOverdue(req)) return 0;
  const due = new Date(req.expectedReturnDate).getTime();
  const today = new Date(REFERENCE_TODAY).getTime();
  return Math.max(1, Math.round((today - due) / (1000 * 60 * 60 * 24)));
}

interface CreateClubInput {
  name: string;
  acronym: string;
  categoryFocus: string;
  description: string;
  storageLocation: string;
  contactEmail: string;
  picPhone: string;
  representativeName: string;
  representativeEmail: string;
  password: string;
}

interface UpdateClubInput {
  name: string;
  acronym: string;
  categoryFocus: string;
  description: string;
  storageLocation: string;
  contactEmail: string;
  picPhone: string;
  representativeName: string;
  representativeEmail: string;
  logoUrl?: string;
}

interface UpdateOwnClubProfileInput {
  name: string;
  description: string;
  contactEmail: string;
  picPhone: string;
  storageLocation: string;
  logoUrl?: string;
}

interface CreateEventInput {
  clubId: string;
  name: string;
  date: string;
  purpose: string;
  description?: string;
}

interface AddResourceInput {
  clubId: string;
  name: string;
  category: ResourceCategory;
  condition: 'Excellent' | 'Good' | 'Fair';
  location: string;
  totalUnits: number;
  description: string;
  remarks: string;
  estimatedUnitCostRM?: number;
  estimatedUnitWeightKg?: number;
  imageUrl: string;
}

interface SubmitBorrowInput {
  resourceId: string;
  eventId?: string;
  eventName: string;
  requestedQuantity: number;
  purpose: string;
  wouldOtherwisePurchase: boolean;
  remarks?: string;
  pickupDate: string;
  expectedReturnDate: string;
}

interface LoginResult {
  ok: boolean;
  error?: string;
  code?: AuthFailureCode;
}

interface AppContextValue {
  clubs: Club[];
  events: ClubEvent[];
  resources: Resource[];
  requests: BorrowRequest[];
  accessRequests: ClubAccessRequest[];
  currentUser: CurrentUser | null;
  currentView: AppView;
  selectedClubId: string | null;
  selectedResourceId: string | null;
  selectedRequestId: string | null;
  marketplaceSearch: string;
  toastMessage: string | null;
  /** False until the stored session (if any) has been checked against the backend. */
  authReady: boolean;
  /** Remember resources/clubs fetched from the API so detail pages can look them up by id. Not persisted. */
  cacheRemoteData: (data: { resources?: Resource[]; clubs?: Club[] }) => void;
  setMarketplaceSearch: (value: string) => void;
  showToast: (msg: string) => void;
  navigate: (
    view: AppView,
    options?: {
      clubId?: string;
      resourceId?: string;
      requestId?: string;
      search?: string;
    }
  ) => void;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  // Admin club management
  createClubAccount: (input: CreateClubInput) => { ok: boolean; error?: string; club?: Club };
  updateClubDetails: (clubId: string, input: UpdateClubInput) => void;
  updateOwnClubProfile: (clubId: string, input: UpdateOwnClubProfileInput) => { ok: boolean; error?: string };
  deactivateClub: (clubId: string) => void;
  reactivateClub: (clubId: string) => void;
  processAccessRequest: (id: string, action: 'approve' | 'decline') => void;
  // Events
  createEvent: (input: CreateEventInput) => ClubEvent;
  updateEvent: (eventId: string, input: Omit<CreateEventInput, 'clubId'>) => void;
  deleteEvent: (eventId: string) => { ok: boolean; error?: string };
  // Public access request
  submitClubAccessRequest: (input: {
    clubName: string;
    representativeName: string;
    email: string;
  }) => void;
  // Borrowing & inventory lifecycle
  submitBorrowRequest: (input: SubmitBorrowInput) => { ok: boolean; error?: string };
  approveBorrowRequest: (requestId: string) => Promise<{ ok: boolean; error?: string }>;
  rejectBorrowRequest: (requestId: string, reason?: string) => Promise<void>;
  cancelBorrowRequest: (requestId: string) => Promise<void>;
  markPickedUp: (requestId: string) => Promise<void>;
  markReturned: (requestId: string) => Promise<void>;
  confirmReturnVerification: (
    requestId: string,
    counts: { reusable: number; damaged: number; missing: number }
  ) => Promise<{ ok: boolean; error?: string }>;
  addResource: (input: AddResourceInput) => Resource;
  editResourceQuantity: (resourceId: string, newTotal: number) => { ok: boolean; error?: string };
  updateResource: (resourceId: string, input: Partial<AddResourceInput>) => { ok: boolean; error?: string };
  toggleResourceAvailability: (resourceId: string) => void;
  archiveResource: (resourceId: string) => { ok: boolean; blocked?: boolean };
  resetDemoData: () => void;
  getClubById: (id?: string | null) => Club | undefined;
  fetchClubById: (clubId: string) => Promise<Club | undefined>;
  getResourceById: (id?: string | null) => Resource | undefined;
  getRequestById: (id?: string | null) => BorrowRequest | undefined;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [marketplaceSearch, setMarketplaceSearch] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [remoteResources, setRemoteResources] = useState<Resource[]>([]);
  const [remoteClubs, setRemoteClubs] = useState<Club[]>([]);

  const cacheRemoteData: AppContextValue['cacheRemoteData'] = useCallback((data) => {
    const merge = <T extends { id: string }>(prev: T[], incoming: T[]) => {
      const byId = new Map(prev.map((x) => [x.id, x]));
      incoming.forEach((x) => byId.set(x.id, x));
      return Array.from(byId.values());
    };
    if (data.resources?.length) setRemoteResources((prev) => merge(prev, data.resources!));
    if (data.clubs?.length) setRemoteClubs((prev) => merge(prev, data.clubs!));
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  // Synchronize with backend API when backend is running
  const refreshBackendData = useCallback(async () => {
    try {
      const health = await api.health();
      if (!health.success) return;

      const [clubsRes, resourcesRes, eventsRes, borrowingRes] = await Promise.all([
        api.clubs.getAll(),
        api.resources.getAll({ limit: 100 }),
        api.events.getAll(),
        api.borrowing.getAll({ limit: 100 }),
      ]);

      setState((prev) => {
        let updatedClubs = [...prev.clubs];
        if (clubsRes.success && Array.isArray(clubsRes.data) && clubsRes.data.length > 0) {
          const apiClubs: Club[] = clubsRes.data.map((c: any) => ({
            id: c.clubId,
            name: c.clubName,
            acronym: c.clubName.split(' ').map((w: string) => w[0]).join('').slice(0, 5).toUpperCase(),
            categoryFocus: 'Student Activity',
            description: c.description || '',
            storageLocation: 'UM Campus',
            contactEmail: c.contactEmail,
            picPhone: c.picContactNum || '',
            representativeName: c.clubName + ' Rep',
            representativeEmail: c.contactEmail,
            password: '',
            status: c.isActive === false ? 'Inactive' : 'Active',
            createdAt: c.createdAt || new Date().toISOString(),
          }));
          const apiClubIds = new Set(apiClubs.map((c) => c.id));
          updatedClubs = [...apiClubs, ...prev.clubs.filter((c) => !apiClubIds.has(c.id))];
        }

        let updatedResources = [...prev.resources];
        if (resourcesRes.success && resourcesRes.data?.items && resourcesRes.data.items.length > 0) {
          const apiResources: Resource[] = resourcesRes.data.items.map((r: any) => ({
            id: r.resourceId,
            clubId: r.clubId,
            name: r.itemName,
            category: (r.category || 'Electronics') as ResourceCategory,
            totalUnits: r.totalQuantity,
            availableUnits: r.availableQuantity,
            reservedUnits: r.reservedQuantity || 0,
            borrowedUnits: r.borrowedQuantity || 0,
            condition: (r.condition || 'Good') as any,
            location: r.location || '',
            description: r.description || '',
            remarks: r.remarks || '',
            images: r.imageURL ? [r.imageURL] : [],
            archived: r.isArchived || false,
            manualUnavailable: r.isTemporarilyUnavailable || false,
            estimatedUnitCostRM: r.estimatedUnitCost,
            estimatedUnitWeightKg: r.estimatedUnitWeight,
            createdAt: r.createdAt || new Date().toISOString(),
          }));
          const apiResIds = new Set(apiResources.map((r) => r.id));
          updatedResources = [...apiResources, ...prev.resources.filter((r) => !apiResIds.has(r.id))];
        }

        let updatedEvents = [...prev.events];
        if (eventsRes.success && Array.isArray(eventsRes.data) && eventsRes.data.length > 0) {
          const apiEvents: ClubEvent[] = eventsRes.data.map((e: any) => ({
            id: e.eventId,
            clubId: e.clubId,
            name: e.eventName,
            date: e.eventDate,
            purpose: e.purpose,
            description: e.description,
            createdAt: e.createdAt,
          }));
          const apiEventIds = new Set(apiEvents.map((e) => e.id));
          updatedEvents = [...apiEvents, ...prev.events.filter((e) => !apiEventIds.has(e.id))];
        }

        let updatedRequests = [...prev.requests];
        const rawData = borrowingRes.success ? (borrowingRes.data as any) : null;
        const rawReqs = rawData?.requests || rawData?.items || (Array.isArray(rawData) ? rawData : []);
        if (rawReqs && rawReqs.length > 0) {
          const apiRequests: BorrowRequest[] = rawReqs.map((r: any) => {
            const event = updatedEvents.find((e) => e.id === r.eventId);
            return {
              id: r.requestId || r.id,
              resourceId: r.resourceId,
              ownerClubId: r.ownerClubId,
              borrowerClubId: r.requesterClubId || r.borrowerClubId,
              eventId: r.eventId,
              eventName: event?.name || r.eventName || 'Club Event',
              requestedQuantity: r.quantity ?? r.requestedQuantity ?? 1,
              purpose: r.purpose || '',
              wouldOtherwisePurchase: Boolean(r.wouldHavePurchased ?? r.wouldOtherwisePurchase),
              remarks: r.remarks || '',
              pickupDate: r.pickupDate,
              expectedReturnDate: r.expectedReturnDate,
              status: r.status,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt || r.createdAt,
              returnedDate: r.actualReturnDate || r.returnedDate,
              verification:
                r.usableQuantity !== undefined || r.verification
                  ? {
                      reusable: r.usableQuantity ?? r.verification?.reusable ?? 0,
                      damaged: r.damagedQuantity ?? r.verification?.damaged ?? 0,
                      missing: r.missingQuantity ?? r.verification?.missing ?? 0,
                      verifiedAt: r.updatedAt || r.createdAt || '',
                    }
                  : undefined,
              rejectionReason: r.rejectionRemarks || r.rejectionReason,
            };
          });
          const apiReqIds = new Set(apiRequests.map((r) => r.id));
          updatedRequests = [...apiRequests, ...prev.requests.filter((r) => !apiReqIds.has(r.id))];
        }

        return {
          ...prev,
          clubs: updatedClubs,
          resources: updatedResources,
          events: updatedEvents,
          requests: updatedRequests,
        };
      });
    } catch {
      // Fallback silently to local state when backend is offline
    }
  }, []);

  useEffect(() => {
    refreshBackendData();
  }, [refreshBackendData]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // Restore the session from a stored token by asking the backend who it belongs to.
  useEffect(() => {
    let cancelled = false;
    restoreSession().then((user) => {
      if (cancelled) return;
      if (user) {
        setCurrentUser(user);
        refreshBackendData();
      }
      setAuthReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [refreshBackendData]);

  // Any API call rejected as expired/disabled signs the user out.
  useEffect(() => {
    setUnauthorizedHandler((reason) => {
      setCurrentUser(null);
      setCurrentView('home');
      setToastMessage(
        reason === 'disabled'
          ? 'Your account has been disabled. Contact UM Admin.'
          : 'Your session has expired. Please log in again.'
      );
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const showToast = (msg: string) => setToastMessage(msg);

  const navigate: AppContextValue['navigate'] = (view, options) => {
    if (checkViewAccess(view, currentUser) === 'login_required') {
      setCurrentView('home');
      showToast('Please log in to continue.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (options?.clubId !== undefined) setSelectedClubId(options.clubId);
    if (options?.resourceId !== undefined) setSelectedResourceId(options.resourceId);
    if (options?.requestId !== undefined) setSelectedRequestId(options.requestId);
    if (options?.search !== undefined) setMarketplaceSearch(options.search);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login: AppContextValue['login'] = async (email, password) => {
    try {
      const user = await signIn(email, password);
      setCurrentUser(user);
      setCurrentView(homeViewFor(user));
      showToast(`Signed in as ${user.name}.`);
      await refreshBackendData();
      return { ok: true };
    } catch (err) {
      const failure = describeAuthError(err);
      return { ok: false, code: failure.code, error: failure.message };
    }
  };

  const logout = () => {
    signOut();
    setCurrentUser(null);
    setCurrentView('home');
    showToast('Signed out of EventPool.');
  };

  const createClubAccount: AppContextValue['createClubAccount'] = (input) => {
    const cleanEmail = input.representativeEmail.trim().toLowerCase();
    const duplicate = state.clubs.some(
      (c) => c.representativeEmail.toLowerCase() === cleanEmail
    );
    if (duplicate) {
      return {
        ok: false,
        error: 'A club account with this UM representative email already exists.',
      };
    }

    const newClub: Club = {
      id: `club-${Date.now()}`,
      name: input.name.trim(),
      acronym: input.acronym.trim(),
      categoryFocus: input.categoryFocus.trim() || 'Student Organization',
      description: input.description.trim(),
      storageLocation: input.storageLocation.trim(),
      contactEmail: (input.contactEmail || input.representativeEmail).trim(),
      picPhone: input.picPhone.trim() || '+60 12-000 0000',
      representativeName: input.representativeName.trim(),
      representativeEmail: input.representativeEmail.trim(),
      password: input.password || 'password123',
      status: 'Active',
      createdAt: REFERENCE_TODAY,
    };

    setState((prev) => ({
      ...prev,
      clubs: [newClub, ...prev.clubs],
    }));
    showToast(`Club account "${newClub.acronym}" created and activated.`);
    return { ok: true, club: newClub };
  };

  const updateClubDetails: AppContextValue['updateClubDetails'] = (clubId, input) => {
    setState((prev) => ({
      ...prev,
      clubs: prev.clubs.map((c) =>
        c.id === clubId
          ? {
              ...c,
              name: input.name.trim(),
              acronym: input.acronym.trim(),
              categoryFocus: input.categoryFocus.trim(),
              description: input.description.trim(),
              storageLocation: input.storageLocation.trim(),
              contactEmail: input.contactEmail.trim(),
              picPhone: input.picPhone.trim(),
              representativeName: input.representativeName.trim(),
              representativeEmail: input.representativeEmail.trim(),
              ...(input.logoUrl !== undefined
                ? { logoUrl: input.logoUrl }
                : {}),
            }
          : c
      ),
    }));
    showToast('Club details updated.');
  };

  const updateOwnClubProfile: AppContextValue['updateOwnClubProfile'] = (
    clubId,
    input
  ) => {
    if (
      currentUser?.role !== 'club_rep' ||
      currentUser.clubId !== clubId
    ) {
      return {
        ok: false,
        error: 'Only this club’s authorized representative can update its profile.',
      };
    }
    setState((prev) => ({
      ...prev,
      clubs: prev.clubs.map((c) =>
        c.id === clubId
          ? {
              ...c,
              name: input.name.trim(),
              description: input.description.trim(),
              contactEmail: input.contactEmail.trim(),
              picPhone: input.picPhone.trim(),
              storageLocation: input.storageLocation.trim(),
              ...(input.logoUrl !== undefined
                ? { logoUrl: input.logoUrl }
                : {}),
            }
          : c
      ),
    }));
    showToast('Club profile saved.');
    return { ok: true };
  };

  const deactivateClub: AppContextValue['deactivateClub'] = (clubId) => {
    const club = state.clubs.find((c) => c.id === clubId);
    setState((prev) => ({
      ...prev,
      clubs: prev.clubs.map((c) =>
        c.id === clubId ? { ...c, status: 'Inactive' } : c
      ),
    }));
    showToast(`${club?.acronym || 'Club'} has been deactivated and set to Inactive.`);
  };

  const reactivateClub: AppContextValue['reactivateClub'] = (clubId) => {
    const club = state.clubs.find((c) => c.id === clubId);
    setState((prev) => ({
      ...prev,
      clubs: prev.clubs.map((c) =>
        c.id === clubId ? { ...c, status: 'Active' } : c
      ),
    }));
    showToast(`${club?.acronym || 'Club'} has been reactivated.`);
  };

  const processAccessRequest: AppContextValue['processAccessRequest'] = (id, action) => {
    const target = state.accessRequests.find((r) => r.id === id);
    if (!target) return;

    if (action === 'decline') {
      setState((prev) => ({
        ...prev,
        accessRequests: prev.accessRequests.map((r) =>
          r.id === id ? { ...r, status: 'Declined' } : r
        ),
      }));
      showToast(`Declined club access request from ${target.clubName}.`);
      return;
    }

    const acronym =
      target.clubName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 8) || target.clubName.slice(0, 8);

    const createdClub: Club = {
      id: `club-${Date.now()}`,
      name: target.clubName,
      acronym,
      categoryFocus: 'Student Organization',
      description: `Verified Universiti Malaya student organization represented by ${target.representativeName}.`,
      storageLocation: 'UM Student Activity Centre',
      contactEmail: target.email,
      picPhone: '+60 12-000 0000',
      representativeName: target.representativeName,
      representativeEmail: target.email,
      password: 'password123',
      status: 'Active',
      createdAt: REFERENCE_TODAY,
    };

    setState((prev) => ({
      ...prev,
      accessRequests: prev.accessRequests.map((r) =>
        r.id === id ? { ...r, status: 'Approved' } : r
      ),
      clubs: [createdClub, ...prev.clubs],
    }));
    showToast(`Approved access request and activated ${target.clubName}.`);
  };

  const createEvent: AppContextValue['createEvent'] = (input) => {
    const newEvt: ClubEvent = {
      id: `evt-${Date.now()}`,
      clubId: input.clubId,
      name: input.name.trim(),
      date: input.date,
      purpose: input.purpose.trim(),
      description: input.description?.trim() || undefined,
      createdAt: REFERENCE_TODAY,
    };
    setState((prev) => ({
      ...prev,
      events: [newEvt, ...prev.events],
    }));
    showToast(`Event "${newEvt.name}" created.`);
    return newEvt;
  };

  const updateEvent: AppContextValue['updateEvent'] = (eventId, input) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((ev) =>
        ev.id === eventId
          ? {
              ...ev,
              name: input.name.trim(),
              date: input.date,
              purpose: input.purpose.trim(),
              description: input.description?.trim() || undefined,
            }
          : ev
      ),
    }));
    showToast('Event updated.');
  };

  const deleteEvent: AppContextValue['deleteEvent'] = (eventId) => {
    const linkedRequest = state.requests.find(
      (r) => r.eventId === eventId && !['returned', 'rejected', 'cancelled'].includes(r.status)
    );
    if (linkedRequest) {
      const resName = state.resources.find((r) => r.id === linkedRequest.resourceId)?.name || 'resource';
      const msg = `Cannot delete event: it is associated with an active borrow request (${resName}).`;
      showToast(msg);
      return { ok: false, error: msg };
    }
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((ev) => ev.id !== eventId),
    }));
    showToast('Event deleted.');
    return { ok: true };
  };

  const submitClubAccessRequest: AppContextValue['submitClubAccessRequest'] = (input) => {
    const newReq: ClubAccessRequest = {
      id: `acc-${Date.now()}`,
      clubName: input.clubName.trim(),
      representativeName: input.representativeName.trim(),
      email: input.email.trim(),
      status: 'Pending',
      submittedAt: REFERENCE_TODAY,
    };
    setState((prev) => ({
      ...prev,
      accessRequests: [newReq, ...prev.accessRequests],
    }));
  };

  const submitBorrowRequest: AppContextValue['submitBorrowRequest'] = (input) => {
    const resource = state.resources.find((r) => r.id === input.resourceId);
    if (!resource) return { ok: false, error: 'Resource not found.' };

    const borrowerClubId = currentUser?.clubId || 'club-pekom';
    if (borrowerClubId === resource.clubId) {
      return { ok: false, error: 'You cannot borrow equipment owned by your own club.' };
    }
    if (input.requestedQuantity < 1 || input.requestedQuantity > resource.availableUnits) {
      return {
        ok: false,
        error: `Requested quantity must be between 1 and ${resource.availableUnits}.`,
      };
    }
    if (input.expectedReturnDate <= input.pickupDate) {
      return {
        ok: false,
        error: 'Expected return date must be after the pickup date.',
      };
    }

    const newReq: BorrowRequest = {
      id: `req-${Date.now()}`,
      resourceId: resource.id,
      ownerClubId: resource.clubId,
      borrowerClubId,
      eventId: input.eventId,
      eventName: input.eventName.trim(),
      requestedQuantity: input.requestedQuantity,
      purpose: input.purpose.trim(),
      wouldOtherwisePurchase: input.wouldOtherwisePurchase,
      remarks: input.remarks?.trim() || undefined,
      pickupDate: input.pickupDate,
      expectedReturnDate: input.expectedReturnDate,
      status: 'Pending',
      createdAt: REFERENCE_TODAY,
      updatedAt: REFERENCE_TODAY,
    };

    setState((prev) => ({
      ...prev,
      requests: [newReq, ...prev.requests],
    }));
    showToast('Borrowing request submitted (Pending owner approval).');
    return { ok: true };
  };

  const approveBorrowRequest: AppContextValue['approveBorrowRequest'] = async (requestId) => {
    try {
      const res = await api.borrowing.approve(requestId);
      if (res.success) {
        showToast('Borrowing request approved. Stock has been reserved.');
        await refreshBackendData();
        return { ok: true };
      }
      if (res.message || res.error) {
        const errMsg = res.message || 'Failed to approve request.';
        showToast(errMsg);
        await refreshBackendData();
        return { ok: false, error: errMsg };
      }
    } catch (err: any) {
      await refreshBackendData();
      const errMsg = err?.message || 'Conflict: Unable to approve borrowing request (409).';
      showToast(errMsg);
      return { ok: false, error: errMsg };
    }

    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: 'Request not found.' };
    const resource = state.resources.find((r) => r.id === req.resourceId);
    if (!resource || resource.availableUnits < req.requestedQuantity) {
      return {
        ok: false,
        error: 'Insufficient available units remaining to approve this request.',
      };
    }

    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId ? { ...r, status: 'Approved', updatedAt: REFERENCE_TODAY } : r
      ),
      resources: prev.resources.map((res) =>
        res.id === req.resourceId
          ? {
              ...res,
              availableUnits: res.availableUnits - req.requestedQuantity,
              reservedUnits: res.reservedUnits + req.requestedQuantity,
            }
          : res
      ),
    }));
    showToast('Borrowing request approved. Stock has been reserved.');
    return { ok: true };
  };

  const rejectBorrowRequest: AppContextValue['rejectBorrowRequest'] = async (requestId, reason) => {
    try {
      const res = await api.borrowing.reject(requestId, reason);
      if (res.success) {
        showToast('Borrowing request rejected and saved to history.');
        await refreshBackendData();
        return;
      }
      if (res.message || res.error) {
        showToast(res.message || 'Failed to reject request.');
      }
    } catch {
      // Fallback
    }

    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Rejected',
              rejectionReason: reason || 'Resource unavailable or scheduling conflict.',
              updatedAt: REFERENCE_TODAY,
            }
          : r
      ),
    }));
    showToast('Borrowing request rejected and saved to history.');
  };

  const cancelBorrowRequest: AppContextValue['cancelBorrowRequest'] = async (requestId) => {
    const req = state.requests.find((r) => r.id === requestId);
    if (!req || !['Pending', 'Approved'].includes(req.status)) return;

    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId ? { ...r, status: 'Cancelled', updatedAt: REFERENCE_TODAY } : r
      ),
      resources:
        req.status === 'Approved'
          ? prev.resources.map((res) =>
              res.id === req.resourceId
                ? {
                    ...res,
                    reservedUnits: Math.max(0, res.reservedUnits - req.requestedQuantity),
                    availableUnits: res.availableUnits + req.requestedQuantity,
                  }
                : res
            )
          : prev.resources,
    }));
    showToast('Borrowing request cancelled and saved to history.');
  };

  const markPickedUp: AppContextValue['markPickedUp'] = async (requestId) => {
    try {
      const res = await api.borrowing.markBorrowed(requestId);
      if (res.success) {
        showToast('Marked as Borrowed (picked up).');
        await refreshBackendData();
        return;
      }
      if (res.message || res.error) {
        showToast(res.message || 'Failed to mark as borrowed.');
      }
    } catch {
      // Fallback
    }

    const req = state.requests.find((r) => r.id === requestId);
    if (!req || req.status !== 'Approved') return;
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId ? { ...r, status: 'Borrowed', updatedAt: REFERENCE_TODAY } : r
      ),
      resources: prev.resources.map((res) =>
        res.id === req.resourceId
          ? {
              ...res,
              reservedUnits: Math.max(0, res.reservedUnits - req.requestedQuantity),
              borrowedUnits: res.borrowedUnits + req.requestedQuantity,
            }
          : res
      ),
    }));
    showToast('Marked as Borrowed (picked up).');
  };

  const markReturned: AppContextValue['markReturned'] = async (requestId) => {
    try {
      const res = await api.borrowing.submitReturn(requestId, {
        actualReturnDate: new Date().toISOString().slice(0, 10),
        remarks: 'Item returned by borrower',
      });
      if (res.success) {
        showToast('Return submitted. Awaiting owner verification.');
        await refreshBackendData();
        return;
      }
      if (res.message || res.error) {
        showToast(res.message || 'Failed to submit return.');
      }
    } catch {
      // Fallback
    }

    const req = state.requests.find((r) => r.id === requestId);
    if (!req || req.status !== 'Borrowed') return;
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Return Pending',
              returnedDate: REFERENCE_TODAY,
              updatedAt: REFERENCE_TODAY,
            }
          : r
      ),
    }));
    showToast('Return submitted. Awaiting owner verification.');
  };

  const confirmReturnVerification: AppContextValue['confirmReturnVerification'] = async (
    requestId,
    counts
  ) => {
    const total = counts.reusable + counts.damaged + counts.missing;
    try {
      const res = await api.borrowing.complete(requestId, {
        returnedQuantity: counts.reusable + counts.damaged,
        usableQuantity: counts.reusable,
        damagedQuantity: counts.damaged,
        missingQuantity: counts.missing,
        returnCondition: 'Good',
        remarks: 'Return verified by club owner',
      });
      if (res.success) {
        showToast(
          `Return verified & completed. ${counts.reusable} reusable unit${counts.reusable === 1 ? '' : 's'} returned to stock.`
        );
        await refreshBackendData();
        return { ok: true };
      }
      if (res.message || res.error) {
        const errMsg = res.message || 'Failed to verify return.';
        showToast(errMsg);
        await refreshBackendData();
        return { ok: false, error: errMsg };
      }
    } catch (err: any) {
      await refreshBackendData();
      const errMsg = err?.message || 'Conflict: Unable to verify return (409).';
      showToast(errMsg);
      return { ok: false, error: errMsg };
    }

    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return { ok: false, error: 'Request not found.' };
    if (total !== req.requestedQuantity) {
      return {
        ok: false,
        error: `Reusable (${counts.reusable}) + Damaged (${counts.damaged}) + Missing (${counts.missing}) must equal ${req.requestedQuantity} borrowed units.`,
      };
    }

    const lostUnits = counts.damaged + counts.missing;
    setState((prev) => ({
      ...prev,
      requests: prev.requests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'Completed',
              updatedAt: REFERENCE_TODAY,
              verification: { ...counts, verifiedAt: REFERENCE_TODAY },
            }
          : r
      ),
      resources: prev.resources.map((res) =>
        res.id === req.resourceId
          ? {
              ...res,
              borrowedUnits: Math.max(0, res.borrowedUnits - req.requestedQuantity),
              availableUnits: res.availableUnits + counts.reusable,
              totalUnits: Math.max(0, res.totalUnits - lostUnits),
            }
          : res
      ),
    }));
    showToast(
      `Return verified & completed. ${counts.reusable} reusable unit${counts.reusable === 1 ? '' : 's'} returned to stock.`
    );
    return { ok: true };
  };

  const addResource: AppContextValue['addResource'] = (input) => {
    const newRes: Resource = {
      id: `res-${Date.now()}`,
      clubId: input.clubId,
      name: input.name.trim(),
      category: input.category,
      totalUnits: input.totalUnits,
      availableUnits: input.totalUnits,
      reservedUnits: 0,
      borrowedUnits: 0,
      condition: input.condition,
      location: input.location.trim(),
      description: input.description.trim(),
      remarks: input.remarks.trim(),
      images: [input.imageUrl],
      archived: false,
      manualUnavailable: false,
      estimatedUnitCostRM: input.estimatedUnitCostRM,
      estimatedUnitWeightKg: input.estimatedUnitWeightKg,
      createdAt: REFERENCE_TODAY,
    };

    api.resources
      .create({
        itemName: input.name.trim(),
        category: input.category,
        description: input.description.trim(),
        totalQuantity: input.totalUnits,
        condition: input.condition,
        location: input.location.trim(),
        remarks: input.remarks.trim(),
        estimatedUnitCost: input.estimatedUnitCostRM,
        estimatedUnitWeight: input.estimatedUnitWeightKg,
      })
      .then((res) => {
        if (res.success) {
          refreshBackendData();
        }
      })
      .catch((err) => {
        console.error('Failed to create resource on backend:', err);
      });

    setState((prev) => ({
      ...prev,
      resources: [newRes, ...prev.resources],
    }));
    showToast(`Added "${newRes.name}" to club inventory.`);
    return newRes;
  };

  const editResourceQuantity: AppContextValue['editResourceQuantity'] = (
    resourceId,
    newTotal
  ) => {
    const res = state.resources.find((r) => r.id === resourceId);
    if (!res) return { ok: false, error: 'Resource not found.' };
    const committed = res.reservedUnits + res.borrowedUnits;
    if (newTotal < committed) {
      const errMsg = `Cannot reduce total below ${committed} units currently reserved or borrowed.`;
      showToast(errMsg);
      return {
        ok: false,
        error: errMsg,
      };
    }

    api.resources
      .update(resourceId, { totalQuantity: newTotal })
      .then(() => refreshBackendData())
      .catch((err: any) => {
        if (err?.code === 'QUANTITY_CONFLICT' || err?.status === 409) {
          showToast(err.message || 'QUANTITY_CONFLICT: Cannot reduce total quantity below reserved/borrowed units.');
        }
      });

    setState((prev) => ({
      ...prev,
      resources: prev.resources.map((r) =>
        r.id === resourceId
          ? {
              ...r,
              totalUnits: newTotal,
              availableUnits: newTotal - committed,
            }
          : r
      ),
    }));
    showToast(`Updated "${res.name}" quantity to ${newTotal} units.`);
    return { ok: true };
  };

  const updateResource: AppContextValue['updateResource'] = (
    resourceId,
    input
  ) => {
    const res = state.resources.find((r) => r.id === resourceId);
    if (!res) return { ok: false, error: 'Resource not found.' };

    const committed = res.reservedUnits + res.borrowedUnits;
    if (input.totalUnits !== undefined && input.totalUnits < committed) {
      const errMsg = `Cannot reduce total below ${committed} units currently reserved or borrowed.`;
      showToast(errMsg);
      return {
        ok: false,
        error: errMsg,
      };
    }

    const payload: any = {};
    if (input.name) payload.itemName = input.name.trim();
    if (input.category) payload.category = input.category;
    if (input.description !== undefined) payload.description = input.description.trim();
    if (input.condition) payload.condition = input.condition;
    if (input.location !== undefined) payload.location = input.location.trim();
    if (input.remarks !== undefined) payload.remarks = input.remarks.trim();
    if (input.totalUnits !== undefined) payload.totalQuantity = input.totalUnits;
    if (input.estimatedUnitCostRM !== undefined) payload.estimatedUnitCost = input.estimatedUnitCostRM;
    if (input.estimatedUnitWeightKg !== undefined) payload.estimatedUnitWeight = input.estimatedUnitWeightKg;

    api.resources
      .update(resourceId, payload)
      .then(() => refreshBackendData())
      .catch((err: any) => {
        if (err?.code === 'QUANTITY_CONFLICT' || err?.status === 409) {
          showToast(err.message || 'QUANTITY_CONFLICT: Cannot reduce total quantity below reserved/borrowed units.');
        }
      });

    setState((prev) => ({
      ...prev,
      resources: prev.resources.map((r) => {
        if (r.id !== resourceId) return r;
        const total = input.totalUnits !== undefined ? input.totalUnits : r.totalUnits;
        return {
          ...r,
          name: input.name ? input.name.trim() : r.name,
          category: input.category || r.category,
          condition: input.condition || r.condition,
          location: input.location ? input.location.trim() : r.location,
          description: input.description !== undefined ? input.description.trim() : r.description,
          remarks: input.remarks !== undefined ? input.remarks.trim() : r.remarks,
          totalUnits: total,
          availableUnits: total - committed,
          images: input.imageUrl ? [input.imageUrl] : r.images,
          estimatedUnitCostRM: input.estimatedUnitCostRM !== undefined ? input.estimatedUnitCostRM : r.estimatedUnitCostRM,
          estimatedUnitWeightKg: input.estimatedUnitWeightKg !== undefined ? input.estimatedUnitWeightKg : r.estimatedUnitWeightKg,
        };
      }),
    }));
    showToast(`Resource "${input.name?.trim() || res.name}" updated successfully.`);
    return { ok: true };
  };

  const toggleResourceAvailability: AppContextValue['toggleResourceAvailability'] = (
    resourceId
  ) => {
    const res = state.resources.find((r) => r.id === resourceId);
    if (!res) return;
    const newUnavailable = !res.manualUnavailable;

    api.resources
      .updateAvailability(resourceId, { isTemporarilyUnavailable: newUnavailable })
      .then(() => refreshBackendData())
      .catch(console.error);

    setState((prev) => ({
      ...prev,
      resources: prev.resources.map((r) =>
        r.id === resourceId
          ? { ...r, manualUnavailable: newUnavailable }
          : r
      ),
    }));
    showToast(
      res.manualUnavailable
        ? `"${res.name}" is now visible as Available.`
        : `"${res.name}" marked Unavailable for new requests.`
    );
  };

  const archiveResource: AppContextValue['archiveResource'] = (resourceId) => {
    const hasActiveUse = state.requests.some(
      (req) =>
        req.resourceId === resourceId &&
        ['Pending', 'Approved', 'Borrowed', 'Return Pending'].includes(req.status)
    );
    if (hasActiveUse) {
      showToast('Cannot archive resource with active borrowings (reserved or borrowed units).');
      return { ok: false, blocked: true };
    }

    api.resources
      .archive(resourceId)
      .then(() => refreshBackendData())
      .catch((err: any) => {
        if (err?.code === 'RESOURCE_HAS_ACTIVE_BORROWINGS' || err?.status === 409) {
          showToast(err.message || 'RESOURCE_HAS_ACTIVE_BORROWINGS: Cannot archive resource with active borrowings.');
        }
      });

    setState((prev) => ({
      ...prev,
      resources: prev.resources.map((r) =>
        r.id === resourceId ? { ...r, archived: true } : r
      ),
    }));
    showToast('Resource archived. Historical records are preserved.');
    return { ok: true };
  };

  const resetDemoData = () => {
    const fresh: PersistedState = {
      clubs: INITIAL_CLUBS,
      events: INITIAL_EVENTS,
      resources: INITIAL_RESOURCES,
      requests: INITIAL_REQUESTS,
      accessRequests: INITIAL_ACCESS_REQUESTS,
    };
    setState(fresh);
    showToast('Demo data restored to initial state.');
  };

  // API data is layered over the local demo data; API ids win on a clash.
  const clubMap = useMemo(
    () => new Map([...state.clubs, ...remoteClubs].map((c) => [c.id, c])),
    [state.clubs, remoteClubs]
  );

  const resourceMap = useMemo(
    () => new Map([...state.resources, ...remoteResources].map((r) => [r.id, r])),
    [state.resources, remoteResources]
  );

  const requestMap = useMemo(
    () => new Map(state.requests.map((r) => [r.id, r])),
    [state.requests]
  );

  const fetchClubById = useCallback(async (clubId: string) => {
    if (!clubId) return undefined;
    try {
      const res = await api.clubs.getById(clubId);
      if (res.success && res.data) {
        const c = res.data;
        const club: Club = {
          id: c.clubId,
          name: c.clubName,
          acronym: c.clubName.split(' ').map((w: string) => w[0]).join('').slice(0, 5).toUpperCase(),
          categoryFocus: 'Student Activity',
          description: c.description || '',
          storageLocation: 'UM Campus',
          contactEmail: c.contactEmail,
          picPhone: c.picContactNum || '',
          representativeName: c.clubName + ' Rep',
          representativeEmail: c.contactEmail,
          password: '',
          status: c.isActive === false ? 'Inactive' : 'Active',
          createdAt: c.createdAt || new Date().toISOString(),
        };
        setState((prev) => ({
          ...prev,
          clubs: [club, ...prev.clubs.filter((x) => x.id !== club.id)],
        }));
        return club;
      }
    } catch {
      // ignore
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (currentUser?.clubId) {
      fetchClubById(currentUser.clubId);
    }
  }, [currentUser?.clubId, fetchClubById]);

  const getClubById = (id?: string | null) => {
    if (!id) return undefined;
    const direct = clubMap.get(id);
    if (direct) return direct;
    return Array.from(clubMap.values()).find(
      (c) => c.id.toLowerCase() === id.toLowerCase() || c.acronym.toLowerCase() === id.toLowerCase()
    );
  };
  const getResourceById = (id?: string | null) =>
    id ? resourceMap.get(id) : undefined;
  const getRequestById = (id?: string | null) =>
    id ? requestMap.get(id) : undefined;

  return (
    <AppContext.Provider
      value={{
        clubs: state.clubs,
        events: state.events,
        resources: state.resources,
        requests: state.requests,
        accessRequests: state.accessRequests,
        currentUser,
        currentView,
        selectedClubId,
        selectedResourceId,
        selectedRequestId,
        marketplaceSearch,
        toastMessage,
        authReady,
        cacheRemoteData,
        setMarketplaceSearch,
        showToast,
        navigate,
        login,
        logout,
        createClubAccount,
        updateClubDetails,
        updateOwnClubProfile,
        deactivateClub,
        reactivateClub,
        processAccessRequest,
        createEvent,
        updateEvent,
        deleteEvent,
        submitClubAccessRequest,
        submitBorrowRequest,
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
        resetDemoData,
        getClubById,
        fetchClubById,
        getResourceById,
        getRequestById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
