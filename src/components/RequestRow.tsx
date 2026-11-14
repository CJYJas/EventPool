import React from 'react';
import { StatusBadge } from './StatusBadge';
import type { BorrowRequest } from '../types/eventpool';

interface RequestRowProps {
  request: BorrowRequest;
  title: string;
  subtitle: string;
  overdue?: boolean;
  overdueDays?: number;
  onViewDetails?: () => void;
  actions?: React.ReactNode;
}

export const RequestRow: React.FC<RequestRowProps> = ({
  request,
  title,
  subtitle,
  overdue = false,
  overdueDays = 0,
  onViewDetails,
  actions,
}) => {
  return (
    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        {onViewDetails ? (
          <button
            type="button"
            onClick={onViewDetails}
            className="text-left text-sm font-bold text-[#1F3626] hover:text-[#2D4A35] hover:underline tabular-nums truncate block cursor-pointer"
          >
            {title}
          </button>
        ) : (
          <p className="text-sm font-bold text-[#1F3626] tabular-nums truncate">
            {title}
          </p>
        )}
        <p className="text-xs text-[#6B766E] mt-0.5 font-mono tabular-nums">
          {subtitle}
          {overdue && overdueDays > 0 ? ` · ${overdueDays}d overdue` : ''}
        </p>
        {request.remarks && (
          <p className="text-[11px] text-[#4A554E] mt-0.5 truncate">
            Note: {request.remarks}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <StatusBadge status={request.status} />
        {overdue && <StatusBadge status="Overdue" />}
        {actions}
      </div>
    </div>
  );
};
