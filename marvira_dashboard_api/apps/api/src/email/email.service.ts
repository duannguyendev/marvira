import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.config.get('SMTP_PORT', '587'), 10),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    }
  }

  async sendPasswordResetEmail(to: string, resetUrl: string, userName: string): Promise<void> {
    const from = this.config.get('SMTP_FROM', 'Marvira <noreply@marvira.com>');
    const subject = 'Reset your Marvira password';
    const text = [
      `Hi ${userName},`,
      '',
      'We received a request to reset your password.',
      'Click the link below to choose a new password:',
      '',
      resetUrl,
      '',
      'This link expires in 1 hour. If you did not request a reset, you can ignore this email.',
    ].join('\n');

    const html = `
      <p>Hi ${this.escapeHtml(userName)},</p>
      <p>We received a request to reset your password.</p>
      <p><a href="${this.escapeHtml(resetUrl)}">Reset your password</a></p>
      <p>Or copy this link into your browser:</p>
      <p>${this.escapeHtml(resetUrl)}</p>
      <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
    `;

    if (!this.transporter) {
      this.logger.warn(`SMTP not configured — password reset email for ${to}`);
      this.logger.log(`Reset URL: ${resetUrl}`);
      return;
    }

    await this.transporter.sendMail({ from, to, subject, text, html });
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
