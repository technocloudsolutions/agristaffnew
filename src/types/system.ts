import { Timestamp } from 'firebase/firestore';

export interface SystemVersion {
  id: string;
  versionNumber: string;
  buildNumber: string;
  releaseDate: Timestamp;
  description?: string;
  changes?: string[];
  createdAt: Timestamp;
  createdBy: string;
  isActive: boolean;
  history?: VersionHistory[];
}

export interface VersionHistory {
  id: string;
  action: 'created' | 'updated' | 'activated' | 'deactivated';
  timestamp: Timestamp;
  performedBy: string;
  details?: {
    previousVersion?: string;
    newVersion?: string;
    previousBuild?: string;
    newBuild?: string;
    changes?: string[];
  };
}

export interface NewSystemVersion {
  versionNumber: string;
  buildNumber: string;
  releaseDate: Date;
  description?: string;
  changes?: string[];
  isActive: boolean;
} 