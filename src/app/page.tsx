'use client';

import { useAuth } from '@/context/AuthContext';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import DataEntryDashboard from '@/components/dashboards/DataEntryDashboard';
import UserDashboard from '@/components/dashboards/UserDashboard';

export default function Home() {
  const { user, loading, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to /login
  }

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <nav className="bg-card shadow-md border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {role === 'admin' ? 'Admin Dashboard' : 
                 role === 'data-entry' ? 'Data Entry Dashboard' : 'User Dashboard'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Logged in as: {user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button
                onClick={() => signOut(auth)}
                className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:bg-destructive/90 transition-colors focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 focus:ring-offset-background"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <div className="space-y-8">
          {role === 'admin' && <AdminDashboard />}
          {role === 'data-entry' && <DataEntryDashboard />}
          {role === 'user' && <UserDashboard />}
          {!role && (
            <div className="bg-card rounded-lg shadow-md p-6 border border-border animate-fade-in">
              <h2 className="text-xl font-semibold mb-4">
                Welcome
              </h2>
              <p className="text-muted-foreground">
                Your role is being assigned. Please wait...
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
