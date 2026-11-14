import React from 'react';
import { Layout } from './components/Layout';
import { AppProvider, useApp } from './context/AppContext';
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
  const { currentView, toastMessage } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'clubs':
        return <ClubsPage />;
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

  return <Layout toastMessage={toastMessage}>{renderView()}</Layout>;
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
