import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Test } from '@nestjs/testing';
import {
  createAppointmentCreatedEmail,
  createAppointmentCancelledEmail,
  createAppointmentUpdatedEmail,
  createEmailVerificationEmail,
  createForgotPasswordEmail,
  createInvitationEmail,
  createResetPasswordConfirmationEmail,
  createWelcomeEmail,
} from './email.factory';
import { resolveEmailPartialsDir, resolveEmailTemplateDir } from './email.config';

describe('email template rendering with mock transport', () => {
  let mailerService: MailerService;
  const templateDir = resolveEmailTemplateDir('dev', process.cwd());
  const partialsDir = resolveEmailPartialsDir('dev', process.cwd());
  const dashboardUrl = 'https://app.legalcalendar.test';
  const legacyColors = [
    '#FAF7F2',
    '#C4956A',
    '#3D3530',
    '#7A706A',
    '#E0D8CE',
    '#F0EBE3',
    '#F5F7FA',
    '#4A6FA5',
    '#3A5A8C',
    '#2C3E50',
    '#6B7B8D',
    '#D0D8E0',
    '#E8ECF1',
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        MailerModule.forRoot({
          transport: {
            streamTransport: true,
            buffer: true,
            newline: 'unix',
          },
          defaults: {
            from: '"Legal Calendar" <noreply@legalcalendar.test>',
          },
          template: {
            dir: templateDir,
            adapter: new HandlebarsAdapter(undefined, {
              inlineCssEnabled: false,
            }),
            options: {
              strict: true,
            },
          },
          options: {
            partials: {
              dir: partialsDir,
              options: {
                strict: true,
              },
            },
          },
        }),
      ],
    }).compile();

    mailerService = moduleRef.get(MailerService);
  });

  const normalizeMessage = (message: string) =>
    message
      .replace(/=\r?\n/g, '')
      .replace(/=3D/g, '=')
      .replace(/&#x3D;/g, '=');

  it.each([
    [
      'welcome',
      createWelcomeEmail('to@test.com', 'Nora', dashboardUrl),
      ['Nora, bienvenido!', dashboardUrl, '#F8FAFC', '#2563EB', '#0F172A', '#E2E8F0'],
      [],
    ],
    [
      'email-verification',
      createEmailVerificationEmail(
        'to@test.com',
        'Nora',
        '123456',
        'https://app/verify',
        'signup',
        dashboardUrl,
      ),
      ['123456', 'https://app/verify', '#F8FAFC', '#2563EB', '#0F172A', '#E2E8F0', '#EFF6FF'],
      [],
    ],
    [
      'forgot-password',
      createForgotPasswordEmail(
        'to@test.com',
        'Nora',
        'https://app/reset?token=abc',
        dashboardUrl,
      ),
      ['https://app/reset?token=abc', 'Restablecer contrase', '#F8FAFC', '#2563EB', '#0F172A', '#E2E8F0'],
      [],
    ],
    [
      'reset-password',
      createResetPasswordConfirmationEmail('to@test.com', 'Nora', dashboardUrl),
      [dashboardUrl, 'tu contrase', '#F8FAFC', '#2563EB', '#0F172A', '#E2E8F0'],
      [],
    ],
    [
      'invitation',
      createInvitationEmail(
        'to@test.com',
        'Admin',
        'https://app/register-invited?token=abc',
        dashboardUrl,
      ),
      ['https://app/register-invited?token=abc', 'Aceptar invitacion', '#F8FAFC', '#2563EB', '#0F172A', '#E2E8F0'],
      [],
    ],
    [
      'appointment-created',
      createAppointmentCreatedEmail(
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
        'ics-content',
        dashboardUrl,
      ),
      ['Consulta inicial', 'En persona', 'Av. Corrientes 1234', '#F8FAFC', '#2563EB', '#0F172A', '#E2E8F0'],
      ['IN_PERSON'],
    ],
    [
      'appointment-updated',
      createAppointmentUpdatedEmail(
        'to@test.com',
        {
          lawyerName: 'Dra. Nora',
          clientName: 'Cliente',
          title: 'Consulta inicial',
          type: 'VIDEO_CALL',
          date: '02/04/2026',
          time: '15:00 - 16:00',
          location: 'https://meet.example.com/abc',
        },
        'ics-content',
        dashboardUrl,
      ),
      ['Consulta inicial', 'Videollamada', 'https://meet.example.com/abc', '#F8FAFC', '#2563EB', '#0F172A', '#E2E8F0'],
      ['VIDEO_CALL'],
    ],
    [
      'appointment-cancelled',
      createAppointmentCancelledEmail(
        'to@test.com',
        {
          lawyerName: 'Dra. Nora',
          clientName: 'Cliente',
          title: 'Consulta inicial',
          date: '03/04/2026',
          time: '09:00 - 10:00',
        },
        'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nMETHOD:CANCEL\r\nEND:VCALENDAR',
        dashboardUrl,
      ),
      ['Consulta inicial', '#F8FAFC', '#2563EB', '#0F172A', '#E2E8F0'],
      [],
    ],
  ])(
    'renders and sends %s through mock transport',
    async (
      _template,
      mailOptions,
      expectedFragments,
      forbiddenFragments = [],
    ) => {
      const info = await mailerService.sendMail(mailOptions);
      const message = normalizeMessage(info.message.toString());

      expect(message).toContain('Content-Type: text/html');

      for (const fragment of expectedFragments) {
        expect(message).toContain(fragment);
      }

      for (const forbiddenFragment of forbiddenFragments) {
        expect(message).not.toContain(forbiddenFragment);
      }

      for (const legacyColor of legacyColors) {
        expect(message).not.toContain(legacyColor);
      }

      if (mailOptions.template.startsWith('appointment-')) {
        expect(message).toContain('Content-Type: text/calendar; charset=utf-8');
        expect(message).toContain(
          `Content-Type: text/calendar; charset=utf-8; method=${
            mailOptions.icalEvent?.method || 'REQUEST'
          }`,
        );
        expect(message).toContain('Content-Type: application/ics; name=appointment.ics');
        expect(message).toContain('Content-Disposition: attachment; filename=appointment.ics');
      }
    },
  );
});
