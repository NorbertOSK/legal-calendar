import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AdminInvitation } from './entities/admin-invitation.entity';
import { LawyersModule } from 'src/modules/lawyers/lawyers.module';

import { InvitationsController } from './controller/invitations.controller';
import { InvitationsService } from './service/invitations.service';

import { InvitationsRepository } from './repositories/invitations.repository';

import { CreateInvitationUseCase } from './use-cases/create-invitation.use-case';
import { RegisterInvitedUseCase } from './use-cases/register-invited.use-case';

@Module({
  controllers: [InvitationsController],
  providers: [
    InvitationsService,
    {
      provide: 'IInvitationsRepository',
      useClass: InvitationsRepository,
    },
    CreateInvitationUseCase,
    RegisterInvitedUseCase,
  ],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AdminInvitation]),
    LawyersModule,
  ],
  exports: [InvitationsService],
})
export class InvitationsModule {}
