import { Inject, Injectable, Logger } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { User } from '../entities/user.entity';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';

export interface GetAllLawyersInput {
  limit?: number;
  page?: number;
}

export interface GetAllLawyersOutput {
  ok: boolean;
  data: User[];
  total: number;
}

@Injectable()
export class GetAllLawyersUseCase
  implements IUseCase<GetAllLawyersInput, GetAllLawyersOutput>
{
  private readonly logger = new Logger(GetAllLawyersUseCase.name);

  constructor(
    @Inject('ILawyersRepository')
    private readonly lawyersRepository: ILawyersRepository,
  ) {}

  async execute({ limit = 20, page = 1 }: GetAllLawyersInput): Promise<GetAllLawyersOutput> {
    const offset = (page - 1) * limit;
    const [data, total] = await this.lawyersRepository.findAll({ limit, offset });

    this.logger.log(`Listed ${data.length} lawyers (total: ${total})`);

    return { ok: true, data, total };
  }
}
