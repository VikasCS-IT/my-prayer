'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { supabase, getAdminProfile } from '../lib/supabase';
import { apiGetOverview, apiGetReligions, apiGetDeities, apiGetPrayers } from '../lib/api-client';
import { DbProfile, DbReligion, DbDeity, DbPrayer } from '../types';
import { AdminSidebar, AdminTab } from '../components/AdminSidebar';
import { OverviewTab } from '../components/OverviewTab';
import { ReligionsTab } from '../components/ReligionsTab';
import { DeitiesTab } from '../components/DeitiesTab';
import { PrayersTab } from '../components/PrayersTab';
import { BrandingTab } from '../components/BrandingTab';
import { Toast, ToastMessage } from '../components/Toast';

export default function AdminPortalPage() {
  // Auth state
  const [session, setSession] = useState<any>(null);
  const [adminProfile, setAdminProfile] = useState<DbProfile | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Live Data States
  const [counts, setCounts] = useState({
    religionsCount: 0,
    deitiesCount: 0,
    prayersCount: 0,
    usersCount: 0,
  });
  const [religions, setReligions] = useState<DbReligion[]>([]);
  const [deities, setDeities] = useState<DbDeity[]>([]);
  const [prayers, setPrayers] = useState<(DbPrayer & { deity?: DbDeity; verses_count?: number })[]>([]);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check auth & role on mount
  const verifySession = useCallback(async () => {
    setIsCheckingAuth(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setSession(session);
        const profile = await getAdminProfile(session.user.id);

        // Check if Admin
        if (profile?.role === 'admin' || session.user.email === 'prayer@myprayer.com') {
          setAdminProfile(
            profile || {
              id: session.user.id,
              name: 'System Administrator',
              role: 'admin',
            }
          );
        } else {
          // Block unauthorized
          await supabase.auth.signOut();
          setSession(null);
          setAdminProfile(null);
          setLoginError('Unauthorized access: Only accounts with role = "admin" can access this portal.');
        }
      } else {
        setSession(null);
        setAdminProfile(null);
      }
    } catch (err: any) {
      console.warn('Auth verify notice:', err);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Load all dashboard content via unified API client
  const loadPortalData = useCallback(async () => {
    setIsRefreshingData(true);
    try {
      const [cnts, rels, deits, prs] = await Promise.all([
        apiGetOverview(),
        apiGetReligions(),
        apiGetDeities(),
        apiGetPrayers(),
      ]);
      setCounts(cnts);
      setReligions(rels);
      setDeities(deits);
      setPrayers(prs);
    } catch (err: any) {
      console.warn('Error loading portal data:', err);
      showToast('error', 'Failed to fetch data: ' + (err.message || ''));
    } finally {
      setIsRefreshingData(false);
    }
  }, []);

  useEffect(() => {
    if (adminProfile) {
      loadPortalData();
    }
  }, [adminProfile, loadPortalData]);

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both email and password.');
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword.trim(),
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Check Admin role
        const profile = await getAdminProfile(data.user.id);
        const isAdmin = profile?.role === 'admin' || data.user.email === 'prayer@myprayer.com';

        if (!isAdmin) {
          await supabase.auth.signOut();
          setLoginError('Access Denied: This account does not possess administrator privileges.');
          return;
        }

        setSession(data.session);
        setAdminProfile(
          profile || {
            id: data.user.id,
            name: 'System Administrator',
            role: 'admin',
          }
        );
        showToast('success', 'Successfully logged in to Admin Console!');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAdminProfile(null);
    showToast('success', 'You have been signed out.');
  };

  /* =========================================================================
     VIEW 1: CHECKING AUTH STATE
     ========================================================================= */
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-stone-900 text-stone-200">
        <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center text-3xl mb-4 shadow-lg shadow-orange-950 animate-pulse">
          🕉️
        </div>
        <p className="text-sm font-semibold tracking-wide text-stone-400">
          Verifying administrative credentials...
        </p>
      </div>
    );
  }

  /* =========================================================================
     VIEW 2: ADMIN LOGIN (UNAUTHENTICATED OR NOT ADMIN)
     ========================================================================= */
  if (!adminProfile) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
        {/* Background glow effects */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-3xl p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-3xl text-white shadow-xl shadow-orange-950 mb-4">
              🕉️
            </div>
            <h1 className="text-2xl font-extrabold text-stone-100 tracking-tight">
              My Prayer Admin
            </h1>
            <p className="text-xs text-orange-400 font-semibold uppercase tracking-wider mt-1">
              Enterprise Cloud Management Portal
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="prayer@myprayer.com"
                  className="w-full bg-stone-950/70 border border-stone-800 text-stone-100 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-950/70 border border-stone-800 text-stone-100 text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-950/50 disabled:opacity-50 transition-all"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>Sign In to Admin Portal</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-800/80 text-center">
            <p className="text-[11px] text-stone-500">
              Restricted portal. Only verified accounts with <code className="text-orange-400 font-mono">role = 'admin'</code> are permitted.
            </p>
          </div>
        </div>
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  /* =========================================================================
     VIEW 3: AUTHENTICATED ADMIN DASHBOARD
     ========================================================================= */
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        adminName={adminProfile.name}
        adminEmail={session?.user?.email || 'admin@myprayer.app'}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 bg-white border-b border-stone-200/80 px-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xl">🌸</span>
            <h2 className="text-base font-bold text-stone-800">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'religions' && 'Religions Manager'}
              {activeTab === 'deities' && 'Deities Manager'}
              {activeTab === 'prayers' && 'Prayers & Audio Manager'}
              {activeTab === 'branding' && 'App Branding & Metadata'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadPortalData}
              disabled={isRefreshingData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 text-xs font-semibold transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingData ? 'animate-spin text-orange-600' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="h-4 w-[1px] bg-stone-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-800 text-xs font-bold">
                {adminProfile.name.slice(0, 1)}
              </div>
              <span className="text-xs font-semibold text-stone-700 hidden sm:inline">
                {adminProfile.name}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Tab Body */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && (
            <OverviewTab counts={counts} onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'religions' && (
            <ReligionsTab
              religions={religions}
              onRefresh={loadPortalData}
              showToast={showToast}
            />
          )}

          {activeTab === 'deities' && (
            <DeitiesTab
              deities={deities}
              onRefresh={loadPortalData}
              showToast={showToast}
            />
          )}

          {activeTab === 'prayers' && (
            <PrayersTab
              prayers={prayers}
              deities={deities}
              onRefresh={loadPortalData}
              showToast={showToast}
            />
          )}

          {activeTab === 'branding' && (
            <BrandingTab showToast={showToast} />
          )}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
