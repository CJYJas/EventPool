import React from 'react';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  toastMessage?: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, toastMessage }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F2] text-[#1F3626]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-2xl bg-[#1F3626] text-white text-xs font-medium shadow-lg border border-[#3B5B44]"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
};
