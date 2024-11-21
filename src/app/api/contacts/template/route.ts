import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // Create template workbook with your Firebase data structure
    const template = [
      {
        title: 'Mr',
        fullName: 'John Doe',
        departmentId: 'department-id-1',
        instituteId: 'institute-id-1',
        unitId: 'unit-id-1',
        mobileNo1: '+94771234567',
        mobileNo2: '',
        whatsAppNo: '+94771234567',
        officeNo1: '+94112345678',
        officeNo2: '',
        faxNo1: '',
        faxNo2: '',
        personalEmail: 'john.personal@example.com',
        officialEmail: 'john.official@example.com',
        address: '123 Main St, City',
        description: 'Department Head',
        contactType: 'Person',
        contactStatus: 'On Duty'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(template);
    XLSX.utils.book_append_sheet(wb, ws, 'Contacts Template');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Disposition': 'attachment; filename="contacts_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
} 