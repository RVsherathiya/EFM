import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (env.EMAIL_PROVIDER === 'smtp' && env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
      });
      logger.info(`📧 SMTP Email transporter initialized with host: ${env.SMTP_HOST}`);
    } else {
      logger.info('📧 Email service running in CONSOLE / LOCAL mode (emails will be logged to console & terminal)');
    }
  }

  public async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: env.EMAIL_FROM,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.html.replace(/<[^>]*>?/gm, ''),
        });
        logger.info(`✉️ Email successfully dispatched via SMTP to ${options.to} - Subject: ${options.subject}`);
        return true;
      }

      // Console fallback / Development mode output
      logger.info(`\n================== [ EFM OUTGOING EMAIL ] ==================\n` +
        `To: ${options.to}\n` +
        `From: ${env.EMAIL_FROM}\n` +
        `Subject: ${options.subject}\n` +
        `------------------------------------------------------------\n` +
        `${options.text || options.html.replace(/<[^>]*>?/gm, '')}\n` +
        `============================================================\n`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  public async sendPasswordResetEmail(to: string, recipientName: string, resetUrl: string, token: string): Promise<boolean> {
    const subject = 'Password Reset Request - EFM Enterprise Portal';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 32px 28px; line-height: 1.6; color: #334155; }
    .body h2 { margin-top: 0; font-size: 18px; color: #0f172a; }
    .btn-container { text-align: center; margin: 32px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(79,70,229,0.3); }
    .token-box { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; font-family: monospace; font-size: 13px; word-break: break-all; color: #475569; margin: 16px 0; }
    .footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    .warning { font-size: 12px; color: #e11d48; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>EFM Enterprise</h1>
      <p>Workforce Management & Performance Portal</p>
    </div>
    <div class="body">
      <h2>Hello ${recipientName || 'Employee'},</h2>
      <p>We received an official request to reset the password for your EFM Workspace account associated with <strong>${to}</strong>.</p>
      <p>Click the button below to securely configure a new password. This reset link is active for <strong>30 minutes</strong>:</p>
      
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Workspace Password</a>
      </div>

      <p>If the button above does not work, copy and paste this link into your browser:</p>
      <div class="token-box">${resetUrl}</div>

      <p class="warning">🔒 If you did not request a password reset, please ignore this email or contact your Human Resources Administrator immediately.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} EFM Enterprise. 256-Bit SSL Secured Transmission.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
Hello ${recipientName || 'Employee'},

We received a request to reset the password for your EFM Workspace account (${to}).
Please use the following active link within 30 minutes to set your new password:

${resetUrl}

Reset Token: ${token}

If you did not request this, please ignore this email.
    `;

    return this.sendEmail({ to, subject, html, text });
  }
}

export const emailService = new EmailService();
