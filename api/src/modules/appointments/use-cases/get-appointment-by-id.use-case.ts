import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUseCase } from '../../../shared/interfaces/use-case.interface';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { Appointment } from '../entities/appointment.entity';

interface GetAppointmentByIdInput {
  id: string;
  lawyerId: string;
}

@Injectable()
export class GetAppointmentByIdUseCase
  implements IUseCase<GetAppointmentByIdInput, Appointment>
{
  constructor(
    @Inject('IAppointmentsRepository')
    private readonly repo: IAppointmentsRepository,
  ) {}

  async execute(input: GetAppointmentByIdInput): Promise<Appointment> {
    const { id, lawyerId } = input;

    const appointment = await this.repo.findById(id);
    if (!appointment) {
      throw new NotFoundException({ ok: false, msgCode: 'APT0002' });
    }

    if (appointment.lawyerId !== lawyerId) {
      throw new ForbiddenException({ ok: false, msgCode: 'APT0003' });
    }

    return appointment;
  }
}
