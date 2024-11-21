'use client';

import { useState } from 'react';
import SystemSettings from './SystemSettings';

const SettingsTabs = () => {
  const [activeTab, setActiveTab] = useState('system');

  return (
    <div className="space-y-6">
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
  );
};

export default SettingsTabs; 