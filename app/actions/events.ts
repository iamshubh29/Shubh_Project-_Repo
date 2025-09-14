'use server';

import { connectToDatabase } from '@/lib/db';
import Event, { IEvent } from "@/models/Event";
import Students from '@/models/Students';
import { revalidatePath } from 'next/cache';
import { sendMail } from '@/lib/email';
import { reminderEmailTemplate } from "@/mail/Remind";
import fs from 'fs/promises';
import path from 'path';

// This action now handles a file upload along with other event data.
export async function createEvent(formData: FormData) {
  try {
    const eventName = formData.get('eventName') as string;
    const eventDate = formData.get('eventDate') as string;
    const motive = formData.get('motive') as string;
    const registrationFee = formData.get('registrationFee') as string;
    const certificateFile = formData.get('certificateTemplate') as File;

    if (!eventName || !eventDate || !motive) {
      return { ok: false, error: 'Event Name, Date, and Motive are required.' };
    }

    await connectToDatabase();
    
    let certificateFilename: string | undefined = undefined;

    // 1. Check if a certificate file was uploaded.
    if (certificateFile && certificateFile.size > 0) {
      // 2. Convert the file to a Buffer.
      const fileBuffer = Buffer.from(await certificateFile.arrayBuffer());
      // 3. Create a unique filename to prevent overwrites.
      certificateFilename = `${Date.now()}-${certificateFile.name.replace(/\s/g, '_')}`;
      // 4. Define the path to save the file in the public directory.
      const filePath = path.join(process.cwd(), 'public', certificateFilename);
      // 5. Write the file to the server's filesystem.
      await fs.writeFile(filePath, new Uint8Array(fileBuffer));
    }

    const newEvent = new Event({ 
      eventName, 
      eventDate, 
      motive, 
      registrationFee: registrationFee || 'Free',
      // 6. Save the unique filename to the database for this event.
      certificateTemplate: certificateFilename,
    });

    await newEvent.save();
    revalidatePath('/admin/scanner');

    return { ok: true, event: JSON.parse(JSON.stringify(newEvent)) };
  } catch (error: any) {
    console.error("Error creating event:", error);
    if (error.code === 11000) {
        return { ok: false, error: 'An event with this name already exists.' };
    }
    return { ok: false, error: 'Failed to create event. Please check all fields.' };
  }
}

// ... (The rest of your functions in this file remain unchanged)

export async function RemainerStudents(id: string) {
  console.log(`[1/4] Starting reminder process for event ID: ${id}`);
  try {
    await connectToDatabase();

    const event = await Event.findById(id).lean<IEvent | null>();
    if (!event) {
      console.error("Reminder failed: Event not found.");
      return { success: false, message: 'Event not found' };
    }
    console.log(`[2/4] Found event: ${event.eventName}`);

    const students = await Students.find({ eventName: event.eventName });
    if (!students || students.length === 0) {
      console.log("[3/4] No students found for this event. No reminders sent.");
      return { success: true, message: 'No students registered for this event yet.' };
    }
    console.log(`[3/4] Found ${students.length} student(s) to remind.`);

    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    for (const student of students) {
        console.log(`--> Sending email to ${student.email}...`);
        await sendMail({
            to: student.email,
            subject: `📅 Event Reminder: ${event.eventName}`,
            html: reminderEmailTemplate(
                student.name,
                event.eventName,
                "RTU Campus, Kota",
                `${formattedDate} at 3:00 PM`
            ),
        });
    }

    console.log(`[4/4] Process complete. Reminder emails sent to ${students.length} students.`);
    return {
      success: true,
      message: `Reminder emails sent successfully to ${students.length} students`
    };
  } catch (error) {
    console.error('❌ Error in RemainerStudents:', error);
    return { success: false, message: 'Failed to send reminder emails. Check server logs.' };
  }
}

export async function getEvents() {
  try {
    await connectToDatabase();
    const events = await Event.find({}).sort({ createdAt: -1 }).lean<IEvent[]>();
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    return [];
  }
}

export async function getEventById(eventId: string) {
  try {
    await connectToDatabase();
    const event = await Event.findById(eventId).lean<IEvent | null>();
    return event ? JSON.parse(JSON.stringify(event)) : null;
  } catch (error) {
    return null;
  }
}

export async function deleteEvent(id: string) {
  try {
    await connectToDatabase();
    await Event.findByIdAndDelete(id);
    revalidatePath('/admin/scanner');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: 'Failed to delete event' };
  }
}

export async function getEventAttendance(eventId: string) {
  try {
    await connectToDatabase();
    const event = await Event.findById(eventId).lean<IEvent | null>();
    if (!event) return { ok: false, error: 'Event not found' };
    const students = await Students.find({ eventName: event.eventName }).lean();
    const rows = (students || []).map((s: any) => ({
      name: s.name, email: s.email, rollNumber: s.rollNumber,
      universityRollNo: s.universityRollNo, branch: s.branch, year: s.year,
      phoneNumber: s.phoneNumber, attendanceCount: Array.isArray(s.attendance) ? s.attendance.length : 0,
    }));
    return { ok: true, eventName: event.eventName, rows };
  } catch (error) {
    return { ok: false, error: 'Failed to fetch event attendance' };
  }
}