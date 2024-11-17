'use client';

import { useAuth } from '@/context/AuthContext';
import SignIn from '@/components/auth/SignIn';
import SignUp from '@/components/auth/SignUp';
import { auth } from '@/firebase/config';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import DataEntryDashboard from '@/components/dashboards/DataEntryDashboard';
import UserDashboard from '@/components/dashboards/UserDashboard';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/components/Footer';

export default function Home() {
  const { user, loading } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
        <div className="flex-grow flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-muted-foreground">Sign in to access your account</p>
            </div>
            <div className="bg-card shadow-lg rounded-lg p-6 border border-border">
              {showSignUp ? <SignUp /> : <SignIn />}
              <button
                onClick={() => setShowSignUp(!showSignUp)}
                className="mt-4 text-primary hover:text-primary/80 transition-colors w-full text-center"
              >
                {showSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <nav className="bg-card shadow-md border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {userRole === 'admin' ? 'Admin Dashboard' : 
                 userRole === 'data-entry' ? 'Data Entry Dashboard' : 'User Dashboard'}
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
          {userRole === 'admin' && <AdminDashboard />}
          {userRole === 'data-entry' && <DataEntryDashboard />}
          {userRole === 'user' && <UserDashboard />}
          {!userRole && (
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
