import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { IUseCase } from '../../../shared/interfaces/use-case.interface';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { Appointment } from '../entities/appointment.entity';
import { IcsService } from '../../../shared/services/ics.service';
import { EmailService } from '../../email/email.service';

interface CreateAppointmentInput {
  dto: CreateAppointmentDto;
  lawyerId: string;
  lawyerName: string;
  lawyerEmail: string;
  lawyerTimezone: string;
}

@Injectable()
export class CreateAppointmentUseCase
  implements IUseCase<CreateAppointmentInput, Appointment>
{
  constructor(
    @Inject('IAppointmentsRepository')
    private readonly repo: IAppointmentsRepository,
    private readonly redisService: RedisService,
    private readonly icsService: IcsService,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: CreateAppointmentInput): Promise<Appointment> {
    const { dto, lawyerId } = input;

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const now = new Date();

    if (startsAt >= endsAt) {
      throw new BadRequestException({ ok: false, msgCode: 'APT0006' });
    }

    if (startsAt <= now) {
      throw new BadRequestException({ ok: false, msgCode: 'APT0007' });
    }

    const overlapping = await this.repo.findOverlapping(
      lawyerId,
      startsAt,
      endsAt,
    );
    if (overlapping.length > 0) {
      throw new ConflictException({ ok: false, msgCode: 'APT0001' });
    }

    const appointment = await this.repo.save({
      lawyerId,
      clientName: dto.clientName,
      clientEmail: dto.clientEmail,
      clientPhone: dto.clientPhone ?? null,
      clientTimezone: dto.clientTimezone ?? null,
      type: dto.type,
      title: dto.title,
      description: dto.description ?? null,
      startsAt,
      endsAt,
      location: dto.location ?? null,
      meetingLink: dto.meetingLink ?? null,
    });

    const timezone = input.lawyerTimezone;
    const icsContent = this.icsService.generateIcs(
      {
        id: appointment.id,
        title: appointment.title,
        description: appointment.description ?? undefined,
        location: appointment.location ?? undefined,
        meetingLink: appointment.meetingLink ?? undefined,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        organizerName: input.lawyerName,
        organizerEmail: input.lawyerEmail,
        attendeeName: appointment.clientName,
        attendeeEmail: appointment.clientEmail,
      },
      'REQUEST',
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
    const formattedDate = dateFormatter.format(appointment.startsAt);
    const formattedTime =
      timeFormatter.format(appointment.startsAt) +
      ' - ' +
      timeFormatter.format(appointment.endsAt);

    let clientTime: string | undefined;
    if (appointment.clientTimezone && appointment.clientTimezone !== timezone) {
      const clientDateFmt = new Intl.DateTimeFormat('es-AR', {
        timeZone: appointment.clientTimezone,
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
      const clientTimeFmt = new Intl.DateTimeFormat('es-AR', {
        timeZone: appointment.clientTimezone,
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
      clientTime = clientDateFmt.format(appointment.startsAt) + ' ' +
        clientTimeFmt.format(appointment.startsAt) + ' - ' + clientTimeFmt.format(appointment.endsAt);
    }

    this.emailService.sendAppointmentCreated(
      appointment.clientEmail,
      {
        lawyerName: input.lawyerName,
        clientName: appointment.clientName,
        title: appointment.title,
        type: appointment.type,
        date: formattedDate,
        time: formattedTime,
        location: appointment.location ?? appointment.meetingLink ?? '',
        clientTime,
      },
      icsContent,
    );

    await this.redisService.deleteByPattern(`appointments:lawyer:${lawyerId}:*`);

    return appointment;
  }
}
