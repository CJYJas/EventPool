import React from 'react';
import type { Club } from '../types/eventpool';

interface ClubLogoProps {
  club?: Club;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'white' | 'tint';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<ClubLogoProps['size']>, string> = {
  sm: 'w-10 h-10 rounded-xl text-xs',
  md: 'w-14 h-14 rounded-2xl text-base',
  lg: 'w-16 h-16 rounded-2xl text-sm',
};

export const ClubLogo: React.FC<ClubLogoProps> = ({
  club,
  size = 'md',
  tone = 'tint',
  className = '',
}) => {
  const isInactive = club?.status === 'Inactive';
  const sizeClass = SIZE_CLASSES[size];

  if (club?.logoUrl) {
    return (
      <div
        className={`${sizeClass} overflow-hidden border border-[#E5E2D9] bg-white p-1 flex items-center justify-center shrink-0 ${className}`}
      >
        <img
          src={club.logoUrl}
          alt={`${club.acronym} logo`}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  const fallbackColors =
    tone === 'white'
      ? 'bg-white border border-[#C9DBC4] text-[#2D4A35]'
      : isInactive
      ? 'bg-[#ECEAE4] text-[#6B6962]'
      : 'bg-[#DCE7D8] text-[#1F3626]';

  return (
    <div
      className={`${sizeClass} ${fallbackColors} flex items-center justify-center font-bold shrink-0 ${className}`}
    >
      {club?.acronym.slice(0, 4).toUpperCase() || 'UM'}
    </div>
  );
};
