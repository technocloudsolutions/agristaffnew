'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import SystemSettings from '@/components/settings/SystemSettings';

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('system');

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        
        {/* Settings Content */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          {/* Tabs Navigation */}
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('system')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'system'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                System Settings
              </button>
              {/* Add more tabs here as needed */}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'system' && <SystemSettings />}
            {/* Add more tab contents here */}
          </div>
        </div>
      </div>
    </div>
  );
} 