import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../lawyers/entities/user.entity';

@Entity('admin_invitations')
@Index('idx_invitation_token', ['token'], { unique: true })
@Index('idx_invitation_email', ['email'])
export class AdminInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  email: string;

  @Column('uuid')
  invitedById: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitedById' })
  invitedBy: User;

  @Column('text', { unique: true })
  token: string;

  @Column('timestamp without time zone')
  expiresAt: Date;

  @Column('timestamp without time zone', { nullable: true, default: null })
  acceptedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
