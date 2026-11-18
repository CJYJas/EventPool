/**
 * EventPool API Service
 * Connects the React Frontend to the Express / Firebase Backend
 */

const FIREBASE_WEB_API_KEY =
  import.meta.env?.VITE_FIREBASE_WEB_API_KEY ||
  'AIzaSyCuxj4pY_b0wDq298coBMXtVm-FdDrLRuQ';

export const TOKEN_STORAGE_KEY = 'eventpool_auth_token';

/** Error carrying the HTTP status and machine-readable code (e.g. ACCOUNT_DISABLED, USER_DISABLED). */
export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 0, code = 'UNKNOWN') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage unavailable - nothing to clear
  }
}

let unauthorizedHandler: ((reason: 'expired' | 'disabled') => void) | null = null;

/** Registered by the app so an expired/invalid token on any API call signs the user out. */
export function setUnauthorizedHandler(handler: ((reason: 'expired' | 'disabled') => void) | null): void {
  unauthorizedHandler = handler;
}

/**
 * Check if the Express backend server is alive and responding
 */
export async function checkBackendHealth(): Promise<{ ok: boolean; status?: string }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { ok: false };
    const data = await res.json();
    return { ok: true, status: data?.data?.status || 'healthy' };
  } catch {
    return { ok: false };
  }
}

/**
 * Exchange email & password for a real Firebase ID token via REST API
 */
export async function loginWithFirebaseAuth(email: string, password: string): Promise<string> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Firebase codes look like "INVALID_LOGIN_CREDENTIALS" or "TOO_MANY_ATTEMPTS_TRY_LATER : Access to this account..."
    const code = String(data.error?.message || 'AUTH_FAILED').split(' ')[0];
    throw new ApiError('Authentication with Firebase failed.', res.status, code);
  }

  const token = data.idToken as string;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage unavailable - session will not survive a reload
  }
  return token;
}

/**
 * Generic authenticated API fetch wrapper
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  let response: Response;
  try {
    response = await fetch(endpoint, { ...options, headers });
  } catch {
    throw new ApiError('Cannot reach the EventPool server.', 0, 'NETWORK_ERROR');
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorCode = body?.error?.code;
    if (token && (response.status === 401 || errorCode === 'ACCOUNT_DISABLED')) {
      clearAuthToken();
      unauthorizedHandler?.(errorCode === 'ACCOUNT_DISABLED' ? 'disabled' : 'expired');
    }
    const message =
      body?.message ||
      (typeof body?.error === 'string' ? body.error : undefined) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, body?.error?.code || 'REQUEST_FAILED');
  }

  return body.data;
}

// ── Resource APIs ─────────────────────────────────────────────────────────────

export async function fetchResourcesApi() {
  return apiRequest('/api/resources');
}

export async function createResourceApi(input: {
  itemName: string;
  category: string;
  totalQuantity: number;
  condition: string;
  location: string;
  remarks?: string;
  estimatedUnitCost?: number;
  estimatedWeight?: number;
}) {
  return apiRequest('/api/resources', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateResourceApi(resourceId: string, updates: Record<string, any>) {
  return apiRequest(`/api/resources/${resourceId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function archiveResourceApi(resourceId: string) {
  return apiRequest(`/api/resources/${resourceId}/archive`, {
    method: 'PATCH',
  });
}

export async function toggleAvailabilityApi(resourceId: string, manualUnavailable: boolean) {
  return apiRequest(`/api/resources/${resourceId}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ manualUnavailable }),
  });
}

// ── Club & Profile APIs ────────────────────────────────────────────────────────

export async function fetchClubsApi() {
  return apiRequest('/api/clubs');
}

export async function fetchClubByIdApi(clubId: string) {
  return apiRequest(`/api/clubs/${clubId}`);
}

export async function updateClubProfileApi(clubId: string, updates: Record<string, any>) {
  return apiRequest(`/api/clubs/${clubId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export type AuthProfile =
  | { accountType: 'club'; clubId: string; clubName: string; email: string }
  | { accountType: 'admin'; adminId: string; adminName: string; email: string };

export async function fetchAuthProfileApi(): Promise<AuthProfile> {
  return apiRequest<AuthProfile>('/api/auth/profile');
}

// ── Event APIs ────────────────────────────────────────────────────────────────

export async function fetchEventsApi() {
  return apiRequest('/api/events');
}

export async function createEventApi(input: {
  name: string;
  date: string;
  purpose: string;
  description?: string;
}) {
  return apiRequest('/api/events', {
    method: 'POST',
    body: JSON.stringify({
      eventName: input.name,
      eventDate: input.date,
      purpose: input.purpose,
      description: input.description,
    }),
  });
}

export async function updateEventApi(
  eventId: string,
  input: {
    name?: string;
    date?: string;
    purpose?: string;
    description?: string;
  }
) {
  return apiRequest(`/api/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(input.name ? { eventName: input.name } : {}),
      ...(input.date ? { eventDate: input.date } : {}),
      ...(input.purpose ? { purpose: input.purpose } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    }),
  });
}

// ── Borrowing Request APIs (FE-06) ──────────────────────────────────────────

export async function fetchBorrowRequestsApi() {
  return apiRequest('/api/borrowing-requests');
}

export async function approveBorrowRequestApi(requestId: string) {
  return apiRequest(`/api/borrowing-requests/${requestId}/approve`, {
    method: 'PATCH',
  });
}

export async function rejectBorrowRequestApi(requestId: string, reason?: string) {
  return apiRequest(`/api/borrowing-requests/${requestId}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export async function markBorrowedApi(requestId: string) {
  return apiRequest(`/api/borrowing-requests/${requestId}/borrow`, {
    method: 'PATCH',
  });
}

export async function cancelBorrowRequestApi(requestId: string) {
  return apiRequest(`/api/borrowing-requests/${requestId}/cancel`, {
    method: 'PATCH',
  });
}

// ── Admin & Sustainability APIs (FE-08) ────────────────────────────────────

export async function fetchAdminDashboardApi() {
  return apiRequest('/api/admin/dashboard');
}

export async function fetchSustainabilityApi(params?: { clubId?: string; period?: string }) {
  const query = new URLSearchParams(params as Record<string, string>).toString();
  return apiRequest(`/api/sustainability${query ? `?${query}` : ''}`);
}
