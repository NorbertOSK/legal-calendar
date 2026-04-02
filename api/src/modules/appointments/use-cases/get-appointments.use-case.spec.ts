import { Test, TestingModule } from '@nestjs/testing';
import { GetAppointmentsUseCase, GetAppointmentsOutput } from './get-appointments.use-case';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentType } from '../enums/appointment-type.enum';
import { FilterAppointmentsDto } from '../dto/filter-appointments.dto';

describe('GetAppointmentsUseCase', () => {
  let useCase: GetAppointmentsUseCase;
  let mockRepo: jest.Mocked<IAppointmentsRepository>;
  let mockRedis: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'delete'>>;

  const lawyerId = 'lawyer-uuid-001';

  const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
    id: 'appt-uuid-001',
    lawyerId,
    clientName: 'Jane Client',
    clientEmail: 'client@example.com',
    clientPhone: null,
    clientTimezone: null,
    type: AppointmentType.IN_PERSON,
    title: 'Legal Consultation',
    description: null,
    startsAt: new Date('2030-06-15T10:00:00Z'),
    endsAt: new Date('2030-06-15T11:00:00Z'),
    status: AppointmentStatus.SCHEDULED,
    location: null,
    meetingLink: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lawyer: null as any,
    ...overrides,
  });

  const makeFilters = (overrides: Partial<FilterAppointmentsDto> = {}): FilterAppointmentsDto => ({
    page: 1,
    limit: 20,
    ...overrides,
  });

  beforeEach(async () => {
    mockRepo = {
      findById: jest.fn(),
      findByLawyerId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findOverlapping: jest.fn(),
    };

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAppointmentsUseCase,
        { provide: 'IAppointmentsRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    useCase = module.get(GetAppointmentsUseCase);
  });

  it('should return appointments from cache when available', async () => {
    const filters = makeFilters();
    const cachedResult: GetAppointmentsOutput = {
      data: [makeAppointment()],
      total: 1,
      page: 1,
      limit: 20,
    };

    (mockRedis.get as jest.Mock).mockResolvedValue(cachedResult);

    const result = await useCase.execute({ lawyerId, filters });

    expect(result).toBe(cachedResult);
    expect(mockRepo.findByLawyerId).not.toHaveBeenCalled();
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it('should query repository and cache result when cache miss', async () => {
    const filters = makeFilters();
    const appointments = [makeAppointment()];

    (mockRedis.get as jest.Mock).mockResolvedValue(null);
    mockRepo.findByLawyerId.mockResolvedValue({ data: appointments, total: 1 });
    (mockRedis.set as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute({ lawyerId, filters });

    expect(result).toEqual({
      data: appointments,
      total: 1,
      page: 1,
      limit: 20,
    });
    expect(mockRepo.findByLawyerId).toHaveBeenCalledWith(lawyerId, filters);
    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringContaining(`appointments:lawyer:${lawyerId}`),
      expect.objectContaining({ data: appointments, total: 1 }),
      3600,
    );
  });

  it('should use the correct cache key including lawyerId and serialized filters', async () => {
    const filters = makeFilters({ status: AppointmentStatus.SCHEDULED });

    (mockRedis.get as jest.Mock).mockResolvedValue(null);
    mockRepo.findByLawyerId.mockResolvedValue({ data: [], total: 0 });
    (mockRedis.set as jest.Mock).mockResolvedValue(undefined);

    await useCase.execute({ lawyerId, filters });

    const expectedCacheKey = `appointments:lawyer:${lawyerId}:${JSON.stringify(filters)}`;
    expect(mockRedis.get).toHaveBeenCalledWith(expectedCacheKey);
    expect(mockRedis.set).toHaveBeenCalledWith(
      expectedCacheKey,
      expect.any(Object),
      3600,
    );
  });

  it('should use default page=1 and limit=20 when not specified in filters', async () => {
    const filters: FilterAppointmentsDto = {};

    (mockRedis.get as jest.Mock).mockResolvedValue(null);
    mockRepo.findByLawyerId.mockResolvedValue({ data: [], total: 0 });
    (mockRedis.set as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute({ lawyerId, filters });

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should return empty data array and total 0 when no appointments exist', async () => {
    const filters = makeFilters();

    (mockRedis.get as jest.Mock).mockResolvedValue(null);
    mockRepo.findByLawyerId.mockResolvedValue({ data: [], total: 0 });
    (mockRedis.set as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute({ lawyerId, filters });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
