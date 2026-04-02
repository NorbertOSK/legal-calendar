import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUuidOrEmailPipe implements PipeTransform {
  transform(value: string) {
    if (/\S+@\S+\.\S+/.test(value)) {
      return value;
    }

    if (!isUUID(value))
      throw new BadRequestException({ ok: false, msgCode: 'VAL0002' });

    return value;
  }
}
