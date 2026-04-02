import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../../shared/shared.module';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsTypeOrmRepository } from './repositories/appointments.repository';
import { CreateAppointmentUseCase } from './use-cases/create-appointment.use-case';
import { UpdateAppointmentUseCase } from './use-cases/update-appointment.use-case';
import { CancelAppointmentUseCase } from './use-cases/cancel-appointment.use-case';
import { CompleteAppointmentUseCase } from './use-cases/complete-appointment.use-case';
import { GetAppointmentsUseCase } from './use-cases/get-appointments.use-case';
import { GetAppointmentByIdUseCase } from './use-cases/get-appointment-by-id.use-case';
import { AppointmentsService } from './service/appointments.service';
import { AppointmentsController } from './controller/appointments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    SharedModule,
  ],
  controllers: [AppointmentsController],
  providers: [
    {
      provide: 'IAppointmentsRepository',
      useClass: AppointmentsTypeOrmRepository,
    },
    {
      provide: 'CreateAppointmentUseCase',
      useClass: CreateAppointmentUseCase,
    },
    {
      provide: 'UpdateAppointmentUseCase',
      useClass: UpdateAppointmentUseCase,
    },
    {
      provide: 'CancelAppointmentUseCase',
      useClass: CancelAppointmentUseCase,
    },
    {
      provide: 'CompleteAppointmentUseCase',
      useClass: CompleteAppointmentUseCase,
    },
    {
      provide: 'GetAppointmentsUseCase',
      useClass: GetAppointmentsUseCase,
    },
    {
      provide: 'GetAppointmentByIdUseCase',
      useClass: GetAppointmentByIdUseCase,
    },
    AppointmentsService,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
