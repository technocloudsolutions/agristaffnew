import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Department } from '@/types/organization';

export async function GET() {
  try {
    const departmentsRef = collection(db, 'departments');
    const snapshot = await getDocs(departmentsRef);
    
    const departments = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
    }));

    return NextResponse.json({ departments }, { status: 200 });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
} 