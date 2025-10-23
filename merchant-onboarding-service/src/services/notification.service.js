import nodemailer from 'nodemailer';
import { getConfig } from '../config/index.js';
import { getPool } from '../config/database.js';

export class NotificationService {
  static transporter = null;

  /**
   * Initialize email transporter
   */
  static initializeTransporter() {
    if (this.transporter) return this.transporter;

    const { email } = getConfig();
    
    this.transporter = nodemailer.createTransporter({
      host: email.host,
      port: email.port,
      secure: email.secure,
      auth: {
        user: email.user,
        pass: email.password
      }
    });

    return this.transporter;
  }

  /**
   * Send application submitted notification
   */
  static async sendApplicationSubmittedNotification(application) {
    const { businessName, contactPerson, email } = application;
    
    const subject = 'Merchant Application Submitted - Fluence Pay';
    const message = `
      Dear ${contactPerson},
      
      Thank you for submitting your merchant application for ${businessName}.
      
      Your application has been received and is currently under review. Our team will review your application within 48 hours.
      
      Application Details:
      - Business Name: ${businessName}
      - Contact Person: ${contactPerson}
      - Email: ${email}
      - Status: Pending Review
      
      You will receive an email notification once your application has been reviewed.
      
      If you have any questions, please contact our support team.
      
      Best regards,
      Fluence Pay Team
    `;

    return await this.sendEmail(email, subject, message, 'application_submitted', application.id);
  }

  /**
   * Send application approved notification
   */
  static async sendApplicationApprovedNotification(application) {
    const { businessName, contactPerson, email } = application;
    
    const subject = 'Merchant Application Approved - Fluence Pay';
    const message = `
      Dear ${contactPerson},
      
      Congratulations! Your merchant application for ${businessName} has been approved.
      
      Your merchant profile has been created and you can now:
      - Access the merchant dashboard
      - Configure your cashback campaigns
      - Manage your budget and settings
      
      Next Steps:
      1. Log in to your merchant account
      2. Complete your profile setup
      3. Configure your first cashback campaign
      
      If you have any questions, please contact our support team.
      
      Welcome to Fluence Pay!
      
      Best regards,
      Fluence Pay Team
    `;

    return await this.sendEmail(email, subject, message, 'application_approved', application.id);
  }

  /**
   * Send application rejected notification
   */
  static async sendApplicationRejectedNotification(application, rejectionReason) {
    const { businessName, contactPerson, email } = application;
    
    const subject = 'Merchant Application Update - Fluence Pay';
    const message = `
      Dear ${contactPerson},
      
      Thank you for your interest in joining Fluence Pay as a merchant.
      
      After careful review, we regret to inform you that your application for ${businessName} has not been approved at this time.
      
      Reason for rejection:
      ${rejectionReason || 'Please contact our support team for more details.'}
      
      You are welcome to reapply in the future if your circumstances change or if you can address the concerns mentioned above.
      
      If you have any questions or would like to discuss this decision, please contact our support team.
      
      Best regards,
      Fluence Pay Team
    `;

    return await this.sendEmail(email, subject, message, 'application_rejected', application.id);
  }

  /**
   * Send SLA reminder notification to admin
   */
  static async sendSlaReminderNotification(application) {
    const { businessName, contactPerson, email, submittedAt } = application;
    
    const subject = 'URGENT: Merchant Application SLA Reminder - Fluence Pay';
    const message = `
      Admin Alert: SLA Reminder
      
      A merchant application is approaching the 48-hour SLA deadline.
      
      Application Details:
      - Business Name: ${businessName}
      - Contact Person: ${contactPerson}
      - Email: ${email}
      - Submitted: ${new Date(submittedAt).toLocaleString()}
      - Hours Pending: ${Math.round((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60))} hours
      
      Please review and process this application immediately to maintain our SLA commitment.
      
      Application ID: ${application.id}
      
      Best regards,
      Fluence Pay System
    `;

    // Send to admin email (configure in environment)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@fluencepay.com';
    return await this.sendEmail(adminEmail, subject, message, 'sla_reminder', application.id);
  }

  /**
   * Send generic email
   */
  static async sendEmail(recipient, subject, message, notificationType, referenceId) {
    try {
      const transporter = this.initializeTransporter();
      
      const mailOptions = {
        from: getConfig().email.from,
        to: recipient,
        subject: subject,
        text: message,
        html: this.formatHtmlMessage(message)
      };

      const result = await transporter.sendMail(mailOptions);
      
      // Log notification
      await this.logNotification({
        notificationType,
        recipientEmail: recipient,
        subject,
        message,
        status: 'sent',
        sentAt: new Date(),
        referenceId
      });

      return result;
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Log failed notification
      await this.logNotification({
        notificationType,
        recipientEmail: recipient,
        subject,
        message,
        status: 'failed',
        errorMessage: error.message,
        referenceId
      });

      throw error;
    }
  }

  /**
   * Format plain text message to HTML
   */
  static formatHtmlMessage(textMessage) {
    return textMessage
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  /**
   * Log notification to database
   */
  static async logNotification(notificationData) {
    const pool = getPool();
    const {
      notificationType,
      recipientEmail,
      subject,
      message,
      status,
      sentAt,
      deliveredAt,
      errorMessage,
      referenceId
    } = notificationData;

    try {
      await pool.query(
        `INSERT INTO notification_log (
          application_id, notification_type, recipient_email, subject, message,
          status, sent_at, delivered_at, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          referenceId, notificationType, recipientEmail, subject, message,
          status, sentAt, deliveredAt, errorMessage
        ]
      );
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  /**
   * Get notification history
   */
  static async getNotificationHistory(applicationId, limit = 50, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM notification_log 
       WHERE application_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [applicationId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
         notification_type,
         status,
         COUNT(*) as count
       FROM notification_log 
       GROUP BY notification_type, status
       ORDER BY notification_type, status`
    );
    return result.rows;
  }

  /**
   * Send test email
   */
  static async sendTestEmail(recipient) {
    const subject = 'Test Email - Fluence Pay Merchant Service';
    const message = `
      This is a test email from the Fluence Pay Merchant Onboarding Service.
      
      If you received this email, the notification system is working correctly.
      
      Sent at: ${new Date().toLocaleString()}
      
      Best regards,
      Fluence Pay System
    `;

    return await this.sendEmail(recipient, subject, message, 'test', null);
  }
}
