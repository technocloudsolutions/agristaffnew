import { NextResponse } from 'next/server';
import { db } from '@/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Contact } from '@/types/contact';

export async function GET(request: Request) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search') || '';
    const department = url.searchParams.get('department') || '';
    const contactType = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Create base query
    let contactsQuery = query(
      collection(db, 'contacts'),
      where('status', '==', 'active')
    );

    // Get documents
    const snapshot = await getDocs(contactsQuery);
    
    // Transform data with proper typing
    let contacts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Contact[];

    // Apply filters
    if (searchTerm) {
      contacts = contacts.filter(contact => 
        contact.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.officialEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (department) {
      contacts = contacts.filter(contact => contact.departmentId === department);
    }

    if (contactType) {
      contacts = contacts.filter(contact => contact.contactType === contactType);
    }

    if (status) {
      contacts = contacts.filter(contact => contact.contactStatus === status);
    }

    // Calculate pagination
    const totalItems = contacts.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContacts = contacts.slice(startIndex, endIndex);

    return NextResponse.json({
      status: 'success',
      data: {
        contacts: paginatedContacts,
        pagination: {
          total: totalItems,
          pages: totalPages,
          current: page,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Failed to fetch contacts' 
      },
      { status: 500 }
    );
  }
} 