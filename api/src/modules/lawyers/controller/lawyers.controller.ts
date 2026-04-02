import {
  Controller,
  Get,
  Body,
  Patch,
  Post,
  Delete,
  Param,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { LawyersService } from '../service/lawyers.service';
import { ChangeEmailRequestDto, UpdateLawyerDto } from '../dto';
import { User } from '../entities/user.entity';
import { GetUser } from '../decorators';
import { ValidRoles } from 'src/modules/auth/interfaces/validRoles';
import { Auth } from 'src/modules/auth/decorators';

@Controller()
export class LawyersController {
  constructor(private readonly lawyersService: LawyersService) {}

  @Get('lawyers/profile')
  @Auth(ValidRoles.LAWYER, ValidRoles.ADMIN)
  getMyProfile(@GetUser() user: User) {
    return this.lawyersService.getMyProfile(user);
  }

  @Patch('lawyers/profile')
  @Auth(ValidRoles.LAWYER, ValidRoles.ADMIN)
  update(@GetUser() user: User, @Body() dto: UpdateLawyerDto) {
    return this.lawyersService.update(user, dto);
  }

  @Post('lawyers/change-email/request')
  @Auth(ValidRoles.LAWYER, ValidRoles.ADMIN)
  requestChangeEmail(
    @GetUser() user: User,
    @Body() dto: ChangeEmailRequestDto,
  ) {
    return this.lawyersService.requestChangeEmail(user, dto);
  }

  @Delete('lawyers/delete-account')
  @Auth(ValidRoles.LAWYER)
  deleteAccount(@GetUser() user: User) {
    return this.lawyersService.remove(user, user.id);
  }

  @Get('admin/lawyers')
  @Auth(ValidRoles.ADMIN)
  findAll(
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  ) {
    return this.lawyersService.findAllLawyers({ limit, page });
  }

  @Patch('admin/lawyers/:id/toggle-status')
  @Auth(ValidRoles.ADMIN)
  toggleStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ) {
    return this.lawyersService.toggleStatus(id, user.id);
  }
}
