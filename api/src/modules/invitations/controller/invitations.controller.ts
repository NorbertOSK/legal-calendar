import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InvitationsService } from '../service/invitations.service';
import { CreateInvitationDto } from '../dto/create-invitation.dto';
import { Auth } from 'src/modules/auth/decorators';
import { ValidRoles } from 'src/modules/auth/interfaces';
import { GetUser } from 'src/modules/lawyers/decorators';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { RegisterInvitedDto } from 'src/modules/auth/dto/register-invited.dto';

@Controller()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('admin/invitations')
  @Auth(ValidRoles.ADMIN)
  create(
    @Body() createInvitationDto: CreateInvitationDto,
    @GetUser() user: User,
  ) {
    return this.invitationsService.create(createInvitationDto.email, user);
  }

  @Get('admin/invitations')
  @Auth(ValidRoles.ADMIN)
  findAll() {
    return this.invitationsService.findAll();
  }

  @Post('admin/invitations/:id/resend')
  @Auth(ValidRoles.ADMIN)
  @HttpCode(HttpStatus.OK)
  resend(@Param('id', ParseUUIDPipe) id: string) {
    return this.invitationsService.resend(id);
  }

  @Get('invitations/validate/:token')
  validateToken(@Param('token') token: string) {
    return this.invitationsService.validateToken(token);
  }

  @Post('auth/register-invited')
  @HttpCode(HttpStatus.OK)
  acceptInvitation(@Body() registerInvitedDto: RegisterInvitedDto) {
    return this.invitationsService.acceptInvitation(registerInvitedDto.token, {
      name: registerInvitedDto.name,
      password: registerInvitedDto.password,
    });
  }
}
