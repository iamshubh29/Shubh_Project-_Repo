export const EventPosterEmailTemplate = (
    userName: string,
    eventName: string,
    eventDate: string,
    qrUrl: string
  ) => {
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUrl)}&size=200x200&margin=10`;
    const formattedDate = new Date(eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #030712; }
          .container { max-width: 600px; margin: 40px auto; background-color: #111827; border-radius: 12px; color: #f9fafb; border: 1px solid #374151; }
          .header { text-align: center; padding: 40px 20px; }
          .logo { width: 80px; height: 80px; margin-bottom: 16px; }
          .subtitle { font-size: 16px; color: #93c5fd; font-weight: 600; letter-spacing: 1px; }
          .title { font-size: 36px; font-weight: 800; margin: 8px 0; }
          .content { padding: 0 40px 30px; text-align: center; }
          .description { font-size: 18px; color: #d1d5db; line-height: 1.6; }
          .details { margin: 30px 0; font-size: 16px; color: #d1d5db; }
          .qr-section { padding: 30px 20px; background-color: #1f2937; border-radius: 0 0 12px 12px; }
          .qr-text { font-size: 16px; margin-bottom: 20px; }
          .qr-code { border-radius: 8px; background-color: white; padding: 15px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://res.cloudinary.com/dzk5x7rjz/image/upload/v1744756604/RTU_logo_me4bn1.png" alt="RTU Logo" class="logo">
            <p class="subtitle">REGISTRATION CONFIRMATION</p>
            <h1 class="title">${eventName}</h1>
          </div>
          <div class="content">
            <p class="description">
              Hello <strong>${userName}</strong>, you are successfully registered!
            </p>
            <div class="details">
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Venue:</strong> RTU Campus, Kota</p>
            </div>
          </div>
          <div class="qr-section">
            <p class="qr-text">Present this QR Code at the event for your attendance.</p>
            <div class="qr-code">
              <img src="${qrImageUrl}" alt="QR Code" style="width: 200px; height: 200px;">
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };