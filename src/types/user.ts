export interface User {
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
  updatedAt: any;
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