import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pill?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#2D4A35] hover:bg-[#233B2A] disabled:bg-[#C6CDC7] text-white border border-transparent',
  secondary:
    'bg-[#EEF3EC] hover:bg-[#DCE7D8] text-[#2D4A35] border border-[#C9DBC4]',
  outline:
    'bg-white hover:bg-[#FAF8F2] text-[#1F3626] border border-[#D4D1C7]',
  danger:
    'bg-[#FDF2F2] hover:bg-[#FADDDD] text-[#8C2220] border border-[#F0B7B4]',
  ghost:
    'bg-transparent hover:bg-[#F2EFE6] text-[#3D4B41] border border-transparent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-xs',
  md: 'h-10 px-4 text-xs sm:text-sm',
  lg: 'h-11 px-6 text-sm',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  pill = false,
  className = '',
  type = 'button',
  children,
  ...props
}) => {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed ${
        pill ? 'rounded-full' : 'rounded-xl'
      } ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
