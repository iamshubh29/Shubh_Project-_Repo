"use client";

import { getEventById } from '@/app/actions/events';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Download, Loader2, MapPin, Ticket } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode.react';

type EventType = {
  _id: string;
  eventName: string;
  eventDate: string;
  motive: string;
  registrationFee?: string;
};

export default function EventDetailPage({ params }: { params: { eventId: string } }) {
  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const posterRef = useRef<HTMLDivElement>(null);
  const registrationUrl = event ? `${process.env.NEXT_PUBLIC_APP_URL}/student-register?eventId=${event._id}` : '';

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const fetchedEvent = await getEventById(params.eventId);
        setEvent(fetchedEvent);
      } catch (error) {
        console.error("Failed to fetch event", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [params.eventId]);
  
  const handleDownload = async () => {
    if (!posterRef.current || !event) return;

    setIsDownloading(true);
    toast.info("Generating poster, please wait...");
    try {
      const canvas = await html2canvas(posterRef.current, {
        useCORS: true,
        backgroundColor: '#1f2937', // This is Tailwind's gray-800
        scale: 2,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${event.eventName.replace(/ /g, '_')}_poster.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Poster download started!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Could not download poster.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!event) {
    return notFound();
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white">
      {/* --- STICKY HEADER WITH ACTION BUTTONS --- */}
      <header className="sticky top-0 w-full bg-gray-900/80 backdrop-blur-md z-50 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 p-4">
          <Link href="/events">
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              All Events
            </Button>
          </Link>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="text-white border-white/50 hover:bg-white hover:text-gray-900 w-full"
              onClick={handleDownload} 
              disabled={isDownloading}
            >
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Download Poster
            </Button>
            <Link href={`/student-register?eventId=${event._id}`} className="w-full">
              <Button size="default" className="bg-blue-600 hover:bg-blue-500 text-white font-bold w-full">
                Register for this Event
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* --- MAIN POSTER DISPLAY AREA --- */}
      <main className="flex justify-center w-full p-6 sm:p-8 md:p-12">
        <div 
            ref={posterRef} 
            className="bg-gray-800 border border-gray-700 rounded-2xl p-10 text-center shadow-2xl w-full max-w-2xl flex flex-col items-center gap-6 animate-fade-in duration-500"
        >
          <div className="flex flex-col items-center gap-3">
            <img src="/RTU logo.png" alt="RTU Logo" className="h-20 w-20" />
            <p className="text-md font-semibold text-blue-400 tracking-widest">
              RAJASTHAN TECHNICAL UNIVERSITY
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
              {event.eventName}
            </h1>
            <p className="text-lg text-gray-300 max-w-xl mx-auto">
              {event.motive}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-3 text-md text-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-400" />
              <span>{format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-400" />
              <span>RTU Campus, Kota</span>
            </div>
            {event.registrationFee && (
                <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-blue-400" />
                    <span>Fee: {event.registrationFee}</span>
                </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 pt-6 border-t border-gray-700 w-full">
            <p className="text-md font-semibold text-gray-300">Scan to Register</p>
            <div className="bg-white p-3 rounded-lg shadow-md">
                <QRCode 
                  value={registrationUrl} 
                  size={180} 
                  level="H" 
                  includeMargin={true} 
                  bgColor="#ffffff" 
                  fgColor="#000000"
                />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}