"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner"; // UPDATED: This now uses the correct 'sonner' toast library
import { getEvents, RemainerStudents } from "@/app/actions/events";

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
}

export default function SendReminderPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await getEvents();
      setEvents(res || []);
    } catch (error) {
      toast.error("Failed to fetch events"); // Corrected toast call
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReminder(eventId: string) {
    setSending(eventId);
    try {
      const res = await RemainerStudents(eventId);
      if (res?.success) {
        toast.success(res.message || "Reminder emails sent successfully!"); // Corrected toast call
      } else {
        toast.error(res?.message || "Failed to send reminder emails"); // Corrected toast call
      }
    } catch (error) {
      toast.error("Something went wrong while sending reminders"); // Corrected toast call
    } finally {
      setSending(null);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="sticky top-0 w-full bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/RTU logo.png" alt="Logo" className="h-9 w-9" />
            <h1 className="text-xl font-bold">Event Reminders</h1>
          </div>
          <Link href="/admin/scanner">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold mb-2">Send Event Reminders</h2>
            <p className="text-gray-400">
              Select an event to send a reminder email to all registered students.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500" /></div>
          ) : events.length === 0 ? (
            <Alert className="bg-gray-800 border-gray-700">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                No events found. Create an event on the dashboard before sending reminders.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event._id} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle>{event.eventName}</CardTitle>
                    <CardDescription>
                      Scheduled for {formatDate(event.eventDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleSendReminder(event._id)}
                      disabled={!!sending}
                      className="w-full sm:w-auto bg-orange-600 hover:bg-orange-500 text-white"
                    >
                      {sending === event._id ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Sending...</>
                      ) : (
                        <><Mail className="h-4 w-4 mr-2" /> Send Reminder to All</>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}