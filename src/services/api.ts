/**
 * EventPool API Client
 * Connects the frontend to the Express/Firebase backend API (/api)
 */

const API_BASE = '/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
  };
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('eventpool_jwt_token') || null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('eventpool_jwt_token', token);
    } else {
      localStorage.removeItem('eventpool_jwt_token');
    }
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('eventpool_jwt_token');
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const json = await response.json().catch(() => ({
        success: false,
        message: response.statusText,
        error: { code: 'HTTP_' + response.status },
      }));

      return json;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Network request failed',
        error: { code: 'NETWORK_ERROR' },
      };
    }
  }

  // Health check
  async health() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  // Auth Endpoints (BE-01)
  auth = {
    getProfile: () => this.request<any>('/auth/profile'),
  };

  // Admin Endpoints (BE-05)
  admin = {
    getProfile: () => this.request<any>('/admin/profile'),
    createClub: (data: {
      clubName: string;
      description?: string;
      contactEmail: string;
      picContactNum: string;
      password: string;
    }) =>
      this.request<{
        clubId: string;
        clubName: string;
        contactEmail: string;
        isActive: boolean;
      }>('/admin/clubs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deactivateClub: (clubId: string) =>
      this.request<{ clubId: string; isActive: boolean }>(
        `/admin/clubs/${clubId}/deactivate`,
        { method: 'PATCH' }
      ),
    getDashboard: () =>
      this.request<{
        totalClubs: number;
        activeClubs: number;
        totalResources: number;
        totalBorrowingRequests: number;
        pendingRequests: number;
        completedRequests: number;
      }>('/admin/dashboard'),
  };

  // Club Endpoints (BE-04)
  clubs = {
    getAll: () =>
      this.request<
        Array<{
          clubId: string;
          clubName: string;
          description: string;
          contactEmail: string;
          picContactNum: string;
          isActive: boolean;
        }>
      >('/clubs'),
    getById: (clubId: string) =>
      this.request<{
        clubId: string;
        clubName: string;
        description: string;
        contactEmail: string;
        picContactNum: string;
        createdAt: string;
        isActive: boolean;
      }>(`/clubs/${clubId}`),
    update: (
      clubId: string,
      data: {
        clubName?: string;
        description?: string;
        contactEmail?: string;
        picContactNum?: string;
      }
    ) =>
      this.request<{
        clubId: string;
        clubName: string;
        contactEmail: string;
      }>(`/clubs/${clubId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  };

  // Event Endpoints (BE-04)
  events = {
    getAll: (params?: { clubId?: string; eventDate?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<
        Array<{
          eventId: string;
          clubId: string;
          eventName: string;
          eventDate: string;
          purpose: string;
          description: string;
          createdAt: string;
        }>
      >(`/events${q ? `?${q}` : ''}`);
    },
    create: (data: {
      eventName: string;
      eventDate: string;
      purpose: string;
      description?: string;
    }) =>
      this.request<{
        eventId: string;
        clubId: string;
        eventName: string;
        eventDate: string;
        purpose: string;
      }>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  };

  // Resource Endpoints (BE-02 & BE-03)
  resources = {
    getAll: (params?: {
      category?: string;
      status?: string;
      clubId?: string;
      location?: string;
      page?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams(params as any).toString();
      return this.request<{
        items: any[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/resources${q ? `?${q}` : ''}`);
    },
    search: (params?: {
      q?: string;
      category?: string;
      status?: string;
      clubId?: string;
      location?: string;
      page?: number;
      limit?: number;
    }) => {
      const qs = new URLSearchParams(params as any).toString();
      return this.request<{
        items: any[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/resources/search${qs ? `?${qs}` : ''}`);
    },
    getById: (resourceId: string) => this.request<any>(`/resources/${resourceId}`),
    create: (data: {
      itemName: string;
      category: string;
      description?: string;
      totalQuantity: number;
      condition?: string;
      location?: string;
      remarks?: string;
      estimatedUnitCost?: number;
      estimatedUnitWeight?: number;
    }) =>
      this.request<any>('/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      resourceId: string,
      data: {
        itemName?: string;
        category?: string;
        description?: string;
        totalQuantity?: number;
        condition?: string;
        location?: string;
        remarks?: string;
        estimatedUnitCost?: number;
        estimatedUnitWeight?: number;
      }
    ) =>
      this.request<any>(`/resources/${resourceId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    archive: (resourceId: string) =>
      this.request<{ resourceId: string; isArchived: boolean }>(
        `/resources/${resourceId}/archive`,
        { method: 'PATCH' }
      ),
    updateAvailability: (
      resourceId: string,
      data: { isTemporarilyUnavailable: boolean; remarks?: string }
    ) =>
      this.request<any>(`/resources/${resourceId}/availability`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    uploadImage: (resourceId: string, file: File | Blob) => {
      const formData = new FormData();
      formData.append('image', file);
      return this.request<{ resourceId: string; imageURL: string }>(
        `/resources/${resourceId}/image`,
        {
          method: 'POST',
          body: formData,
        }
      );
    },
    getImage: (resourceId: string) =>
      this.request<{ resourceId: string; imageURL: string }>(
        `/resources/${resourceId}/image`
      ),
    deleteImage: (resourceId: string) =>
      this.request<{ resourceId: string; imageURL: null }>(
        `/resources/${resourceId}/image`,
        { method: 'DELETE' }
      ),
  };
}

export const api = new ApiService();
export default api;
