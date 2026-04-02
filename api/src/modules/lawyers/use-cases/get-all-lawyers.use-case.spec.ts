import { Test, TestingModule } from '@nestjs/testing';
import { GetAllLawyersUseCase } from './get-all-lawyers.use-case';
import { ILawyersRepository } from '../repositories/lawyers.repository.interface';
import { User, UserStatus } from '../entities/user.entity';
import { ValidRoles } from '../../auth/interfaces/validRoles';

describe('GetAllLawyersUseCase', () => {
  let useCase: GetAllLawyersUseCase;
  let mockRepo: jest.Mocked<Pick<ILawyersRepository, 'findAll'>>;

  const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-uuid-001',
    name: 'john lawyer',
    email: 'lawyer@example.com',
    country: 'AR',
    timezone: 'America/Argentina/Buenos_Aires',
    password: 'hashed-password',
    active: true,
    role: ValidRoles.LAWYER,
    status: UserStatus.ACTIVE,
    emailVerifiedAt: new Date(),
    appointments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    mockRepo = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAllLawyersUseCase,
        { provide: 'ILawyersRepository', useValue: mockRepo },
      ],
    }).compile();

    useCase = module.get(GetAllLawyersUseCase);
  });

  it('should return lawyers with default pagination', async () => {
    const users = [makeUser()];
    mockRepo.findAll.mockResolvedValue([users, 1]);

    const result = await useCase.execute({});

    expect(result).toEqual({ ok: true, data: users, total: 1 });
    expect(mockRepo.findAll).toHaveBeenCalledWith({ limit: 20, offset: 0 });
  });

  it('should return lawyers with custom pagination', async () => {
    const users = [makeUser(), makeUser({ id: 'user-uuid-002' })];
    mockRepo.findAll.mockResolvedValue([users, 50]);

    const result = await useCase.execute({ limit: 10, page: 3 });

    expect(result).toEqual({ ok: true, data: users, total: 50 });
    expect(mockRepo.findAll).toHaveBeenCalledWith({ limit: 10, offset: 20 });
  });

  it('should return empty result when no lawyers exist', async () => {
    mockRepo.findAll.mockResolvedValue([[], 0]);

    const result = await useCase.execute({});

    expect(result).toEqual({ ok: true, data: [], total: 0 });
    expect(mockRepo.findAll).toHaveBeenCalled();
  });
});
