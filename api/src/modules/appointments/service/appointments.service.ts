import { Inject, Injectable } from '@nestjs/common';
import { CreateAppointmentUseCase } from '../use-cases/create-appointment.use-case';
import { UpdateAppointmentUseCase } from '../use-cases/update-appointment.use-case';
import { CancelAppointmentUseCase } from '../use-cases/cancel-appointment.use-case';
import { CompleteAppointmentUseCase } from '../use-cases/complete-appointment.use-case';
import {
  GetAppointmentsUseCase,
  GetAppointmentsOutput,
} from '../use-cases/get-appointments.use-case';
import { GetAppointmentByIdUseCase } from '../use-cases/get-appointment-by-id.use-case';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { FilterAppointmentsDto } from '../dto/filter-appointments.dto';
import { Appointment } from '../entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @Inject('CreateAppointmentUseCase')
    private readonly createUC: CreateAppointmentUseCase,
    @Inject('UpdateAppointmentUseCase')
    private readonly updateUC: UpdateAppointmentUseCase,
    @Inject('CancelAppointmentUseCase')
    private readonly cancelUC: CancelAppointmentUseCase,
    @Inject('CompleteAppointmentUseCase')
    private readonly completeUC: CompleteAppointmentUseCase,
    @Inject('GetAppointmentsUseCase')
    private readonly getAppointmentsUC: GetAppointmentsUseCase,
    @Inject('GetAppointmentByIdUseCase')
    private readonly getByIdUC: GetAppointmentByIdUseCase,
  ) {}

  create(
    dto: CreateAppointmentDto,
    lawyerId: string,
    lawyerName: string,
    lawyerEmail: string,
    lawyerTimezone: string,
  ): Promise<Appointment> {
    return this.createUC.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone });
  }

  update(
    id: string,
    dto: UpdateAppointmentDto,
    lawyerId: string,
    lawyerName: string,
    lawyerEmail: string,
    lawyerTimezone: string,
  ): Promise<Appointment> {
    return this.updateUC.execute({ id, dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone });
  }

  cancel(
    id: string,
    lawyerId: string,
    lawyerName: string,
    lawyerEmail: string,
    lawyerTimezone: string,
  ): Promise<Appointment> {
    return this.cancelUC.execute({ id, lawyerId, lawyerName, lawyerEmail, lawyerTimezone });
  }

  complete(id: string, lawyerId: string): Promise<Appointment> {
    return this.completeUC.execute({ id, lawyerId });
  }

  findAll(
    lawyerId: string,
    filters: FilterAppointmentsDto,
  ): Promise<GetAppointmentsOutput> {
    return this.getAppointmentsUC.execute({ lawyerId, filters });
  }

  findOne(id: string, lawyerId: string): Promise<Appointment> {
    return this.getByIdUC.execute({ id, lawyerId });
  }
}
