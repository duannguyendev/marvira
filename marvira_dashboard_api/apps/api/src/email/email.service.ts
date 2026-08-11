import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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

type MailPayload = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private resendApiKey: string | null = null;

  constructor(private readonly config: ConfigService) {
    this.resendApiKey =
      this.config.get<string>('RESEND_API_KEY')?.trim() || null;

    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (host) {
      const user = this.config.get<string>('SMTP_USER')?.trim();
      // Gmail App Passwords are often pasted with spaces — strip them.
      const pass = this.config
        .get<string>('SMTP_PASS')
        ?.replace(/\s+/g, '');
      const isGmail =
        /^(smtp\.)?gmail\.com$/i.test(host) || host.toLowerCase() === 'gmail';
      const port = parseInt(this.config.get('SMTP_PORT', '587'), 10);
      const secure =
        this.config.get('SMTP_SECURE') === 'true' || port === 465;

      this.transporter = nodemailer.createTransport(
        isGmail
          ? {
              service: 'gmail',
              auth: { user, pass },
              connectionTimeout: 10_000,
              greetingTimeout: 10_000,
              socketTimeout: 15_000,
            }
          : {
              host,
              port,
              secure,
              auth: { user, pass },
              requireTLS: !secure && port === 587,
              connectionTimeout: 10_000,
              greetingTimeout: 10_000,
              socketTimeout: 15_000,
            },
      );
    }
  }

  async onModuleInit() {
    if (this.resendApiKey) {
      this.logger.log('Email delivery: Resend (HTTPS)');
      return;
    }
    if (this.transporter) {
      const host = this.config.get<string>('SMTP_HOST')?.trim();
      this.logger.log(`Email delivery: SMTP (${host})`);
      try {
        await this.transporter.verify();
        this.logger.log('SMTP connection verified');
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : String(error);
        this.logger.error(
          `SMTP verify failed — transactional emails will not send: ${detail}`,
        );
        this.logger.error(
          'Gmail: use an App Password (not account password). ' +
            'Railway: outbound SMTP is often blocked — switch to RESEND_API_KEY.',
        );
      }
      return;
    }
    this.logger.warn(
      'Email delivery: DISABLED — set RESEND_API_KEY (recommended) or SMTP_* env vars',
    );
  }

  isConfigured(): boolean {
    return !!(this.resendApiKey || this.transporter);
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    userName: string,
    options?: { isFirstPassword?: boolean },
  ): Promise<void> {
    const supportEmail = this.supportEmail();
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
      ${this.ctaButton(safeUrl, ctaLabel)}
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

    await this.dispatch(
      {
        to,
        subject,
        text,
        html: this.wrapSystemMail({
          preheader: isFirst
            ? 'Create your Marvira password — link expires in 1 hour.'
            : 'Reset your Marvira password — link expires in 1 hour.',
          bodyHtml,
          footerNote: isFirst
            ? `You received this because a Marvira password was requested for your account. Questions? ${safeSupport}`
            : `You received this because a password reset was requested for your Marvira account. Questions? ${safeSupport}`,
        }),
      },
      {
        kind: 'password-reset',
        fallbackLog: `Reset URL: ${resetUrl}`,
      },
    );
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    const supportEmail = this.supportEmail();
    const siteUrl =
      this.config.get<string>('MARKETING_SITE_URL')?.trim() ||
      this.config.get<string>('PUBLIC_SITE_URL')?.trim() ||
      'https://www.marvira.com';
    const downloadUrl = `${siteUrl.replace(/\/$/, '')}/download`;
    const subject = 'Welcome to Marvira';
    const intro =
      'Thanks for creating your Marvira account. Open the app to find nearby hunts, walk to places, and unlock challenges.';

    const text = [
      `Hi ${userName},`,
      '',
      intro,
      '',
      `Get the app: ${downloadUrl}`,
      '',
      `Need help? Contact ${supportEmail}`,
      '— The Marvira team',
    ].join('\n');

    const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${BRAND.ink};">
        Hi ${this.escapeHtml(userName)},
      </p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:${BRAND.ink};">
        ${this.escapeHtml(intro)}
      </p>
      ${this.ctaButton(this.escapeHtml(downloadUrl), 'Get the app')}
      <p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND.muted};">
        Happy exploring.
      </p>
    `;

    await this.dispatch(
      {
        to,
        subject,
        text,
        html: this.wrapSystemMail({
          preheader: 'Welcome to Marvira — find hunts near you.',
          bodyHtml,
          footerNote: `You received this because you created a Marvira account. Questions? ${this.escapeHtml(supportEmail)}`,
        }),
      },
      { kind: 'welcome' },
    );
  }

  /**
   * Security notice after password is created or changed.
   * reason: changed (settings), reset (email link), set (SSO first password).
   */
  async sendPasswordChangedEmail(
    to: string,
    userName: string,
    reason: 'changed' | 'reset' | 'set' = 'changed',
  ): Promise<void> {
    const supportEmail = this.supportEmail();
    const subject =
      reason === 'set'
        ? 'Your Marvira password was created'
        : 'Your Marvira password was changed';
    const intro =
      reason === 'set'
        ? 'A Marvira password was just added to your account. You can now sign in with email and password as well as social login.'
        : reason === 'reset'
          ? 'Your Marvira password was just reset using an email link. If this was you, no further action is needed.'
          : 'Your Marvira password was just changed. If this was you, no further action is needed.';
    const warning =
      'If you did not make this change, reset your password immediately and contact support.';

    const text = [
      `Hi ${userName},`,
      '',
      intro,
      '',
      warning,
      '',
      `Need help? Contact ${supportEmail}`,
      '— The Marvira team',
    ].join('\n');

    const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${BRAND.ink};">
        Hi ${this.escapeHtml(userName)},
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${BRAND.ink};">
        ${this.escapeHtml(intro)}
      </p>
      <p style="margin:0;font-size:14px;line-height:1.5;color:${BRAND.muted};">
        ${this.escapeHtml(warning)}
      </p>
    `;

    await this.dispatch(
      {
        to,
        subject,
        text,
        html: this.wrapSystemMail({
          preheader: subject,
          bodyHtml,
          footerNote: `Security notice for your Marvira account. Questions? ${this.escapeHtml(supportEmail)}`,
        }),
      },
      { kind: 'password-changed' },
    );
  }

  /**
   * Notify the support inbox when a user submits feedback (web or app).
   */
  async sendSupportFeedbackNotification(input: {
    id: string;
    name: string;
    email: string;
    category: string;
    subject?: string | null;
    message: string;
    source: string;
  }): Promise<void> {
    const to = this.supportEmail();
    const topic = input.subject?.trim() || input.category;
    const mailSubject = `[Marvira ${input.source}] ${input.category}: ${topic}`;
    const text = [
      'New support / feedback message',
      '',
      `ID: ${input.id}`,
      `From: ${input.name} <${input.email}>`,
      `Category: ${input.category}`,
      `Source: ${input.source}`,
      input.subject?.trim() ? `Subject: ${input.subject.trim()}` : null,
      '',
      'Message:',
      input.message,
    ]
      .filter(line => line !== null)
      .join('\n');

    const bodyHtml = `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${BRAND.ink};">
        New support / feedback message
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
        <tr><td style="padding:2px 12px 2px 0;color:${BRAND.muted};">ID</td><td>${this.escapeHtml(input.id)}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:${BRAND.muted};">From</td><td>${this.escapeHtml(input.name)} &lt;${this.escapeHtml(input.email)}&gt;</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:${BRAND.muted};">Category</td><td>${this.escapeHtml(input.category)}</td></tr>
        <tr><td style="padding:2px 12px 2px 0;color:${BRAND.muted};">Source</td><td>${this.escapeHtml(input.source)}</td></tr>
        ${
          input.subject?.trim()
            ? `<tr><td style="padding:2px 12px 2px 0;color:${BRAND.muted};">Subject</td><td>${this.escapeHtml(input.subject.trim())}</td></tr>`
            : ''
        }
      </table>
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${BRAND.muted};">Message</p>
      <p style="margin:0;padding:16px;font-size:15px;line-height:1.6;color:${BRAND.ink};background:${BRAND.bg};border-radius:8px;white-space:pre-wrap;">
${this.escapeHtml(input.message)}
      </p>
    `;

    await this.dispatch(
      {
        to,
        subject: mailSubject,
        text,
        html: this.wrapSystemMail({
          preheader: `New ${input.category} from ${input.name}`,
          bodyHtml,
          footerNote: `Reply goes to the user when you use Reply in your mail client (${this.escapeHtml(input.email)}).`,
        }),
        replyTo: input.email,
      },
      { kind: 'support-feedback' },
    );
  }

  private supportEmail(): string {
    return (
      this.config.get<string>('SUPPORT_EMAIL')?.trim() || 'support@marvira.com'
    );
  }

  private fromAddress(): string {
    return (
      this.config.get('SMTP_FROM')?.trim() ||
      this.config.get('RESEND_FROM')?.trim() ||
      'Marvira <noreply@marvira.com>'
    );
  }

  private ctaButton(safeHref: string, label: string): string {
    return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td align="center" bgcolor="${BRAND.primary}" style="border-radius:8px;">
            <a href="${safeHref}"
               style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:${BRAND.white};text-decoration:none;border-radius:8px;">
              ${label}
            </a>
          </td>
        </tr>
      </table>
    `;
  }

  private async dispatch(
    content: Omit<MailPayload, 'from'>,
    meta: { kind: string; fallbackLog?: string },
  ): Promise<void> {
    const mail: MailPayload = { ...content, from: this.fromAddress() };

    if (!this.isConfigured()) {
      this.logger.warn(
        `Email not configured — ${meta.kind} for ${mail.to} (skipped)`,
      );
      if (meta.fallbackLog) {
        this.logger.log(meta.fallbackLog);
      }
      return;
    }

    try {
      if (this.resendApiKey) {
        await this.sendViaResend(mail);
        this.logger.log(`${meta.kind} email sent via Resend to ${mail.to}`);
        return;
      }
      await this.transporter!.sendMail(mail);
      this.logger.log(`${meta.kind} email sent via SMTP to ${mail.to}`);
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to send ${meta.kind} email to ${mail.to}: ${detail}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Do not rethrow — auth flows must still succeed.
    }
  }

  private async sendViaResend(mail: MailPayload): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: mail.from,
        to: [mail.to],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Resend HTTP ${response.status}: ${body || response.statusText}`,
      );
    }
  }

  /**
   * Shared transactional layout (table-based for email clients).
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
