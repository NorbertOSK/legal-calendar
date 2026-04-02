import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AppointmentsService } from '../service/appointments.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { FilterAppointmentsDto } from '../dto/filter-appointments.dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { GetUser } from '../../lawyers/decorators/get-user.decorator';
import { ValidRoles } from '../../auth/interfaces/validRoles';
import { User } from '../../lawyers/entities/user.entity';
import { Appointment } from '../entities/appointment.entity';
import { GetAppointmentsOutput } from '../use-cases/get-appointments.use-case';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Auth(ValidRoles.LAWYER)
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  create(
    @Body() dto: CreateAppointmentDto,
    @GetUser() user: User,
  ): Promise<Appointment> {
    return this.appointmentsService.create(dto, user.id, user.name, user.email, user.timezone);
  }

  @Get()
  @Auth(ValidRoles.LAWYER)
  @Throttle({ short: { ttl: 60000, limit: 60 } })
  findAll(
    @GetUser() user: User,
    @Query() filters: FilterAppointmentsDto,
  ): Promise<GetAppointmentsOutput> {
    return this.appointmentsService.findAll(user.id, filters);
  }

  @Get(':id')
  @Auth(ValidRoles.LAWYER)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.appointmentsService.findOne(id, user.id);
  }

  @Patch(':id')
  @Auth(ValidRoles.LAWYER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @GetUser() user: User,
  ) {
    return this.appointmentsService.update(id, dto, user.id, user.name, user.email, user.timezone);
  }

  @Patch(':id/cancel')
  @Auth(ValidRoles.LAWYER)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.appointmentsService.cancel(id, user.id, user.name, user.email, user.timezone);
  }

  @Patch(':id/complete')
  @Auth(ValidRoles.LAWYER)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.appointmentsService.complete(id, user.id);
  }
}
