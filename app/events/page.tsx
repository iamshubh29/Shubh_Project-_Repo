// File: app/events/page.tsx

"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getEvents } from '@/app/actions/events';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Define the shape of your event object for TypeScript
type EventType = {
  _id: string;
  eventName: string;
  eventDate: string;
  motive: string;
};

export default function EventsListPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const fetchedEvents = await getEvents();
        if (fetchedEvents) {
          setEvents(fetchedEvents);
        } else {
          toast.error("Could not load events.");
        }
      } catch (error) {
        console.error("Failed to fetch events", error);
        toast.error("An error occurred while fetching events.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-4 text-lg">Loading Events...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white">
      <header className="sticky top-0 w-full bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center p-4">
          <h1 className="text-2xl font-bold">Upcoming Events</h1>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-6 sm:p-8">
        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <Card key={event._id} className="bg-gray-800 border-gray-700 text-white flex flex-col hover:border-blue-500 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold tracking-tight">{event.eventName}</CardTitle>
                  <CardDescription className="text-gray-400">{event.motive}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    <span>{format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/events/${event._id}`} className="w-full">
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold">
                      View Details & Register
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-3xl font-semibold text-gray-400">No Events Found</h2>
            <p className="text-gray-500 mt-2">Please check back later for upcoming events.</p>
          </div>
        )}
      </main>
    </div>
  );
}