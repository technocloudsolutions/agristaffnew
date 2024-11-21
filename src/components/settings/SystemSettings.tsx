'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/utils/toast';
import { Settings } from 'lucide-react';
import { db } from '@/firebase/config';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';
import type { SystemSettings as SystemSettingsType } from '@/types/system';
import { Version } from '@/types/version';
import { VersionHistory } from './VersionHistory';

const SystemSettings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettingsType>({
    systemName: 'Agri Staff',
    timeZone: 'Asia/Colombo',
  });
  const [versions, setVersions] = useState<Version[]>([]);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const settingsRef = doc(db, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        
        if (settingsSnap.exists()) {
          setSettings(settingsSnap.data() as SystemSettingsType);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  useEffect(() => {
    const fetchVersions = async () => {
      if (!user) return;
      
      try {
        const versionsRef = collection(db, 'versions');
        const q = query(versionsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const versionsList: Version[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          versionsList.push({
            id: doc.id,
            version: data.version,
            date: new Date(data.createdAt.toDate()).toLocaleString(),
            changes: data.changes,
            createdBy: data.createdBy,
            createdAt: data.createdAt
          });
        });
        
        setVersions(versionsList);
      } catch (error) {
        console.error('Error fetching versions:', error);
        toast.error('Failed to load version history');
      }
    };

    fetchVersions();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast.error('You must be logged in to change settings');
      return;
    }
    
    setIsLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'general');
      const currentSettingsSnap = await getDoc(settingsRef);
      const currentSettings = currentSettingsSnap.exists() ? currentSettingsSnap.data() : null;

      const changesList: string[] = [];
      if (currentSettings) {
        Object.keys(settings).forEach(key => {
          if (settings[key as keyof SystemSettingsType] !== currentSettings[key]) {
            changesList.push(`Changed ${key} from ${currentSettings[key]} to ${settings[key as keyof SystemSettingsType]}`);
          }
        });
      }

      if (changesList.length === 0) {
        toast.info('No changes detected');
        setIsLoading(false);
        return;
      }

      const settingsData = {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: user.email
      };

      await setDoc(settingsRef, settingsData, { merge: true });

      const versionsRef = collection(db, 'versions');
      const newVersion = {
        version: `${new Date().getFullYear()}.${new Date().getMonth() + 1}.${new Date().getDate()}-${new Date().getTime().toString().slice(-4)}`,
        changes: changesList,
        createdBy: user.email,
        createdAt: serverTimestamp(),
      };

      await addDoc(versionsRef, newVersion);
      
      toast.success('Settings saved successfully');
      
      // Refresh versions list
      const q = query(versionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const versionsList: Version[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        versionsList.push({
          id: doc.id,
          version: data.version,
          date: new Date(data.createdAt.toDate()).toLocaleString(),
          changes: data.changes,
          createdBy: data.createdBy,
          createdAt: data.createdAt
        });
      });
      setVersions(versionsList);
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (version: Version) => {
    if (!user) {
      toast.error('You must be logged in to revert settings');
      return;
    }

    setIsLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'general');
      const versionsRef = collection(db, 'versions');
      
      const newVersion = {
        version: `${new Date().getFullYear()}.${new Date().getMonth() + 1}.${new Date().getDate()}-${new Date().getTime().toString().slice(-4)}`,
        changes: ['Reverted to version ' + version.version],
        createdBy: user.email,
        createdAt: serverTimestamp(),
      };

      await setDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
        updatedBy: user.email
      });
      await addDoc(versionsRef, newVersion);

      const q = query(versionsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const versionsList: Version[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        versionsList.push({
          id: doc.id,
          version: data.version,
          date: new Date(data.createdAt.toDate()).toLocaleString(),
          changes: data.changes,
          createdBy: data.createdBy,
          createdAt: data.createdAt
        });
      });
      setVersions(versionsList);

      toast.success('Successfully reverted to version ' + version.version);
    } catch (error) {
      console.error('Error reverting version:', error);
      toast.error('Failed to revert to selected version');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">System Settings</h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* General Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">General Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">System Name</label>
              <input
                type="text"
                value={settings.systemName}
                onChange={(e) => setSettings({ ...settings, systemName: e.target.value })}
                className="w-full rounded-md border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time Zone</label>
              <select 
                value={settings.timeZone}
                onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                className="w-full rounded-md border-input bg-background px-3 py-2 text-sm"
              >
                <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Version History */}
        <VersionHistory versions={versions} onRevert={handleRevert} />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings; 