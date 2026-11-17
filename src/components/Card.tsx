import React from 'react';

type CardTone = 'default' | 'sage' | 'sand';

interface CardProps {
  children: React.ReactNode;
  tone?: CardTone;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const TONE_CLASSES: Record<CardTone, string> = {
  default: 'bg-white border border-[#E5E2D9]',
  sage: 'bg-[#DCE7D8] border border-[#C9DBC4]',
  sand: 'bg-[#FAF8F2] border border-[#EFECE3]',
};

const PADDING_CLASSES = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 sm:p-8',
};

export const Card: React.FC<CardProps> = ({
  children,
  tone = 'default',
  padding = 'md',
  className = '',
}) => {
  return (
    <div
      className={`rounded-3xl ${TONE_CLASSES[tone]} ${PADDING_CLASSES[padding]} ${className}`}
    >
      {children}
    </div>
  );
};
