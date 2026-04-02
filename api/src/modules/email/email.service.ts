import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import {
  AppointmentEmailData,
  createAppointmentCancelledEmail,
  createAppointmentCreatedEmail,
  createAppointmentUpdatedEmail,
  createEmailVerificationEmail,
  createForgotPasswordEmail,
  createInvitationEmail,
  createResetPasswordConfirmationEmail,
  createWelcomeEmail,
  TemplateMailOptions,
} from './email.factory';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly dashboardUrl: string;
  private readonly maxRetries = 3;
  private readonly initialDelayMs = 1000;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.dashboardUrl = this.configService.get<string>('dashboardDomain');
  }

  sendWelcome(to: string, name: string): void {
    this.dispatchEmail(createWelcomeEmail(to, name, this.dashboardUrl));
  }

  sendEmailVerification(
    to: string,
    name: string,
    securityCode: string,
    verificationLink: string,
    purpose: string,
  ): void {
    this.dispatchEmail(
      createEmailVerificationEmail(
        to,
        name,
        securityCode,
        verificationLink,
        purpose,
        this.dashboardUrl,
      ),
    );
  }

  sendForgotPassword(to: string, name: string, token: string): void {
    this.dispatchEmail(
      createForgotPasswordEmail(to, name, token, this.dashboardUrl),
    );
  }

  sendResetPasswordConfirmation(to: string, name: string): void {
    this.dispatchEmail(
      createResetPasswordConfirmationEmail(to, name, this.dashboardUrl),
    );
  }

  sendInvitation(
    to: string,
    inviterName: string,
    invitationLink: string,
  ): void {
    this.dispatchEmail(
      createInvitationEmail(
        to,
        inviterName,
        invitationLink,
        this.dashboardUrl,
      ),
    );
  }

  sendAppointmentCreated(
    to: string,
    data: AppointmentEmailData,
    icsContent: string,
  ): void {
    this.dispatchEmail(
      createAppointmentCreatedEmail(to, data, icsContent, this.dashboardUrl),
    );
  }

  sendAppointmentUpdated(
    to: string,
    data: AppointmentEmailData,
    icsContent: string,
  ): void {
    this.dispatchEmail(
      createAppointmentUpdatedEmail(to, data, icsContent, this.dashboardUrl),
    );
  }

  sendAppointmentCancelled(
    to: string,
    data: AppointmentEmailData,
    icsContent: string,
  ): void {
    this.dispatchEmail(
      createAppointmentCancelledEmail(to, data, icsContent, this.dashboardUrl),
    );
  }

  private dispatchEmail(mailOptions: TemplateMailOptions): void {
    void this.attemptSend(
      mailOptions,
      this.maxRetries,
      this.initialDelayMs,
    ).catch((err) => {
      const details = this.serializeError(err);
      this.logger.error(
        `Email delivery failed for ${String(mailOptions.to)} [template=${mailOptions.template}, retryable=${this.isRetryableError(err)}]: ${details}`,
      );
    });
  }

  private async attemptSend(
    mailOptions: TemplateMailOptions,
    maxRetries: number,
    delayMs: number,
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.mailerService.sendMail(mailOptions);
        this.logger.log(
          `Email sent successfully to ${String(mailOptions.to)} [template=${mailOptions.template}, attempt=${attempt}]`,
        );
        return;
      } catch (err) {
        const retryable = this.isRetryableError(err);
        const details = this.serializeError(err);

        if (!retryable || attempt === maxRetries) {
          throw err;
        }

        const nextDelayMs = this.calculateDelay(delayMs);

        this.logger.warn(
          `Email attempt ${attempt}/${maxRetries} failed for ${String(mailOptions.to)} [template=${mailOptions.template}, retryable=${retryable}]. Retrying in ${nextDelayMs}ms. Error: ${details}`,
        );
        await this.sleep(nextDelayMs);
        delayMs *= 2;
      }
    }
  }

  private isRetryableError(err: unknown): boolean {
    const error = err as Record<string, any> | undefined;
    const code = String(error?.code || '').toUpperCase();
    const command = String(error?.command || '').toUpperCase();
    const responseCode = Number(error?.responseCode);
    const message = String(error?.message || '').toLowerCase();

    const permanentPatterns = [
      'template',
      'precompile',
      'compile',
      'enoent',
      'no such file',
      'missing template',
      'invalid login',
      'authentication unsuccessful',
      'auth',
      'no recipients defined',
      'eenvelope',
      'certificate',
      'self signed certificate',
    ];

    if (permanentPatterns.some((pattern) => message.includes(pattern))) {
      return false;
    }

    const retryableCodes = new Set([
      'ETIMEDOUT',
      'ECONNECTION',
      'ESOCKET',
      'ECONNRESET',
      'EAI_AGAIN',
      'ENOTFOUND',
      'EPIPE',
    ]);

    if (retryableCodes.has(code)) {
      return true;
    }

    if (command === 'CONN' && !code) {
      return true;
    }

    if ([421, 425, 429, 450, 451, 452].includes(responseCode)) {
      return true;
    }

    if (
      message.includes('timeout') ||
      message.includes('connection closed') ||
      message.includes('connection reset') ||
      message.includes('rate limit') ||
      message.includes('temporar')
    ) {
      return true;
    }

    return false;
  }

  private calculateDelay(baseDelayMs: number): number {
    const jitter = Math.floor(baseDelayMs * 0.1 * Math.random());
    return baseDelayMs + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private serializeError(err: unknown): string {
    const error = err as Record<string, any> | undefined;

    return [
      error?.message,
      error?.code ? `code=${error.code}` : undefined,
      error?.responseCode ? `responseCode=${error.responseCode}` : undefined,
      error?.command ? `command=${error.command}` : undefined,
    ]
      .filter(Boolean)
      .join(' | ');
  }
}
