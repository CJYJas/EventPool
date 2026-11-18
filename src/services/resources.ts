import type { Club, Resource, ResourceCategory } from '../types/eventpool';
import { apiRequest } from './api';

/** Shapes returned by the backend (see backend/src/controllers/resourceController.js and clubController.js). */
export interface ApiResource {
  resourceId: string;
  clubId: string;
  itemName: string;
  category: string;
  description?: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  borrowedQuantity: number;
  condition?: string;
  location?: string;
  remarks?: string;
  estimatedUnitCost?: number;
  estimatedUnitWeight?: number;
  imageURL?: string | null;
  isArchived?: boolean;
  isTemporarilyUnavailable?: boolean;
  createdAt?: string;
}

export interface ApiClub {
  clubId: string;
  clubName: string;
  description?: string;
  contactEmail?: string;
  picContactNum?: string;
  isActive?: boolean;
  createdAt?: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResourceQuery {
  /** Keyword. When non-empty the /search endpoint is used. */
  q?: string;
  category?: string;
  /** Available | Reserved | Borrowed | Unavailable */
  status?: string;
  clubId?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export interface ResourcePage {
  items: Resource[];
  pagination: Pagination;
}

export function mapApiResource(r: ApiResource): Resource {
  return {
    id: r.resourceId,
    clubId: r.clubId,
    name: r.itemName,
    category: r.category as ResourceCategory,
    totalUnits: Number(r.totalQuantity) || 0,
    availableUnits: Number(r.availableQuantity) || 0,
    reservedUnits: Number(r.reservedQuantity) || 0,
    borrowedUnits: Number(r.borrowedQuantity) || 0,
    condition: (r.condition as Resource['condition']) || 'Good',
    location: r.location || '',
    description: r.description || '',
    remarks: r.remarks || '',
    images: r.imageURL ? [r.imageURL] : [],
    archived: r.isArchived === true,
    manualUnavailable: r.isTemporarilyUnavailable === true,
    estimatedUnitCostRM: r.estimatedUnitCost,
    estimatedUnitWeightKg: r.estimatedUnitWeight,
    createdAt: r.createdAt || '',
  };
}

/** The backend has no acronym, so the club name is used wherever an acronym was shown. */
export function mapApiClub(c: ApiClub): Club {
  return {
    id: c.clubId,
    name: c.clubName,
    acronym: c.clubName,
    categoryFocus: '',
    description: c.description || '',
    storageLocation: '',
    contactEmail: c.contactEmail || '',
    picPhone: c.picContactNum || '',
    representativeName: '',
    representativeEmail: '',
    password: '',
    status: c.isActive === false ? 'Inactive' : 'Active',
    createdAt: c.createdAt || '',
  };
}

/** Builds the query string, dropping empty values. */
export function buildResourceQueryString(query: ResourceQuery, omitKeyword = false): string {
  const params = new URLSearchParams();
  const entries: Array<[string, string | number | undefined]> = [
    ['q', omitKeyword ? undefined : query.q?.trim()],
    ['category', query.category],
    ['status', query.status],
    ['clubId', query.clubId],
    ['location', query.location],
    ['page', query.page],
    ['limit', query.limit],
  ];
  for (const [key, value] of entries) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/** GET /api/resources, or GET /api/resources/search when a keyword is present. */
export async function fetchResourcePage(query: ResourceQuery): Promise<ResourcePage> {
  const hasKeyword = Boolean(query.q?.trim());
  const path = hasKeyword ? '/api/resources/search' : '/api/resources';
  const data = await apiRequest<{ items: ApiResource[]; pagination: Pagination }>(
    `${path}${buildResourceQueryString(query, !hasKeyword)}`
  );
  return { items: data.items.map(mapApiResource), pagination: data.pagination };
}

/** GET /api/resources/:resourceId */
export async function fetchResourceById(resourceId: string): Promise<Resource> {
  const data = await apiRequest<ApiResource>(`/api/resources/${encodeURIComponent(resourceId)}`);
  return mapApiResource(data);
}

/** GET /api/clubs/:clubId */
export async function fetchClubById(clubId: string): Promise<Club> {
  const data = await apiRequest<ApiClub>(`/api/clubs/${encodeURIComponent(clubId)}`);
  return mapApiClub(data);
}

/** GET /api/clubs */
export async function fetchClubDirectory(): Promise<Club[]> {
  const data = await apiRequest<ApiClub[]>('/api/clubs');
  return data.map(mapApiClub);
}

/** Page numbers with ellipses, e.g. 1 ... 4 5 6 ... 20 */
export function getPageWindow(current: number, total: number): Array<number | '...'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: Array<number | '...'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('...');
    out.push(p);
  });
  return out;
}
