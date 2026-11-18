import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Info,
  Recycle,
} from 'lucide-react';
import { ClubLogo } from '../../components/ClubLogo';
import { ResourceImage } from '../../components/ResourceImage';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState, ErrorRetryState, LoadingSkeleton } from '../../components/StateBlocks';
import { getResourceAvailability, useApp } from '../../context/AppContext';
import { useResourceDetail } from '../../hooks/useResourceDetail';
import { getRequestBlocker } from '../../services/borrowing';

export const ResourceDetailPage: React.FC = () => {
  const { selectedResourceId, currentUser, navigate } = useApp();
  const { resource, club: ownerClub, status, error, reload } = useResourceDetail(selectedResourceId);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const backToMarketplace = (
    <button
      type="button"
      onClick={() => navigate('marketplace')}
      className="inline-flex items-center gap-2 text-sm font-medium text-[#2D4A35] hover:text-[#1F3626] cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Marketplace
    </button>
  );

  if (status === 'not_found') {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {backToMarketplace}
        <EmptyState
          title="Resource not found"
          description="This resource may have been removed or archived by its owner club."
          actionLabel="Browse Marketplace"
          onAction={() => navigate('marketplace')}
        />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {backToMarketplace}
        {status === 'error' ? (
          <ErrorRetryState message={error} onRetry={reload} />
        ) : (
          <LoadingSkeleton rows={4} />
        )}
      </div>
    );
  }

  const images = resource.images.length > 0 ? resource.images : [''];
  const safeIdx = activeImageIdx % images.length;
  const availability = getResourceAvailability(resource, ownerClub);
  const isOwnClub = Boolean(currentUser?.clubId) && currentUser?.clubId === resource.clubId;
  const isClubInactive = ownerClub?.status === 'Inactive';
  // Same rules the borrowing form enforces: own club, unavailable, archived or inactive owner cannot be requested
  const canRequest = getRequestBlocker(resource, ownerClub, currentUser, availability) === null;

  const handleRequestBorrow = () => {
    // navigate() sends signed-out users to the login screen
    navigate('borrow_form', { resourceId: resource.id });
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button
        type="button"
        onClick={() => navigate('marketplace')}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#2D4A35] hover:text-[#1F3626] cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </button>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Gallery */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl overflow-hidden border border-[#E5E2D9] aspect-[4/3] bg-[#FAF8F2]">
            <ResourceImage
              src={images[safeIdx]}
              alt={resource.name}
              className="w-full h-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label="Previous image"
                onClick={() =>
                  setActiveImageIdx(
                    (idx) => (idx - 1 + images.length) % images.length
                  )
                }
                className="w-8 h-8 rounded-full border border-[#D4D1C7] flex items-center justify-center text-[#4A554E] hover:bg-[#FAF8F2] shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-3 gap-2.5 flex-1">
                {images.slice(0, 3).map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveImageIdx(i)}
                    className={`rounded-xl overflow-hidden aspect-[4/3] border-2 cursor-pointer transition-colors ${
                      i === safeIdx
                        ? 'border-[#2D4A35]'
                        : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <ResourceImage
                      src={img}
                      alt={`${resource.name} view ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="Next image"
                onClick={() =>
                  setActiveImageIdx((idx) => (idx + 1) % images.length)
                }
                className="w-8 h-8 rounded-full border border-[#D4D1C7] flex items-center justify-center text-[#4A554E] hover:bg-[#FAF8F2] shrink-0 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right Specs & Action */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <StatusBadge status={availability} />
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1F3626] mt-2">
              {resource.name}
            </h1>
            <button
              type="button"
              onClick={() =>
                ownerClub && navigate('club_detail', { clubId: ownerClub.id })
              }
              className="text-sm font-medium text-[#2D4A35] hover:underline mt-0.5 cursor-pointer"
            >
              {ownerClub?.acronym || 'UM Club'}
            </button>
            {status === 'error' && (
              <p className="text-xs text-[#8C2220] mt-1">
                Could not refresh this resource. Showing the last loaded details.{' '}
                <button type="button" onClick={reload} className="underline cursor-pointer">
                  Retry
                </button>
              </p>
            )}
          </div>

          <div className="border-y border-[#EFECE3] py-4 space-y-2.5 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-[#1F3626]">
                Available quantity
              </span>
              <span className="col-span-2 text-[#4A554E] tabular-nums">
                {resource.availableUnits} of {resource.totalUnits} units
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-[#1F3626]">Condition</span>
              <span className="col-span-2 text-[#4A554E]">
                {resource.condition}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-[#1F3626]">Location</span>
              <span className="col-span-2 text-[#4A554E]">
                {resource.location}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-[#1F3626]">Category</span>
              <span className="col-span-2 text-[#4A554E]">
                {resource.category}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-[#1F3626]">Description</h2>
            <p className="text-sm text-[#4A554E] mt-1.5 leading-relaxed">
              {resource.description}
            </p>
          </div>

          {resource.remarks && (
            <div className="rounded-2xl bg-[#DCE7D8] p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#2D4A35] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#1F3626]">Remarks</p>
                <p className="text-xs text-[#3D4B41] mt-0.5 leading-relaxed">
                  {resource.remarks}
                </p>
              </div>
            </div>
          )}

          <div>
            {isOwnClub ? (
              <button
                type="button"
                onClick={() => navigate('my_club')}
                className="w-full sm:w-auto px-7 h-11 rounded-xl border border-[#2D4A35] text-[#2D4A35] text-sm font-semibold hover:bg-[#EEF3EC] cursor-pointer"
              >
                Manage in My Club
              </button>
            ) : currentUser?.role === 'admin' ? (
              <p className="text-xs text-[#6B766E]">
                Viewing as System Admin. Switch to a Club Representative account to submit a borrowing request.
              </p>
            ) : (
              <button
                type="button"
                disabled={!canRequest}
                onClick={handleRequestBorrow}
                className="w-full sm:w-80 h-11 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] disabled:bg-[#C6CDC7] disabled:cursor-not-allowed text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4" />
                {isClubInactive
                  ? 'Owner Club Inactive'
                  : availability === 'Available'
                  ? 'Request to borrow →'
                  : `Currently ${availability}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Banner: About the owner club + Reuse. Reduce. Make an Impact. */}
      <div className="bg-[#DCE7D8] rounded-3xl border border-[#C9DBC4] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <button
          type="button"
          onClick={() =>
            ownerClub && navigate('club_detail', { clubId: ownerClub.id })
          }
          className="text-left flex items-center gap-4 group cursor-pointer"
        >
          <ClubLogo club={ownerClub} size="lg" tone="white" />
          <div>
            <h3 className="text-base font-bold text-[#1F3626] group-hover:underline">
              About the owner club
            </h3>
            <p className="text-sm font-semibold text-[#2D4A35] mt-0.5">
              {ownerClub?.acronym} · {ownerClub?.name}
            </p>
            <p className="text-xs text-[#4A554E] mt-1 leading-relaxed line-clamp-2">
              {ownerClub?.description}
            </p>
          </div>
        </button>

        <div className="md:border-l md:border-[#B9CEB3] md:pl-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center text-[#1F3626] shrink-0">
            <Recycle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1F3626]">
              Reuse. Reduce. Make an Impact.
            </h3>
            <p className="text-xs text-[#3D4B41] mt-1">
              Let&apos;s build a greener Universiti Malaya campus together.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
