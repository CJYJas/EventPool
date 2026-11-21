import React from 'react';
import { AccessRestricted } from './components/AccessRestricted';
import { Layout } from './components/Layout';
import { AppProvider, useApp } from './context/AppContext';
import { checkViewAccess } from './context/viewAccess';
import { AdminClubsPage } from './pages/AdminClubsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ClubDetailPage } from './pages/ClubDetailPage';
import { ClubsPage } from './pages/ClubsPage';
import { HomePage } from './pages/HomePage';
import { SustainabilityPage } from './pages/SustainabilityPage';
import { BorrowFormPage } from './pages/borrower/BorrowFormPage';
import { MarketplacePage } from './pages/borrower/MarketplacePage';
import { MyClubPage } from './pages/borrower/MyClubPage';
import { RequestDetailPage } from './pages/borrower/RequestDetailPage';
import { ResourceDetailPage } from './pages/borrower/ResourceDetailPage';

const AppShell: React.FC = () => {
  const { currentView, currentUser, authReady, navigate, toastMessage } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'clubs':
        // Administrators get the live club-account manager; everyone else sees the public directory
        return currentUser?.role === 'admin' ? <AdminClubsPage /> : <ClubsPage />;
      case 'club_detail':
        return <ClubDetailPage />;
      case 'marketplace':
        return <MarketplacePage />;
      case 'resource_detail':
        return <ResourceDetailPage />;
      case 'borrow_form':
        return <BorrowFormPage />;
      case 'my_club':
        return <MyClubPage />;
      case 'request_detail':
        return <RequestDetailPage />;
      case 'admin_dashboard':
        return <AdminDashboardPage />;
      case 'sustainability':
        return <SustainabilityPage />;
      default:
        return <HomePage />;
    }
  };

  // Wait for the stored session to be verified so protected pages never flash for signed-out users.
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F2] text-sm text-[#4A554E]" role="status">
        Loading EventPool...
      </div>
    );
  }

  const access = checkViewAccess(currentView, currentUser);
  const content =
    access === 'allowed' ? (
      renderView()
    ) : access === 'forbidden' ? (
      <AccessRestricted onHome={() => navigate('home')} />
    ) : (
      <HomePage /> // login_required: fall back to the login screen
    );

  return <Layout toastMessage={toastMessage}>{content}</Layout>;
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
