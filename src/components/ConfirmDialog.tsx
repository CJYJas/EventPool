import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: 'danger' | 'primary';
  note?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  description,
  confirmLabel,
  tone = 'primary',
  note,
  onConfirm,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E2D9] p-6 sm:p-7 relative shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {tone === 'danger' && (
          <div className="w-11 h-11 rounded-2xl bg-[#FDF2F2] border border-[#F0B7B4] flex items-center justify-center text-[#8C2220] mb-4">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}

        <h2 className="text-xl font-bold text-[#1F3626]">{title}</h2>
        <p className="text-sm text-[#4A554E] mt-2 leading-relaxed">
          {description}
        </p>

        {note && (
          <div className="mt-3 p-3 rounded-xl bg-[#FDF7E7] border border-[#EDD58B] text-xs text-[#7A530B]">
            {note}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 h-10 rounded-xl border border-[#D4D1C7] text-sm font-medium text-[#3D4B41] hover:bg-[#FAF8F2] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 h-10 rounded-xl text-white text-sm font-semibold cursor-pointer ${
              tone === 'danger'
                ? 'bg-[#8C2220] hover:bg-[#731A19]'
                : 'bg-[#2D4A35] hover:bg-[#233B2A]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
