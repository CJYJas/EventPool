import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export type StatusMessageTone = 'error' | 'warning' | 'success' | 'info';

interface StatusMessageProps {
  tone?: StatusMessageTone;
  title?: string;
  message: string;
  className?: string;
}

const TONE_STYLES: Record<StatusMessageTone, string> = {
  success: 'bg-[#EEF9EE] border-[#B6E8B8] text-[#175B2B]',
  warning: 'bg-[#FDF7E7] border-[#EDD58B] text-[#7A530B]',
  info: 'bg-[#EEF3EC] border-[#C9DBC4] text-[#2D4A35]',
  error: 'bg-[#FDF2F2] border-[#F0B7B4] text-[#8C2220]',
};

export const StatusMessage: React.FC<StatusMessageProps> = ({
  tone = 'info',
  title,
  message,
  className = '',
}) => {
  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'warning'
      ? AlertTriangle
      : tone === 'info'
      ? Info
      : AlertCircle;

  return (
    <div
      role="alert"
      className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${TONE_STYLES[tone]} ${className}`}
    >
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div>
        {title && <p className="font-bold mb-0.5">{title}</p>}
        <span>{message}</span>
      </div>
    </div>
  );
};
