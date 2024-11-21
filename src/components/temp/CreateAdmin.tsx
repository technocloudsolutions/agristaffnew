'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function CreateAdmin() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // First check if the user document exists
      const userRef = doc(db, 'users', user.id);
      const userDoc = await getDoc(userRef);

      // Create or update the user document
      await setDoc(userRef, {
        email: user.email,
        name: user.name || user.email?.split('@')[0],
        role: 'admin',
        status: 'active',
        createdAt: new Date()
      }, { merge: true }); // Using merge: true to update if exists

      setMessage('Admin role assigned successfully');
    } catch (err) {
      console.error('Error:', err);
      setMessage('Error assigning admin role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Create First Admin</h3>
      <p className="text-sm text-gray-600 mb-4">
        Current user: {user.email}
      </p>
      <button
        onClick={handleCreateAdmin}
        disabled={isLoading}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50"
      >
        {isLoading ? 'Processing...' : 'Make Me Admin'}
      </button>
      {message && (
        <p className={`mt-4 text-sm ${
          message.includes('success') ? 'text-green-600' : 'text-red-600'
        }`}>
          {message}
        </p>
      )}
    </div>
  );
} 