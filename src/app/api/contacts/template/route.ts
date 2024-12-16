import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create template workbook with your Firebase data structure
    const template = [
      {
        title: 'Mr/Mrs/Miss/Dr/Prof',
        fullName: 'Full Name',
        designation: 'Designation',
        departmentId: 'Department ID',
        instituteId: 'Institute ID (Optional)',
        unitId: 'Unit ID (Optional)',
        mobileNo1: '+94XXXXXXXXX',
        mobileNo2: '+94XXXXXXXXX (Optional)',
        whatsAppNo: '+94XXXXXXXXX (Optional)',
        officeNo1: '+94XXXXXXXXX (Optional)',
        officeNo2: '+94XXXXXXXXX (Optional)',
        faxNo1: '+94XXXXXXXXX (Optional)',
        faxNo2: '+94XXXXXXXXX (Optional)',
        personalEmail: 'personal@email.com (Optional)',
        officialEmail: 'official@email.com',
        address: 'Address (Optional)',
        description: 'Description (Optional)',
        contactType: 'Person/Institute',
        contactStatus: 'On Duty/Retired/Transferred/Other'
      }
    ];

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts Template');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return the Excel file
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="contacts_template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
} 