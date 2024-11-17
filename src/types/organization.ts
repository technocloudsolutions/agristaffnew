import { Timestamp } from 'firebase/firestore';

export interface BaseEntity {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Department extends BaseEntity {
  code: string;
  head?: string;
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
}

export interface Institute extends BaseEntity {
  departmentId: string;
  departmentName?: string; // For denormalization
  head?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
  };
}

export interface Unit extends BaseEntity {
  instituteId: string;
  instituteName?: string; // For denormalization
  departmentId?: string; // For easier querying
  unitHead?: string;
  staffCount?: number;
} 