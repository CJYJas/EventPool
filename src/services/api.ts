/**
 * EventPool API Service
 * Connects the React Frontend to the Express / Firebase Backend
 */

const FIREBASE_WEB_API_KEY =
  import.meta.env.VITE_FIREBASE_WEB_API_KEY ||
  'AIzaSyCuxj4pY_b0wDq298coBMXtVm-FdDrLRuQ';

export const TOKEN_STORAGE_KEY = 'eventpool_auth_token';

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

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Authentication with Firebase failed.');
  }

  const token = data.idToken;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  return token;
}

/**
 * Generic authenticated API fetch wrapper
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.message || body?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
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

export async function fetchAuthProfileApi() {
  return apiRequest('/api/auth/profile');
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
