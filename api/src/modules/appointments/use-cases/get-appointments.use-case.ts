import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../shared/interfaces/use-case.interface';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { FilterAppointmentsDto } from '../dto/filter-appointments.dto';
import { Appointment } from '../entities/appointment.entity';

interface GetAppointmentsInput {
  lawyerId: string;
  filters: FilterAppointmentsDto;
}

export interface GetAppointmentsOutput {
  data: Appointment[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class GetAppointmentsUseCase
  implements IUseCase<GetAppointmentsInput, GetAppointmentsOutput>
{
  constructor(
    @Inject('IAppointmentsRepository')
    private readonly repo: IAppointmentsRepository,
    private readonly redisService: RedisService,
  ) {}

  async execute(input: GetAppointmentsInput): Promise<GetAppointmentsOutput> {
    const { lawyerId, filters } = input;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;

    const serializedFilters = JSON.stringify(filters);
    const cacheKey = `appointments:lawyer:${lawyerId}:${serializedFilters}`;

    const cached =
      await this.redisService.get<GetAppointmentsOutput>(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, total } = await this.repo.findByLawyerId(lawyerId, filters);

    const result: GetAppointmentsOutput = { data, total, page, limit };

    await this.redisService.set(cacheKey, result, 3600);

    return result;
  }
}
