import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Unit } from '@/types/organization';

export async function GET() {
  try {
    const unitsRef = collection(db, 'units');
    const snapshot = await getDocs(unitsRef);
    
    const units = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      instituteId: doc.data().instituteId,
      departmentId: doc.data().departmentId,
    }));

    return NextResponse.json({ units }, { status: 200 });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { error: 'Failed to fetch units' },
      { status: 500 }
    );
  }
} 