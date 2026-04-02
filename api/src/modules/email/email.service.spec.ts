import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('EmailService', () => {
  let service: EmailService;
  let mailerService: { sendMail: jest.Mock };

  beforeEach(() => {
    mailerService = {
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message' }),
    };

    service = new EmailService(
      mailerService as unknown as MailerService,
      {
        get: jest.fn().mockReturnValue('https://app.legalcalendar.test'),
      } as unknown as ConfigService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it.each([
    ['sendWelcome', ['to@test.com', 'Nora'], 'welcome', 'Bienvenido a Legal Calendar'],
    [
      'sendEmailVerification',
      ['to@test.com', 'Nora', '123456', 'https://app/verify', 'signup'],
      'email-verification',
      'Verifica tu email - Legal Calendar',
    ],
    [
      'sendForgotPassword',
      ['to@test.com', 'Nora', 'https://app/reset?token=abc'],
      'forgot-password',
      'Recupera tu contraseña - Legal Calendar',
    ],
    [
      'sendResetPasswordConfirmation',
      ['to@test.com', 'Nora'],
      'reset-password',
      'Contraseña actualizada - Legal Calendar',
    ],
    [
      'sendInvitation',
      ['to@test.com', 'Admin', 'https://app/register-invited?token=abc'],
      'invitation',
      'Has sido invitado a Legal Calendar',
    ],
  ])(
    '%s dispatches the expected template without blocking',
    async (methodName, args, expectedTemplate, expectedSubject) => {
      const loggerSpy = jest
        .spyOn<any, any>(service['logger'], 'error')
        .mockImplementation();

      expect(() => (service as any)[methodName](...args)).not.toThrow();

      await flushPromises();

      expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'to@test.com',
          template: expectedTemplate,
          subject: expectedSubject,
          context: expect.objectContaining({
            theme: expect.objectContaining({
              bodyBg: '#F8FAFC',
              primary: '#2563EB',
              textPrimary: '#0F172A',
            }),
          }),
        }),
      );
      expect(loggerSpy).not.toHaveBeenCalled();
    },
  );

  it('retries transient errors with exponential backoff', async () => {
    jest.useFakeTimers();

    mailerService.sendMail
      .mockRejectedValueOnce({
        message: 'Connection timeout',
        code: 'ETIMEDOUT',
      })
      .mockResolvedValueOnce({ messageId: 'ok' });

    service.sendForgotPassword(
      'to@test.com',
      'Nora',
      'https://app/reset?token=abc',
    );

    await flushPromises();
    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1100);
    await flushPromises();

    expect(mailerService.sendMail).toHaveBeenCalledTimes(2);
  });

  it('does not retry permanent template/configuration errors', async () => {
    jest.useFakeTimers();

    mailerService.sendMail.mockRejectedValue({
      message:
        "Cannot destructure property 'templateName' of 'precompile(...)' as it is undefined.",
    });

    const loggerSpy = jest
      .spyOn<any, any>(service['logger'], 'error')
      .mockImplementation();

    service.sendWelcome('to@test.com', 'Nora');

    await flushPromises();

    expect(mailerService.sendMail).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.stringContaining('retryable=false'),
    );
  });

  it.each([
    ['sendAppointmentCreated', 'REQUEST'],
    ['sendAppointmentUpdated', 'REQUEST'],
    ['sendAppointmentCancelled', 'CANCEL'],
  ])(
    '%s sends calendar invites via icalEvent instead of attachments',
    async (methodName, expectedMethod) => {
      const loggerSpy = jest
        .spyOn<any, any>(service['logger'], 'error')
        .mockImplementation();

      expect(() =>
        (service as any)[methodName](
          'to@test.com',
          {
            lawyerName: 'Dra. Nora',
            clientName: 'Cliente',
            title: 'Consulta inicial',
            type: 'IN_PERSON',
            date: '01/04/2026',
            time: '10:00 - 11:00',
            location: 'Av. Corrientes 1234',
          },
          'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR',
        ),
      ).not.toThrow();

      await flushPromises();

      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'to@test.com',
          icalEvent: expect.objectContaining({
            method: expectedMethod,
            filename: 'appointment.ics',
            content: 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR',
          }),
        }),
      );
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        expect.not.objectContaining({
          attachments: expect.anything(),
        }),
      );
      expect(loggerSpy).not.toHaveBeenCalled();
    },
  );
});
