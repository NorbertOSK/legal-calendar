import { Appointment } from '../entities/appointment.entity';
import { FilterAppointmentsDto } from '../dto/filter-appointments.dto';

export interface IAppointmentsRepository {
  findById(id: string): Promise<Appointment | null>;
  findByLawyerId(
    lawyerId: string,
    filters?: FilterAppointmentsDto,
  ): Promise<{ data: Appointment[]; total: number }>;
  save(data: Partial<Appointment>): Promise<Appointment>;
  update(id: string, data: Partial<Appointment>): Promise<Appointment>;
  findOverlapping(
    lawyerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]>;
}
