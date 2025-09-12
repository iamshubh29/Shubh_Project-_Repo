export const reminderEmailTemplate = (
    userName: string,
    eventName: string,
    venue: string,
    time: string
  ) => {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f6f9fc; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <img 
            src="https://res.cloudinary.com/dzk5x7rjz/image/upload/v1744756604/RTU_logo_me4bn1.png" 
            alt="RTU Logo" 
            style="width: 100px; margin-bottom: 15px;" 
          />
          <div style="font-size: 14px; color: #7f8c8d; margin-bottom: 25px;">
            Team Event Management System, RTU Kota
          </div>
  
          <h2 style="font-size: 24px; color: #2c3e50; margin-bottom: 20px;">
            ⏰ Event Reminder
          </h2>
  
          <p style="font-size: 16px; color: #2c3e50; margin-bottom: 15px;">
            Hello <strong>${userName}</strong>,
          </p>
          <p style="font-size: 15px; color: #555; margin-bottom: 20px;">
            This is a friendly reminder that you have registered for the event:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h3 style="font-size: 18px; color: #2c3e50; margin: 0 0 10px 0;">
              📅 ${eventName}
            </h3>
            <p style="font-size: 14px; color: #555; margin: 5px 0;">
              <strong>📍 Venue:</strong> ${venue}
            </p>
            <p style="font-size: 14px; color: #555; margin: 5px 0;">
              <strong>🕒 Time:</strong> ${time}
            </p>
          </div>

          <p style="font-size: 14px; color: #555; margin: 20px 0;">
            Please make sure to bring your QR code for quick check-in at the event.
          </p>

          <div style="margin: 20px 0;">
            <a 
              href="https://chat.whatsapp.com/CeM1n0ZrxxH7owou3ywUmI?mode=ac_t" 
              style="
                display: inline-block; 
                padding: 12px 20px;             
                background-color: #25D366; 
                color: white; 
                text-decoration: none; 
                border-radius: 6px;
                font-size: 14px;
                font-weight: bold;
                margin-top: 10px;
              "
              target="_blank"
            >
              📱 Join WhatsApp Group
            </a>
          </div>
  
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
  
          <p style="margin-top: 8px; font-weight: bold; color: #2c3e50;">— Team Event Management System, RTU Kota</p>
          <p style="margin-top: 4px; font-size: 13px; color: #888;">For any queries, contact: <strong>9950156755</strong></p>
        </div>
      </div>
    `;
  }
  