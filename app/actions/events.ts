'use server';

import { connectToDatabase } from '@/lib/db';
import Event, { IEvent } from "@/models/Event";
import Students from '@/models/Students';
import { revalidatePath } from 'next/cache';
import { sendMail } from '@/lib/email';
import { reminderEmailTemplate } from "@/mail/Remind";

// --- UPDATED createEvent FUNCTION SIGNATURE AND LOGIC ---
export async function createEvent(eventName: string, eventDate: string, motive: string, registrationFee: string) {
  try {
    await connectToDatabase();
    const newEvent = new Event({ eventName, eventDate, motive, registrationFee });
    await newEvent.save();
    console.log("Event created:", newEvent);
    revalidatePath('/admin/scanner');

    const plainEvent = JSON.parse(JSON.stringify(newEvent));
    return { ok: true, event: plainEvent };
  } catch (error: any) {
    console.error("Error creating event:", error);
    if (error.code === 11000) { // Handle duplicate event names if your schema has a unique index
        return { ok: false, error: 'An event with this name already exists.' };
    }
    return { ok: false, error: 'Failed to create event. Please check all fields.' };
  }
}
// --- END OF UPDATE ---

export async function getEvents() {
  try {
    await connectToDatabase();
    const events = await Event.find({}).sort({ createdAt: -1 }).lean<IEvent[]>();
    return JSON.parse(JSON.stringify(events));
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function getEventById(eventId: string) {
  try {
    await connectToDatabase();
    const event = await Event.findById(eventId).lean<IEvent | null>();
    if (!event) {
      return null;
    }
    return JSON.parse(JSON.stringify(event));
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    return null;
  }
}

export async function deleteEvent(id: string) {
  try {
    await connectToDatabase();
    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      console.error("Event not found:", id);
      return { ok: false, error: 'Event not found' };
    }
    console.log("Event deleted:", deletedEvent);
    revalidatePath('/admin/scanner');
    return { ok: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { ok: false, error: 'Failed to delete event' };
  }
}

export async function getEventAttendance(eventId: string) {
  try {
    await connectToDatabase();
    const event = await Event.findById(eventId).lean<IEvent | null>();

    if (!event) {
      return { ok: false, error: 'Event not found' };
    }

    const students = await Students.find({ eventName: event.eventName }).lean();

    const rows = (students || []).map((s: any) => ({
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber,
      universityRollNo: s.universityRollNo,
      branch: s.branch,
      year: s.year,
      phoneNumber: s.phoneNumber,
      attendanceCount: Array.isArray(s.attendance) ? s.attendance.length : 0,
    }));

    return { ok: true, eventName: event.eventName, rows };
  } catch (error) {
    console.error('Error fetching event attendance:', error);
    return { ok: false, error: 'Failed to fetch event attendance' };
  }
}

export async function RemainerStudents(id: string) {
  try {
    await connectToDatabase();

    const event = await Event.findById(id).lean<IEvent | null>();
    if (!event) {
      return { success: false, message: 'Event not found' };
    }

    const students = await Students.find({ eventName: event.eventName });
    if (!students || students.length === 0) {
      return { success: true, message: 'No students registered for this event yet.' };
    }

    const eventDate = new Date(event.eventDate);
    const formattedDate = eventDate.toLocaleDateString('en-IN', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    for (const student of students) {
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

    console.log(`Reminder emails sent to ${students.length} students for event: ${event.eventName}`);
    return {
      success: true,
      message: `Reminder emails sent successfully to ${students.length} students`
    };
  } catch (error) {
    console.error('Error in RemainerStudents:', error);
    return { success: false, message: 'Failed to send reminder emails' };
  }
}