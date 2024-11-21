import { Timestamp } from 'firebase/firestore';

export type ContactTitle = 'Mr' | 'Mrs' | 'Miss' | 'Dr' | 'Prof';
export type ContactType = 'Institute' | 'Person';
export type ContactStatus = 'On Duty' | 'Retired' | 'Transferred' | 'Other';

export interface Contact {
  id: string;
  title: ContactTitle;
  fullName: string;
  departmentId: string;
  instituteId?: string | null;
  unitId?: string | null;
  mobileNo1?: string | null;
  mobileNo2?: string | null;
  whatsAppNo?: string | null;
  officeNo1?: string | null;
  officeNo2?: string | null;
  faxNo1?: string | null;
  faxNo2?: string | null;
  personalEmail?: string | null;
  officialEmail: string;
  address?: string | null;
  description?: string | null;
  contactType: ContactType;
  contactStatus: ContactStatus;
  profilePicture?: string | null;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
  deletedAt?: Timestamp | null;
  deletedBy?: string | null;
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
  faxNo2: string;
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