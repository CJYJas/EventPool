import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { FormField, fieldInputClass } from './FormField';
import { InlineAlert } from './StateBlocks';
import {
  MAX_DESCRIPTION_LENGTH,
  createClubAccountApi,
  describeCreateClubError,
  validateCreateClub,
  type CreateClubErrors,
  type CreateClubValues,
  type CreatedClub,
} from '../services/adminClubs';

const EMPTY: CreateClubValues = {
  clubName: '',
  contactEmail: '',
  picContactNum: '',
  description: '',
  password: '',
};

/** Admin-only form for POST /api/admin/clubs. Callers must only render it for administrators. */
export const CreateClubAccountModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreated: (club: CreatedClub) => void;
}> = ({ open, onClose, onCreated }) => {
  const [values, setValues] = useState<CreateClubValues>(EMPTY);
  const [errors, setErrors] = useState<CreateClubErrors>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  const close = () => {
    if (submitting) return;
    setValues(EMPTY);
    setErrors({});
    setFormError('');
    setShowPassword(false);
    onClose();
  };

  const set = (key: keyof CreateClubValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError('');

    const found = validateCreateClub(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const created = await createClubAccountApi(values);
      setValues(EMPTY);
      setErrors({});
      setShowPassword(false);
      onCreated(created);
    } catch (err) {
      const failure = describeCreateClubError(err);
      if (failure.field) setErrors({ [failure.field]: failure.message });
      else setFormError(failure.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-club-title"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-8 relative shadow-xl my-8">
        <button
          type="button"
          onClick={close}
          aria-label="Close modal"
          className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <h2 id="create-club-title" className="text-xl font-bold text-[#1F3626]">
            Create Club Account
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            Creates an active UM student club account. The contact email is the club&apos;s login.
          </p>
        </div>

        {formError && (
          <div className="mb-4" role="alert">
            <InlineAlert message={formError} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <FormField label="Club name" required htmlFor="club-name" error={errors.clubName}>
            <input
              id="club-name"
              type="text"
              value={values.clubName}
              onChange={set('clubName')}
              disabled={submitting}
              placeholder="e.g. Persatuan Komputer Universiti Malaya"
              className={fieldInputClass(Boolean(errors.clubName))}
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Contact email (login)" required htmlFor="club-email" error={errors.contactEmail}>
              <input
                id="club-email"
                type="email"
                autoComplete="off"
                value={values.contactEmail}
                onChange={set('contactEmail')}
                disabled={submitting}
                placeholder="club@um.edu.my"
                className={fieldInputClass(Boolean(errors.contactEmail))}
              />
            </FormField>
            <FormField label="PIC contact number" required htmlFor="club-phone" error={errors.picContactNum}>
              <input
                id="club-phone"
                type="tel"
                value={values.picContactNum}
                onChange={set('picContactNum')}
                disabled={submitting}
                placeholder="012-345 6789"
                className={fieldInputClass(Boolean(errors.picContactNum))}
              />
            </FormField>
          </div>

          <FormField
            label="Description"
            htmlFor="club-description"
            error={errors.description}
            helper={`${values.description.trim().length}/${MAX_DESCRIPTION_LENGTH}`}
          >
            <textarea
              id="club-description"
              rows={3}
              value={values.description}
              onChange={set('description')}
              disabled={submitting}
              placeholder="What does this club do?"
              className={`w-full p-3.5 rounded-xl border text-sm text-[#1F3626] focus:outline-none ${
                errors.description ? 'border-[#8C2220] bg-[#FDF2F2]/40' : 'border-[#D4D1C7] focus:border-[#2D4A35]'
              }`}
            />
          </FormField>

          <FormField
            label="Initial password"
            required
            htmlFor="club-password"
            error={errors.password}
            helper="At least 6 characters. Share it with the club representative securely."
          >
            <div className="relative">
              <input
                id="club-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={values.password}
                onChange={set('password')}
                disabled={submitting}
                className={`${fieldInputClass(Boolean(errors.password))} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B766E] hover:text-[#1F3626] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={close}
              disabled={submitting}
              className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-sm font-medium text-[#3D4B41] hover:bg-[#FAF8F2] disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] disabled:bg-[#9BA89E] disabled:cursor-not-allowed text-white text-sm font-semibold cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Club Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
