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

interface CompleteAppointmentInput {
  id: string;
  lawyerId: string;
}

@Injectable()
export class CompleteAppointmentUseCase
  implements IUseCase<CompleteAppointmentInput, Appointment>
{
  constructor(
    @Inject('IAppointmentsRepository')
    private readonly repo: IAppointmentsRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(input: CompleteAppointmentInput): Promise<Appointment> {
    const { id, lawyerId } = input;

    const appointment = await this.repo.findById(id);
    if (!appointment) {
      throw new NotFoundException({ ok: false, msgCode: 'APT0002' });
    }

    if (appointment.lawyerId !== lawyerId) {
      throw new ForbiddenException({ ok: false, msgCode: 'APT0003' });
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException({ ok: false, msgCode: 'APT0005' });
    }

    const completed = await this.repo.update(id, {
      status: AppointmentStatus.COMPLETED,
    });

    await this.redisService.deleteByPattern(`appointments:lawyer:${lawyerId}:*`);

    return completed;
  }
}
