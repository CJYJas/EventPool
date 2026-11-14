export type UserRole = 'club_rep' | 'admin';

export type ClubStatus = 'Active' | 'Inactive';

export type ResourceCategory =
  | 'Furniture'
  | 'Audio Equipment'
  | 'Lighting'
  | 'Electronics'
  | 'Decorations';

export type ResourceAvailability =
  | 'Available'
  | 'Reserved'
  | 'Borrowed'
  | 'Unavailable';

export type RequestStatus =
  | 'Pending'
  | 'Approved'
  | 'Borrowed'
  | 'Return Pending'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled';

export type AppView =
  | 'home'
  | 'clubs'
  | 'club_detail'
  | 'marketplace'
  | 'resource_detail'
  | 'borrow_form'
  | 'my_club'
  | 'request_detail'
  | 'admin_dashboard'
  | 'sustainability';

export interface Club {
  id: string;
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
  status: ClubStatus;
  logoUrl?: string;
  createdAt: string;
}

export interface ClubEvent {
  id: string;
  clubId: string;
  name: string;
  date: string;
  purpose: string;
  description?: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  clubId: string;
  name: string;
  category: ResourceCategory;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  borrowedUnits: number;
  condition: 'Excellent' | 'Good' | 'Fair';
  location: string;
  description: string;
  remarks: string;
  images: string[];
  archived: boolean;
  manualUnavailable: boolean;
  estimatedUnitCostRM?: number;
  estimatedUnitWeightKg?: number;
  createdAt: string;
}

export interface ReturnVerification {
  reusable: number;
  damaged: number;
  missing: number;
  verifiedAt: string;
}

export interface BorrowRequest {
  id: string;
  resourceId: string;
  ownerClubId: string;
  borrowerClubId: string;
  eventId?: string;
  eventName: string;
  requestedQuantity: number;
  purpose: string;
  wouldOtherwisePurchase: boolean;
  remarks?: string;
  pickupDate: string;
  expectedReturnDate: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  returnedDate?: string;
  verification?: ReturnVerification;
}

export interface ClubAccessRequest {
  id: string;
  clubName: string;
  representativeName: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Declined';
  submittedAt: string;
}

export interface CurrentUser {
  role: UserRole;
  name: string;
  email: string;
  clubId?: string;
}

export interface HistoricalMonthlyShare {
  month: string;
  cycles: number;
  units: number;
}
