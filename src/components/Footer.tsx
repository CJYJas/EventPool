import React from 'react';
import { Leaf } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#E5E2D9] bg-[#FAF8F2] mt-auto">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6B766E]">
        <p>EventPool / Share more. Waste less.</p>
        <p className="inline-flex items-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-[#2D4A35]" />
          <span>A little sharing. A lighter footprint.</span>
        </p>
      </div>
    </footer>
  );
};
