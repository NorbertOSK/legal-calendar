import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from '../../../shared/interfaces/use-case.interface';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { IcsService } from '../../../shared/services/ics.service';
import { EmailService } from '../../email/email.service';

interface CancelAppointmentInput {
  id: string;
  lawyerId: string;
  lawyerName: string;
  lawyerEmail: string;
  lawyerTimezone: string;
}

@Injectable()
export class CancelAppointmentUseCase
  implements IUseCase<CancelAppointmentInput, Appointment>
{
  constructor(
    @Inject('IAppointmentsRepository')
    private readonly repo: IAppointmentsRepository,
    private readonly redisService: RedisService,
    private readonly icsService: IcsService,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: CancelAppointmentInput): Promise<Appointment> {
    const { id, lawyerId, lawyerName, lawyerEmail } = input;

    const appointment = await this.repo.findById(id);
    if (!appointment) {
      throw new NotFoundException({ ok: false, msgCode: 'APT0002' });
    }

    if (appointment.lawyerId !== lawyerId) {
      throw new ForbiddenException({ ok: false, msgCode: 'APT0003' });
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException({ ok: false, msgCode: 'APT0004' });
    }

    const cancelled = await this.repo.update(id, {
      status: AppointmentStatus.CANCELLED,
    });

    const timezone = input.lawyerTimezone;
    const icsContent = this.icsService.generateIcs(
      {
        id: cancelled.id,
        title: cancelled.title,
        description: cancelled.description ?? undefined,
        location: cancelled.location ?? undefined,
        meetingLink: cancelled.meetingLink ?? undefined,
        startsAt: cancelled.startsAt,
        endsAt: cancelled.endsAt,
        organizerName: lawyerName,
        organizerEmail: lawyerEmail,
        attendeeName: cancelled.clientName,
        attendeeEmail: cancelled.clientEmail,
      },
      'CANCEL',
    );

    const dateFormatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatter = new Intl.DateTimeFormat('es-AR', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const formattedDate = dateFormatter.format(cancelled.startsAt);
    const formattedTime =
      timeFormatter.format(cancelled.startsAt) +
      ' - ' +
      timeFormatter.format(cancelled.endsAt);

    let clientTime: string | undefined;
    if (cancelled.clientTimezone && cancelled.clientTimezone !== timezone) {
      const clientDateFmt = new Intl.DateTimeFormat('es-AR', {
        timeZone: cancelled.clientTimezone,
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
      const clientTimeFmt = new Intl.DateTimeFormat('es-AR', {
        timeZone: cancelled.clientTimezone,
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
      clientTime = clientDateFmt.format(cancelled.startsAt) + ' ' +
        clientTimeFmt.format(cancelled.startsAt) + ' - ' + clientTimeFmt.format(cancelled.endsAt);
    }

    this.emailService.sendAppointmentCancelled(
      cancelled.clientEmail,
      {
        lawyerName,
        clientName: cancelled.clientName,
        title: cancelled.title,
        type: cancelled.type,
        date: formattedDate,
        time: formattedTime,
        location: cancelled.location ?? cancelled.meetingLink ?? '',
        clientTime,
      },
      icsContent,
    );

    await this.redisService.deleteByPattern(`appointments:lawyer:${lawyerId}:*`);

    return cancelled;
  }
}
