import { Injectable } from '@nestjs/common';

export type IcsMethod = 'REQUEST' | 'CANCEL';

export interface IcsEventData {
  id: string;
  title: string;
  description?: string;
  location?: string;
  meetingLink?: string;
  startsAt: Date;
  endsAt: Date;
  sequence?: number;
  organizerName: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail: string;
}

@Injectable()
export class IcsService {
  generateIcs(event: IcsEventData, method: IcsMethod): string {
    const uid = `appointment-${event.id}@legalcalendar.app`;
    const dtStart = this.formatDate(event.startsAt);
    const dtEnd = this.formatDate(event.endsAt);
    const now = this.formatDate(new Date());
    const sequence = event.sequence ?? 0;
    const status = method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED';
    const locationValue = event.meetingLink || event.location || '';

    const lines = [
      'BEGIN:VCALENDAR',
      'CALSCALE:GREGORIAN',
      'VERSION:2.0',
      'PRODID:-//LegalCalendar//Appointments//ES',
      `METHOD:${method}`,
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${this.escapeText(event.title)}`,
    ];

    if (event.description) {
      lines.push(`DESCRIPTION:${this.escapeText(event.description)}`);
    }

    if (locationValue) {
      lines.push(`LOCATION:${this.escapeText(locationValue)}`);
    }

    lines.push(
      `ORGANIZER;CN=${this.escapeText(event.organizerName)}:mailto:${event.organizerEmail}`,
      `ATTENDEE;CN=${this.escapeText(event.attendeeName)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${event.attendeeEmail}`,
      `SEQUENCE:${sequence}`,
      `STATUS:${status}`,
      'TRANSP:OPAQUE',
      'END:VEVENT',
      'END:VCALENDAR',
    );

    return lines
      .flatMap((line) => this.foldLine(line))
      .join('\r\n');
  }

  private formatDate(date: Date): string {
    return date
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '');
  }

  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  private foldLine(line: string): string[] {
    const maxOctets = 75;
    const foldedLines: string[] = [];
    let remaining = line;
    let prefix = '';

    while (Buffer.byteLength(`${prefix}${remaining}`, 'utf8') > maxOctets) {
      const availableOctets = maxOctets - Buffer.byteLength(prefix, 'utf8');
      const splitIndex = this.findFoldIndex(remaining, availableOctets);
      const chunk = remaining.slice(0, splitIndex);

      foldedLines.push(`${prefix}${chunk}`);
      remaining = remaining.slice(splitIndex);
      prefix = ' ';
    }

    foldedLines.push(`${prefix}${remaining}`);

    return foldedLines;
  }

  private findFoldIndex(value: string, maxOctets: number): number {
    let octets = 0;

    for (let index = 0; index < value.length; index++) {
      const codePoint = value.codePointAt(index);
      if (codePoint === undefined) {
        return index;
      }

      const char = String.fromCodePoint(codePoint);
      const charLength = Buffer.byteLength(char, 'utf8');

      if (octets + charLength > maxOctets) {
        return index;
      }

      octets += charLength;

      if (codePoint > 0xffff) {
        index++;
      }
    }

    return value.length;
  }
}
