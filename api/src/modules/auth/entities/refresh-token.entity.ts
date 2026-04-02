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

@Entity('refresh_tokens')
@Index('idx_refresh_token_hash', ['tokenHash'])
@Index('idx_refresh_token_user', ['userId'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('text')
  tokenHash: string;

  @Column('timestamp without time zone')
  expiresAt: Date;

  @Column('timestamp without time zone', { nullable: true, default: null })
  revokedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
