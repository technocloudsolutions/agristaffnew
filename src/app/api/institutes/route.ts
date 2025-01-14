import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Institute } from '@/types/organization';

export async function GET() {
  try {
    const institutesRef = collection(db, 'institutes');
    const snapshot = await getDocs(institutesRef);
    
    const institutes = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      departmentId: doc.data().departmentId,
    }));

    return NextResponse.json({ institutes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching institutes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch institutes' },
      { status: 500 }
    );
  }
} 