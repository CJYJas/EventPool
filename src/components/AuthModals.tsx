import React, { useState } from 'react';
import { CheckCircle2, Mail, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ForgotPasswordModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setSent(false);
    setEmail('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E2D9] p-8 relative shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-[#1F3626]">
                Reset password
              </h2>
              <p className="text-sm text-[#4A554E] mt-1.5 leading-relaxed">
                Enter your registered email address to receive password reset
                instructions.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                UM email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#858F87] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@um.edu.my"
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] placeholder:text-[#98A099] focus:border-[#2D4A35] focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Send Reset Link
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm font-medium text-[#2D4A35] underline underline-offset-4 hover:text-[#1F3626] cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#EEF3EC] flex items-center justify-center text-[#2D4A35]">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1F3626]">
                Check your email
              </h2>
              <p className="text-sm text-[#4A554E] mt-2 leading-relaxed">
                If an account exists with <span className="font-medium text-[#1F3626]">{email}</span>,
                password reset instructions will be sent to you.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const RequestAccessModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { submitClubAccessRequest } = useApp();
  const [clubName, setClubName] = useState('');
  const [repName, setRepName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setSubmitted(false);
    setClubName('');
    setRepName('');
    setEmail('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim() || !repName.trim() || !email.trim()) return;
    submitClubAccessRequest({
      clubName,
      representativeName: repName,
      email,
    });
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-[#E5E2D9] p-8 relative shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute right-5 top-5 w-8 h-8 rounded-full hover:bg-[#F2EFE6] flex items-center justify-center text-[#6B766E] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1F3626]">
                Request Club Access
              </h2>
              <p className="text-sm text-[#4A554E] mt-1">
                New to EventPool? Submit your club details for verification.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Club Name *
              </label>
              <input
                type="text"
                required
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g. Business Club"
                className="w-full h-11 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] placeholder:text-[#98A099] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                Representative Name *
              </label>
              <input
                type="text"
                required
                value={repName}
                onChange={(e) => setRepName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full h-11 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] placeholder:text-[#98A099] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F3626] mb-1.5">
                UM email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@um.edu.my"
                className="w-full h-11 px-3.5 rounded-xl border border-[#D4D1C7] text-sm text-[#1F3626] placeholder:text-[#98A099] focus:border-[#2D4A35] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold transition-colors cursor-pointer mt-1"
            >
              Submit Request
            </button>

            <p className="text-center text-sm text-[#4A554E]">
              Already registered?{' '}
              <button
                type="button"
                onClick={handleClose}
                className="font-medium text-[#2D4A35] underline underline-offset-4 hover:text-[#1F3626] cursor-pointer"
              >
                Log in
              </button>
            </p>
          </form>
        ) : (
          <div className="text-center py-2 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#EEF3EC] flex items-center justify-center text-[#2D4A35]">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1F3626]">
                Request submitted!
              </h2>
              <p className="text-sm text-[#4A554E] mt-2 leading-relaxed">
                Your club access request has been submitted for review. You&apos;ll
                be notified once it has been processed.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 h-10 rounded-xl bg-[#2D4A35] hover:bg-[#233B2A] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
