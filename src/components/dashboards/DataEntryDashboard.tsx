'use client';

import { useState, useEffect } from 'react';
import ContactManagement from '../contacts/ContactManagement';
import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import DashboardHeader from '../common/DashboardHeader';
import TabButton from '../common/TabButton';

interface SystemSettings {
  version: string;
  buildNumber: string;
  lastUpdated: string;
  releaseNotes: string[];
}

export default function DataEntryDashboard() {
  const [activeTab, setActiveTab] = useState('contacts');
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    version: '1.0.0',
    buildNumber: '20231215001',
    lastUpdated: new Date().toISOString().split('T')[0],
    releaseNotes: []
  });

  // Fetch system settings
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

  return (
    <div className="space-y-6">
      <DashboardHeader 
        title="Agri Staff Control Panel" 
        subtitle="Department of Agriculture"
      />

      {/* Tabs with enhanced UI */}
      <div className="bg-gray-100 p-2 rounded-lg flex space-x-2">
        <TabButton 
          active={activeTab === 'contacts'} 
          onClick={() => setActiveTab('contacts')}
        >
          Contacts
        </TabButton>
        <TabButton 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </TabButton>
      </div>

      {/* Content with enhanced styling */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {activeTab === 'contacts' && <ContactManagement />}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-6">About System</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Version</span>
                <span className="font-medium">{systemSettings.version}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">{systemSettings.lastUpdated}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Build Number</span>
                <span className="font-medium">#{systemSettings.buildNumber}</span>
              </div>
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">Release Notes:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {systemSettings.releaseNotes.map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 