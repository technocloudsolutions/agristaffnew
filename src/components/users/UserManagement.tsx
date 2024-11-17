'use client';

import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase/config';
import {
  collection,
  query,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  DocumentData
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { uploadProfilePicture } from '@/utils/fileUpload';
// import Image from 'next/image';
import { Department, Institute, Unit } from '@/types/organization';

interface User extends DocumentData {
  id: string;
  email: string;
  role: 'admin' | 'data-entry' | 'user';
  name: string;
  status: 'active' | 'inactive';
  designation?: string;
  contactNumber?: string;
  departmentId?: string;
  instituteId?: string;
  unitId?: string;
  profilePicture?: string;
  createdAt: any;
}

interface NewUser {
  email: string;
  role: 'admin' | 'data-entry' | 'user';
  name: string;
  status: 'active' | 'inactive';
  designation?: string;
  contactNumber?: string;
  departmentId?: string;
  instituteId?: string;
  unitId?: string;
  profilePicture?: File | null;
}

interface EditingUserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'data-entry' | 'user';
  status: 'active' | 'inactive';
  designation?: string;
  contactNumber?: string;
  departmentId?: string;
  instituteId?: string;
  unitId?: string;
}

const ROLES = ['admin', 'data-entry', 'user'];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    role: 'user',
    name: '',
    status: 'active'
  });

  const [editingUser, setEditingUser] = useState<EditingUserData | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedInstitute, setSelectedInstitute] = useState<string>('');
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      const fetchedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          role: data.role || 'user',
          name: data.name || '',
          status: data.status || 'active',
          designation: data.designation || '',
          contactNumber: data.contactNumber || '',
          departmentId: data.departmentId || '',
          instituteId: data.instituteId || '',
          unitId: data.unitId || '',
          profilePicture: data.profilePicture || '',
          createdAt: data.createdAt || new Date()
        };
      });

      console.log('Fetched Users:', fetchedUsers);
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch departments, institutes, and units
  const fetchOrganizationData = async () => {
    try {
      const [deptSnap, instSnap, unitSnap] = await Promise.all([
        getDocs(collection(db, 'departments')),
        getDocs(collection(db, 'institutes')),
        getDocs(collection(db, 'units'))
      ]);

      setDepartments(deptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
      setInstitutes(instSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institute)));
      setUnits(unitSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit)));
    } catch (err) {
      console.error('Error fetching organization data:', err);
    }
  };

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  // Handle profile picture change
  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewUser(prev => ({ ...prev, profilePicture: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Filter institutes based on selected department
  const filteredInstitutes = institutes.filter(
    inst => !selectedDepartment || inst.departmentId === selectedDepartment
  );

  // Filter units based on selected institute
  const filteredUnits = units.filter(
    unit => !selectedInstitute || unit.instituteId === selectedInstitute
  );

  // Enhanced handleAddUser function
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!newUser.email || !newUser.name) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const tempPassword = 'TempPass' + Math.random().toString(36).slice(-8);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        tempPassword
      );

      let profilePictureUrl = '';
      if (newUser.profilePicture) {
        try {
          setError('Uploading profile picture...');
          profilePictureUrl = await uploadProfilePicture(
            newUser.profilePicture,
            userCredential.user.uid
          );
          setError('');
        } catch (err) {
          console.error('Error uploading profile picture:', err);
          // Continue with user creation even if profile picture upload fails
          setError('Profile picture upload failed, but user will be created.');
        }
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        designation: newUser.designation || '',
        contactNumber: newUser.contactNumber || '',
        departmentId: newUser.departmentId || '',
        instituteId: newUser.instituteId || '',
        unitId: newUser.unitId || '',
        profilePicture: profilePictureUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await sendPasswordResetEmail(auth, newUser.email);

      setNewUser({
        email: '',
        role: 'user',
        name: '',
        status: 'active',
        designation: '',
        contactNumber: '',
        departmentId: '',
        instituteId: '',
        unitId: '',
        profilePicture: null
      });
      setProfilePreview(null);
      setSelectedDepartment('');
      setSelectedInstitute('');

      await fetchUsers();
      setError('User created successfully. Password reset email sent.');
    } catch (err: any) {
      console.error('Error adding user:', err);
      setError(err.message || 'Failed to add user');
    }
  };

  // Add this function to start editing
  const handleStartEdit = (user: User) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      designation: user.designation || '',
      contactNumber: user.contactNumber || '',
      departmentId: user.departmentId || '',
      instituteId: user.instituteId || '',
      unitId: user.unitId || ''
    });
  };

  // Update the handleUpdateUser function
  const handleUpdateUser = async () => {
    if (!editingUser) return;

    try {
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        ...editingUser,
        updatedAt: serverTimestamp()
      });
      
      setEditingUser(null);
      await fetchUsers();
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'data-entry':
        return 'Data Entry Operator';
      case 'user':
        return 'User';
      case 'admin':
        return 'Admin';
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <div className="text-sm text-muted-foreground">
          Total Users: {users.length}
        </div>
      </div>

      {/* Enhanced Add User Form */}
      <form onSubmit={handleAddUser} className="bg-card p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-card-foreground">Add New User</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Basic Information</h4>
            
            {/* Profile Picture Upload */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-32 h-32 relative rounded-full overflow-hidden border-2 border-gray-200">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Name *</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Email *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full p-2 border rounded bg-background text-foreground"
                required
              />
            </div>
          </div>

          {/* Role and Contact */}
          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Role & Contact</h4>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as NewUser['role'] })}
                className="w-full p-2 border rounded bg-background text-foreground"
              >
                {ROLES.map(role => (
                  <option key={role} value={role}>{getRoleDisplayName(role)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser({ ...newUser, status: e.target.value as 'active' | 'inactive' })}
                className="w-full p-2 border rounded bg-background text-foreground"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Designation</label>
              <input
                type="text"
                value={newUser.designation || ''}
                onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                className="w-full p-2 border rounded bg-background text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Contact Number</label>
              <input
                type="tel"
                value={newUser.contactNumber || ''}
                onChange={(e) => setNewUser({ ...newUser, contactNumber: e.target.value })}
                className="w-full p-2 border rounded bg-background text-foreground"
              />
            </div>
          </div>

          {/* Organization */}
          <div className="space-y-4">
            <h4 className="font-medium text-muted-foreground">Organization</h4>
            
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  setNewUser({ ...newUser, departmentId: e.target.value });
                  setSelectedInstitute('');
                  setNewUser(prev => ({ ...prev, instituteId: '', unitId: '' }));
                }}
                className="w-full p-2 border rounded bg-background text-foreground"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Institute</label>
              <select
                value={selectedInstitute}
                onChange={(e) => {
                  setSelectedInstitute(e.target.value);
                  setNewUser({ ...newUser, instituteId: e.target.value, unitId: '' });
                }}
                className="w-full p-2 border rounded bg-background text-foreground"
                disabled={!selectedDepartment}
              >
                <option value="">Select Institute</option>
                {filteredInstitutes.map(inst => (
                  <option key={inst.id} value={inst.id}>{inst.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">Unit</label>
              <select
                value={newUser.unitId || ''}
                onChange={(e) => setNewUser({ ...newUser, unitId: e.target.value })}
                className="w-full p-2 border rounded bg-background text-foreground"
                disabled={!selectedInstitute}
              >
                <option value="">Select Unit</option>
                {filteredUnits.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <p className={`mt-4 text-sm ${
            error.includes('successfully') ? 'text-green-600' : 'text-destructive'
          }`}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-6 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
        >
          Add User
        </button>
      </form>

      {/* Users List */}
      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Profile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                    {editingUser?.id === user.id ? (
                      // Edit Mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            value={editingUser.name}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              name: e.target.value
                            })}
                            className="p-1 border rounded bg-background text-foreground w-full"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="email"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              email: e.target.value
                            })}
                            className="p-1 border rounded bg-background text-foreground w-full"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editingUser.role}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              role: e.target.value as User['role']
                            })}
                            className="p-1 border rounded bg-background text-foreground w-full"
                          >
                            {ROLES.map(role => (
                              <option key={role} value={role}>
                                {getRoleDisplayName(role)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={editingUser.status}
                            onChange={(e) => setEditingUser({
                              ...editingUser,
                              status: e.target.value as 'active' | 'inactive'
                            })}
                            className="p-1 border rounded bg-background text-foreground w-full"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <select
                              value={editingUser.departmentId || ''}
                              onChange={(e) => {
                                const newDeptId = e.target.value;
                                setEditingUser({
                                  ...editingUser,
                                  departmentId: newDeptId,
                                  instituteId: '',
                                  unitId: ''
                                });
                              }}
                              className="p-1 border rounded bg-background text-foreground w-full"
                            >
                              <option value="">Select Department</option>
                              {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                              ))}
                            </select>
                            {editingUser.departmentId && (
                              <select
                                value={editingUser.instituteId || ''}
                                onChange={(e) => {
                                  const newInstId = e.target.value;
                                  setEditingUser({
                                    ...editingUser,
                                    instituteId: newInstId,
                                    unitId: ''
                                  });
                                }}
                                className="p-1 border rounded bg-background text-foreground w-full"
                              >
                                <option value="">Select Institute</option>
                                {institutes
                                  .filter(inst => inst.departmentId === editingUser.departmentId)
                                  .map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                                  ))}
                              </select>
                            )}
                            {editingUser.instituteId && (
                              <select
                                value={editingUser.unitId || ''}
                                onChange={(e) => setEditingUser({
                                  ...editingUser,
                                  unitId: e.target.value
                                })}
                                className="p-1 border rounded bg-background text-foreground w-full"
                              >
                                <option value="">Select Unit</option>
                                {units
                                  .filter(unit => unit.instituteId === editingUser.instituteId)
                                  .map(unit => (
                                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                                  ))}
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingUser.designation || ''}
                              onChange={(e) => setEditingUser({
                                ...editingUser,
                                designation: e.target.value
                              })}
                              placeholder="Designation"
                              className="p-1 border rounded bg-background text-foreground w-full"
                            />
                            <input
                              type="tel"
                              value={editingUser.contactNumber || ''}
                              onChange={(e) => setEditingUser({
                                ...editingUser,
                                contactNumber: e.target.value
                              })}
                              placeholder="Contact Number"
                              className="p-1 border rounded bg-background text-foreground w-full"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={handleUpdateUser}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 mr-4"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.profilePicture ? (
                            <div className="w-10 h-10 relative rounded-full overflow-hidden">
                              <img
                                src={user.profilePicture}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleDisplayName(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {user.departmentId && (
                              <div className="text-gray-600 dark:text-gray-400">
                                Dept: {departments.find(d => d.id === user.departmentId)?.name}
                              </div>
                            )}
                            {user.instituteId && (
                              <div className="text-gray-600 dark:text-gray-400">
                                Inst: {institutes.find(i => i.id === user.instituteId)?.name}
                              </div>
                            )}
                            {user.unitId && (
                              <div className="text-gray-600 dark:text-gray-400">
                                Unit: {units.find(u => u.id === user.unitId)?.name}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm space-y-1">
                            {user.designation && (
                              <div className="text-gray-600 dark:text-gray-400">
                                {user.designation}
                              </div>
                            )}
                            {user.contactNumber && (
                              <div className="text-gray-600 dark:text-gray-400">
                                {user.contactNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-destructive hover:text-destructive/80"
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}
    </div>
  );
} 