import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { EmailVerificationPurpose } from '../enums/email-verification-purpose.enum';

@Entity('email_verifications')
@Index('idx_email_verification_user_purpose', ['userId', 'purpose'])
@Index('idx_email_verification_target_email', ['targetEmail'])
@Index('idx_email_verification_verification_token', ['verificationToken'], {
  unique: true,
})
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: EmailVerificationPurpose,
  })
  purpose: EmailVerificationPurpose;

  @Column('text')
  targetEmail: string;

  @Column('text')
  codeHash: string;

  @Column('text', { unique: true })
  verificationToken: string;

  @Column('timestamp without time zone')
  expiresAt: Date;

  @Column('timestamp without time zone', { nullable: true, default: null })
  consumedAt: Date | null;

  @Column('int', { default: 0 })
  attempts: number;

  @Column('int', { default: 0 })
  resendCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
