import { useState, useCallback } from 'react';
import { db } from '@/firebase/config';
import {
  collection,
  query,
  getDocs,
  where,
  orderBy,
  DocumentData,
} from 'firebase/firestore';
import { Department, Institute, Unit } from '@/types/organization';

export function useOrganization() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWithFilters = useCallback(async (
    collectionName: string,
    filters: {
      searchTerm?: string;
      status?: string;
      sortField?: string;
      parentId?: string;
    }
  ) => {
    setLoading(true);
    try {
      let queryRef = collection(db, collectionName);
      let queryConstraints = [];
      
      // Apply filters
      if (filters.status && filters.status !== 'all') {
        queryConstraints.push(where('status', '==', filters.status));
      }
      
      if (filters.parentId) {
        queryConstraints.push(where(
          collectionName === 'institutes' ? 'departmentId' : 'instituteId',
          '==',
          filters.parentId
        ));
      }

      // Apply sorting
      if (filters.sortField) {
        queryConstraints.push(orderBy(filters.sortField));
      }

      const queryWithFilters = query(queryRef, ...queryConstraints);
      const snapshot = await getDocs(queryWithFilters);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as (Department | Institute | Unit)[];

      // Apply search filter in memory
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        return items.filter(item => 
          (item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          ('code' in item && item.code?.toLowerCase().includes(searchLower)))
        );
      }

      return items;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchWithFilters
  };
} 