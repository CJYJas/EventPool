import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { StatusMessage } from './StatusMessage';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <div className="space-y-3 animate-pulse" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className="h-14 rounded-2xl bg-[#EFECE3]/80 border border-[#E5E2D9]"
      />
    ))}
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => (
  <div className="bg-white rounded-3xl border border-[#E5E2D9] p-10 text-center space-y-2.5">
    <div className="w-11 h-11 rounded-2xl bg-[#F2EFE6] text-[#4A554E] mx-auto flex items-center justify-center">
      <Inbox className="w-5 h-5" />
    </div>
    <h3 className="text-base font-bold text-[#1F3626]">{title}</h3>
    <p className="text-xs text-[#6B766E] max-w-md mx-auto leading-relaxed">
      {description}
    </p>
    {actionLabel && onAction && (
      <div className="pt-2">
        <button
          type="button"
          onClick={onAction}
          className="px-5 h-9 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-xs font-semibold cursor-pointer"
        >
          {actionLabel}
        </button>
      </div>
    )}
  </div>
);

export const ErrorRetryState: React.FC<{
  message: string;
  onRetry: () => void;
}> = ({ message, onRetry }) => (
  <div className="bg-[#FDF2F2] rounded-2xl border border-[#F0B7B4] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div className="flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-[#8C2220] shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-[#8C2220]">
          Unable to load data
        </p>
        <p className="text-xs text-[#731A19] mt-0.5">{message}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 px-4 h-9 rounded-xl bg-white border border-[#F0B7B4] text-xs font-semibold text-[#8C2220] hover:bg-[#FADDDD] cursor-pointer shrink-0"
    >
      <RefreshCw className="w-3.5 h-3.5" />
      Retry
    </button>
  </div>
);

export const InlineAlert: React.FC<{
  tone?: 'error' | 'warning' | 'success' | 'info';
  message: string;
}> = ({ tone = 'error', message }) => (
  <StatusMessage tone={tone} message={message} />
);
