import { Timestamp } from 'firebase/firestore';

export interface SystemVersion {
  id: string;
  versionNumber: string;
  buildNumber: string;
  releaseDate: Timestamp;
  description?: string;
  features?: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy?: string;
}

export interface NewSystemVersion {
  versionNumber: string;
  buildNumber: string;
  releaseDate: Date;
  description?: string;
  features?: string[];
  isActive: boolean;
} 