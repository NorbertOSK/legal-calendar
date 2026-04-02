import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ValidRoles } from '../../auth/interfaces/validRoles';
import { Appointment } from '../../appointments/entities/appointment.entity';

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('users')
@Index('idx_user_role', ['role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @Column('text', { unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 100, default: 'America/Argentina/Buenos_Aires' })
  timezone: string;

  @Column('text', { select: false })
  @Exclude()
  password: string;

  @Column('boolean', { default: true })
  active: boolean;

  @Column({
    type: 'enum',
    enum: ValidRoles,
    default: ValidRoles.LAWYER,
  })
  role: ValidRoles;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column('timestamp without time zone', { nullable: true, default: null })
  emailVerifiedAt: Date | null;

  @OneToMany(() => Appointment, (appointment) => appointment.lawyer)
  appointments: Appointment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt: Date;
}
