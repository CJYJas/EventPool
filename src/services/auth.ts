import type { CurrentUser } from '../types/eventpool';
import {
  ApiError,
  clearAuthToken,
  fetchAuthProfileApi,
  getAuthToken,
  loginWithFirebaseAuth,
  type AuthProfile,
} from './api';

export type AuthFailureCode =
  | 'invalid_credentials'
  | 'disabled_account'
  | 'too_many_attempts'
  | 'account_not_found'
  | 'network_error'
  | 'unknown';

export interface AuthFailure {
  code: AuthFailureCode;
  message: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6; // Firebase Authentication minimum

export interface LoginFieldErrors {
  email?: string;
  password?: string;
}

/** Client-side validation run before any network call. */
export function validateLoginInput(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (!email.trim()) errors.email = 'Enter your UM email.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address, e.g. name@um.edu.my.';

  if (!password) errors.password = 'Enter your password.';
  else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return errors;
}

/** Translate a Firebase or EventPool API failure into a message the user can act on. */
export function describeAuthError(err: unknown): AuthFailure {
  if (err instanceof ApiError) {
    switch (err.code) {
      // Firebase REST codes
      case 'INVALID_LOGIN_CREDENTIALS':
      case 'INVALID_PASSWORD':
      case 'EMAIL_NOT_FOUND':
      case 'INVALID_EMAIL':
        return {
          code: 'invalid_credentials',
          message: 'Incorrect email or password. Check your details and try again.',
        };
      case 'USER_DISABLED':
      case 'ACCOUNT_DISABLED': // backend 403
        return {
          code: 'disabled_account',
          message:
            'This account has been disabled by UM Admin. Contact Student Affairs to reactivate it.',
        };
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return {
          code: 'too_many_attempts',
          message: 'Too many failed attempts. Please wait a few minutes before trying again.',
        };
      case 'ACCOUNT_PROFILE_NOT_FOUND':
        return {
          code: 'account_not_found',
          message:
            'Your sign-in worked, but no EventPool account is linked to it. Contact UM Admin.',
        };
      case 'NETWORK_ERROR':
        return {
          code: 'network_error',
          message: 'Cannot reach the EventPool server. Check your connection and try again.',
        };
    }
    if (err.status === 0 || err.status >= 500) {
      return {
        code: 'network_error',
        message: 'EventPool is temporarily unavailable. Please try again shortly.',
      };
    }
  } else if (err instanceof TypeError) {
    // fetch() rejects with TypeError when offline / blocked
    return {
      code: 'network_error',
      message: 'Cannot reach the sign-in service. Check your connection and try again.',
    };
  }
  return { code: 'unknown', message: 'Sign-in failed. Please try again.' };
}

/** Map the backend profile onto the app's CurrentUser shape. */
export function profileToUser(profile: AuthProfile): CurrentUser {
  if (profile.accountType === 'admin') {
    return { role: 'admin', name: profile.adminName, email: profile.email };
  }
  return { role: 'club_rep', name: profile.clubName, email: profile.email, clubId: profile.clubId };
}

/** Firebase sign-in, then resolve the account type via GET /api/auth/profile. */
export async function signIn(email: string, password: string): Promise<CurrentUser> {
  await loginWithFirebaseAuth(email.trim(), password);
  try {
    return profileToUser(await fetchAuthProfileApi());
  } catch (err) {
    clearAuthToken(); // never keep a token that has no usable profile
    throw err;
  }
}

/** Re-establish the session from a stored token on page load. Resolves null if there is none or it is invalid. */
export async function restoreSession(): Promise<CurrentUser | null> {
  if (!getAuthToken()) return null;
  try {
    return profileToUser(await fetchAuthProfileApi());
  } catch (err) {
    // Keep the token only if the server was simply unreachable
    if (!(err instanceof ApiError) || err.status !== 0) clearAuthToken();
    return null;
  }
}

export function signOut(): void {
  clearAuthToken();
}
