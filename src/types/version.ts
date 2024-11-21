import { Timestamp } from 'firebase/firestore';

export interface Version {
  id?: string;
  version: string;
  date: string;
  changes: string[];
  createdBy: string;
  createdAt: Timestamp;
}

export interface VersionHistoryProps {
  versions: Version[];
  onRevert?: (version: Version) => Promise<void>;
} 