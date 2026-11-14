import React from 'react';

export type StatusVariant =
  | 'Available'
  | 'Reserved'
  | 'Borrowed'
  | 'Unavailable'
  | 'Active'
  | 'Inactive'
  | 'Pending'
  | 'Approved'
  | 'Return Pending'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled'
  | 'Overdue'
  | 'Declined';

const VARIANT_STYLES: Record<StatusVariant, string> = {
  Available: 'bg-[#D6F5D6] text-[#175B2B] border-[#B6E8B8]',
  Active: 'bg-[#D6F5D6] text-[#175B2B] border-[#B6E8B8]',
  Approved: 'bg-[#DCEAD7] text-[#23452C] border-[#C1D8BA]',
  Completed: 'bg-[#DCEAD7] text-[#23452C] border-[#C1D8BA]',
  Reserved: 'bg-[#F8E7B4] text-[#7A530B] border-[#EDD58B]',
  Pending: 'bg-[#F7E8D0] text-[#7F4F16] border-[#EBD2AD]',
  'Return Pending': 'bg-[#F7DFC2] text-[#834212] border-[#EAC69A]',
  Borrowed: 'bg-[#E9E6DF] text-[#4E4D47] border-[#D7D3C9]',
  Inactive: 'bg-[#ECEAE4] text-[#5B5952] border-[#D6D2C9]',
  Cancelled: 'bg-[#ECEAE4] text-[#5B5952] border-[#D6D2C9]',
  Unavailable: 'bg-[#F9D6D4] text-[#8C2220] border-[#F0B7B4]',
  Rejected: 'bg-[#F9D6D4] text-[#8C2220] border-[#F0B7B4]',
  Overdue: 'bg-[#F9D6D4] text-[#8C2220] border-[#F0B7B4]',
  Declined: 'bg-[#F9D6D4] text-[#8C2220] border-[#F0B7B4]',
};

export const StatusBadge: React.FC<{
  status: StatusVariant;
  className?: string;
}> = ({ status, className = '' }) => {
  const styles = VARIANT_STYLES[status] || VARIANT_STYLES.Inactive;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 ${styles} ${className}`}
    >
      {status}
    </span>
  );
};
