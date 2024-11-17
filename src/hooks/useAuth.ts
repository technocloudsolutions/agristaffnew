'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'admin' | 'data-entry' | 'user' | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data() as User;
          
          if (userData) {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name,
              role: userData.role,
              status: userData.status,
              designation: userData.designation,
              contactNumber: userData.contactNumber,
              departmentId: userData.departmentId,
              instituteId: userData.instituteId,
              unitId: userData.unitId,
              profilePicture: userData.profilePicture,
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt
            });
            setRole(userData.role);
          }
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const canManageContacts = role === 'admin' || role === 'data-entry';
  const canManageUsers = role === 'admin';
  const canManageOrganization = role === 'admin';

  return {
    user,
    role,
    loading,
    canManageContacts,
    canManageUsers,
    canManageOrganization,
    isAdmin: role === 'admin',
    isDataEntry: role === 'data-entry',
    isUser: role === 'user'
  };
} 