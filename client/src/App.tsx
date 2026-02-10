import { createContext, useContext, useEffect, useState } from 'react';
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

// Context to signal that auth is fully ready and pages can safely fetch data.
// The value is a counter that increments on each auth state change, so pages
// can use it as a useEffect dependency to re-fetch when the session changes.
const AuthReadyContext = createContext<number>(0);
export function useAuthReady() {
  return useContext(AuthReadyContext);
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isSkipAuth);
  const [authReady, setAuthReady] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured || isSkipAuth) {
      setLoading(false);
      setAuthReady(1);
      return;
    }

    // Wait for BOTH getSession to resolve AND onAuthStateChange to fire
    // before marking auth as ready. This ensures the Supabase client's
    // internal headers are fully set before any data fetches happen.
    let initialEventFired = false;
    let getSessionDone = false;
    let latestSession: Session | null = null;

    function maybeReady() {
      if (getSessionDone && initialEventFired) {
        setSession(latestSession);
        setLoading(false);
        setAuthReady((c) => c + 1);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      latestSession = session;
      if (!initialEventFired) {
        initialEventFired = true;
        maybeReady();
      } else {
        // Subsequent auth changes (sign out, token refresh, etc.)
        setSession(session);
        setAuthReady((c) => c + 1);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      latestSession = session;
      getSessionDone = true;
      maybeReady();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (loading) return <div className="flex justify-center items-center min-h-screen"><span className="loading loading-lg" /></div>;
  if (!isSkipAuth && !session) return <LoginPage />;

  return (
    <AuthReadyContext.Provider value={authReady}>
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
    </AuthReadyContext.Provider>
  );
}
