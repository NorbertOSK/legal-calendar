import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../lawyers/entities/user.entity';
import { AppointmentType } from '../enums/appointment-type.enum';
import { AppointmentStatus } from '../enums/appointment-status.enum';

@Entity('appointments')
@Index('idx_appointment_lawyer', ['lawyerId'])
@Index('idx_appointment_lawyer_starts', ['lawyerId', 'startsAt'])
@Index('idx_appointment_lawyer_status', ['lawyerId', 'status'])
@Index('idx_appointment_overlap', ['lawyerId', 'startsAt', 'endsAt'])
@Index('idx_appointment_client_email', ['clientEmail'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  lawyerId: string;

  @ManyToOne(() => User, (user) => user.appointments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lawyerId' })
  lawyer: User;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'varchar', length: 255 })
  clientEmail: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  clientPhone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  clientTimezone: string | null;

  @Column({ type: 'enum', enum: AppointmentType })
  type: AppointmentType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'timestamptz' })
  startsAt: Date;

  @Column({ type: 'timestamptz' })
  endsAt: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status: AppointmentStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  meetingLink: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
