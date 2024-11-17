import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

type ContactTitle = 'Mr' | 'Mrs' | 'Miss' | 'Dr' | 'Prof';
type ContactType = 'Institute' | 'Person';
type ContactStatus = 'On Duty' | 'Retired' | 'Transferred' | 'Other';

const CONTACT_TITLES: ContactTitle[] = ['Mr', 'Mrs', 'Miss', 'Dr', 'Prof'];
const CONTACT_TYPES: ContactType[] = ['Institute', 'Person'];
const CONTACT_STATUSES: ContactStatus[] = ['On Duty', 'Retired', 'Transferred', 'Other'];

const ContactManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterContactType, setFilterContactType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [newContact, setNewContact] = useState({
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
    contactType: 'Institute',
    contactStatus: 'On Duty',
    profilePicture: null,
    status: 'active',
  });
  const [canManageContacts, setCanManageContacts] = useState(false);

  useEffect(() => {
    // Fetch contacts, departments, and permissions
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateContactForm()) {
      // Handle form submission
    }
  };

  const validateContactForm = () => {
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
    if (newContact.mobileNo1 && !/^01\d{9}$/.test(newContact.mobileNo1)) {
      toast.error('Invalid mobile number format. Should start with 01 and be 11 digits');
      return false;
    }
    return true;
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Contact Management</h2>
        <div className="text-sm text-muted-foreground">
          Total Contacts: {contacts.length}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded bg-background text-foreground"
          />
        </div>
        
        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          className="p-2 border rounded bg-background text-foreground"
        >
          <option value="">All Departments</option>
          {departments.map((dept: { id: string; name: string }) => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>

        <select
          value={filterContactType}
          onChange={(e) => setFilterContactType(e.target.value as ContactType | '')}
          className="p-2 border rounded bg-background text-foreground"
        >
          <option value="">All Contact Types</option>
          {CONTACT_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ContactStatus | '')}
          className="p-2 border rounded bg-background text-foreground"
        >
          <option value="">All Statuses</option>
          {CONTACT_STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Contact Form - Only show for admin and data-entry */}
      {canManageContacts && (
        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-6 text-card-foreground">Add New Contact</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-muted-foreground">Basic Information</h4>
              
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-2">
                {/* ... existing profile picture code ... */}
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Title</label>
                  <select
                    value={newContact.title}
                    onChange={(e) => setNewContact({ ...newContact, title: e.target.value as ContactTitle })}
                    className="w-full p-2 border rounded bg-background text-foreground"
                  >
                    {CONTACT_TITLES.map(title => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Full Name *
                    <span className="text-xs text-muted-foreground ml-1">(e.g., John Smith)</span>
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

              {/* ... rest of the form fields ... */}
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-muted-foreground">Contact Information</h4>
              
              {/* ... phone numbers and other contact fields ... */}
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-muted-foreground">Additional Information</h4>
              
              {/* ... emails, address, description fields ... */}
            </div>
          </div>

          {/* ... form buttons ... */}
        </form>
      )}

      {/* Contacts List */}
      {/* ... existing contacts list code ... */}
    </div>
  );
};

export default ContactManagement; 