import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userEmail = formData.get('userEmail') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Batch create contacts in Firebase
    const contactsRef = collection(db, 'contacts');
    const importPromises = jsonData.map(async (row: any) => {
      const contactData = {
        title: row.title || 'Mr',
        fullName: row.fullName || '',
        departmentId: row.departmentId || '',
        instituteId: row.instituteId || '',
        unitId: row.unitId || '',
        mobileNo1: row.mobileNo1 || '',
        mobileNo2: row.mobileNo2 || '',
        whatsAppNo: row.whatsAppNo || '',
        officeNo1: row.officeNo1 || '',
        officeNo2: row.officeNo2 || '',
        faxNo1: row.faxNo1 || '',
        faxNo2: row.faxNo2 || '',
        personalEmail: row.personalEmail || '',
        officialEmail: row.officialEmail || '',
        address: row.address || '',
        description: row.description || '',
        contactType: row.contactType || 'Person',
        contactStatus: row.contactStatus || 'On Duty',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userEmail,
        updatedBy: userEmail
      };

      return addDoc(contactsRef, contactData);
    });

    await Promise.all(importPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    );
  }
} 