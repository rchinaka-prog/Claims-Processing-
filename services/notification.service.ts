import { SocketService } from './socket.service';
import { eventBus, AppEvents } from '../events/eventBus';
import twilio from 'twilio';
import { Resend } from 'resend';

export class NotificationService {
  private static twilioClient: any = null;
  private static resendClient: Resend | null = null;

  static init() {
    // Initialize clients lazily or here
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const resendKey = process.env.RESEND_API_KEY;

    if (twilioSid && twilioAuth) {
      this.twilioClient = twilio(twilioSid, twilioAuth);
    }

    if (resendKey) {
      this.resendClient = new Resend(resendKey);
    }

    eventBus.on(AppEvents.CLAIM_UPDATED, (data) => {
      const { full, updates } = data;
      if (updates && updates.status) {
        this.sendStatusUpdateNotifications(full);
      }
    });

    eventBus.on(AppEvents.CLAIM_CREATED, (data) => {
      // Optional: Notify on creation
    });
  }

  static async sendStatusUpdateNotifications(claim: any) {
    const { owner, phone, id, status, email } = claim;
    
    const targetEmail = email || claim.owner_email; // Fallback if email is in claim object
    
    // 1. Send Email
    if (targetEmail) {
      await this.sendEmail(targetEmail, `Claim Status Update: ${id}`, `Your claim ${id} status has been updated to: ${status}.`);
    }
    
    // 2. Send SMS
    if (phone) {
      await this.sendSms(phone, `AIMS: Your claim ${id} is now ${status}. Check your dashboard for details.`);
    }
  }

  static async sendEmail(to: string, subject: string, body: string) {
    if (!this.resendClient) {
      console.warn(`[AIMS] Resend API Key missing. Email to ${to} not sent. Body: ${body}`);
      return;
    }

    try {
      await this.resendClient.emails.send({
        from: 'AIMS Notifications <notifications@resend.dev>', // Use verified domain in production
        to: [to],
        subject: subject,
        text: body,
      });
      console.log(`[AIMS] Real Email dispatched to ${to}`);
    } catch (error) {
      console.error(`[AIMS] Failed to send email to ${to}:`, error);
    }
  }

  static async sendSms(to: string, message: string) {
    if (!this.twilioClient) {
      console.warn(`[AIMS] Twilio Credentials missing. SMS to ${to} not sent. Message: ${message}`);
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to,
      });
      console.log(`[AIMS] Real SMS dispatched to ${to}`);
    } catch (error) {
      console.error(`[AIMS] Failed to send SMS to ${to}:`, error);
    }
  }

  static async sendSmsOtp(phoneNumber: string, claimId: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    await this.sendSms(phoneNumber, `AIMS Sync Code: ${otp}`);
    
    // Broadcast to connected sockets for the simulator
    SocketService.emitToClaim(claimId, "otp-received", { claimId, phoneNumber, otp });
    
    return otp;
  }
}
