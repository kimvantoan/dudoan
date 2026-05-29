'use client';

import React from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { LoginScreen } from '../LoginScreen';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { usePathname } from 'next/navigation';

function ShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthCallback = pathname === '/auth-callback';

  const {
    token,
    currentUser,
    googleLoginUrl,
    isSidebarOpen,
    setIsSidebarOpen,
    handleLogout,
    successMsg,
    errorMsg,
    isMounted,
  } = useApp();

  // Show a clean loading screen on mount to prevent Next.js hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 font-sans">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm font-bold text-slate-400">Đang tải...</p>
      </div>
    );
  }

  // If not logged in and not on the auth callback page, show login screen
  if (!token && !isAuthCallback) {
    return (
      <div className="min-h-screen bg-slate-950 flex font-sans selection:bg-indigo-500 selection:text-white text-slate-100 w-full animate-fade-in">
        {/* Toast Messages */}
        {successMsg && (
          <div className="fixed top-4 right-4 z-50 max-w-sm bg-emerald-900 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
            <span>✅</span>
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="fixed top-4 right-4 z-50 max-w-sm bg-rose-950 border border-rose-500 text-rose-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-pulse">
            <span>❌</span>
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 flex items-center justify-center p-4">
          <LoginScreen googleLoginUrl={googleLoginUrl} />
        </div>
      </div>
    );
  }

  // If on the auth callback page, render it directly (it has its own loading layout)
  if (isAuthCallback) {
    return (
      <div className="min-h-screen bg-slate-950 flex font-sans selection:bg-indigo-500 selection:text-white text-slate-100 w-full">
        {/* Toast Messages */}
        {successMsg && (
          <div className="fixed top-4 right-4 z-50 max-w-sm bg-emerald-900 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
            <span>✅</span>
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="fixed top-4 right-4 z-50 max-w-sm bg-rose-950 border border-rose-500 text-rose-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-pulse">
            <span>❌</span>
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans selection:bg-indigo-500 selection:text-white text-slate-100 w-full animate-fade-in">
      {/* Toast Messages */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-emerald-900 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-bounce">
          <span>✅</span>
          <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-rose-950 border border-rose-500 text-rose-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-pulse">
          <span>❌</span>
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Main Application Layout with Sidebar */}
      <div className="flex-1 flex flex-col md:flex-row min-h-screen relative overflow-x-hidden md:overflow-hidden">
        <Header setIsSidebarOpen={setIsSidebarOpen} currentUser={currentUser} />

        {/* Sidebar Backdrop Overlay on Mobile */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          currentUser={currentUser}
          handleLogout={handleLogout}
        />

        {/* Main Content Area: Scroll naturally on mobile, nested scroll on desktop */}
        <main className="flex-1 bg-slate-950 p-4 md:p-8 flex flex-col md:overflow-y-auto md:max-h-screen">
          <div className="flex-1 max-w-2xl w-full mx-auto space-y-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <ShellContent>{children}</ShellContent>
    </AppProvider>
  );
}
