import { Timestamp } from 'firebase/firestore';

export type ContactTitle = 'Mr' | 'Mrs' | 'Miss' | 'Dr' | 'Prof';
export type ContactType = 'Institute' | 'Person';
export type ContactStatus = 'On Duty' | 'Retired' | 'Transferred' | 'Other';

export interface Contact {
  id: string;
  title: ContactTitle;
  fullName: string;
  departmentId: string;
  instituteId?: string;
  unitId?: string;
  mobileNo1?: string;
  mobileNo2?: string;
  whatsAppNo?: string;
  officeNo1?: string;
  officeNo2?: string;
  faxNo1?: string;
  faxNo2?: string;
  personalEmail?: string;
  officialEmail: string;
  address?: string;
  description?: string;
  contactType: ContactType;
  contactStatus: ContactStatus;
  profilePicture?: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface NewContact {
  title: ContactTitle;
  fullName: string;
  departmentId: string;
  instituteId?: string;
  unitId?: string;
  mobileNo1?: string;
  mobileNo2?: string;
  whatsAppNo?: string;
  officeNo1?: string;
  officeNo2?: string;
  faxNo1?: string;
  faxNo2?: string;
  personalEmail?: string;
  officialEmail: string;
  address?: string;
  description?: string;
  contactType: ContactType;
  contactStatus: ContactStatus;
  profilePicture?: File | null;
  status: 'active' | 'inactive';
}

export interface ContactFilters {
  searchTerm?: string;
  departmentId?: string;
  instituteId?: string;
  unitId?: string;
  contactType?: ContactType;
  contactStatus?: ContactStatus;
  status?: 'active' | 'inactive';
} 