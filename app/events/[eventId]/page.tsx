"use client";

import { getEventById } from '@/app/actions/events';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, Download, Loader2, MapPin } from 'lucide-react';
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
        backgroundColor: null, 
        scale: 2, // Higher scale for better quality
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

  useEffect(() => {
    const adjustPosterScale = () => {
      const container = document.querySelector<HTMLElement>('.poster-container');
      const poster = document.querySelector<HTMLElement>('.poster-content');
      if (container && poster) {
        const containerWidth = container.offsetWidth;
        const posterWidth = 1080; // The fixed width of your poster design
        const scale = containerWidth / posterWidth;
        poster.style.transform = `scale(${scale})`;
        container.style.height = `${poster.offsetHeight * scale}px`;
      }
    };
    
    window.addEventListener('resize', adjustPosterScale);
    adjustPosterScale();
    const timeoutId = setTimeout(adjustPosterScale, 100);

    return () => {
        window.removeEventListener('resize', adjustPosterScale);
        clearTimeout(timeoutId);
    };
  }, [event]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  if (!event) {
    return notFound();
  }

  return (
    <div className="min-h-screen w-full bg-gray-800 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4 z-20">
        <Link href="/events">
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Events
          </Button>
        </Link>
      </div>
      
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl aspect-[1080/1350] poster-container relative z-10">
        <div 
            ref={posterRef} 
            className="w-[1080px] h-[1350px] bg-gray-900 text-white flex flex-col items-center justify-between p-24 overflow-hidden transform origin-top-left absolute"
            style={{ 
               backgroundImage: `url('/poster-background.png')`, 
               backgroundSize: 'cover', 
               backgroundPosition: 'center',
            }}
        >
          <div className="absolute inset-0 bg-black/60"></div>

          <div className="relative z-10 flex flex-col items-center mt-8">
              <img src="/RTU logo.png" alt="RTU Logo" className="h-40 w-40 mb-8 filter drop-shadow-lg"/>
              <p className="text-4xl font-extrabold text-blue-300 tracking-widest text-center uppercase leading-snug">
                Rajasthan Technical University
              </p>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center px-8">
              <h1 className="text-9xl font-extrabold tracking-tight leading-none mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {event.eventName}
              </h1>
              <p className="text-4xl text-gray-200 leading-relaxed max-w-4xl font-light">
                Join us for this exclusive event to connect talent with opportunity.
              </p>
          </div>
          
          <div className="relative z-10 flex flex-col items-center text-3xl font-semibold gap-6">
              <div className="flex items-center gap-4">
                  <Calendar className="h-9 w-9 text-blue-300" />
                  <span>{format(new Date(event.eventDate), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-4">
                  <MapPin className="h-9 w-9 text-blue-300" />
                  <span>RTU Campus, Kota</span>
              </div>
          </div>

          <div className="relative z-10 flex flex-col items-center mt-auto mb-12">
            <p className="text-3xl text-gray-300 font-medium mb-4">Scan to Register</p>
            {registrationUrl && (
              <div className="bg-white p-4 rounded-lg">
                <QRCode 
                  value={registrationUrl} 
                  size={220} 
                  level="H" 
                  includeMargin={true} 
                  bgColor="#ffffff" 
                  fgColor="#000000"
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 z-20">
        <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-200 text-lg font-bold py-6 px-10" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Download className="mr-2 h-5 w-5" />}
          Download Poster
        </Button>
        <Link href={`/student-register?eventId=${event._id}`}>
          <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-gray-900 text-lg font-bold py-6 px-10">
            Register for this Event
          </Button>
        </Link>
      </div>
    </div>
  );
}