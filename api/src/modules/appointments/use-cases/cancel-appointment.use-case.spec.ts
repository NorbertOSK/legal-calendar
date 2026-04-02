import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CancelAppointmentUseCase } from './cancel-appointment.use-case';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { IcsService } from '../../../shared/services/ics.service';
import { EmailService } from '../../email/email.service';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentType } from '../enums/appointment-type.enum';

describe('CancelAppointmentUseCase', () => {
  let useCase: CancelAppointmentUseCase;
  let mockRepo: jest.Mocked<IAppointmentsRepository>;
  let mockRedis: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'delete' | 'deleteByPattern'>>;
  let mockIcsService: jest.Mocked<Pick<IcsService, 'generateIcs'>>;
  let mockEmailService: jest.Mocked<Pick<EmailService, 'sendAppointmentCancelled'>>;

  const appointmentId = 'appt-uuid-001';
  const lawyerId = 'lawyer-uuid-001';
  const otherLawyerId = 'lawyer-uuid-999';
  const lawyerName = 'John Lawyer';
  const lawyerEmail = 'lawyer@example.com';

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

  const makeInput = (idOverride = appointmentId, lawyerIdOverride = lawyerId) => ({
    id: idOverride,
    lawyerId: lawyerIdOverride,
    lawyerName,
    lawyerEmail,
    lawyerTimezone: 'America/Argentina/Buenos_Aires',
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
      sendAppointmentCancelled: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelAppointmentUseCase,
        { provide: 'IAppointmentsRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
        { provide: IcsService, useValue: mockIcsService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    useCase = module.get(CancelAppointmentUseCase);
  });

  it('should cancel appointment successfully', async () => {
    const existing = makeAppointment();
    const cancelled = makeAppointment({ status: AppointmentStatus.CANCELLED });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(cancelled);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute(makeInput());

    expect(result).toBe(cancelled);
    expect(mockRepo.update).toHaveBeenCalledWith(appointmentId, {
      status: AppointmentStatus.CANCELLED,
    });
    expect(mockRedis.deleteByPattern).toHaveBeenCalledWith(`appointments:lawyer:${lawyerId}:*`);
  });

  it('should throw APT0002 when appointment not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute(makeInput())).rejects.toThrow(NotFoundException);

    try {
      await useCase.execute(makeInput());
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0002');
    }
  });

  it('should throw APT0003 when not owner', async () => {
    mockRepo.findById.mockResolvedValue(makeAppointment());

    await expect(useCase.execute(makeInput(appointmentId, otherLawyerId))).rejects.toThrow(ForbiddenException);

    try {
      await useCase.execute(makeInput(appointmentId, otherLawyerId));
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0003');
    }
  });

  it('should throw APT0004 when already cancelled', async () => {
    mockRepo.findById.mockResolvedValue(
      makeAppointment({ status: AppointmentStatus.CANCELLED }),
    );

    await expect(useCase.execute(makeInput())).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute(makeInput());
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0004');
    }
  });

  it('should throw APT0004 when appointment is already COMPLETED', async () => {
    mockRepo.findById.mockResolvedValue(
      makeAppointment({ status: AppointmentStatus.COMPLETED }),
    );

    await expect(useCase.execute(makeInput())).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute(makeInput());
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0004');
    }
  });

  it('should send CANCEL ICS and email after cancellation', async () => {
    const existing = makeAppointment();
    const cancelled = makeAppointment({ status: AppointmentStatus.CANCELLED });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.update.mockResolvedValue(cancelled);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    await useCase.execute(makeInput());

    expect(mockIcsService.generateIcs).toHaveBeenCalledWith(
      expect.objectContaining({ id: cancelled.id }),
      'CANCEL',
    );
    expect(mockEmailService.sendAppointmentCancelled).toHaveBeenCalledWith(
      cancelled.clientEmail,
      expect.any(Object),
      'ics-content',
    );
  });
});
