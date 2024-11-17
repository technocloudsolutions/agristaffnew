'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase/config';
import {
  collection,
  query,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { Department, Institute, Unit } from '@/types/organization';
import SearchFilter from './SearchFilter';
import ConfirmModal from '../common/ConfirmModal';
import TableSkeleton from '../common/TableSkeleton';
import Toast from '../common/Toast';

export default function OrganizationManagement() {
  const [activeTab, setActiveTab] = useState<'departments' | 'institutes' | 'units'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: string;
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: '',
    id: '',
    name: ''
  });

  // New item states
  const [newDepartment, setNewDepartment] = useState<{
    name: string;
    description: string;
  }>({ name: '', description: '' });
  const [newInstitute, setNewInstitute] = useState({ 
    name: '', 
    description: '', 
    departmentId: '' 
  });
  const [newUnit, setNewUnit] = useState({ 
    name: '', 
    description: '', 
    instituteId: '' 
  });

  // Fetch data
  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...'); // Debug log
      const querySnapshot = await getDocs(collection(db, 'departments'));
      const fetchedDepartments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Department[];
      console.log('Fetched departments:', fetchedDepartments); // Debug log
      setDepartments(fetchedDepartments);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to fetch departments');
    }
  };

  const fetchInstitutes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'institutes'));
      const fetchedInstitutes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Institute[];
      setInstitutes(fetchedInstitutes);
    } catch (err) {
      console.error('Error fetching institutes:', err);
      setError('Failed to fetch institutes');
    }
  };

  const fetchUnits = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'units'));
      const fetchedUnits = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Unit[];
      setUnits(fetchedUnits);
    } catch (err) {
      console.error('Error fetching units:', err);
      setError('Failed to fetch units');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDepartments(),
        fetchInstitutes(),
        fetchUnits()
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter function
  const filterItems = (items: any[], term: string) => {
    if (!term) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(term.toLowerCase()) ||
      item.code?.toLowerCase().includes(term.toLowerCase()) ||
      item.description?.toLowerCase().includes(term.toLowerCase())
    );
  };

  // Add new department with code
  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newDepartment.name) {
        setError('Department name is required');
        return;
      }

      setActionLoading('adding-department');

      // Generate a code from name
      const code = newDepartment.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();

      const departmentData = {
        name: newDepartment.name,
        code,
        description: newDepartment.description || '',
        head: '',
        contactEmail: '',
        contactPhone: '',
        location: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'departments'), departmentData);
      setNewDepartment({ name: '', description: '' });
      await fetchDepartments();
      showToast('Department added successfully', 'success');
      setError('');
    } catch (err) {
      console.error('Error adding department:', err);
      setError('Failed to add department');
      showToast('Failed to add department', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddInstitute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newInstitute.name || !newInstitute.departmentId) {
        setError('Institute name and department are required');
        return;
      }

      setActionLoading('adding-institute');
      await addDoc(collection(db, 'institutes'), {
        ...newInstitute,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewInstitute({ name: '', description: '', departmentId: '' });
      await fetchInstitutes();
      showToast('Institute added successfully', 'success');
    } catch (err) {
      setError('Failed to add institute');
      showToast('Failed to add institute', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newUnit.name || !newUnit.instituteId) {
        setError('Unit name and institute are required');
        return;
      }

      setActionLoading('adding-unit');
      await addDoc(collection(db, 'units'), {
        ...newUnit,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewUnit({ name: '', description: '', instituteId: '' });
      await fetchUnits();
      showToast('Unit added successfully', 'success');
    } catch (err) {
      setError('Failed to add unit');
      showToast('Failed to add unit', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (type: string, id: string, name: string) => {
    setDeleteModal({
      isOpen: true,
      type,
      id,
      name
    });
  };

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Add loading states for actions
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Enhanced delete handler with loading state
  const handleDelete = async () => {
    const { type, id, name } = deleteModal;
    setActionLoading(`delete-${id}`);
    try {
      await deleteDoc(doc(db, type, id));
      showToast(`${type.slice(0, -1)} deleted successfully`, 'success');
      
      switch (type) {
        case 'departments':
          await fetchDepartments();
          break;
        case 'institutes':
          await fetchInstitutes();
          break;
        case 'units':
          await fetchUnits();
          break;
      }
      
      setDeleteModal({ isOpen: false, type: '', id: '', name: '' });
    } catch (err) {
      console.error('Error deleting item:', err);
      showToast(`Failed to delete ${type.slice(0, -1)}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Add hover effect utility
  const getHoverEffect = (itemId: string) => {
    return actionLoading === `delete-${itemId}`
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:bg-muted/50 transition-colors';
  };

  // Filter items based on search term
  const filteredDepartments = filterItems(departments, searchTerm);
  const filteredInstitutes = filterItems(institutes, searchTerm);
  const filteredUnits = filterItems(units, searchTerm);

  // Enhanced tab navigation component
  const TabNavigation = () => (
    <div className="border-b border-border mb-6">
      <nav className="-mb-px flex space-x-8">
        {[
          { id: 'departments', label: 'Departments', count: departments.length },
          { id: 'institutes', label: 'Institutes', count: institutes.length },
          { id: 'units', label: 'Units', count: units.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.id 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }
            `}
          >
            {tab.label}
            <span className={`
              ml-2 rounded-full px-2 py-0.5 text-xs font-medium
              ${activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground group-hover:bg-muted/70'
              }
            `}>
              {tab.count}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );

  // Enhanced table component
  const DataTable = ({ data, columns, onDelete }: any) => (
    <div className="bg-card shadow-sm rounded-lg overflow-hidden border border-border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              {columns.map((column: any) => (
                <th key={column.key} className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((item: any) => (
                <tr 
                  key={item.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {columns.map((column: any) => (
                    <td 
                      key={`${item.id}-${column.key}`} 
                      className="px-6 py-4 text-sm whitespace-nowrap"
                    >
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Move getColumnsForType inside the component
  const getColumnsForType = (type: string) => {
    const commonColumns = [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { 
        key: 'actions', 
        label: 'Actions',
        render: (item: any) => (
          <button
            onClick={() => handleDeleteClick(type, item.id, item.name)}
            className="inline-flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors"
            disabled={actionLoading === `delete-${item.id}`}
          >
            {actionLoading === `delete-${item.id}` ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Deleting...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </>
            )}
          </button>
        )
      }
    ];

    if (type === 'departments') {
      return [
        { key: 'code', label: 'Code' },
        ...commonColumns,
        { key: 'head', label: 'Head' },
        { 
          key: 'contact', 
          label: 'Contact',
          render: (item: any) => (
            <div>
              {item.contactEmail && <div>{item.contactEmail}</div>}
              {item.contactPhone && <div>{item.contactPhone}</div>}
            </div>
          )
        }
      ];
    }

    return commonColumns;
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-6">
      <TabNavigation />
      
      <SearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onStatusFilter={() => {}}
        onSortChange={() => {}}
        sortField=""
        status=""
      />

      <div className="space-y-6">
        {activeTab === 'departments' && (
          <form onSubmit={handleAddDepartment} className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-foreground">
                Add New Department
              </h3>
            </div>
            <div className="space-y-4">
              <div className="form-group">
                <label htmlFor="dept-name">Department Name</label>
                <input
                  id="dept-name"
                  type="text"
                  placeholder="Enter department name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({
                    ...newDepartment,
                    name: e.target.value
                  })}
                  className="input-focus"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="dept-desc">Description</label>
                <textarea
                  id="dept-desc"
                  placeholder="Enter department description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({
                    ...newDepartment,
                    description: e.target.value
                  })}
                  className="input-focus"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setNewDepartment({ name: '', description: '' })}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={actionLoading === 'adding-department'}
                >
                  {actionLoading === 'adding-department' ? 'Adding...' : 'Add Department'}
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'institutes' && (
          <form onSubmit={handleAddInstitute} className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-foreground">
                Add New Institute
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="inst-dept">Department</label>
                  <select
                    id="inst-dept"
                    value={newInstitute.departmentId}
                    onChange={(e) => setNewInstitute({
                      ...newInstitute,
                      departmentId: e.target.value
                    })}
                    className="input-focus"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="inst-name">Institute Name</label>
                  <input
                    id="inst-name"
                    type="text"
                    placeholder="Enter institute name"
                    value={newInstitute.name}
                    onChange={(e) => setNewInstitute({
                      ...newInstitute,
                      name: e.target.value
                    })}
                    className="input-focus"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="inst-desc">Description</label>
                <textarea
                  id="inst-desc"
                  placeholder="Enter institute description"
                  value={newInstitute.description}
                  onChange={(e) => setNewInstitute({
                    ...newInstitute,
                    description: e.target.value
                  })}
                  className="input-focus"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setNewInstitute({ name: '', description: '', departmentId: '' })}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={actionLoading === 'adding-institute'}
                >
                  {actionLoading === 'adding-institute' ? 'Adding...' : 'Add Institute'}
                </button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'units' && (
          <form onSubmit={handleAddUnit} className="bg-card p-6 rounded-lg shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-foreground">
                Add New Unit
              </h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label htmlFor="unit-inst">Institute</label>
                  <select
                    id="unit-inst"
                    value={newUnit.instituteId}
                    onChange={(e) => setNewUnit({
                      ...newUnit,
                      instituteId: e.target.value
                    })}
                    className="input-focus"
                    required
                  >
                    <option value="">Select Institute</option>
                    {institutes.map(inst => (
                      <option key={inst.id} value={inst.id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="unit-name">Unit Name</label>
                  <input
                    id="unit-name"
                    type="text"
                    placeholder="Enter unit name"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({
                      ...newUnit,
                      name: e.target.value
                    })}
                    className="input-focus"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="unit-desc">Description</label>
                <textarea
                  id="unit-desc"
                  placeholder="Enter unit description"
                  value={newUnit.description}
                  onChange={(e) => setNewUnit({
                    ...newUnit,
                    description: e.target.value
                  })}
                  className="input-focus"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setNewUnit({ name: '', description: '', instituteId: '' })}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={actionLoading === 'adding-unit'}
                >
                  {actionLoading === 'adding-unit' ? 'Adding...' : 'Add Unit'}
                </button>
              </div>
            </div>
          </form>
        )}
        
        <DataTable
          data={
            activeTab === 'departments' ? filteredDepartments :
            activeTab === 'institutes' ? filteredInstitutes :
            filteredUnits
          }
          columns={getColumnsForType(activeTab)}
          onDelete={handleDeleteClick}
        />
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: '', id: '', name: '' })}
        onConfirm={handleDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${deleteModal.name}? This action cannot be undone.`}
      />

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
} 