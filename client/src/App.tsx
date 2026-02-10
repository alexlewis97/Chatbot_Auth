import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from './services/supabase';
import { isSkipAuth } from './services/auth';
import type { Session } from '@supabase/supabase-js';

import SetupScreen from './components/SetupScreen';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChatbotsPage from './pages/ChatbotsPage';
import GroupsPage from './pages/GroupsPage';
import PermissionsPage from './pages/PermissionsPage';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isSkipAuth);

  useEffect(() => {
    if (!isSupabaseConfigured || isSkipAuth) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (loading) return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-lg" /></div>;
  if (!isSkipAuth && !session) return <LoginPage />;

  return (
    <div className="min-h-screen flex flex-col">
      <Header userEmail={session?.user?.email} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-base-200">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/chatbots" element={<ChatbotsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/permissions" element={<PermissionsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
