import { ISendMailOptions } from '@nestjs-modules/mailer/dist/interfaces/send-mail-options.interface';
import Mail from 'nodemailer/lib/mailer';
import {
  createEmailThemeTokens,
  EmailThemeTokens,
  EmailTemplateContexts,
  EmailTemplateName,
} from './email.config';
import { AppointmentType } from '../appointments/enums/appointment-type.enum';

export type TemplateMailOptions<T extends EmailTemplateName = EmailTemplateName> =
  Omit<ISendMailOptions, 'template' | 'context'> & {
    template: T;
    context: EmailTemplateContexts[T];
  };

type CalendarInviteMailOptions<T extends EmailTemplateName> =
  TemplateMailOptions<T> & {
    icalEvent: Mail.IcalAttachment;
  };

const withTheme = <T extends Record<string, unknown>>(
  context: T,
): T & { theme: EmailThemeTokens } => ({
  ...context,
  theme: createEmailThemeTokens(),
});

export const createWelcomeEmail = (
  to: string,
  name: string,
  dashboardUrl: string,
): TemplateMailOptions<'welcome'> => ({
  to,
  subject: 'Bienvenido a Legal Calendar',
  template: 'welcome',
  context: withTheme({ name, dashboardUrl }),
});

export const createEmailVerificationEmail = (
  to: string,
  name: string,
  securityCode: string,
  verificationLink: string,
  purpose: string,
  dashboardUrl: string,
): TemplateMailOptions<'email-verification'> => ({
  to,
  subject: 'Verifica tu email - Legal Calendar',
  template: 'email-verification',
  context: withTheme({
    name,
    securityCode,
    verificationLink,
    purpose,
    dashboardUrl,
  }),
});

export const createForgotPasswordEmail = (
  to: string,
  name: string,
  token: string,
  dashboardUrl: string,
): TemplateMailOptions<'forgot-password'> => ({
  to,
  subject: 'Recupera tu contraseña - Legal Calendar',
  template: 'forgot-password',
  context: withTheme({ name, token, dashboardUrl }),
});

export const createResetPasswordConfirmationEmail = (
  to: string,
  name: string,
  dashboardUrl: string,
): TemplateMailOptions<'reset-password'> => ({
  to,
  subject: 'Contraseña actualizada - Legal Calendar',
  template: 'reset-password',
  context: withTheme({ name, dashboardUrl }),
});

export const createInvitationEmail = (
  to: string,
  inviterName: string,
  invitationLink: string,
  dashboardUrl: string,
): TemplateMailOptions<'invitation'> => ({
  to,
  subject: 'Has sido invitado a Legal Calendar',
  template: 'invitation',
  context: withTheme({
    inviterName,
    invitationLink,
    expirationHours: 72,
    dashboardUrl,
  }),
});

export interface AppointmentEmailData {
  lawyerName: string;
  clientName: string;
  title: string;
  type?: string;
  date: string;
  time: string;
  location?: string;
  clientTime?: string;
}

const getAppointmentTypeLabel = (type?: string): string => {
  switch (type) {
    case AppointmentType.IN_PERSON:
      return 'En persona';
    case AppointmentType.VIDEO_CALL:
      return 'Videollamada';
    case AppointmentType.PHONE:
      return 'Llamada telefónica';
    default:
      return type || '';
  }
};

export const createAppointmentCreatedEmail = (
  to: string,
  data: AppointmentEmailData,
  icsContent: string,
  dashboardUrl: string,
): CalendarInviteMailOptions<'appointment-created'> => ({
  to,
  subject: `Cita programada: ${data.title} - Legal Calendar`,
  template: 'appointment-created',
  context: withTheme({
    lawyerName: data.lawyerName,
    clientName: data.clientName,
    title: data.title,
    typeLabel: getAppointmentTypeLabel(data.type),
    date: data.date,
    time: data.time,
    location: data.location || 'Por definir',
    clientTime: data.clientTime,
    dashboardUrl,
  }),
  icalEvent: {
    filename: 'appointment.ics',
    method: 'REQUEST',
    content: icsContent,
  },
});

export const createAppointmentUpdatedEmail = (
  to: string,
  data: AppointmentEmailData,
  icsContent: string,
  dashboardUrl: string,
): CalendarInviteMailOptions<'appointment-updated'> => ({
  to,
  subject: `Cita actualizada: ${data.title} - Legal Calendar`,
  template: 'appointment-updated',
  context: withTheme({
    lawyerName: data.lawyerName,
    clientName: data.clientName,
    title: data.title,
    typeLabel: getAppointmentTypeLabel(data.type),
    date: data.date,
    time: data.time,
    location: data.location || 'Por definir',
    clientTime: data.clientTime,
    dashboardUrl,
  }),
  icalEvent: {
    filename: 'appointment.ics',
    method: 'REQUEST',
    content: icsContent,
  },
});

export const createAppointmentCancelledEmail = (
  to: string,
  data: AppointmentEmailData,
  icsContent: string,
  dashboardUrl: string,
): CalendarInviteMailOptions<'appointment-cancelled'> => ({
  to,
  subject: `Cita cancelada: ${data.title} - Legal Calendar`,
  template: 'appointment-cancelled',
  context: withTheme({
    lawyerName: data.lawyerName,
    clientName: data.clientName,
    title: data.title,
    date: data.date,
    time: data.time,
    clientTime: data.clientTime,
    dashboardUrl,
  }),
  icalEvent: {
    filename: 'appointment.ics',
    method: 'CANCEL',
    content: icsContent,
  },
});
