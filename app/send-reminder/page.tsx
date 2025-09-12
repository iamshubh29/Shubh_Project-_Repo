"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getEvents, RemainerStudents } from "@/app/actions/events";

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function SendReminderPage() {
  const { toast } = useToast();
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch events",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSendReminder(eventId: string, eventName: string) {
    setSending(eventId);
    try {
      const res = await RemainerStudents(eventId);
      if (res?.success) {
        toast({
          title: "Success",
          description: res.message || "Reminder emails sent successfully!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: res?.message || "Failed to send reminder emails",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong while sending reminders",
      });
    } finally {
      setSending(null);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src="/RTU logo.png" alt="Logo" className="h-8 w-8" />
            <h1 className="text-xl font-bold">Event Management System</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/admin/scanner">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Send Event Reminders</h2>
            <p className="text-muted-foreground">
              Send reminder emails to all students registered for specific events
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <Alert>
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                No events found. Create an event first to send reminders.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event._id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{event.eventName}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {formatDate(event.eventDate)}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Event scheduled for {formatDate(event.eventDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>Send reminder to all registered students</span>
                      </div>
                      <Button
                        onClick={() => handleSendReminder(event._id, event.eventName)}
                        disabled={sending === event._id}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {sending === event._id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Reminder
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Alert className="mt-8">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> Reminder emails will be sent to all students who have registered for the selected event. 
              The emails include event details, venue information, and a link to join the WhatsApp group.
            </AlertDescription>
          </Alert>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Event Management System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
