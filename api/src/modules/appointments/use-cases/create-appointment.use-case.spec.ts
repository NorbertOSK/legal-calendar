import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { CreateAppointmentUseCase } from './create-appointment.use-case';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { IcsService } from '../../../shared/services/ics.service';
import { EmailService } from '../../email/email.service';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentType } from '../enums/appointment-type.enum';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';

describe('CreateAppointmentUseCase', () => {
  let useCase: CreateAppointmentUseCase;
  let mockRepo: jest.Mocked<IAppointmentsRepository>;
  let mockRedis: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'delete' | 'deleteByPattern'>>;
  let mockIcsService: jest.Mocked<Pick<IcsService, 'generateIcs'>>;
  let mockEmailService: jest.Mocked<Pick<EmailService, 'sendAppointmentCreated'>>;

  const lawyerId = 'lawyer-uuid-001';
  const lawyerName = 'John Lawyer';
  const lawyerEmail = 'lawyer@example.com';

  const makeDto = (overrides: Partial<CreateAppointmentDto> = {}): CreateAppointmentDto => ({
    title: 'Legal Consultation',
    clientName: 'Jane Client',
    clientEmail: 'client@example.com',
    type: AppointmentType.IN_PERSON,
    startsAt: '2030-06-15T10:00:00Z',
    endsAt: '2030-06-15T11:00:00Z',
    ...overrides,
  });

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
      deleteByPattern: jest.fn(),
    } as any;

    mockIcsService = {
      generateIcs: jest.fn().mockReturnValue('ics-content'),
    };

    mockEmailService = {
      sendAppointmentCreated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAppointmentUseCase,
        { provide: 'IAppointmentsRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
        { provide: IcsService, useValue: mockIcsService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    useCase = module.get(CreateAppointmentUseCase);
  });

  it('should create appointment successfully', async () => {
    const dto = makeDto();
    const savedAppointment = makeAppointment();

    mockRepo.findOverlapping.mockResolvedValue([]);
    mockRepo.save.mockResolvedValue(savedAppointment);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' });

    expect(result).toBe(savedAppointment);
    expect(mockRepo.findOverlapping).toHaveBeenCalledWith(
      lawyerId,
      new Date(dto.startsAt),
      new Date(dto.endsAt),
    );
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should throw APT0006 when startsAt >= endsAt (equal times)', async () => {
    const dto = makeDto({
      startsAt: '2030-06-15T10:00:00Z',
      endsAt: '2030-06-15T10:00:00Z',
    });

    await expect(
      useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0006');
    }
  });

  it('should throw APT0006 when startsAt > endsAt', async () => {
    const dto = makeDto({
      startsAt: '2030-06-15T12:00:00Z',
      endsAt: '2030-06-15T10:00:00Z',
    });

    await expect(
      useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0006');
    }
  });

  it('should throw APT0007 when startsAt is in the past', async () => {
    const dto = makeDto({
      startsAt: '2000-01-01T10:00:00Z',
      endsAt: '2000-01-01T11:00:00Z',
    });

    await expect(
      useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0007');
    }
  });

  it('should throw APT0001 when overlapping appointment exists', async () => {
    const dto = makeDto();
    mockRepo.findOverlapping.mockResolvedValue([makeAppointment()]);

    await expect(
      useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' }),
    ).rejects.toThrow(ConflictException);

    try {
      await useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0001');
    }
  });

  it('should invalidate Redis cache after creation', async () => {
    const dto = makeDto();
    mockRepo.findOverlapping.mockResolvedValue([]);
    mockRepo.save.mockResolvedValue(makeAppointment());
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    await useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' });

    expect(mockRedis.deleteByPattern).toHaveBeenCalledWith(`appointments:lawyer:${lawyerId}:*`);
  });

  it('should call ICS service and email service after saving', async () => {
    const dto = makeDto();
    const savedAppointment = makeAppointment();

    mockRepo.findOverlapping.mockResolvedValue([]);
    mockRepo.save.mockResolvedValue(savedAppointment);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    await useCase.execute({ dto, lawyerId, lawyerName, lawyerEmail, lawyerTimezone: 'America/Argentina/Buenos_Aires' });

    expect(mockIcsService.generateIcs).toHaveBeenCalledWith(
      expect.objectContaining({
        id: savedAppointment.id,
        organizerEmail: lawyerEmail,
        attendeeEmail: savedAppointment.clientEmail,
      }),
      'REQUEST',
    );
    expect(mockEmailService.sendAppointmentCreated).toHaveBeenCalledWith(
      savedAppointment.clientEmail,
      expect.any(Object),
      'ics-content',
    );
  });
});
