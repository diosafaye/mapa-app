import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import MapView from './pages/MapView';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import { Toaster } from "sonner";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import PageNotFound from './lib/PageNotFound';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from '@/components/ThemeProvider';
import HeritageSites from './pages/HeritageSites';
import CulturePage from './pages/CulturePage';
import AlertsPage from './pages/AlertsPage';
import DamageReports from './pages/DamageReports';
import NotificationsPage from './pages/NotificationsPage';
import PushNotificationHandler from './components/PushNotificationHandler';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, user } = useAuth();

  // ✅ fixed: added bg-background and text-foreground so loading screen respects theme
  if (isLoadingAuth) return (
    <div className="h-screen flex items-center justify-center bg-background text-foreground">
      Loading...
    </div>
  );

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/map" replace />} />
      <Route path="/login" element={<Navigate to="/map" replace />} />

      {isAdmin ? (
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/heritage" element={<HeritageSites />} />
          <Route path="/culture" element={<CulturePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<DamageReports />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      ) : (
        <Route element={<PublicLayout />}>
          <Route path="/map" element={<MapView />} />
          <Route path="/heritage" element={<HeritageSites />} />
          <Route path="/culture" element={<CulturePage />} />
           <Route path="/alerts" element={<AlertsPage />} />       
           <Route path="/reports" element={<DamageReports />} /> 
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/admin" element={<Navigate to="/map" replace />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      )}
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
           <Toaster richColors position="top-center" />
          </Router>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}