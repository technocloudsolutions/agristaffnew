'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Calendar, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SystemVersion, NewSystemVersion } from '@/types/system';
import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  where,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';

const SystemSettings = () => {
  const { user, isAdmin } = useAuth();
  const [versions, setVersions] = useState<SystemVersion[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newVersion, setNewVersion] = useState<NewSystemVersion>({
    versionNumber: '',
    buildNumber: '',
    releaseDate: new Date(),
    description: '',
    changes: [''],
    isActive: true
  });

  // Fetch versions
  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const versionsRef = collection(db, 'systemVersions');
      const q = query(versionsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const versionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure Timestamp fields are properly handled
        createdAt: doc.data().createdAt || Timestamp.now(),
        updatedAt: doc.data().updatedAt || Timestamp.now(),
        releaseDate: doc.data().releaseDate || Timestamp.now()
      } as SystemVersion));

      setVersions(versionsList);
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Failed to load system versions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  // Add new version with history
  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Convert releaseDate to Timestamp
      const versionData = {
        ...newVersion,
        releaseDate: Timestamp.fromDate(newVersion.releaseDate),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user?.email || '',
        updatedBy: user?.email || '',
        changes: newVersion.changes?.filter(change => change.trim() !== ''),
        history: [{
          id: crypto.randomUUID(),
          action: 'created',
          timestamp: Timestamp.now(),
          performedBy: user?.email || '',
          details: {
            newVersion: newVersion.versionNumber,
            newBuild: newVersion.buildNumber,
            changes: newVersion.changes?.filter(change => change.trim() !== '')
          }
        }]
      };

      // Add the new version
      const docRef = await addDoc(collection(db, 'systemVersions'), versionData);
      console.log('Version added with ID:', docRef.id);

      // If this is set as active, deactivate other versions and update their history
      if (newVersion.isActive) {
        const versionsRef = collection(db, 'systemVersions');
        const q = query(versionsRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        // Deactivate other active versions
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          if (doc.id !== docRef.id) {
            const currentHistory = doc.data().history || [];
            batch.update(doc.ref, { 
              isActive: false,
              updatedAt: serverTimestamp(),
              updatedBy: user?.email || '',
              history: [
                ...currentHistory,
                {
                  id: crypto.randomUUID(),
                  action: 'deactivated',
                  timestamp: Timestamp.now(),
                  performedBy: user?.email || '',
                  details: {
                    previousVersion: doc.data().versionNumber,
                    newVersion: newVersion.versionNumber
                  }
                }
              ]
            });
          }
        });
        await batch.commit();
      }

      toast.success('Version added successfully');
      setShowAddModal(false);
      resetForm();
      await fetchVersions();
    } catch (error) {
      console.error('Error adding version:', error);
      toast.error('Failed to add version');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!newVersion.versionNumber.trim()) {
      toast.error('Version number is required');
      return false;
    }
    if (!newVersion.buildNumber.trim()) {
      toast.error('Build number is required');
      return false;
    }
    return true;
  };

  // Reset form
  const resetForm = () => {
    setNewVersion({
      versionNumber: '',
      buildNumber: '',
      releaseDate: new Date(),
      description: '',
      changes: [''],
      isActive: true
    });
  };

  // Add/Remove change items
  const handleChangeItem = (index: number, value: string) => {
    const updatedChanges = [...(newVersion.changes || [])];
    updatedChanges[index] = value;
    setNewVersion({ ...newVersion, changes: updatedChanges });
  };

  const addChangeItem = () => {
    setNewVersion({
      ...newVersion,
      changes: [...(newVersion.changes || []), '']
    });
  };

  const removeChangeItem = (index: number) => {
    const updatedChanges = newVersion.changes?.filter((_, i) => i !== index);
    setNewVersion({ ...newVersion, changes: updatedChanges });
  };

  // Add function to toggle version status
  const toggleVersionStatus = async (version: SystemVersion) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const versionRef = doc(db, 'systemVersions', version.id);
      const currentHistory = version.history || [];
      
      if (!version.isActive) {
        // Deactivate other versions first
        const versionsRef = collection(db, 'systemVersions');
        const q = query(versionsRef, where('isActive', '==', true));
        const snapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
          const docHistory = doc.data().history || [];
          batch.update(doc.ref, { 
            isActive: false,
            updatedAt: serverTimestamp(),
            updatedBy: user.email || '',
            history: [
              ...docHistory,
              {
                id: crypto.randomUUID(),
                action: 'deactivated',
                timestamp: Timestamp.now(),
                performedBy: user.email || '',
                details: {
                  previousVersion: doc.data().versionNumber,
                  newVersion: version.versionNumber
                }
              }
            ]
          });
        });
        await batch.commit();
      }

      // Update this version's status
      await updateDoc(versionRef, {
        isActive: !version.isActive,
        updatedAt: serverTimestamp(),
        updatedBy: user.email || '',
        history: [
          ...currentHistory,
          {
            id: crypto.randomUUID(),
            action: version.isActive ? 'deactivated' : 'activated',
            timestamp: Timestamp.now(),
            performedBy: user.email || '',
            details: {
              previousVersion: version.versionNumber,
              newVersion: version.versionNumber
            }
          }
        ]
      });

      toast.success(`Version ${version.isActive ? 'deactivated' : 'activated'} successfully`);
      await fetchVersions();
    } catch (error) {
      console.error('Error toggling version status:', error);
      toast.error('Failed to update version status');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to view version history
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<SystemVersion | null>(null);

  const handleViewHistory = (version: SystemVersion) => {
    setSelectedVersion(version);
    setShowHistoryModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">System Versions</h2>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Version
            </span>
          </button>
        )}
      </div>

      {/* Versions List */}
      <div className="bg-card border border-border rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Build
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Release Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {versions.map((version) => (
                <tr key={version.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-medium">{version.versionNumber}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {version.buildNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {version.releaseDate.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        version.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100'
                      }`}>
                        {version.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => toggleVersionStatus(version)}
                          className="text-xs text-primary hover:text-primary/80 transition-colors"
                          disabled={isLoading}
                        >
                          {version.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      <button
                        onClick={() => handleViewHistory(version)}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        View History
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-muted-foreground">{version.description}</p>
                    {version.changes && version.changes.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-sm">
                        {version.changes.map((change, index) => (
                          <li key={index}>{change}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Version Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl m-4">
            <form onSubmit={handleAddVersion}>
              <div className="flex items-center justify-between bg-muted/40 px-6 py-4 border-b border-border">
                <h3 className="text-xl font-semibold">Add New Version</h3>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Version Number *
                    </label>
                    <input
                      type="text"
                      value={newVersion.versionNumber}
                      onChange={(e) => setNewVersion({ ...newVersion, versionNumber: e.target.value })}
                      className="w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      placeholder="1.0.0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Build Number *
                    </label>
                    <input
                      type="text"
                      value={newVersion.buildNumber}
                      onChange={(e) => setNewVersion({ ...newVersion, buildNumber: e.target.value })}
                      className="w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={newVersion.releaseDate.toISOString().split('T')[0]}
                    onChange={(e) => setNewVersion({ ...newVersion, releaseDate: new Date(e.target.value) })}
                    className="w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={newVersion.description}
                    onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    placeholder="Enter version description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Changes
                  </label>
                  <div className="space-y-2">
                    {newVersion.changes?.map((change, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={change}
                          onChange={(e) => handleChangeItem(index, e.target.value)}
                          className="flex-1 rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          placeholder="Enter change description"
                        />
                        <button
                          type="button"
                          onClick={() => removeChangeItem(index)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addChangeItem}
                      className="text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      + Add Change
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newVersion.isActive}
                    onChange={(e) => setNewVersion({ ...newVersion, isActive: e.target.checked })}
                    className="rounded border-input"
                  />
                  <label htmlFor="isActive" className="text-sm">
                    Set as Active Version
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-4 px-6 py-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Adding...' : 'Add Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedVersion && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl m-4">
            <div className="flex items-center justify-between bg-muted/40 px-6 py-4 border-b border-border">
              <h3 className="text-xl font-semibold">Version History</h3>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedVersion(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {selectedVersion.history?.map((historyItem) => (
                  <div
                    key={historyItem.id}
                    className="bg-muted/40 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{historyItem.action}</span>
                      <span className="text-sm text-muted-foreground">
                        {historyItem.timestamp.toDate().toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      By: {historyItem.performedBy}
                    </p>
                    {historyItem.details && (
                      <div className="text-sm space-y-1">
                        {historyItem.details.previousVersion && (
                          <p>Previous Version: {historyItem.details.previousVersion}</p>
                        )}
                        {historyItem.details.newVersion && (
                          <p>New Version: {historyItem.details.newVersion}</p>
                        )}
                        {historyItem.details.changes?.length > 0 && (
                          <div>
                            <p className="font-medium">Changes:</p>
                            <ul className="list-disc list-inside pl-4">
                              {historyItem.details.changes.map((change, index) => (
                                <li key={index}>{change}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-border">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedVersion(null);
                }}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings; 