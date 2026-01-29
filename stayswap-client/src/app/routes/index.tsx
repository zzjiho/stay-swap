import {Navigate, Route, Routes} from 'react-router-dom';
import {PublicRoute} from './PublicRoute';
import {ProtectedRoute} from './ProtectedRoute';

// Layouts
import {MainLayout} from '@/components/layout/MainLayout';

// Pages
import {HomePage} from '@/pages/HomePage';
import {AuthPage} from '@/pages/auth/AuthPage';
import {ListingsPage} from '@/pages/houses/ListingsPage';
import {ListingDetailPage} from '@/pages/houses/ListingDetailPage';
import {NewListingPage} from '@/pages/houses/NewListingPage';
import {EditListingPage} from '@/pages/houses/EditListingPage';
import {ExchangesPage} from '@/pages/exchanges/ExchangesPage';
import {ProfilePage} from '@/pages/profile/ProfilePage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes - 로그인 상태면 홈으로 */}
      <Route element={<PublicRoute />}>
        <Route path="/auth" element={<AuthPage />} />
      </Route>

      {/* Main Layout Routes */}
      <Route element={<MainLayout />}>
        {/* Public - 누구나 접근 가능 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/listings" element={<ListingsPage />} />
        <Route path="/listings/:id" element={<ListingDetailPage />} />

        {/* Protected - 로그인 필요 */}
        <Route element={<ProtectedRoute />}>
          <Route path="/listings/new" element={<NewListingPage />} />
          <Route path="/listings/:id/edit" element={<EditListingPage />} />
          <Route path="/exchanges" element={<ExchangesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
