'use client';

import { useState, useEffect } from 'react';
import UserManagement from '../users/UserManagement';
import OrganizationManagement from '../organization/OrganizationManagement';
import ContactManagement from '../contacts/ContactManagement';
import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import DashboardHeader from '../common/DashboardHeader';
import TabButton from '../common/TabButton';

interface SystemSettings {
  version: string;
  buildNumber: string;
  lastUpdated: string;
  releaseNotes: string[];
}

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  roleDistribution: {
    admin: number;
    manager: number;
    staff: number;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    version: '1.0.0',
    buildNumber: '20231215001',
    lastUpdated: new Date().toISOString().split('T')[0],
    releaseNotes: [
      'Initial release of the contact management system',
      'Added department and institute hierarchy',
      'Implemented role-based access control',
      'Added search and filter functionality'
    ]
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    roleDistribution: {
      admin: 0,
      manager: 0,
      staff: 0
    }
  });

  // Fetch system settings from Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDocs(collection(db, 'settings'));
        if (!settingsDoc.empty) {
          const data = settingsDoc.docs[0].data() as SystemSettings;
          setSystemSettings(data);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      const usersRef = collection(db, 'users');
      const allUsersQuery = await getDocs(usersRef);
      
      const totalUsers = allUsersQuery.size;
      
      const activeUsersQuery = query(usersRef, where('status', '==', 'active'));
      const activeUsersSnapshot = await getDocs(activeUsersQuery);
      const activeUsers = activeUsersSnapshot.size;

      // Get users created in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let newUsers = 0;
      let adminCount = 0;
      let managerCount = 0;
      let staffCount = 0;

      allUsersQuery.forEach(doc => {
        const userData = doc.data();
        // Count new users
        if (userData.createdAt?.toDate() > thirtyDaysAgo) {
          newUsers++;
        }
        // Count roles
        switch (userData.role) {
          case 'admin':
            adminCount++;
            break;
          case 'manager':
            managerCount++;
            break;
          case 'staff':
            staffCount++;
            break;
        }
      });

      setAnalyticsData({
        totalUsers,
        activeUsers,
        newUsers,
        roleDistribution: {
          admin: adminCount,
          manager: managerCount,
          staff: staffCount
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const handleSettingsUpdate = async () => {
    setIsLoading(true);
    try {
      const settingsRef = collection(db, 'settings');
      const settingsQuery = await getDocs(settingsRef);
      
      const updatedSettings = {
        ...systemSettings,
        lastUpdated: new Date().toISOString().split('T')[0],
        updatedAt: serverTimestamp()
      };
      
      if (!settingsQuery.empty) {
        // Update existing settings
        await updateDoc(doc(settingsRef, settingsQuery.docs[0].id), updatedSettings);
      } else {
        // Create new settings document
        await addDoc(settingsRef, {
          ...updatedSettings,
          createdAt: serverTimestamp()
        });
      }
      
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update system settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReleaseNote = () => {
    setSystemSettings({
      ...systemSettings,
      releaseNotes: [...systemSettings.releaseNotes, '']
    });
  };

  const handleRemoveReleaseNote = (index: number) => {
    const newNotes = systemSettings.releaseNotes.filter((_, i) => i !== index);
    setSystemSettings({
      ...systemSettings,
      releaseNotes: newNotes
    });
  };

  const handleUpdateReleaseNote = (index: number, value: string) => {
    const newNotes = [...systemSettings.releaseNotes];
    newNotes[index] = value;
    setSystemSettings({
      ...systemSettings,
      releaseNotes: newNotes
    });
  };

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Agri Staff Control Panel" 
        subtitle="Department of Agriculture"
      />

      {/* Tabs with enhanced UI */}
      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg flex space-x-2">
        <TabButton 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')}
        >
          User Management
        </TabButton>
        <TabButton 
          active={activeTab === 'organization'} 
          onClick={() => setActiveTab('organization')}
        >
          Organization
        </TabButton>
        <TabButton 
          active={activeTab === 'contacts'} 
          onClick={() => setActiveTab('contacts')}
        >
          Contacts
        </TabButton>
        <TabButton 
          active={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </TabButton>
        <TabButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </TabButton>
      </div>

      {/* Content with enhanced styling */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'organization' && <OrganizationManagement />}
        {activeTab === 'contacts' && <ContactManagement />}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">Total Users</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analyticsData.totalUsers}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">All registered users</p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">Active Users</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analyticsData.activeUsers}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round((analyticsData.activeUsers / analyticsData.totalUsers) * 100)}% of total users
                </p>
              </div>
              <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">New Users</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analyticsData.newUsers}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last 30 days</p>
              </div>
            </div>

            {/* Role Distribution */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Role Distribution</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Admins</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {analyticsData.roleDistribution.admin}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Managers</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {analyticsData.roleDistribution.manager}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Staff</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {analyticsData.roleDistribution.staff}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="system-settings">
            <h2>System Settings</h2>
            
            <div className="setting-group">
              <div className="setting-label">Version Number</div>
              <input
                type="text"
                className="input-focus bg-gray-700 w-full"
                value={systemSettings.version}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  version: e.target.value
                })}
              />
            </div>

            <div className="setting-group">
              <div className="setting-label">Build Number</div>
              <input
                type="text"
                className="input-focus bg-gray-700 w-full"
                value={systemSettings.buildNumber}
                onChange={(e) => setSystemSettings({
                  ...systemSettings,
                  buildNumber: e.target.value
                })}
              />
            </div>

            <div className="setting-group">
              <div className="setting-label">Release Notes</div>
              {systemSettings.releaseNotes.map((note, index) => (
                <div key={index} className="release-notes flex items-center gap-2">
                  <input
                    type="text"
                    className="input-focus bg-gray-700 flex-1"
                    value={note}
                    onChange={(e) => handleUpdateReleaseNote(index, e.target.value)}
                    placeholder="Enter release note"
                  />
                  <button 
                    className="text-red-500 hover:text-red-400 px-2 py-1"
                    onClick={() => handleRemoveReleaseNote(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button 
                className="text-blue-500 hover:text-blue-400 mt-2"
                onClick={handleAddReleaseNote}
              >
                + Add Release Note
              </button>
            </div>

            <div className="mt-6">
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                onClick={handleSettingsUpdate}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 