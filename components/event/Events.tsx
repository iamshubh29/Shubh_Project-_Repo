"use client";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { createEvent, getEvents, deleteEvent as deleteEventAction, RemainerStudents, getEventAttendance } from "@/app/actions/events";
import { generateAndSendCertificatesAction } from "@/app/actions/generation";
import Link from "next/link";

interface Event {
  _id: string;
  eventName: string;
  eventDate: string;
}

export default function EventManager() {
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [motive, setMotive] = useState("");
  const [registrationFee, setRegistrationFee] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Ref for the file input to reset it after submission
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    const res = await getEvents();
    if (res) {
      setEvents(res);
    } else {
      toast.error("Failed to fetch events");
    }
    setLoading(false);
  }

  // This function now correctly uses FormData
  async function handleCreateEvent(formData: FormData) {
    if (!formData.get("eventName") || !formData.get("eventDate") || !formData.get("motive")) {
      toast.error("Event Name, Date, and Motive are required.");
      return;
    }
    
    // The createEvent action now correctly expects one argument: FormData
    const res = await createEvent(formData);

    if (res?.ok) {
      toast.success("Event created successfully!");
      // Reset form fields
      setEventName("");
      setEventDate("");
      setMotive("");
      setRegistrationFee("");
      if(fileInputRef.current) fileInputRef.current.value = "";
      fetchEvents();
    } else {
      toast.error(res?.error || "Failed to create event");
    }
  }
  
  // ... (handleDeleteEvent, handleSendCertificates, etc. remain unchanged)

  async function handleDeleteEvent(id: string) {
    setActionLoading(`delete-${id}`);
    const res = await deleteEventAction(id);
    if (res?.ok) {
      toast.success("Event deleted successfully!");
      fetchEvents();
    } else {
      toast.error("Failed to delete event");
    }
    setActionLoading(null);
  }
  
  async function handleSendCertificates(id: string) {
    setActionLoading(`cert-${id}`);
    const res = await generateAndSendCertificatesAction(id);
    if (res.success) {
        toast.success(res.message);
    } else {
        toast.error(res.error || "Failed to send certificates");
    }
    setActionLoading(null);
  }

  async function handleReminderEvent(id: string){
    setActionLoading(`reminder-${id}`);
    const res = await RemainerStudents(id)
    if(res?.success){
      toast.success("✅ Reminder emails sent successfully!")
    }else{
      toast.error("❌ Failed to send reminder emails")
    }
    setActionLoading(null);
  }

  function downloadAsCsv(filename: string, rows: any[]) {
    const headers = Object.keys(rows[0] || {});
    const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => escape(r[h])).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleDownloadAttendance(id: string) {
    setActionLoading(`download-${id}`);
    try {
      const res = await getEventAttendance(id);
      if (!res?.ok || !res.rows || res.rows.length === 0) {
        toast.info(res?.error || 'No student data for this event');
        return;
      }
      const filename = `${res.eventName.replace(/[^a-z0-9-_]+/gi, '_')}_attendance.csv`;
      downloadAsCsv(filename, res.rows);
    } catch (e) {
      toast.error('Failed to download');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Tabs defaultValue="create" className="w-full mb-10">
      <TabsList className="mb-4">
        <TabsTrigger value="create">New Event</TabsTrigger>
        <TabsTrigger value="list">All Events</TabsTrigger>
      </TabsList>

      <TabsContent value="create">
        <Card>
          {/* This form now correctly includes the file input */}
          <form action={handleCreateEvent}>
            <CardContent className="space-y-4 p-4">
              <Input name="eventName" placeholder="Event Name (e.g., 'Startup School 5.0')" value={eventName} onChange={(e) => setEventName(e.target.value)} required />
              <Input name="motive" placeholder="Event Motive / Description" value={motive} onChange={(e) => setMotive(e.target.value)} required />
              <Input name="eventDate" placeholder="Event Date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} type="date" required />
              <Input name="registrationFee" placeholder="Registration Fee (e.g., 'Free' or '₹100')" value={registrationFee} onChange={(e) => setRegistrationFee(e.target.value)} />
              
              {/* ✨ ADDED THIS SECTION FOR FILE UPLOAD ✨ */}
              <div>
                <label className="text-sm font-medium">Certificate Template (Optional)</label>
                <Input name="certificateTemplate" type="file" accept="image/png, image/jpeg" ref={fileInputRef} className="mt-1"/>
                <p className="text-xs text-muted-foreground mt-1">Upload a PNG or JPG. If not provided, the default template will be used.</p>
              </div>
              
              <Button type="submit">Create Event</Button>
            </CardContent>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="list">
        <ScrollArea className="h-[400px] w-full">
          <div className="space-y-4">
            {loading ? <p>Loading...</p> : events.map((event) => (
              <Card key={event._id}>
                <CardContent className="p-4 space-y-2">
                  <h3 className="text-lg font-semibold">{event.eventName}</h3>
                  <p className="text-sm">Date: {new Date(event.eventDate).toLocaleDateString()}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Link href={`/events/${event._id}`} target="_blank"><Button variant="outline">View Poster</Button></Link>
                    <Button variant="outline" onClick={() => handleDownloadAttendance(event._id)} disabled={!!actionLoading}>Download Attendance</Button>
                    <Button onClick={() => handleSendCertificates(event._id)} disabled={!!actionLoading}>Send Certificates</Button>
                    <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleReminderEvent(event._id)} disabled={!!actionLoading}>Send Reminder</Button>
                    <Button variant="destructive" onClick={() => handleDeleteEvent(event._id)} disabled={!!actionLoading}>Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}