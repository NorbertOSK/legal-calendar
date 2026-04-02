import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from '../../../shared/interfaces/use-case.interface';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentType } from '../enums/appointment-type.enum';
import { IcsService } from '../../../shared/services/ics.service';
import { EmailService } from '../../email/email.service';

interface UpdateAppointmentInput {
  id: string;
  dto: UpdateAppointmentDto;
  lawyerId: string;
  lawyerName: string;
  lawyerEmail: string;
  lawyerTimezone: string;
}

@Injectable()
export class UpdateAppointmentUseCase
  implements IUseCase<UpdateAppointmentInput, Appointment>
{
  constructor(
    @Inject('IAppointmentsRepository')
    private readonly repo: IAppointmentsRepository,
    private readonly redisService: RedisService,
    private readonly icsService: IcsService,
    private readonly emailService: EmailService,
  ) {}

  async execute(input: UpdateAppointmentInput): Promise<Appointment> {
    const { id, dto, lawyerId, lawyerName, lawyerEmail } = input;

    const appointment = await this.repo.findById(id);
    if (!appointment) {
      throw new NotFoundException({ ok: false, msgCode: 'APT0002' });
    }

    if (appointment.lawyerId !== lawyerId) {
      throw new ForbiddenException({ ok: false, msgCode: 'APT0003' });
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException({ ok: false, msgCode: 'APT0004' });
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException({ ok: false, msgCode: 'APT0005' });
    }

    const datesChanged = dto.startsAt !== undefined || dto.endsAt !== undefined;
    if (datesChanged) {
      const startsAt = dto.startsAt
        ? new Date(dto.startsAt)
        : appointment.startsAt;
      const endsAt = dto.endsAt ? new Date(dto.endsAt) : appointment.endsAt;

      if (startsAt >= endsAt) {
        throw new BadRequestException({ ok: false, msgCode: 'APT0006' });
      }

      const overlapping = await this.repo.findOverlapping(
        lawyerId,
        startsAt,
        endsAt,
        id,
      );
      if (overlapping.length > 0) {
        throw new ConflictException({ ok: false, msgCode: 'APT0001' });
      }
    }

    const finalType = dto.type ?? appointment.type;
    const finalLocation = dto.location !== undefined ? dto.location : appointment.location;
    const finalMeetingLink = dto.meetingLink !== undefined ? dto.meetingLink : appointment.meetingLink;
    const finalClientPhone = dto.clientPhone !== undefined ? dto.clientPhone : appointment.clientPhone;

    if (finalType === AppointmentType.IN_PERSON && !finalLocation) {
      throw new BadRequestException({ ok: false, msgCode: 'APT0008' });
    }
    if (finalType === AppointmentType.VIDEO_CALL && !finalMeetingLink) {
      throw new BadRequestException({ ok: false, msgCode: 'APT0008' });
    }
    if (finalType === AppointmentType.PHONE && !finalClientPhone) {
      throw new BadRequestException({ ok: false, msgCode: 'APT0008' });
    }

    const updateData: Partial<Appointment> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.clientName !== undefined) updateData.clientName = dto.clientName;
    if (dto.clientEmail !== undefined) updateData.clientEmail = dto.clientEmail;
    if (dto.clientPhone !== undefined) updateData.clientPhone = dto.clientPhone;
    if (dto.clientTimezone !== undefined)
      updateData.clientTimezone = dto.clientTimezone;
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.startsAt !== undefined) updateData.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) updateData.endsAt = new Date(dto.endsAt);
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.meetingLink !== undefined) updateData.meetingLink = dto.meetingLink;

    const updated = await this.repo.update(id, updateData);

    const timezone = input.lawyerTimezone;
    const icsContent = this.icsService.generateIcs(
      {
        id: updated.id,
        title: updated.title,
        description: updated.description ?? undefined,
        location: updated.location ?? undefined,
        meetingLink: updated.meetingLink ?? undefined,
        startsAt: updated.startsAt,
        endsAt: updated.endsAt,
        sequence: 1,
        organizerName: lawyerName,
        organizerEmail: lawyerEmail,
        attendeeName: updated.clientName,
        attendeeEmail: updated.clientEmail,
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
    const formattedDate = dateFormatter.format(updated.startsAt);
    const formattedTime =
      timeFormatter.format(updated.startsAt) +
      ' - ' +
      timeFormatter.format(updated.endsAt);

    let clientTime: string | undefined;
    if (updated.clientTimezone && updated.clientTimezone !== timezone) {
      const clientDateFmt = new Intl.DateTimeFormat('es-AR', {
        timeZone: updated.clientTimezone,
        day: '2-digit', month: '2-digit', year: 'numeric',
      });
      const clientTimeFmt = new Intl.DateTimeFormat('es-AR', {
        timeZone: updated.clientTimezone,
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
      clientTime = clientDateFmt.format(updated.startsAt) + ' ' +
        clientTimeFmt.format(updated.startsAt) + ' - ' + clientTimeFmt.format(updated.endsAt);
    }

    this.emailService.sendAppointmentUpdated(
      updated.clientEmail,
      {
        lawyerName,
        clientName: updated.clientName,
        title: updated.title,
        type: updated.type,
        date: formattedDate,
        time: formattedTime,
        location: updated.location ?? updated.meetingLink ?? '',
        clientTime,
      },
      icsContent,
    );

    await this.redisService.deleteByPattern(`appointments:lawyer:${lawyerId}:*`);

    return updated;
  }
}
