import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/** Marvira brand (aligned with mobile / marketing). */
const BRAND = {
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  ink: '#1E293B',
  muted: '#64748B',
  border: '#E2E8F0',
  bg: '#F8FAFC',
  white: '#FFFFFF',
} as const;

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
        // Prevent hung SMTP from blocking API requests (mobile shows "Network error").
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
        socketTimeout: 15_000,
      });
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    userName: string,
    options?: { isFirstPassword?: boolean },
  ): Promise<void> {
    const from = this.config.get('SMTP_FROM', 'Marvira <noreply@marvira.com>');
    const supportEmail = this.config.get(
      'SUPPORT_EMAIL',
      'support@marvira.com',
    );
    const isFirst = !!options?.isFirstPassword;
    const subject = isFirst
      ? 'Create your Marvira password'
      : 'Reset your Marvira password';
    const safeName = this.escapeHtml(userName);
    const safeUrl = this.escapeHtml(resetUrl);
    const safeSupport = this.escapeHtml(supportEmail);
    const ctaLabel = isFirst ? 'Create password' : 'Reset password';
    const intro = isFirst
      ? 'You asked to create a Marvira password for your account (you may have signed in with Google, Apple, or Facebook before). Use the button below to set one — you can then sign in with email/password or keep using social login.'
      : 'We received a request to reset your Marvira password. Use the button below to choose a new one.';

    const text = [
      `Hi ${userName},`,
      '',
      intro,
      '',
      resetUrl,
      '',
      'This link expires in 1 hour. If you did not request this, you can ignore this email.',
      '',
      `Need help? Contact ${supportEmail}`,
      '— The Marvira team',
    ].join('\n');

    const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${BRAND.ink};">
        Hi ${safeName},
      </p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:${BRAND.ink};">
        ${this.escapeHtml(intro)}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td align="center" bgcolor="${BRAND.primary}" style="border-radius:8px;">
            <a href="${safeUrl}"
               style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:${BRAND.white};text-decoration:none;border-radius:8px;">
              ${ctaLabel}
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${BRAND.muted};">
        Or copy this link into your browser:
      </p>
      <p style="margin:0 0 24px;font-size:13px;line-height:1.5;word-break:break-all;color:${BRAND.primaryDark};">
        ${safeUrl}
      </p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND.muted};">
        This link expires in 1 hour. If you did not request this, you can ignore this email.
      </p>
    `;

    const html = this.wrapSystemMail({
      preheader: isFirst
        ? 'Create your Marvira password — link expires in 1 hour.'
        : 'Reset your Marvira password — link expires in 1 hour.',
      bodyHtml,
      footerNote: isFirst
        ? `You received this because a Marvira password was requested for your account. Questions? ${safeSupport}`
        : `You received this because a password reset was requested for your Marvira account. Questions? ${safeSupport}`,
    });

    if (!this.transporter) {
      this.logger.warn(`SMTP not configured — password reset email for ${to}`);
      this.logger.log(`Reset URL: ${resetUrl}`);
      return;
    }

    try {
      await this.transporter.sendMail({ from, to, subject, text, html });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${to}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Do not rethrow — caller must still return the generic success response.
    }
  }

  /**
   * Shared transactional layout (table-based for email clients).
   * Reuse for welcome / invite / password-changed mail later.
   */
  private wrapSystemMail(params: {
    preheader: string;
    bodyHtml: string;
    footerNote: string;
  }): string {
    const { preheader, bodyHtml, footerNote } = params;
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Marvira</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${this.escapeHtml(preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.bg};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background-color:${BRAND.white};border-radius:12px;border:1px solid ${BRAND.border};overflow:hidden;">
          <tr>
            <td align="center" style="padding:28px 32px 16px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.primaryDark});">
              <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:0.02em;color:${BRAND.white};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Marvira
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${BRAND.border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:${BRAND.muted};">
                ${footerNote}
              </p>
              <p style="margin:12px 0 0;font-size:12px;line-height:1.5;color:${BRAND.muted};">
                — The Marvira team
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
