import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import AuthScreen from '@/components/AuthScreen';
import Layout, { type Page } from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import DoctorDirectory from '@/components/DoctorDirectory';
import Appointments from '@/components/Appointments';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'doctors' && <DoctorDirectory />}
      {page === 'appointments' && <Appointments />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
