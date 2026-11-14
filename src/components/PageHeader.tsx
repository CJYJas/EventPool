import React from 'react';

interface PageHeaderProps {
  breadcrumb?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumb,
  title,
  subtitle,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        {breadcrumb && (
          <p className="text-xs text-[#6B766E] mb-1">{breadcrumb}</p>
        )}
        <h1 className="text-3xl font-bold text-[#1F3626] tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[#4A554E] mt-1">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
