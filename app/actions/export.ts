'use server';

import { connectToDatabase } from '@/lib/db';
import Students from '@/models/Students';
import ExcelJS from 'exceljs';

export async function exportStudentsToExcel() {
  try {
    await connectToDatabase();
    const students = await Students.find({}).sort({ name: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Define columns
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Roll Number', key: 'rollNumber', width: 15 },
      { header: 'University Roll No', key: 'universityRollNo', width: 20 },
      { header: 'Branch', key: 'branch', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
      { header: 'Backlogs', key: 'back', width: 10 },
      { header: 'Phone Number', key: 'phoneNumber', width: 20 },
      { header: 'Event Name', key: 'eventName', width: 30 },
      { header: 'Domains', key: 'domain', width: 40 },
      { header: 'Review (0-10)', key: 'review', width: 15 },
      { header: 'Comment', key: 'comment', width: 50 },
      { header: 'Round 1 Attendance', key: 'roundOneAttendance', width: 20 },
      { header: 'Round 2 Attendance', key: 'roundTwoAttendance', width: 20 },
      { header: 'Round 1 Qualified', key: 'roundOneQualified', width: 20 },
      { header: 'Round 2 Qualified', key: 'roundTwoQualified', width: 20 },
      { header: 'Total Attendance', key: 'attendanceCount', width: 20 },
    ];

    // Add rows from the database
    const plainStudents = JSON.parse(JSON.stringify(students));

    plainStudents.forEach((student: any) => {
      worksheet.addRow({
        ...student,
        domain: Array.isArray(student.domain) ? student.domain.join(', ') : student.domain || '',
        attendanceCount: Array.isArray(student.attendance) ? student.attendance.length : 0,
        review: student.review || 'Not Reviewed',
        comment: student.comment || '',
        roundOneAttendance: student.roundOneAttendance ? 'Yes' : 'No',
        roundTwoAttendance: student.roundTwoAttendance ? 'Yes' : 'No',
        roundOneQualified: student.roundOneQualified ? 'Yes' : 'No',
        roundTwoQualified: student.roundTwoQualified ? 'Yes' : 'No',
      });
    });

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Generate the file buffer in memory
    const buffer = await workbook.xlsx.writeBuffer();

    // Convert buffer to a Base64 string to safely send to the client
    const base64 = Buffer.from(buffer).toString('base64');

    return {
      success: true,
      file: base64,
    };
  } catch (error: any) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: 'Failed to export data.' };
  }
}
