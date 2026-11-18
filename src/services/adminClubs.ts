import { ApiError, apiRequest } from './api';

export interface CreateClubValues {
  clubName: string;
  contactEmail: string;
  picContactNum: string;
  description: string;
  password: string;
}

export type CreateClubField = keyof CreateClubValues;
export type CreateClubErrors = Partial<Record<CreateClubField, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 6; // Firebase Authentication minimum
export const MAX_DESCRIPTION_LENGTH = 300;

/** Client-side checks run before POST /api/admin/clubs. */
export function validateCreateClub(values: CreateClubValues): CreateClubErrors {
  const errors: CreateClubErrors = {};

  const name = values.clubName.trim();
  if (!name) errors.clubName = 'Club name is required.';
  else if (name.length < 2) errors.clubName = 'Club name must be at least 2 characters.';
  else if (name.length > 100) errors.clubName = 'Club name must be 100 characters or fewer.';

  const email = values.contactEmail.trim();
  if (!email) errors.contactEmail = 'Contact email is required. It becomes the club login.';
  else if (!EMAIL_PATTERN.test(email)) errors.contactEmail = 'Enter a valid email address.';

  const phone = values.picContactNum.trim();
  const digits = phone.replace(/\D/g, '');
  if (!phone) errors.picContactNum = 'PIC contact number is required.';
  else if (!/^\+?[\d\s-]+$/.test(phone) || digits.length < 8 || digits.length > 15) {
    errors.picContactNum = 'Enter a valid phone number, e.g. 012-345 6789.';
  }

  if (values.description.trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  if (!values.password) errors.password = 'An initial password is required.';
  else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  return errors;
}

export interface CreateClubPayload {
  clubName: string;
  description: string;
  contactEmail: string;
  picContactNum: string;
  password: string;
}

export function buildCreateClubPayload(values: CreateClubValues): CreateClubPayload {
  return {
    clubName: values.clubName.trim(),
    description: values.description.trim(),
    contactEmail: values.contactEmail.trim(),
    picContactNum: values.picContactNum.trim(),
    password: values.password,
  };
}

export interface CreatedClub {
  clubId: string;
  clubName: string;
  contactEmail: string;
  isActive: boolean;
}

/** POST /api/admin/clubs (admin only) */
export async function createClubAccountApi(values: CreateClubValues): Promise<CreatedClub> {
  return apiRequest<CreatedClub>('/api/admin/clubs', {
    method: 'POST',
    body: JSON.stringify(buildCreateClubPayload(values)),
  });
}

export interface CreateClubFailure {
  /** Field to highlight, when the problem belongs to one input. */
  field?: CreateClubField;
  message: string;
}

export function describeCreateClubError(err: unknown): CreateClubFailure {
  if (err instanceof ApiError) {
    if (err.code === 'EMAIL_ALREADY_EXISTS' || err.status === 409) {
      return {
        field: 'contactEmail',
        message: 'A club account with this email already exists. Use a different email.',
      };
    }
    if (err.code === 'NETWORK_ERROR' || err.status === 0) {
      return { message: 'Cannot reach the EventPool server. Check your connection and try again.' };
    }
    if (err.status === 403) {
      return { message: 'Only administrator accounts can create club accounts.' };
    }
    if (err.code === 'INVALID_INPUT') {
      return { message: err.message || 'Some of the details are missing or invalid.' };
    }
    // Firebase Auth rejections are passed through as AUTH_ERROR with Firebase wording
    if (err.code === 'AUTH_ERROR') {
      const text = err.message.toLowerCase();
      if (text.includes('email')) {
        return { field: 'contactEmail', message: 'That email address is not valid for a login account.' };
      }
      if (text.includes('password')) {
        return { field: 'password', message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
      }
      return { message: err.message };
    }
    if (err.status >= 500) {
      return { message: 'The server could not create the account. Nothing was saved. Please try again.' };
    }
    return { message: err.message || 'Could not create the club account.' };
  }
  return { message: 'Could not create the club account.' };
}
