import { Injectable } from '@nestjs/common';

@Injectable()
export class TimezoneService {
  toUtc(date: Date, timezone: string): Date {
    const utcStr = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzStr = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMs = tzStr.getTime() - utcStr.getTime();
    return new Date(date.getTime() - offsetMs);
  }

  fromUtc(date: Date, timezone: string): Date {
    const utcStr = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzStr = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const offsetMs = tzStr.getTime() - utcStr.getTime();
    return new Date(date.getTime() + offsetMs);
  }

  formatInTimezone(date: Date, timezone: string, locale = 'es-AR'): string {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }
}
