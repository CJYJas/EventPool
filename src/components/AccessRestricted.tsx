import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from './Button';

export const AccessRestricted: React.FC<{ onHome: () => void }> = ({ onHome }) => (
  <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
    <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center mx-auto shadow-sm">
      <ShieldAlert className="w-8 h-8" />
    </div>
    <h2 className="text-2xl font-bold text-[#1F3626]">Access Restricted</h2>
    <p className="text-sm text-[#4A554E] leading-relaxed">
      Your account does not have permission to open this page.
    </p>
    <div className="pt-3">
      <Button onClick={onHome}>Return to Home</Button>
    </div>
  </div>
);
