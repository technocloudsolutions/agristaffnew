import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Department, Institute, Unit } from '@/types/organization';

export async function GET() {
  try {
    // Fetch all data in parallel for better performance
    const [departmentsSnapshot, institutesSnapshot, unitsSnapshot] = await Promise.all([
      getDocs(collection(db, 'departments')),
      getDocs(collection(db, 'institutes')),
      getDocs(collection(db, 'units'))
    ]);

    const departments = departmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
    }));

    const institutes = institutesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      departmentId: doc.data().departmentId,
    }));

    const units = unitsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      instituteId: doc.data().instituteId,
      departmentId: doc.data().departmentId,
    }));

    return NextResponse.json({
      departments,
      institutes,
      units
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching organization data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization data' },
      { status: 500 }
    );
  }
} 