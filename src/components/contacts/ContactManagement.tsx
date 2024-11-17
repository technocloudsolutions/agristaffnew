'use client';

import { useState, useEffect } from 'react';
import { Search, Phone, Building2, User, Mail, Printer, Building, MessageSquare, Image as ImageIcon, MapPin, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Contact, NewContact, ContactTitle, ContactType, ContactStatus } from '@/types/contact';
import { db, storage } from '@/firebase/config';
import { 
  collection, 
  query, 
  getDocs, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Department, Institute, Unit } from '@/types/organization';
import { useAuth } from '@/hooks/useAuth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ContactManagement = () => {
  const { user, canManageContacts } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterContactType, setFilterContactType] = useState<ContactType | ''>('');
  const [filterStatus, setFilterStatus] = useState<ContactStatus | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [newContact, setNewContact] = useState<NewContact>({
    title: 'Mr',
    fullName: '',
    departmentId: '',
    instituteId: '',
    unitId: '',
    mobileNo1: '',
    mobileNo2: '',
    whatsAppNo: '',
    officeNo1: '',
    officeNo2: '',
    faxNo1: '',
    faxNo2: '',
    personalEmail: '',
    officialEmail: '',
    address: '',
    description: '',
    contactType: 'Person',
    contactStatus: 'On Duty',
    profilePicture: null,
    status: 'active'
  });
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const contactsSnapshot = await getDocs(collection(db, 'contacts'));
      setContacts(contactsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Contact)));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch departments
        const deptSnapshot = await getDocs(collection(db, 'departments'));
        setDepartments(deptSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));

        // Fetch institutes
        const instSnapshot = await getDocs(collection(db, 'institutes'));
        setInstitutes(instSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Institute)));

        // Fetch units
        const unitSnapshot = await getDocs(collection(db, 'units'));
        setUnits(unitSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Unit)));

        // Fetch contacts
        await fetchContacts();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditing) {
      await handleUpdate(e);
    } else {
      await handleAdd(e);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    setIsLoading(true);
    try {
      if (!user) {
        toast.error('You must be logged in to add contacts');
        return;
      }

      let profilePictureUrl = '';
      
      // Handle profile picture upload if exists
      if (newContact.profilePicture) {
        try {
          const storageRef = ref(storage, `contact-profiles/${Date.now()}-${newContact.profilePicture.name}`);
          const uploadResult = await uploadBytes(storageRef, newContact.profilePicture);
          profilePictureUrl = await getDownloadURL(uploadResult.ref);
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          toast.error('Failed to upload profile picture');
          return;
        }
      }

      // Prepare contact data without the File object
      const contactData = {
        title: newContact.title,
        fullName: newContact.fullName,
        departmentId: newContact.departmentId,
        instituteId: newContact.instituteId || null,
        unitId: newContact.unitId || null,
        mobileNo1: newContact.mobileNo1 || null,
        mobileNo2: newContact.mobileNo2 || null,
        whatsAppNo: newContact.whatsAppNo || null,
        officeNo1: newContact.officeNo1 || null,
        officeNo2: newContact.officeNo2 || null,
        faxNo1: newContact.faxNo1 || null,
        faxNo2: newContact.faxNo2 || null,
        personalEmail: newContact.personalEmail || null,
        officialEmail: newContact.officialEmail,
        address: newContact.address || null,
        description: newContact.description || null,
        contactType: newContact.contactType,
        contactStatus: newContact.contactStatus,
        status: newContact.status,
        profilePicture: profilePictureUrl || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.id,
        updatedBy: user.id
      };

      await addDoc(collection(db, 'contacts'), contactData);
      toast.success('Contact added successfully');
      resetForm();
      await fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!newContact.fullName.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!newContact.departmentId) {
      toast.error('Department is required');
      return false;
    }
    if (!newContact.officialEmail) {
      toast.error('Official email is required');
      return false;
    }
    return true;
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditing(true);
    // Pre-fill the form with contact data
    setNewContact({
      title: contact.title,
      fullName: contact.fullName,
      departmentId: contact.departmentId,
      instituteId: contact.instituteId || '',
      unitId: contact.unitId || '',
      mobileNo1: contact.mobileNo1 || '',
      mobileNo2: contact.mobileNo2 || '',
      whatsAppNo: contact.whatsAppNo || '',
      officeNo1: contact.officeNo1 || '',
      officeNo2: contact.officeNo2 || '',
      faxNo1: contact.faxNo1 || '',
      faxNo2: contact.faxNo2 || '',
      personalEmail: contact.personalEmail || '',
      officialEmail: contact.officialEmail,
      address: contact.address || '',
      description: contact.description || '',
      contactType: contact.contactType,
      contactStatus: contact.contactStatus,
      status: contact.status,
      profilePicture: null
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact || !validateForm() || !user) return;

    setIsLoading(true);
    try {
      let profilePictureUrl = editingContact.profilePicture; // Keep existing picture URL by default

      // Handle new profile picture upload if exists
      if (newContact.profilePicture instanceof File) {
        try {
          const storageRef = ref(storage, `contact-profiles/${Date.now()}-${newContact.profilePicture.name}`);
          const uploadResult = await uploadBytes(storageRef, newContact.profilePicture);
          profilePictureUrl = await getDownloadURL(uploadResult.ref);
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          toast.error('Failed to upload profile picture');
          return;
        }
      }

      const contactRef = doc(db, 'contacts', editingContact.id);
      await updateDoc(contactRef, {
        title: newContact.title,
        fullName: newContact.fullName,
        departmentId: newContact.departmentId,
        instituteId: newContact.instituteId || null,
        unitId: newContact.unitId || null,
        mobileNo1: newContact.mobileNo1 || null,
        mobileNo2: newContact.mobileNo2 || null,
        whatsAppNo: newContact.whatsAppNo || null,
        officeNo1: newContact.officeNo1 || null,
        officeNo2: newContact.officeNo2 || null,
        faxNo1: newContact.faxNo1 || null,
        faxNo2: newContact.faxNo2 || null,
        personalEmail: newContact.personalEmail || null,
        officialEmail: newContact.officialEmail,
        address: newContact.address || null,
        description: newContact.description || null,
        contactType: newContact.contactType,
        contactStatus: newContact.contactStatus,
        status: newContact.status,
        profilePicture: profilePictureUrl,
        updatedAt: serverTimestamp(),
        updatedBy: user.id
      });

      toast.success('Contact updated successfully');
      setIsEditing(false);
      setEditingContact(null);
      resetForm();
      await fetchContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (contact: Contact) => {
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete || !user) return;

    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'contacts', contactToDelete.id), {
        status: 'inactive',
        updatedAt: serverTimestamp(),
        updatedBy: user.id
      });

      toast.success('Contact deleted successfully');
      setShowDeleteModal(false);
      setContactToDelete(null);
      await fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNewContact({
      title: 'Mr',
      fullName: '',
      departmentId: '',
      instituteId: '',
      unitId: '',
      mobileNo1: '',
      mobileNo2: '',
      whatsAppNo: '',
      officeNo1: '',
      officeNo2: '',
      faxNo1: '',
      faxNo2: '',
      personalEmail: '',
      officialEmail: '',
      address: '',
      description: '',
      contactType: 'Person',
      contactStatus: 'On Duty',
      profilePicture: null,
      status: 'active'
    });
  };

  const handleView = (contact: Contact) => {
    setViewingContact(contact);
    setShowViewModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Only show Add Contact Form for admin and data-entry users */}
      {canManageContacts && (
        <form onSubmit={handleSubmit} className="bg-[#111827] p-6 rounded-lg shadow-md space-y-6">
          <h3 className="text-lg font-semibold">Add New Contact</h3>
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={newContact.title}
                  onChange={(e) => setNewContact({ ...newContact, title: e.target.value as ContactTitle })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {['Mr', 'Mrs', 'Miss', 'Dr', 'Prof'].map(title => (
                    <option key={title} value={title}>{title}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={newContact.fullName}
                  onChange={(e) => setNewContact({ ...newContact, fullName: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter full name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Organization Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Department *</label>
              <select
                value={newContact.departmentId}
                onChange={(e) => {
                  setNewContact({
                    ...newContact,
                    departmentId: e.target.value,
                    instituteId: '',
                    unitId: ''
                  });
                }}
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Institute</label>
              <select
                value={newContact.instituteId}
                onChange={(e) => {
                  setNewContact({
                    ...newContact,
                    instituteId: e.target.value,
                    unitId: ''
                  });
                }}
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={!newContact.departmentId}
              >
                <option value="">Select Institute</option>
                {institutes
                  .filter(inst => inst.departmentId === newContact.departmentId)
                  .map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Unit</label>
              <select
                value={newContact.unitId}
                onChange={(e) => setNewContact({ ...newContact, unitId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                disabled={!newContact.instituteId}
              >
                <option value="">Select Unit</option>
                {units
                  .filter(unit => unit.instituteId === newContact.instituteId)
                  .map(unit => (
                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                  ))}
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No. 1</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={newContact.mobileNo1}
                  onChange={(e) => setNewContact({ ...newContact, mobileNo1: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile No. 2</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={newContact.mobileNo2}
                  onChange={(e) => setNewContact({ ...newContact, mobileNo2: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp No.</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={newContact.whatsAppNo}
                  onChange={(e) => setNewContact({ ...newContact, whatsAppNo: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="01XXXXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office No. 1</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={newContact.officeNo1}
                  onChange={(e) => setNewContact({ ...newContact, officeNo1: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Office No. 2</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={newContact.officeNo2}
                  onChange={(e) => setNewContact({ ...newContact, officeNo2: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fax No. 1</label>
              <div className="relative">
                <Printer className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  value={newContact.faxNo1}
                  onChange={(e) => setNewContact({ ...newContact, faxNo1: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Personal Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={newContact.personalEmail}
                  onChange={(e) => setNewContact({ ...newContact, personalEmail: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="personal@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Official Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={newContact.officialEmail}
                  onChange={(e) => setNewContact({ ...newContact, officialEmail: e.target.value })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="official@example.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Type</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={newContact.contactType}
                  onChange={(e) => setNewContact({ ...newContact, contactType: e.target.value as ContactType })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="Person">Person</option>
                  <option value="Institute">Institute</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Status</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={newContact.contactStatus}
                  onChange={(e) => setNewContact({ ...newContact, contactStatus: e.target.value as ContactStatus })}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="On Duty">On Duty</option>
                  <option value="Retired">Retired</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea
                  value={newContact.address}
                  onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                  rows={3}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter address"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
                <textarea
                  value={newContact.description}
                  onChange={(e) => setNewContact({ ...newContact, description: e.target.value })}
                  rows={3}
                  className="pl-10 block w-full rounded-md border-gray-600 bg-[#1f2937] text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter description"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setNewContact({ ...newContact, profilePicture: file });
                    }
                  }}
                  className="pl-10 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingContact(null);
                  resetForm();
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:opacity-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Contact' : 'Add Contact')}
            </button>
          </div>
        </form>
      )}

      {/* Contacts List - visible to all users */}
      <div className="bg-[#111827] p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Contacts List</h3>
          <div className="flex gap-4">
            {/* Search and Filters - available to all users */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border-gray-600 rounded-md w-64 bg-[#1f2937] text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Filters */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="border-gray-600 rounded-md px-3 py-2 bg-[#1f2937] text-gray-100"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
            
            <select
              value={filterContactType}
              onChange={(e) => setFilterContactType(e.target.value as ContactType | '')}
              className="border-gray-600 rounded-md px-3 py-2 bg-[#1f2937] text-gray-100"
            >
              <option value="">All Types</option>
              <option value="Person">Person</option>
              <option value="Institute">Institute</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ContactStatus | '')}
              className="border-gray-600 rounded-md px-3 py-2 bg-[#1f2937] text-gray-100"
            >
              <option value="">All Statuses</option>
              <option value="On Duty">On Duty</option>
              <option value="Retired">Retired</option>
              <option value="Transferred">Transferred</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-[#1f2937] rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-[#111827]">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Profile
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Basic Info
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Contact Details
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Organization
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                {canManageContacts && (
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-[#1f2937] divide-y divide-gray-600">
              {contacts
                .filter(contact => {
                  // Keep existing filter logic
                  if (!canManageContacts && contact.status !== 'active') {
                    return false;
                  }
                  const matchesSearch = contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    contact.officialEmail.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesDepartment = !filterDepartment || contact.departmentId === filterDepartment;
                  const matchesType = !filterContactType || contact.contactType === filterContactType;
                  const matchesStatus = !filterStatus || contact.contactStatus === filterStatus;
                  return matchesSearch && matchesDepartment && matchesType && matchesStatus;
                })
                .map(contact => (
                  <tr key={contact.id} className="hover:bg-[#2d3748] transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {contact.profilePicture ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={contact.profilePicture}
                              alt={contact.fullName}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                              <span className="text-xl text-gray-200">
                                {contact.fullName[0]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-200">{contact.title} {contact.fullName}</div>
                        <div className="text-gray-400">{contact.officialEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-200 space-y-1">
                        {contact.mobileNo1 && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{contact.mobileNo1}</span>
                          </div>
                        )}
                        {contact.officeNo1 && (
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                            <span>{contact.officeNo1}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-200">
                          {departments.find(d => d.id === contact.departmentId)?.name}
                        </div>
                        {contact.instituteId && (
                          <div className="text-gray-400">
                            {institutes.find(i => i.id === contact.instituteId)?.name}
                          </div>
                        )}
                        {contact.unitId && (
                          <div className="text-gray-400">
                            {units.find(u => u.id === contact.unitId)?.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          contact.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {contact.status}
                        </span>
                        <div>
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {contact.contactStatus}
                          </span>
                        </div>
                      </div>
                    </td>
                    {canManageContacts && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleView(contact)}
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-150"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(contact)}
                          className="text-indigo-400 hover:text-indigo-300 transition-colors duration-150"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(contact)}
                          className="text-red-400 hover:text-red-300 transition-colors duration-150"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                    {!canManageContacts && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleView(contact)}
                          className="text-blue-400 hover:text-blue-300 transition-colors duration-150"
                        >
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#1f2937] p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the contact "{contactToDelete?.fullName}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setContactToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Contact Modal */}
      {showViewModal && viewingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#1f2937] p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-semibold">Contact Details</h3>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingContact(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile and Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="h-20 w-20">
                    {viewingContact.profilePicture ? (
                      <img
                        src={viewingContact.profilePicture}
                        alt={viewingContact.fullName}
                        className="h-20 w-20 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-3xl text-gray-500">
                          {viewingContact.fullName[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium">
                      {viewingContact.title} {viewingContact.fullName}
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400">{viewingContact.officialEmail}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-medium mb-2">Organization</h5>
                  <div className="space-y-1">
                    <p>Department: {departments.find(d => d.id === viewingContact.departmentId)?.name}</p>
                    {viewingContact.instituteId && (
                      <p>Institute: {institutes.find(i => i.id === viewingContact.instituteId)?.name}</p>
                    )}
                    {viewingContact.unitId && (
                      <p>Unit: {units.find(u => u.id === viewingContact.unitId)?.name}</p>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-medium mb-2">Status Information</h5>
                  <div className="space-y-2">
                    <div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        viewingContact.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                      }`}>
                        {viewingContact.status}
                      </span>
                    </div>
                    <div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {viewingContact.contactType}
                      </span>
                    </div>
                    <div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {viewingContact.contactStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2">Contact Numbers</h5>
                  <div className="space-y-2">
                    {viewingContact.mobileNo1 && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Mobile 1: {viewingContact.mobileNo1}</span>
                      </div>
                    )}
                    {viewingContact.mobileNo2 && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Mobile 2: {viewingContact.mobileNo2}</span>
                      </div>
                    )}
                    {viewingContact.whatsAppNo && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <span>WhatsApp: {viewingContact.whatsAppNo}</span>
                      </div>
                    )}
                    {viewingContact.officeNo1 && (
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Office 1: {viewingContact.officeNo1}</span>
                      </div>
                    )}
                    {viewingContact.officeNo2 && (
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Office 2: {viewingContact.officeNo2}</span>
                      </div>
                    )}
                    {viewingContact.faxNo1 && (
                      <div className="flex items-center">
                        <Printer className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Fax 1: {viewingContact.faxNo1}</span>
                      </div>
                    )}
                    {viewingContact.faxNo2 && (
                      <div className="flex items-center">
                        <Printer className="h-4 w-4 mr-2 text-gray-400" />
                        <span>Fax 2: {viewingContact.faxNo2}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-medium mb-2">Email Addresses</h5>
                  <div className="space-y-1">
                    <p>Official: {viewingContact.officialEmail}</p>
                    {viewingContact.personalEmail && (
                      <p>Personal: {viewingContact.personalEmail}</p>
                    )}
                  </div>
                </div>

                {viewingContact.address && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Address</h5>
                    <p className="text-gray-700 dark:text-gray-300">{viewingContact.address}</p>
                  </div>
                )}

                {viewingContact.description && (
                  <div className="border-t pt-4">
                    <h5 className="font-medium mb-2">Description</h5>
                    <p className="text-gray-700 dark:text-gray-300">{viewingContact.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;