'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { SystemVersion, NewSystemVersion } from '@/types/system';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

const SystemSettings = () => {
  const [versions, setVersions] = useState<SystemVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchVersions = async () => {
    try {
      const versionsRef = collection(db, 'systemVersions');
      const q = query(versionsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const versionsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          versionNumber: data.versionNumber,
          buildNumber: data.buildNumber,
          releaseDate: data.releaseDate,
          description: data.description || '',
          features: data.features || [],
          isActive: data.isActive,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy,
          updatedBy: data.updatedBy || ''
        } as SystemVersion;
      });

      setVersions(versionsList);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to fetch system versions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const addNewVersion = async (newVersion: NewSystemVersion) => {
    if (!user?.email) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const versionsRef = collection(db, 'systemVersions');
      await addDoc(versionsRef, {
        ...newVersion,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.email
      });

      await fetchVersions();
      toast.success('New version added successfully');
    } catch (error) {
      console.error('Error adding version:', error);
      toast.error('Failed to add new version');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">System Settings</h2>
      
      {/* Version History */}
      <div className="space-y-4">
        <h3 className="text-xl font-medium">Version History</h3>
        <div className="grid gap-4">
          {versions.map((version) => (
            <div 
              key={version.id} 
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-medium">
                    Version {version.versionNumber} (Build {version.buildNumber})
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Released: {version.releaseDate.toDate().toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  version.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {version.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {version.description && (
                <p className="mt-2 text-sm">{version.description}</p>
              )}
              {version.features && version.features.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium mb-1">New Features:</h5>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {version.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemSettings; 