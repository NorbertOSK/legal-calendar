import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { GetUser } from 'src/modules/lawyers/decorators';
import { User } from 'src/modules/lawyers/entities/user.entity';
import { AuthService } from '../service/auth.service';
import { Auth } from '../decorators';
import {
  CreateUserDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  LoginUserDto,
  RefreshTokenDto,
} from '../dto';
import { ValidRoles } from '../interfaces';
import { ForgotPasswordAuthGuard } from '../guards';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from 'src/modules/email-verification/dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  signup(@Body() createUserDto: CreateUserDto) {
    return this.authService.signup(createUserDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Headers('x-token') authToken?: string,
  ) {
    return this.authService.verifyEmail(verifyEmailDto, authToken);
  }

  @Post('verify-email/resend')
  @HttpCode(HttpStatus.OK)
  resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
    @Headers('x-token') authToken?: string,
  ) {
    return this.authService.resendVerification(resendVerificationDto, authToken);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-status')
  @Auth(ValidRoles.LAWYER, ValidRoles.ADMIN)
  checkAuthStatus(@GetUser() user: User) {
    return this.authService.checkAuthStatus(user);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { ttl: 60000, limit: 3 } })
  forgotPassword(@Body() forgotPassword: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPassword);
  }

  @Patch('reset-password')
  @UseGuards(ForgotPasswordAuthGuard)
  resetPassword(
    @GetUser() user: User,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(resetPasswordDto, user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto.refreshToken);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRoles.LAWYER, ValidRoles.ADMIN)
  logoutAll(@GetUser() user: User) {
    return this.authService.logoutAll(user.id);
  }
}
