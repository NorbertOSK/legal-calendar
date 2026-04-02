import {
  ArgumentMetadata,
  Injectable,
  PipeTransform,
  BadRequestException,
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUuidPipe implements PipeTransform {
  transform(value: string, _metadata: ArgumentMetadata) {
    if (!isUUID(value))
      throw new BadRequestException({ ok: false, msgCode: 'VAL0001' });

    return value;
  }
}
