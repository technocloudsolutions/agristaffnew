export interface User {
  id: string;
  uid?: string;
  email: string;
  name: string;
  role: 'admin' | 'data-entry' | 'user';
  status: 'active' | 'inactive';
  designation?: string;
  contactNumber?: string;
  departmentId?: string;
  instituteId?: string;
  unitId?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
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