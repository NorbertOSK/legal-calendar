import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { IAppointmentsRepository } from './appointments.repository.interface';
import { FilterAppointmentsDto } from '../dto/filter-appointments.dto';
import { AppointmentStatus } from '../enums/appointment-status.enum';

@Injectable()
export class AppointmentsTypeOrmRepository implements IAppointmentsRepository {
  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
  ) {}

  async findById(id: string): Promise<Appointment | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByLawyerId(
    lawyerId: string,
    filters?: FilterAppointmentsDto,
  ): Promise<{ data: Appointment[]; total: number }> {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder('appointment')
      .where('appointment.lawyerId = :lawyerId', { lawyerId });

    if (filters?.status) {
      qb.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters?.from) {
      qb.andWhere('appointment.startsAt >= :from', {
        from: new Date(filters.from),
      });
    }

    if (filters?.to) {
      qb.andWhere('appointment.startsAt <= :to', {
        to: new Date(filters.to),
      });
    }

    if (filters?.clientEmail) {
      qb.andWhere('appointment.clientEmail = :clientEmail', {
        clientEmail: filters.clientEmail,
      });
    }

    qb.orderBy('appointment.startsAt', 'ASC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total };
  }

  async save(data: Partial<Appointment>): Promise<Appointment> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Appointment>): Promise<Appointment> {
    const preloaded = await this.repo.preload({ id, ...data });
    if (!preloaded) {
      throw new Error(`Appointment ${id} not found for update`);
    }
    return this.repo.save(preloaded);
  }

  async findOverlapping(
    lawyerId: string,
    startsAt: Date,
    endsAt: Date,
    excludeId?: string,
  ): Promise<Appointment[]> {
    const qb = this.repo
      .createQueryBuilder('appointment')
      .where('appointment.lawyerId = :lawyerId', { lawyerId })
      .andWhere('appointment.status = :status', {
        status: AppointmentStatus.SCHEDULED,
      })
      .andWhere('appointment.startsAt < :endsAt', { endsAt })
      .andWhere('appointment.endsAt > :startsAt', { startsAt });

    if (excludeId) {
      qb.andWhere('appointment.id != :excludeId', { excludeId });
    }

    return qb.getMany();
  }
}
