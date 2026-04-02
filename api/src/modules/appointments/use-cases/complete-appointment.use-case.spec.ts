import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CompleteAppointmentUseCase } from './complete-appointment.use-case';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentType } from '../enums/appointment-type.enum';

describe('CompleteAppointmentUseCase', () => {
  let useCase: CompleteAppointmentUseCase;
  let mockRepo: jest.Mocked<IAppointmentsRepository>;
  let mockRedis: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'delete' | 'deleteByPattern'>>;

  const appointmentId = 'appt-uuid-001';
  const lawyerId = 'lawyer-uuid-001';
  const otherLawyerId = 'lawyer-uuid-999';

  const makeAppointment = (overrides: Partial<Appointment> = {}): Appointment => ({
    id: appointmentId,
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompleteAppointmentUseCase,
        { provide: 'IAppointmentsRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    useCase = module.get(CompleteAppointmentUseCase);
  });

  it('should complete appointment successfully', async () => {
    const existing = makeAppointment();
    const completed = makeAppointment({ status: AppointmentStatus.COMPLETED });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(completed);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute({ id: appointmentId, lawyerId });

    expect(result).toBe(completed);
    expect(mockRepo.update).toHaveBeenCalledWith(appointmentId, {
      status: AppointmentStatus.COMPLETED,
    });
    expect(mockRedis.deleteByPattern).toHaveBeenCalledWith(`appointments:lawyer:${lawyerId}:*`);
  });

  it('should throw APT0002 when appointment not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: appointmentId, lawyerId }),
    ).rejects.toThrow(NotFoundException);

    try {
      await useCase.execute({ id: appointmentId, lawyerId });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0002');
    }
  });

  it('should throw APT0003 when not owner', async () => {
    mockRepo.findById.mockResolvedValue(makeAppointment());

    await expect(
      useCase.execute({ id: appointmentId, lawyerId: otherLawyerId }),
    ).rejects.toThrow(ForbiddenException);

    try {
      await useCase.execute({ id: appointmentId, lawyerId: otherLawyerId });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0003');
    }
  });

  it('should throw APT0005 when appointment is cancelled', async () => {
    mockRepo.findById.mockResolvedValue(
      makeAppointment({ status: AppointmentStatus.CANCELLED }),
    );

    await expect(
      useCase.execute({ id: appointmentId, lawyerId }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({ id: appointmentId, lawyerId });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0005');
    }
  });

  it('should throw APT0005 when appointment is already COMPLETED', async () => {
    mockRepo.findById.mockResolvedValue(
      makeAppointment({ status: AppointmentStatus.COMPLETED }),
    );

    await expect(
      useCase.execute({ id: appointmentId, lawyerId }),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute({ id: appointmentId, lawyerId });
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0005');
    }
  });

  it('should invalidate Redis cache after completing', async () => {
    const existing = makeAppointment();
    const completed = makeAppointment({ status: AppointmentStatus.COMPLETED });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(completed);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    await useCase.execute({ id: appointmentId, lawyerId });

    expect(mockRedis.deleteByPattern).toHaveBeenCalledTimes(1);
    expect(mockRedis.deleteByPattern).toHaveBeenCalledWith(`appointments:lawyer:${lawyerId}:*`);
  });
});
