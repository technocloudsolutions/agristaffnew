'use client';

import { useState, useEffect } from 'react';
import { Search, Phone, Building2, User, Mail, Printer, Building, MessageSquare, Image as ImageIcon, MapPin, FileText, Plus, X, Trash2 } from 'lucide-react';
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
  serverTimestamp, 
  Timestamp, 
  writeBatch, 
  deleteDoc 
} from 'firebase/firestore';
import { Department, Institute, Unit } from '@/types/organization';
import { useAuth } from '@/hooks/useAuth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { User as FirebaseUser } from 'firebase/auth';

// Update the phone validation regex and formatting helpers
const PHONE_REGEX = /^\+94\d{9}$/;  // Must start with +94 followed by 9 digits
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const formatPhoneNumber = (number: string) => {
  // Remove all non-digits and any existing +94
  const cleaned = number.replace(/\D/g, '').replace(/^94/, '');
  
  // Ensure only 9 digits after +94
  const truncated = cleaned.slice(0, 9);
  
  // Always add +94 prefix
  return truncated ? `+94${truncated}` : '';
};

const CONTACT_TITLES: ContactTitle[] = ['Mr', 'Mrs', 'Miss', 'Dr', 'Prof'];
const CONTACT_TYPES: ContactType[] = ['Person', 'Institute'];
const CONTACT_STATUSES: ContactStatus[] = ['On Duty', 'Retired', 'Transferred', 'Other'];

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const contactsRef = collection(db, 'contacts');
      
      // Create query to only get active contacts
      const q = query(
        contactsRef,
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      const contactsList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title as ContactTitle,
          fullName: data.fullName,
          departmentId: data.departmentId,
          instituteId: data.instituteId || '',
          unitId: data.unitId || '',
          mobileNo1: data.mobileNo1 || '',
          mobileNo2: data.mobileNo2 || '',
          whatsAppNo: data.whatsAppNo || '',
          officeNo1: data.officeNo1 || '',
          officeNo2: data.officeNo2 || '',
          faxNo1: data.faxNo1 || '',
          faxNo2: data.faxNo2 || '',
          personalEmail: data.personalEmail || '',
          officialEmail: data.officialEmail,
          address: data.address || '',
          description: data.description || '',
          contactType: data.contactType as ContactType,
          contactStatus: data.contactStatus as ContactStatus,
          profilePicture: data.profilePicture || null,
          status: data.status as 'active' | 'inactive',
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
          deletedAt: data.deletedAt || null,
          createdBy: data.createdBy || '',
          updatedBy: data.updatedBy || '',
          deletedBy: data.deletedBy || null
        } as Contact;
      });

      setContacts(contactsList);
      console.log('Fetched contacts:', contactsList.length);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to fetch contacts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch departments
        const deptSnapshot = await getDocs(collection(db, 'departments'));
        setDepartments(deptSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Department)));

        // Fetch institutes
        const instSnapshot = await getDocs(collection(db, 'institutes'));
        setInstitutes(instSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Institute)));

        // Fetch units
        const unitSnapshot = await getDocs(collection(db, 'units'));
        setUnits(unitSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as Unit)));

        // Fetch contacts
        await fetchContacts();
      } catch (error) {
        console.error('Error loading initial data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array for initial load

  useEffect(() => {
    if (user) { // Only fetch if user is logged in
      fetchContacts();
    }
  }, [canManageContacts, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      if (isEditing && editingContact) {
        await handleUpdate();
      } else {
        await handleAdd(e);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !user) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      let profilePictureUrl = '';
      
      if (newContact.profilePicture instanceof File) {
        const storageRef = ref(storage, `contact-profiles/${Date.now()}-${newContact.profilePicture.name}`);
        const uploadResult = await uploadBytes(storageRef, newContact.profilePicture);
        profilePictureUrl = await getDownloadURL(uploadResult.ref);
      }

      const contactData = {
        ...newContact,
        mobileNo1: newContact.mobileNo1 ? formatPhoneNumber(newContact.mobileNo1) : '',
        mobileNo2: newContact.mobileNo2 ? formatPhoneNumber(newContact.mobileNo2) : '',
        whatsAppNo: newContact.whatsAppNo ? formatPhoneNumber(newContact.whatsAppNo) : '',
        officeNo1: newContact.officeNo1 ? formatPhoneNumber(newContact.officeNo1) : '',
        officeNo2: newContact.officeNo2 ? formatPhoneNumber(newContact.officeNo2) : '',
        faxNo1: newContact.faxNo1 ? formatPhoneNumber(newContact.faxNo1) : '',
        faxNo2: newContact.faxNo2 ? formatPhoneNumber(newContact.faxNo2) : '',
        profilePicture: profilePictureUrl || null,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: user.email,
        updatedBy: user.email
      };

      const docRef = await addDoc(collection(db, 'contacts'), contactData);
      console.log('Contact added with ID:', docRef.id);
      toast.success('Contact added successfully');
      resetForm();
      setShowAddModal(false);
      await fetchContacts();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!newContact.fullName || !newContact.departmentId) {
      toast.error('Please fill in all required fields');
      return false;
    }

    if (newContact.officialEmail && !EMAIL_REGEX.test(newContact.officialEmail)) {
      toast.error('Please enter a valid official email address');
      return false;
    }

    if (newContact.personalEmail && !EMAIL_REGEX.test(newContact.personalEmail)) {
      toast.error('Please enter a valid personal email address');
      return false;
    }

    const phoneFields = [
      newContact.mobileNo1,
      newContact.mobileNo2,
      newContact.whatsAppNo,
      newContact.officeNo1,
      newContact.officeNo2,
      newContact.faxNo1,
      newContact.faxNo2
    ];

    for (const phone of phoneFields) {
      if (phone && !PHONE_REGEX.test(formatPhoneNumber(phone))) {
        toast.error('Please enter valid phone numbers in the format +94XXXXXXXXX');
        return false;
      }
    }

    return true;
  };

  const handleEdit = (contact: Contact) => {
    if (!user || !canManageContacts) {
      toast.error('You do not have permission to edit contacts');
      return;
    }

    setEditingContact(contact);
    setIsEditing(true);
    setNewContact({
      title: contact.title || 'Mr',
      fullName: contact.fullName || '',
      departmentId: contact.departmentId || '',
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
      officialEmail: contact.officialEmail || '',
      address: contact.address || '',
      description: contact.description || '',
      contactType: contact.contactType || 'Person',
      contactStatus: contact.contactStatus || 'On Duty',
      profilePicture: null,
      status: contact.status || 'active'
    });
    setShowAddModal(true);
  };

  const handleUpdate = async () => {
    if (!editingContact || !validateForm() || !user) {
      toast.error('Invalid form data or missing permissions');
      return;
    }

    setIsLoading(true);
    try {
      let profilePictureUrl = editingContact.profilePicture;

      if (newContact.profilePicture instanceof File) {
        const storageRef = ref(storage, `contact-profiles/${Date.now()}-${newContact.profilePicture.name}`);
        const uploadResult = await uploadBytes(storageRef, newContact.profilePicture);
        profilePictureUrl = await getDownloadURL(uploadResult.ref);
      }

      const contactRef = doc(db, 'contacts', editingContact.id);
      const updateData = {
        ...newContact,
        mobileNo1: newContact.mobileNo1 ? formatPhoneNumber(newContact.mobileNo1) : '',
        mobileNo2: newContact.mobileNo2 ? formatPhoneNumber(newContact.mobileNo2) : '',
        whatsAppNo: newContact.whatsAppNo ? formatPhoneNumber(newContact.whatsAppNo) : '',
        officeNo1: newContact.officeNo1 ? formatPhoneNumber(newContact.officeNo1) : '',
        officeNo2: newContact.officeNo2 ? formatPhoneNumber(newContact.officeNo2) : '',
        faxNo1: newContact.faxNo1 ? formatPhoneNumber(newContact.faxNo1) : '',
        faxNo2: newContact.faxNo2 ? formatPhoneNumber(newContact.faxNo2) : '',
        profilePicture: profilePictureUrl,
        updatedAt: serverTimestamp(),
        updatedBy: user.email
      };

      await updateDoc(contactRef, updateData);
      console.log('Contact updated:', editingContact.id);
      toast.success('Contact updated successfully');
      setIsEditing(false);
      setEditingContact(null);
      setShowAddModal(false);
      resetForm();
      await fetchContacts();
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (contact: Contact) => {
    if (!user || !canManageContacts) {
      toast.error('You do not have permission to delete contacts');
      return;
    }
    setContactToDelete(contact);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete || !user) {
      toast.error('Unable to delete contact');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Deleting contact:', contactToDelete.id); // Debug log
      const contactRef = doc(db, 'contacts', contactToDelete.id);
      
      // Actually delete the document from Firebase
      await deleteDoc(contactRef);

      console.log('Contact deleted successfully'); // Debug log

      // Update local state
      setContacts(prevContacts => 
        prevContacts.filter(contact => contact.id !== contactToDelete.id)
      );

      toast.success('Contact deleted successfully');
      setShowDeleteModal(false);
      setContactToDelete(null);
      
      // Refresh contacts list
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

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>, field: keyof NewContact) => {
    let value = e.target.value;
    
    // Remove any non-digits and +94 prefix
    value = value.replace(/\D/g, '').replace(/^94/, '');
    
    // Limit to 9 digits (excluding +94)
    if (value.length > 9) {
      value = value.slice(0, 9);
    }
    
    // Add +94 prefix for display
    const formattedValue = value ? `+94${value}` : '';
    
    // Update the contact state
    setNewContact({ ...newContact, [field]: formattedValue });
  };

  const filteredContacts = contacts.filter(contact => {
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
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredContacts.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setTotalPages(Math.ceil(filteredContacts.length / itemsPerPage));
  }, [filteredContacts, itemsPerPage]);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const Pagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-between items-center mt-4 px-6 py-3 bg-[#1f2937] rounded-lg">
        <div className="text-sm text-gray-400">
          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredContacts.length)} of {filteredContacts.length} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-[#374151] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {pageNumbers.map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`px-3 py-1 rounded-md ${
                currentPage === number 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[#374151] text-gray-300 hover:bg-[#4b5563]'
              }`}
            >
              {number}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md bg-[#374151] text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const handleBulkImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.email) return;
    
    setIsImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userEmail', user.email);
      
      const response = await fetch('/api/contacts/bulk-import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Import failed');
      }
      
      await fetchContacts();
      toast.success('Contacts imported successfully');
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import contacts');
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    console.log('Current editing state:', {
      isEditing,
      editingContact,
      showAddModal
    });
  }, [isEditing, editingContact, showAddModal]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Select all toggled:', event.target.checked); // Debug log
    const newSelection = event.target.checked ? currentItems.map(contact => contact.id) : [];
    console.log('New selection:', newSelection); // Debug log
    setSelectedContacts(newSelection);
  };

  const handleSelectContact = (contactId: string) => {
    console.log('Toggling selection for contact:', contactId); // Debug log
    setSelectedContacts(prev => {
      const newSelection = prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId];
      console.log('New selection:', newSelection); // Debug log
      return newSelection;
    });
  };

  const handleBulkDelete = async () => {
    if (!user || !canManageContacts || selectedContacts.length === 0) {
      toast.error('No contacts selected or missing permissions');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting bulk delete for contacts:', selectedContacts); // Debug log

      // Create a new batch
      const batch = writeBatch(db);
      
      // Add each contact deletion to the batch
      for (const contactId of selectedContacts) {
        console.log('Processing contact for deletion:', contactId); // Debug log
        const contactRef = doc(db, 'contacts', contactId);
        batch.delete(contactRef); // Actually delete the document
      }

      // Commit the batch
      await batch.commit();
      console.log('Bulk delete completed successfully'); // Debug log

      // Update local state
      setContacts(prevContacts => 
        prevContacts.filter(contact => !selectedContacts.includes(contact.id))
      );

      toast.success(`Successfully deleted ${selectedContacts.length} contacts`);
      setSelectedContacts([]);
      setShowBulkDeleteModal(false);
      
      // Refresh contacts list
      await fetchContacts();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to delete contacts');
    } finally {
      setIsLoading(false);
    }
  };

  // Add this useEffect to monitor bulk delete operations
  useEffect(() => {
    console.log('Selected contacts for deletion:', selectedContacts);
  }, [selectedContacts]);

  const handleBulkDeleteClick = () => {
    if (selectedContacts.length === 0) {
      toast.error('No contacts selected');
      return;
    }
    setShowBulkDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Add Contact Button */}
      {canManageContacts && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              resetForm();
              setIsEditing(false);
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Contact
            </span>
          </button>
        </div>
      )}

      {/* Contact Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-muted/40 px-6 py-4 border-b border-border">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                {isEditing ? 'Edit Contact' : 'Add New Contact'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditing(false);
                  setEditingContact(null);
                  resetForm();
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-muted-foreground">Basic Information</h4>
                  
                  {/* Profile Picture Upload */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center relative group">
                      {newContact.profilePicture instanceof File ? (
                        <img
                          src={URL.createObjectURL(newContact.profilePicture)}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : editingContact?.profilePicture ? (
                        <img
                          src={editingContact.profilePicture}
                          alt="Current profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-muted-foreground" />
                      )}
                      <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <ImageIcon className="h-6 w-6 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setNewContact({ ...newContact, profilePicture: file });
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Click to upload profile picture
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                      <select
                        value={newContact.title}
                        onChange={(e) => setNewContact({ ...newContact, title: e.target.value as ContactTitle })}
                        className="w-full p-2 border rounded bg-background text-foreground"
                      >
                        {CONTACT_TITLES.map((title: ContactTitle) => (
                          <option key={title} value={title}>{title}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={newContact.fullName}
                        onChange={(e) => setNewContact({ ...newContact, fullName: e.target.value })}
                        className="w-full p-2 border rounded bg-background text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Department *</label>
                    <select
                      value={newContact.departmentId}
                      onChange={(e) => setNewContact({ ...newContact, departmentId: e.target.value })}
                      className="w-full p-2 border rounded bg-background text-foreground"
                      required
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
                      value={newContact.instituteId}
                      onChange={(e) => setNewContact({ ...newContact, instituteId: e.target.value })}
                      className="w-full p-2 border rounded bg-background text-foreground"
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
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Unit</label>
                    <select
                      value={newContact.unitId}
                      onChange={(e) => setNewContact({ ...newContact, unitId: e.target.value })}
                      className="w-full p-2 border rounded bg-background text-foreground"
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
                <div className="space-y-4">
                  <h4 className="font-medium text-muted-foreground">Contact Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Mobile No. 1</label>
                    <input
                      type="tel"
                      value={newContact.mobileNo1}
                      onChange={(e) => handlePhoneInput(e, 'mobileNo1')}
                      placeholder="+94XXXXXXXXX"
                      className="w-full p-2 border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Mobile No. 2</label>
                    <input
                      type="tel"
                      value={newContact.mobileNo2}
                      onChange={(e) => handlePhoneInput(e, 'mobileNo2')}
                      placeholder="+94XXXXXXXXX"
                      className="w-full p-2 border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">WhatsApp</label>
                    <input
                      type="tel"
                      value={newContact.whatsAppNo}
                      onChange={(e) => handlePhoneInput(e, 'whatsAppNo')}
                      placeholder="+94XXXXXXXXX"
                      className="w-full p-2 border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Office No. 1</label>
                    <input
                      type="tel"
                      value={newContact.officeNo1}
                      onChange={(e) => handlePhoneInput(e, 'officeNo1')}
                      placeholder="+94XXXXXXXXX"
                      className="w-full p-2 border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Office No. 2</label>
                    <input
                      type="tel"
                      value={newContact.officeNo2}
                      onChange={(e) => handlePhoneInput(e, 'officeNo2')}
                      placeholder="+94XXXXXXXXX"
                      className="w-full p-2 border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Fax No. 1</label>
                    <input
                      type="tel"
                      value={newContact.faxNo1}
                      onChange={(e) => handlePhoneInput(e, 'faxNo1')}
                      placeholder="+94XXXXXXXXX"
                      className="w-full p-2 border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Fax No. 2</label>
                    <input
                      type="tel"
                      value={newContact.faxNo2}
                      onChange={(e) => handlePhoneInput(e, 'faxNo2')}
                      placeholder="+94XXXXXXXXX"
                      className="w-full p-2 border rounded bg-background text-foreground"
                    />
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-muted-foreground">Additional Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Official Email</label>
                    <input
                      type="email"
                      value={newContact.officialEmail}
                      onChange={(e) => setNewContact({ ...newContact, officialEmail: e.target.value })}
                      className="w-full p-2 border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Personal Email</label>
                    <input
                      type="email"
                      value={newContact.personalEmail}
                      onChange={(e) => setNewContact({ ...newContact, personalEmail: e.target.value })}
                      className="w-full p-2 border rounded bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Address</label>
                    <textarea
                      value={newContact.address}
                      onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
                      className="w-full p-2 border rounded bg-background text-foreground min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                    <textarea
                      value={newContact.description}
                      onChange={(e) => setNewContact({ ...newContact, description: e.target.value })}
                      className="w-full p-2 border rounded bg-background text-foreground min-h-[100px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Contact Type</label>
                      <select
                        value={newContact.contactType}
                        onChange={(e) => setNewContact({ ...newContact, contactType: e.target.value as ContactType })}
                        className="w-full p-2 border rounded bg-background text-foreground"
                      >
                        {CONTACT_TYPES.map((type: ContactType) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">Contact Status</label>
                      <select
                        value={newContact.contactStatus}
                        onChange={(e) => setNewContact({ ...newContact, contactStatus: e.target.value as ContactStatus })}
                        className="w-full p-2 border rounded bg-background text-foreground"
                      >
                        {CONTACT_STATUSES.map((status: ContactStatus) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditing(false);
                    setEditingContact(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      {isEditing ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    isEditing ? 'Update Contact' : 'Add Contact'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contacts List - visible to all users */}
      <div className="bg-[#111827] p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Contacts List</h3>
            {selectedContacts.length > 0 && canManageContacts && (
              <button
                onClick={handleBulkDeleteClick}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedContacts.length})
              </button>
            )}
          </div>
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
            <thead className="bg-[#1f2937] text-gray-300">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={currentItems.length > 0 && selectedContacts.length === currentItems.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </th>
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
            <tbody className="divide-y divide-gray-700">
              {currentItems.map((contact) => (
                <tr key={contact.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => handleSelectContact(contact.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4">
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
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(contact);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors duration-150"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(contact);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors duration-150"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(contact);
                        }}
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
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete contact "{contactToDelete.fullName}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setContactToDelete(null);
                }}
                className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isLoading) {
                    confirmDelete();
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Contact Modal */}
      {showViewModal && viewingContact && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-muted/40 px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Contact Details</h3>
                  <p className="text-sm text-muted-foreground">View complete contact information</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingContact(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Profile Section */}
                  <div className="bg-muted/10 rounded-lg p-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-primary/20">
                        {viewingContact.profilePicture ? (
                          <img
                            src={viewingContact.profilePicture}
                            alt={viewingContact.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xl font-semibold flex items-center gap-2">
                          {viewingContact.title} {viewingContact.fullName}
                          {viewingContact.status === 'active' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </h4>
                        <p className="text-muted-foreground mt-1">{viewingContact.officialEmail}</p>
                        <div className="flex gap-2 mt-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {viewingContact.contactType}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {viewingContact.contactStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Organization Details */}
                  <div className="bg-muted/10 rounded-lg p-6">
                    <h5 className="text-lg font-medium flex items-center gap-2 mb-4">
                      <Building2 className="h-5 w-5 text-primary" />
                      Organization Details
                    </h5>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-muted-foreground">Department</span>
                        <span className="font-medium">{departments.find(d => d.id === viewingContact.departmentId)?.name}</span>
                      </div>
                      {viewingContact.instituteId && (
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">Institute</span>
                          <span className="font-medium">{institutes.find(i => i.id === viewingContact.instituteId)?.name}</span>
                        </div>
                      )}
                      {viewingContact.unitId && (
                        <div className="flex justify-between items-center py-2 border-b border-border">
                          <span className="text-muted-foreground">Unit</span>
                          <span className="font-medium">{units.find(u => u.id === viewingContact.unitId)?.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(viewingContact.address || viewingContact.description) && (
                    <div className="bg-muted/10 rounded-lg p-6">
                      <h5 className="text-lg font-medium flex items-center gap-2 mb-4">
                        <FileText className="h-5 w-5 text-primary" />
                        Additional Information
                      </h5>
                      {viewingContact.address && (
                        <div className="mb-4">
                          <h6 className="text-sm font-medium text-muted-foreground mb-2">Address</h6>
                          <p className="text-sm leading-relaxed">{viewingContact.address}</p>
                        </div>
                      )}
                      {viewingContact.description && (
                        <div>
                          <h6 className="text-sm font-medium text-muted-foreground mb-2">Description</h6>
                          <p className="text-sm leading-relaxed">{viewingContact.description}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Contact Numbers */}
                  <div className="bg-muted/10 rounded-lg p-6">
                    <h5 className="text-lg font-medium flex items-center gap-2 mb-4">
                      <Phone className="h-5 w-5 text-primary" />
                      Contact Numbers
                    </h5>
                    <div className="space-y-3">
                      {viewingContact.mobileNo1 && (
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Mobile No. 1
                          </span>
                          <span className="font-medium">{viewingContact.mobileNo1}</span>
                        </div>
                      )}
                      {/* Repeat similar structure for other phone numbers */}
                    </div>
                  </div>

                  {/* Email Addresses */}
                  <div className="bg-muted/10 rounded-lg p-6">
                    <h5 className="text-lg font-medium flex items-center gap-2 mb-4">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Addresses
                    </h5>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Official Email
                        </span>
                        <span className="font-medium">{viewingContact.officialEmail}</span>
                      </div>
                      {viewingContact.personalEmail && (
                        <div className="flex items-center justify-between py-2 border-b border-border">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Personal Email
                          </span>
                          <span className="font-medium">{viewingContact.personalEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Record Information */}
                  <div className="bg-muted/10 rounded-lg p-6">
                    <h5 className="text-lg font-medium flex items-center gap-2 mb-4">
                      <FileText className="h-5 w-5 text-primary" />
                      Record Information
                    </h5>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Created By</span>
                        <span className="font-medium">{viewingContact.createdBy}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Created At</span>
                        <span className="font-medium">
                          {viewingContact.createdAt.toDate().toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Last Updated By</span>
                        <span className="font-medium">{viewingContact.updatedBy}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border">
                        <span className="text-muted-foreground">Last Updated At</span>
                        <span className="font-medium">
                          {viewingContact.updatedAt.toDate().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-4 px-6 py-4 border-t border-border">
              {canManageContacts && (
                <>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEdit(viewingContact);
                    }}
                    className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                  >
                    Edit Contact
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleDelete(viewingContact);
                    }}
                    className="px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    Delete Contact
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingContact(null);
                }}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => window.location.href = '/api/contacts/template'}
          className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
        >
          Download Template
        </button>
        
        <div className="relative">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !user?.email) return;
              
              setIsImporting(true);
              
              try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('userEmail', user.email);
                
                const response = await fetch('/api/contacts/bulk-import', {
                  method: 'POST',
                  body: formData,
                });
                
                if (!response.ok) {
                  throw new Error('Import failed');
                }
                
                await fetchContacts();
                toast.success('Contacts imported successfully');
              } catch (error) {
                console.error('Import error:', error);
                toast.error('Failed to import contacts');
              } finally {
                setIsImporting(false);
              }
            }}
            className="hidden"
            id="bulk-import"
            disabled={isImporting}
          />
          <label
            htmlFor="bulk-import"
            className={`px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer inline-block ${
              isImporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isImporting ? 'Importing...' : 'Import Contacts'}
          </label>
        </div>
      </div>

      <Pagination />

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-[#252422]/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#FFFCF2] border border-[#CCC5B9] rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-xl font-semibold mb-4 text-[#252422]">Confirm Bulk Delete</h3>
            <p className="text-[#403D39] mb-6">
              Are you sure you want to delete {selectedContacts.length} contacts? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 rounded-md bg-[#CCC5B9] text-[#252422] hover:bg-[#403D39] hover:text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-[#EB5E28] text-white hover:bg-[#EB5E28]/90 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                    Deleting...
                  </span>
                ) : (
                  'Delete Selected'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactManagement;