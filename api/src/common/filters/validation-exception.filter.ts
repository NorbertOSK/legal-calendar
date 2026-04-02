import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    if (exceptionResponse.message && Array.isArray(exceptionResponse.message)) {
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
      message: exceptionResponse.message || 'Bad Request',
    });
  }
}
