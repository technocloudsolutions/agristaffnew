'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/types/user';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from '@/utils/toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log('Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            console.log('User doc exists:', userDoc.data());
            const userData = userDoc.data() as User;
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || '',
              role: userData.role || 'user',
              status: userData.status || 'active',
              designation: userData.designation || '',
              contactNumber: userData.contactNumber || '',
              departmentId: userData.departmentId || '',
              instituteId: userData.instituteId || '',
              unitId: userData.unitId || '',
              profilePicture: userData.profilePicture || '',
              createdAt: userData.createdAt || new Date(),
              updatedAt: userData.updatedAt || new Date()
            });
            setRole(userData.role || 'user');
          } else {
            console.log('Creating new user doc');
            // Create new user document if it doesn't exist
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: '',
              role: 'user',
              status: 'active',
              designation: '',
              contactNumber: '',
              departmentId: '',
              instituteId: '',
              unitId: '',
              profilePicture: '',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            await setDoc(userDocRef, newUser);
            setUser(newUser);
            setRole('user');
          }

          // If on login page, redirect to home
          if (window.location.pathname === '/login') {
            router.push('/');
          }
        } else {
          console.log('No user found');
          setUser(null);
          setRole(null);
          
          // Only redirect to login if not already there
          if (window.location.pathname !== '/login') {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        toast.error('Authentication error occurred');
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, [router]);

  const value = {
    user,
    loading,
    role
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return {
    ...context,
    isAdmin: context.role === 'admin',
    isDataEntry: context.role === 'data-entry',
    isUser: context.role === 'user',
  };
}; 