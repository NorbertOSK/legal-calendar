import { Module } from '@nestjs/common';
import { IcsService } from './services/ics.service';
import { TimezoneService } from './services/timezone.service';

@Module({
  providers: [IcsService, TimezoneService],
  exports: [IcsService, TimezoneService],
})
export class SharedModule {}
