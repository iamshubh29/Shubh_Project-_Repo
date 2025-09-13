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
 * Generates a clean, professional poster image on the server.
 */
export async function generatePosterAction(eventId: string) {
    // This function is correct and remains unchanged.
    try {
        await connectToDatabase();
        const event = await Event.findById(eventId).lean<IEvent>();
        if (!event) return { success: false, error: 'Event not found' };

        const fontBoldUri = await toBase64Uri(path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'), 'font/ttf');
        const fontRegularUri = await toBase64Uri(path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'), 'font/ttf');
        const logoUri = await toBase64Uri(path.join(process.cwd(), 'public', 'RTU logo.png'), 'image/png');

        const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}`;
        const qrCodeBuffer = await qrcode.toBuffer(registrationUrl, { width: 300, margin: 2 });
        const qrCodeUri = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;
        
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
            <text x="540" y="620" class="details">🗓️ ${new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</text>
            <text x="540" y="670" class="details">📍 RTU Campus, Kota</text>
            ${event.registrationFee ? `<text x="540" y="720" class="details">🎟️ Fee: ${event.registrationFee}</text>` : ''}
            <text x="540" y="880" class="details">Scan to Register</text>
            <image href="${qrCodeUri}" x="380" y="920" height="300" width="300"/>
        </svg>`;
        const svgBuffer = Buffer.from(svgLayout);

        const outputBuffer = await sharp({
            create: { width: 1080, height: 1350, channels: 4, background: { r: 17, g: 24, b: 39 } }
        })
        .composite([{ input: svgBuffer, top: 0, left: 0 }])
        .png()
        .toBuffer();

        const posterUrl = `data:image/png;base64,${outputBuffer.toString('base64')}`;
        return { success: true, posterUrl, event: JSON.parse(JSON.stringify(event)) };

    } catch (error: any) {
        console.error('Error generating poster:', error);
        return { success: false, error: 'Poster generation failed. Please ensure font files exist in /public/fonts.' };
    }
}


/**
 * UPDATED AND CORRECTED
 * Generates and sends PDF certificates to all students who have marked attendance for a specific event.
 */
export async function generateAndSendCertificatesAction(eventId: string) {
    console.log(`[1/5] Starting certificate generation process for event ID: ${eventId}`);
    try {
        await connectToDatabase();
        const event = await Event.findById(eventId).lean<IEvent>();
        if (!event) {
            console.error("Certificate generation failed: Event not found.");
            return { success: false, error: 'Event not found' };
        }

        const eventDate = new Date(event.eventDate);
        eventDate.setHours(0, 0, 0, 0);
        
        const attendedStudents = await Students.find({
            eventName: event.eventName,
            'attendance.date': {
                $gte: eventDate,
                $lt: new Date(eventDate.getTime() + 24 * 60 * 60 * 1000)
            }
        }).lean<IStudent[]>();

        console.log(`[2/5] Found ${attendedStudents.length} student(s) with attendance.`);

        if (attendedStudents.length === 0) {
            return { success: true, message: 'No students with attendance found for this event. No certificates were sent.' };
        }

        console.log("[3/5] Loading certificate template and font files...");
        const templatePath = path.join(process.cwd(), 'public', 'certificate-template.png');
        const templateBuffer = await fs.readFile(templatePath);
        const fontBoldUri = await toBase64Uri(path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf'), 'font/ttf');
        const fontRegularUri = await toBase64Uri(path.join(process.cwd(), 'public', 'fonts', 'Inter-Regular.ttf'), 'font/ttf');
        console.log("Template and fonts loaded successfully.");

        let sentCount = 0;
        for (const student of attendedStudents) {
            console.log(`[4/5] Generating certificate for: ${student.name} (${student.email})`);
            
            const certificateTextSvg = `
            <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
                <style>
                    @font-face { font-family: 'Inter'; src: url("${fontRegularUri}"); font-weight: normal; }
                    @font-face { font-family: 'Inter'; src: url("${fontBoldUri}"); font-weight: bold; }
                    .name { fill: #1E293B; font-size: 52px; font-weight: bold; font-family: 'Inter', sans-serif; text-anchor: middle; }
                    .event { fill: #475569; font-size: 24px; font-family: 'Inter', sans-serif; text-anchor: middle; }
                </style>
                <text x="600" y="420" class="name">${student.name}</text>
                <text x="600" y="510" class="event">for successfully participating in the event</text>
                <text x="600" y="550" class="event">${event.eventName}</text>
            </svg>
            `;

            // --- FIX FOR RUNTIME ERROR ---
            // Resize the template to 1200x800, then composite the text SVG on top.
            const certificateImageBuffer = await sharp(templateBuffer)
                .resize(1200, 800) 
                .composite([{ input: Buffer.from(certificateTextSvg) }])
                .png()
                .toBuffer();

            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([1200, 800]);
            
            // --- FIX FOR TYPESCRIPT ERROR ---
            // Explicitly convert the Buffer to a Uint8Array for pdf-lib
            const pngImage = await pdfDoc.embedPng(new Uint8Array(certificateImageBuffer));
            page.drawImage(pngImage, { x: 0, y: 0, width: 1200, height: 800 });

            const pdfBytes = await pdfDoc.save();

            await sendMail({
                to: student.email,
                subject: `Your Certificate for ${event.eventName}`,
                html: `
                    <p>Dear ${student.name},</p>
                    <p><strong>Thank you for attending the ${event.eventName} session!</strong> We appreciate your participation and hope you found it valuable.</p>
                    <p>Please find your certificate of participation attached to this email.</p>
                    <p>Best Regards,<br/>The Event Team</p>
                `,
                attachments: [{
                    filename: `Certificate_${event.eventName.replace(/ /g, '_')}.pdf`,
                    content: Buffer.from(pdfBytes),
                    contentType: 'application/pdf',
                }],
            });
            sentCount++;
            console.log(`✅ Email sent to ${student.email}`);
        }

        console.log(`[5/5] Process complete. Sent ${sentCount} certificates successfully!`);
        return { success: true, message: `Sent ${sentCount} certificates successfully!` };

    } catch (error: any) {
        console.error('❌ Error sending certificates:', error);
        return { success: false, error: 'Certificate generation failed. Check the server terminal for detailed logs.' };
    }
}