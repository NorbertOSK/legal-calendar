import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { GetAppointmentByIdUseCase } from './get-appointment-by-id.use-case';
import { IAppointmentsRepository } from '../repositories/appointments.repository.interface';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';
import { AppointmentType } from '../enums/appointment-type.enum';

describe('GetAppointmentByIdUseCase', () => {
  let useCase: GetAppointmentByIdUseCase;
  let mockRepo: jest.Mocked<IAppointmentsRepository>;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAppointmentByIdUseCase,
        { provide: 'IAppointmentsRepository', useValue: mockRepo },
      ],
    }).compile();

    useCase = module.get(GetAppointmentByIdUseCase);
  });

  it('should return appointment when found and owned', async () => {
    const appointment = makeAppointment();
    mockRepo.findById.mockResolvedValue(appointment);

    const result = await useCase.execute({ id: appointmentId, lawyerId });

    expect(result).toBe(appointment);
    expect(mockRepo.findById).toHaveBeenCalledWith(appointmentId);
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

  it('should call findById with the exact id provided', async () => {
    const appointment = makeAppointment();
    mockRepo.findById.mockResolvedValue(appointment);

    await useCase.execute({ id: appointmentId, lawyerId });

    expect(mockRepo.findById).toHaveBeenCalledTimes(1);
    expect(mockRepo.findById).toHaveBeenCalledWith(appointmentId);
  });

  it('should return the appointment regardless of status as long as owner matches', async () => {
    const cancelledAppointment = makeAppointment({ status: AppointmentStatus.CANCELLED });
    mockRepo.findById.mockResolvedValue(cancelledAppointment);

    const result = await useCase.execute({ id: appointmentId, lawyerId });

    expect(result).toBe(cancelledAppointment);
    expect(result.status).toBe(AppointmentStatus.CANCELLED);
  });
});
