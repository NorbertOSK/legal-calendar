import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateAppointmentUseCase } from './update-appointment.use-case';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { RedisService } from '../../redis/redis.service';
import { IcsService } from '../../../shared/services/ics.service';
import { EmailService } from '../../email/email.service';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentType } from '../enums/appointment-type.enum';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';

describe('UpdateAppointmentUseCase', () => {
  let useCase: UpdateAppointmentUseCase;
  let mockRepo: jest.Mocked<IAppointmentsRepository>;
  let mockRedis: jest.Mocked<Pick<RedisService, 'get' | 'set' | 'delete' | 'deleteByPattern'>>;
  let mockIcsService: jest.Mocked<Pick<IcsService, 'generateIcs'>>;
  let mockEmailService: jest.Mocked<Pick<EmailService, 'sendAppointmentUpdated'>>;

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
    location: 'Av. Corrientes 1234, CABA',
    meetingLink: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lawyer: null as any,
    ...overrides,
  });

  const makeInput = (dtoOverrides: Partial<UpdateAppointmentDto> = {}, lawyerIdOverride = lawyerId) => ({
    id: appointmentId,
    dto: dtoOverrides as UpdateAppointmentDto,
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
      sendAppointmentUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateAppointmentUseCase,
        { provide: 'IAppointmentsRepository', useValue: mockRepo },
        { provide: RedisService, useValue: mockRedis },
        { provide: IcsService, useValue: mockIcsService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    useCase = module.get(UpdateAppointmentUseCase);
  });

  it('should update appointment successfully', async () => {
    const existing = makeAppointment();
    const updated = makeAppointment({ title: 'Updated Title' });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.findOverlapping.mockResolvedValue([]);
    mockRepo.update.mockResolvedValue(updated);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute(makeInput({ title: 'Updated Title' }));

    expect(result).toBe(updated);
    expect(mockRepo.update).toHaveBeenCalledWith(appointmentId, expect.objectContaining({ title: 'Updated Title' }));
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

  it('should throw APT0003 when not the owner', async () => {
    mockRepo.findById.mockResolvedValue(makeAppointment());

    await expect(useCase.execute(makeInput({}, otherLawyerId))).rejects.toThrow(ForbiddenException);

    try {
      await useCase.execute(makeInput({}, otherLawyerId));
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0003');
    }
  });

  it('should throw APT0004 when appointment is cancelled', async () => {
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

  it('should throw APT0001 when update causes overlap', async () => {
    const existing = makeAppointment();
    const conflicting = makeAppointment({ id: 'other-appt-uuid' });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.findOverlapping.mockResolvedValue([conflicting]);

    const input = makeInput({
      startsAt: '2030-06-15T10:30:00Z',
      endsAt: '2030-06-15T11:30:00Z',
    });

    await expect(useCase.execute(input)).rejects.toThrow(ConflictException);

    try {
      await useCase.execute(input);
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0001');
    }
  });

  it('should invalidate Redis cache after update', async () => {
    const existing = makeAppointment();
    const updated = makeAppointment({ title: 'New Title' });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.findOverlapping.mockResolvedValue([]);
    mockRepo.update.mockResolvedValue(updated);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    await useCase.execute(makeInput({ title: 'New Title' }));

    expect(mockRedis.deleteByPattern).toHaveBeenCalledWith(`appointments:lawyer:${lawyerId}:*`);
  });

  it('should send update email with ICS after updating', async () => {
    const existing = makeAppointment();
    const updated = makeAppointment({ title: 'New Title' });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.findOverlapping.mockResolvedValue([]);
    mockRepo.update.mockResolvedValue(updated);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    await useCase.execute(makeInput({ title: 'New Title' }));

    expect(mockIcsService.generateIcs).toHaveBeenCalledWith(
      expect.objectContaining({ id: updated.id }),
      'REQUEST',
    );
    expect(mockEmailService.sendAppointmentUpdated).toHaveBeenCalledWith(
      updated.clientEmail,
      expect.any(Object),
      'ics-content',
    );
  });

  it('should throw APT0008 when PATCH nullifies location on IN_PERSON appointment', async () => {
    mockRepo.findById.mockResolvedValue(
      makeAppointment({ type: AppointmentType.IN_PERSON, location: 'Office 123' }),
    );

    await expect(
      useCase.execute(makeInput({ location: null as any })),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute(makeInput({ location: null as any }));
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0008');
    }
  });

  it('should throw APT0008 when type changes to VIDEO_CALL without meetingLink', async () => {
    mockRepo.findById.mockResolvedValue(
      makeAppointment({ type: AppointmentType.IN_PERSON, location: 'Office 123' }),
    );

    await expect(
      useCase.execute(makeInput({ type: AppointmentType.VIDEO_CALL })),
    ).rejects.toThrow(BadRequestException);

    try {
      await useCase.execute(makeInput({ type: AppointmentType.VIDEO_CALL }));
    } catch (error: any) {
      expect(error.response.msgCode).toBe('APT0008');
    }
  });

  it('should allow PATCH that changes type when required field is provided', async () => {
    const existing = makeAppointment({ type: AppointmentType.IN_PERSON, location: 'Office 123' });
    const updated = makeAppointment({ type: AppointmentType.VIDEO_CALL, meetingLink: 'https://meet.example.com/abc' });

    mockRepo.findById.mockResolvedValue(existing);
    mockRepo.findOverlapping.mockResolvedValue([]);
    mockRepo.update.mockResolvedValue(updated);
    (mockRedis.deleteByPattern as jest.Mock).mockResolvedValue(undefined);

    const result = await useCase.execute(
      makeInput({ type: AppointmentType.VIDEO_CALL, meetingLink: 'https://meet.example.com/abc' }),
    );

    expect(result).toBe(updated);
  });
});
