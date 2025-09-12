'use server';

import { connectToDatabase } from '@/lib/db';
import Event, { IEvent } from '@/models/Event';
import Students, { IStudent } from '@/models/Students';
import { sendMail } from '@/lib/email';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import qrcode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';
import { Buffer } from 'buffer';

const toBase64Uri = async (filePath: string, mimeType: string) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    return `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
  } catch (error) {
    console.error(`Error reading file for Base64 conversion: ${filePath}`, error);
    throw new Error(`Could not read file: ${filePath}`);
  }
};

/**
 * NEW: Generates a clean, professional poster image on the server.
 */
export async function generatePosterAction(eventId: string) {
  try {
    await connectToDatabase();
    const event = await Event.findById(eventId).lean<IEvent>();
    if (!event) return { success: false, error: 'Event not found' };

    // --- Asset Paths ---
    const fontBoldUri = await toBase64Uri(path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'), 'font/ttf');
    const fontRegularUri = await toBase64Uri(path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'), 'font/ttf');
    const logoUri = await toBase64Uri(path.join(process.cwd(), 'public', 'RTU logo.png'), 'image/png');

    // --- QR Code for REGISTRATION ---
    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}`;
    const qrCodeBuffer = await qrcode.toBuffer(registrationUrl, { width: 300, margin: 2 });
    const qrCodeUri = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;
    
    // --- Dynamic SVG Layout for the Poster ---
    const svgLayout = `
    <svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
      <style>
        @font-face { font-family: 'Inter'; src: url("${fontRegularUri}"); font-weight: normal; }
        @font-face { font-family: 'Inter'; src: url("${fontBoldUri}"); font-weight: bold; }
        .title { font-family: 'Inter', sans-serif; font-size: 100px; font-weight: bold; fill: white; text-anchor: middle; }
        .subtitle { font-family: 'Inter', sans-serif; font-size: 30px; fill: #60a5fa; text-anchor: middle; letter-spacing: 1px; }
        .details { font-family: 'Inter', sans-serif; font-size: 32px; fill: #e5e7eb; text-anchor: middle; }
        .motive { font-family: 'Inter', sans-serif; font-size: 40px; fill: #d1d5db; text-anchor: middle; }
      </style>

      <image href="${logoUri}" x="480" y="100" height="120" width="120"/>
      <text x="540" y="280" class="subtitle">RAJASTHAN TECHNICAL UNIVERSITY, KOTA</text>
      
      <text x="540" y="420" class="title">${event.eventName}</text>

      <text x="540" y="520" class="motive">${event.motive}</text>
      
      <text x="540" y="620" class="details">
        🗓️ ${new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </text>
      <text x="540" y="670" class="details">
        📍 RTU Campus, Kota
      </text>
      ${event.registrationFee ? `<text x="540" y="720" class="details">🎟️ Fee: ${event.registrationFee}</text>` : ''}

      <text x="540" y="880" class="details">Scan to Register</text>
      <image href="${qrCodeUri}" x="380" y="920" height="300" width="300"/>
    </svg>
    `;
    const svgBuffer = Buffer.from(svgLayout);

    // --- Use Sharp to create a background and composite the SVG layout ---
    const outputBuffer = await sharp({
        create: {
            width: 1080,
            height: 1350,
            channels: 4,
            background: { r: 17, g: 24, b: 39 } // This is a dark blue-gray (Tailwind gray-900)
        }
    })
    .composite([{ input: svgBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();

    const posterUrl = `data:image/png;base64,${outputBuffer.toString('base64')}`;
    
    return { success: true, posterUrl: posterUrl };

  } catch (error: any) {
    console.error('Error generating poster:', error);
    return { success: false, error: 'Poster generation failed. Please ensure font files exist in /public/fonts.' };
  }
}


/**
 * Generates and sends PDF certificates to all students who have marked attendance for a specific event.
 */
// This function remains unchanged as it is for certificates, not posters.
export async function generateAndSendCertificatesAction(eventId: string) {
    try {
        await connectToDatabase();
        const event = await Event.findById(eventId).lean<IEvent>();
        if (!event) return { success: false, error: 'Event not found' };

        const eventDate = new Date(event.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        
        const attendedStudents = await Students.find({
        eventName: event.eventName,
        'attendance.date': {
            $gte: eventDate,
            $lt: new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)
        }
        }).lean<IStudent[]>();

        if (attendedStudents.length === 0) {
        return { success: false, error: 'No students with attendance found for this event.' };
        }

        const templatePath = path.join(process.cwd(), 'public', 'certificate-template.png');
        const templateBuffer = await fs.readFile(templatePath);
        const fontBoldUri = await toBase64Uri(path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'), 'font/ttf');
        const fontRegularUri = await toBase64Uri(path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'), 'font/ttf');

        let sentCount = 0;
        for (const student of attendedStudents) {
        const certificateTextSvg = `
        <svg width="1200" height="800">
            <style>
            @font-face { font-family: 'Inter'; src: url("${fontRegularUri}"); font-weight: normal; }
            @font-face { font-family: 'Inter'; src: url("${fontBoldUri}"); font-weight: bold; }
            .name { fill: #000000; font-size: 48px; font-weight: bold; font-family: 'Inter', serif; text-anchor: middle; }
            .event { fill: #333333; font-size: 28px; font-style: italic; font-family: 'Inter', sans-serif; text-anchor: middle; }
            .date { fill: #555555; font-size: 20px; font-family: 'Inter', sans-serif; text-anchor: middle; }
            </style>
            <text x="600" y="380" class="name">${student.name}</text>
            <text x="600" y="480" class="event">For successfully participating in ${event.eventName}</text>
            <text x="600" y="540" class="date">Held on ${new Date(event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</text>
        </svg>
        `;
        const certificateImageBuffer = await sharp(templateBuffer)
            .composite([{ input: Buffer.from(certificateTextSvg) }])
            .png()
            .toBuffer();

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([1200, 800]);
        
        const pngImage = await pdfDoc.embedPng(new Uint8Array(certificateImageBuffer));
        page.drawImage(pngImage, { x: 0, y: 0, width: 1200, height: 800 });

        const pdfBytes = await pdfDoc.save();

        await sendMail({
            to: student.email,
            subject: `Your Certificate for ${event.eventName}`,
            html: `<p>Dear ${student.name},<br/><br/>Thank you for your participation. Please find your certificate attached.</p>`,
            attachments: [
            {
                filename: `Certificate_${student.name.replace(/ /g, '_')}.pdf`,
                content: Buffer.from(pdfBytes),
                contentType: 'application/pdf',
            },
            ],
        });
        sentCount++;
        }

        return { success: true, message: `Sent ${sentCount} certificates successfully!` };

    } catch (error: any) {
        console.error('Error sending certificates:', error);
        return { success: false, error: 'Certificate generation failed. Check if template and font files exist.' };
    }
}