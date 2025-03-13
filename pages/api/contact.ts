// pages/api/contact.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import sgMail from '@sendgrid/mail';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    console.log('Received contact form submission:', req.body);
    
    const { name, email, subject, message } = req.body;

    // Validate the request data
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Set SendGrid API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

    // Create the email
    const msg = {
      to: process.env.EMAIL_TO || 'juszuf_1@icloud.com',
      from: process.env.EMAIL_FROM || 'noreply@yourdomain.com', // Must be a verified sender in SendGrid
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b; border-bottom: 1px solid #f59e0b; padding-bottom: 10px;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 20px;">
            <h3 style="margin-bottom: 10px;">Message:</h3>
            <p style="background-color: #f8f8f8; padding: 15px; border-radius: 4px; white-space: pre-wrap;">${message}</p>
          </div>
          <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            <p>This message was sent from the contact form.</p>
          </div>
        </div>
      `,
    };

    // Send the email
    await sgMail.send(msg);
    
    console.log('Email sent successfully!');
    return res.status(200).json({ message: 'Message sent successfully' });
    
  } catch (error) {
    console.error('Error in contact API:', error);
    
    // Make sure we always return a response even in case of error
    return res.status(500).json({ 
      message: 'Failed to send message',
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}