'use server';

import { connectToDatabase } from '@/lib/db';
import Students, { IStudent } from '@/models/Students';
import Event, { IEvent } from '@/models/Event';
import { toZonedTime, format } from 'date-fns-tz';

/**
 * Processes a natural language query from the chatbot and returns a text-based answer.
 * @param query The question asked by the organizer.
 * @returns An object containing the chatbot's response message.
 */
export async function processChatQueryAction(query: string): Promise<{ message: string }> {
  await connectToDatabase();
  const lowerCaseQuery = query.toLowerCase();

  try {
    // Intent 1: Check attendance for a specific student in a specific event
    const attendanceMatch = lowerCaseQuery.match(/did (.+?) attend (.+)/);
    if (attendanceMatch) {
      const studentName = attendanceMatch[1].trim();
      const eventName = attendanceMatch[2].replace(/[?]/g, '').trim();

      const student = await Students.findOne({ 
        name: new RegExp(`^${studentName}$`, 'i'),
        eventName: new RegExp(`^${eventName}$`, 'i')
      }).lean<IStudent>();

      if (!student) {
        return { message: `I couldn't find a student named "${studentName}" registered for the event "${eventName}".` };
      }

      const event = await Event.findOne({ eventName: new RegExp(`^${eventName}$`, 'i') }).lean<IEvent>();
      if (!event) {
        return { message: `I couldn't find an event named "${eventName}".` };
      }

      const eventDate = toZonedTime(new Date(event.eventDate), 'Asia/Kolkata');
      
      const hasAttended = student.attendance.some(a => {
        const attendanceDate = toZonedTime(new Date(a.date), 'Asia/Kolkata');
        return format(attendanceDate, 'yyyy-MM-dd') === format(eventDate, 'yyyy-MM-dd');
      });

      if (hasAttended) {
        return { message: `Yes, ${student.name} attended ${event.eventName}.` };
      } else {
        return { message: `No, ${student.name} did not attend ${event.eventName}.` };
      }
    }

    // Intent 2: Get details for a specific student
    const detailsMatch = lowerCaseQuery.match(/details for (.+)/);
    if (detailsMatch) {
      const studentName = detailsMatch[1].replace(/[?]/g, '').trim();
      const student = await Students.findOne({ name: new RegExp(`^${studentName}$`, 'i') }).lean<IStudent>();

      if (!student) {
        return { message: `I couldn't find any student named "${studentName}".` };
      }
      return { message: `Here are the details for ${student.name}: \n- Email: ${student.email}\n- Roll Number: ${student.rollNumber}\n- Branch: ${student.branch}\n- Registered for: ${student.eventName}` };
    }

    // Intent 3: List all students for an event
    const listMatch = lowerCaseQuery.match(/who registered for (.+)/);
    if (listMatch) {
      const eventName = listMatch[1].replace(/[?]/g, '').trim();
      const students = await Students.find({ eventName: new RegExp(`^${eventName}$`, 'i') }).lean<IStudent[]>();

      if (students.length === 0) {
        return { message: `No students have registered for "${eventName}" yet.` };
      }
      const studentNames = students.map(s => s.name).join(', ');
      return { message: `The following students registered for ${eventName}: ${studentNames}.` };
    }

    // Default response if no intent is matched
    return { message: "I'm sorry, I can't answer that question yet. You can ask me things like 'Did John Doe attend Startup School?' or 'Who registered for the Web Dev Workshop?'." };

  } catch (error) {
    console.error("Chatbot action error:", error);
    return { message: "I encountered an error while processing your request. Please try again." };
  }
}