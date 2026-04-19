import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import MapView from './pages/MapView';
import HeritageSites from './pages/HeritageSites';
import CulturePage from './pages/CulturePage';
import AlertsPage from './pages/AlertsPage';
import DamageReports from './pages/DamageReports';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login'; 

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <Routes>
      {/* THE FRONT DOOR */}
      <Route path="/" element={<Login />} />

      {/* ADMIN ROUTES (Unlocked after login) */}
      {isAdmin ? (
        <Route element={<Layout />}>
          <Route path="/map" element={<MapView />} />
          <Route path="/heritage" element={<HeritageSites />} />
          <Route path="/culture" element={<CulturePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<DamageReports />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      ) : (
        /* PUBLIC/GUEST ROUTES */
        <Route element={<PublicLayout />}>
          <Route path="/map" element={<MapView />} />
          <Route path="/heritage" element={<HeritageSites />} />
          <Route path="/culture" element={<CulturePage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<DamageReports />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      )}
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App;