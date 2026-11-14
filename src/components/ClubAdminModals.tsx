import React, { useEffect, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { ClubLogo } from './ClubLogo';
import { ConfirmDialog } from './ConfirmDialog';
import { InlineAlert } from './StateBlocks';
import { useApp } from '../context/AppContext';
import type { Club } from '../types/eventpool';

export const CreateClubModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { createClubAccount } = useApp();
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [categoryFocus, setCategoryFocus] = useState('Cultural & Heritage');
  const [storageLocation, setStorageLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [description, setDescription] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeEmail, setRepresentativeEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');

  if (!open) return null;

  const resetAndClose = () => {
    setName('');
    setAcronym('');
    setCategoryFocus('Cultural & Heritage');
    setStorageLocation('');
    setContactEmail('');
    setPicPhone('');
    setDescription('');
    setRepresentativeName('');
    setRepresentativeEmail('');
    setPassword('password123');
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = createClubAccount({
      name,
      acronym,
      categoryFocus,
      storageLocation,
      contactEmail: contactEmail || representativeEmail,
      picPhone,
      description,
      representativeName,
      representativeEmail,
      password,
    });
    if (!result.ok) {
      setError(result.error || 'Unable to create club account.');
      return;
    }
    resetAndClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-8 relative shadow-xl my-8">
        <button
          type="button"
          onClick={resetAndClose}
          aria-label="Close modal"
          className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-[#1F3626]">
            Create Club Account
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            Directly provision an active UM student club account and representative login.
          </p>
        </div>

        {error && <div className="mb-4"><InlineAlert message={error} /></div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Club Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. UM Entrepreneurship Society"
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Short Acronym *
              </label>
              <input
                type="text"
                required
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
                placeholder="e.g. UMES"
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Club Category / Focus
              </label>
              <select
                value={categoryFocus}
                onChange={(e) => setCategoryFocus(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] bg-white focus:border-[#2D4A35] focus:outline-none"
              >
                <option value="Cultural & Heritage">Cultural &amp; Heritage</option>
                <option value="Technology & Innovation">Technology &amp; Innovation</option>
                <option value="Visual & Performing Arts">Visual &amp; Performing Arts</option>
                <option value="Theatre & Production">Theatre &amp; Production</option>
                <option value="Engineering & Robotics">Engineering &amp; Robotics</option>
                <option value="Business & Outreach">Business &amp; Outreach</option>
                <option value="Sports & Recreation">Sports &amp; Recreation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Storage Location *
              </label>
              <input
                type="text"
                required
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="e.g. Block D, Room 104"
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Club Contact Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. umes.club@um.edu.my"
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                PIC Phone Number *
              </label>
              <input
                type="tel"
                required
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value)}
                placeholder="e.g. +60 12-345 6789"
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
              Club Description *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of club activities and shared equipment focus..."
              className="w-full p-3 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-[#EFECE3] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Representative Name *
              </label>
              <input
                type="text"
                required
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                placeholder="e.g. Amirul Hakim"
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Representative Login Email *
              </label>
              <input
                type="email"
                required
                value={representativeEmail}
                onChange={(e) => setRepresentativeEmail(e.target.value)}
                placeholder="e.g. amirul@um.edu.my"
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
              Initial Account Password *
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm font-mono text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
            />
            <p className="text-[11px] text-[#6B766E] mt-1">
              Account will be created with Active status immediately.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-sm font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold cursor-pointer"
            >
              Create Club Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EditClubModal: React.FC<{
  club: Club | null;
  onClose: () => void;
}> = ({ club, onClose }) => {
  const { updateClubDetails } = useApp();
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [categoryFocus, setCategoryFocus] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [picPhone, setPicPhone] = useState('');
  const [description, setDescription] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeEmail, setRepresentativeEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoError, setLogoError] = useState('');

  useEffect(() => {
    if (club) {
      setName(club.name);
      setAcronym(club.acronym);
      setCategoryFocus(club.categoryFocus);
      setStorageLocation(club.storageLocation);
      setContactEmail(club.contactEmail);
      setPicPhone(club.picPhone);
      setDescription(club.description);
      setRepresentativeName(club.representativeName);
      setRepresentativeEmail(club.representativeEmail);
      setLogoUrl(club.logoUrl || '');
      setLogoError('');
    }
  }, [club]);

  if (!club) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoError('Please select a valid image file (PNG, JPG, or WEBP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setLogoError('Profile picture must be 3 MB or smaller.');
      return;
    }
    setLogoError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateClubDetails(club.id, {
      name,
      acronym,
      categoryFocus,
      storageLocation,
      contactEmail,
      picPhone,
      description,
      representativeName,
      representativeEmail,
      logoUrl,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-8 relative shadow-xl my-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5">
          <h2 className="text-xl font-bold text-[#1F3626]">
            Edit Club Details
          </h2>
          <p className="text-sm text-[#4A554E] mt-1">
            Update organization information and primary representative for {club.acronym}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#FAF8F2] border border-[#EFECE3] flex flex-wrap items-center gap-4">
            <ClubLogo
              club={{ ...club, logoUrl: logoUrl || undefined }}
              size="md"
            />
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs font-semibold text-[#1F3626]">
                Club Profile Picture / Logo
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <label className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Upload New Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="sr-only"
                  />
                </label>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl('')}
                    className="inline-flex items-center gap-1 px-2.5 h-8 rounded-lg border border-[#D4D1C7] bg-white hover:bg-[#F2EFE6] text-xs font-medium text-[#4A554E] cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
              {logoError && (
                <p className="text-[11px] text-[#8C2220] mt-1">{logoError}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Club Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Acronym *
              </label>
              <input
                type="text"
                required
                value={acronym}
                onChange={(e) => setAcronym(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Category Focus
              </label>
              <input
                type="text"
                value={categoryFocus}
                onChange={(e) => setCategoryFocus(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Storage Location *
              </label>
              <input
                type="text"
                required
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                PIC Phone Number *
              </label>
              <input
                type="tel"
                required
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
              Description *
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
            />
          </div>

          <div className="pt-2 border-t border-[#EFECE3] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Representative Name *
              </label>
              <input
                type="text"
                required
                value={representativeName}
                onChange={(e) => setRepresentativeName(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Representative UM Email *
              </label>
              <input
                type="email"
                required
                value={representativeEmail}
                onChange={(e) => setRepresentativeEmail(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-sm font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DeactivateClubModal: React.FC<{
  club: Club | null;
  pendingCount: number;
  onClose: () => void;
}> = ({ club, pendingCount, onClose }) => {
  const { deactivateClub } = useApp();

  if (!club) return null;

  return (
    <ConfirmDialog
      open={Boolean(club)}
      tone="danger"
      title={`Deactivate ${club.acronym}?`}
      description={`Deactivating ${club.name} will change its status to Inactive. Its representative will no longer be able to log in or submit borrowing requests, and its shared resources will be marked Unavailable until reactivated.`}
      note={
        pendingCount > 0
          ? `Note: This club currently has ${pendingCount} pending borrowing request${
              pendingCount === 1 ? '' : 's'
            }. Existing history remains preserved.`
          : undefined
      }
      confirmLabel="Confirm Deactivate"
      onConfirm={() => {
        deactivateClub(club.id);
        onClose();
      }}
      onClose={onClose}
    />
  );
};
