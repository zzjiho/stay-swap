import {Navigate, Route, Routes} from 'react-router-dom';
import {PublicRoute} from './PublicRoute';

// Layouts
import {MainLayout} from '@/components/layout/MainLayout';

// Pages
import {HomePage} from '@/pages/HomePage';
import {AuthPage} from '@/pages/auth/AuthPage';
import {ListingsPage} from '@/pages/houses/ListingsPage';
import {ListingDetailPage} from '@/pages/houses/ListingDetailPage';
import {NewListingPage} from '@/pages/houses/NewListingPage';
import {ExchangesPage} from '@/pages/exchanges/ExchangesPage';
import {ProfilePage} from '@/pages/profile/ProfilePage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/auth" element={<AuthPage />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/new" element={<NewListingPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />
        <Route path="/exchanges" element={<ExchangesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
