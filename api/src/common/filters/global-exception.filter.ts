import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof ThrottlerException) {
      return response.status(429).json({
        ok: false,
        msgCode: 'THR0001',
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      if (
        exceptionResponse.message &&
        Array.isArray(exceptionResponse.message)
      ) {
        return response.status(status).json({
          ok: false,
          errors: exceptionResponse.message.map((msgCode: string) => ({
            msgCode,
          })),
        });
      }

      if (exceptionResponse.msgCode) {
        return response.status(status).json({
          ok: false,
          msgCode: exceptionResponse.msgCode,
        });
      }

      return response.status(status).json({
        ok: false,
        msgCode: 'GEN0001',
      });
    }

    this.logger.error('Unhandled exception', exception);
    return response.status(500).json({
      ok: false,
      msgCode: 'GEN0001',
    });
  }
}
