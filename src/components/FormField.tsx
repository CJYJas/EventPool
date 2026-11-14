import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helper?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  helper,
  htmlFor,
  className = '',
  children,
}) => {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold text-[#1F3626] mb-1.5"
      >
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-[#8C2220] mt-1">{error}</p>
      ) : helper ? (
        <p className="text-[11px] text-[#6B766E] mt-1">{helper}</p>
      ) : null}
    </div>
  );
};

export function fieldInputClass(hasError?: boolean): string {
  return `w-full h-11 px-3.5 rounded-xl border text-sm text-[#1F3626] focus:outline-none ${
    hasError
      ? 'border-[#8C2220] bg-[#FDF2F2]/40'
      : 'border-[#D4D1C7] bg-white focus:border-[#2D4A35]'
  }`;
}
