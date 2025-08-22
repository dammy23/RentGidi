const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    console.log('EmailService: Initializing email service');

    // Create transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration (e.g., SendGrid, AWS SES, etc.)
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
    } else {
      // Development - use Ethereal Email for testing
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: process.env.EMAIL_PORT || 587,
        auth: {
          user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
          pass: process.env.EMAIL_PASS || 'ethereal.pass'
        }
      });
    }

    console.log('EmailService: Email service initialized');
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    console.log('EmailService: Sending email to:', to, 'subject:', subject);

    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'RentBridge <noreply@rentbridge.com>',
        to,
        subject,
        html: htmlContent,
        text: textContent || this.htmlToText(htmlContent)
      };

      const result = await this.transporter.sendMail(mailOptions);

      console.log('EmailService: Email sent successfully, messageId:', result.messageId);

      // In development, log the preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('EmailService: Preview URL:', nodemailer.getTestMessageUrl(result));
      }

      return result;
    } catch (error) {
      console.error('EmailService: Error sending email:', error);
      throw error;
    }
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  async sendNotificationEmail(userEmail, title, message, actionUrl = null) {
    const subject = `RentBridge: ${title}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">RentBridge</h2>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1e293b; margin-top: 0;">${title}</h3>
          <p style="color: #475569; line-height: 1.6;">${message}</p>
        </div>
        ${actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Details
            </a>
          </div>
        ` : ''}
        <div style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px;">
          <p>This is an automated notification from RentBridge. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(userEmail, subject, htmlContent);
  }
}

// Export singleton instance
const emailService = new EmailService();

module.exports = {
  sendEmail: (to, subject, htmlContent, textContent) =>
    emailService.sendEmail(to, subject, htmlContent, textContent),
  sendNotificationEmail: (userEmail, title, message, actionUrl) =>
    emailService.sendNotificationEmail(userEmail, title, message, actionUrl)
};