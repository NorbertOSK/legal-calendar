import { IcsService, IcsEventData } from './ics.service';

describe('IcsService', () => {
  let service: IcsService;

  const baseEvent: IcsEventData = {
    id: 'abc-123',
    title: 'Legal Consultation',
    description: 'Initial consultation meeting',
    location: 'Office Room 1',
    startsAt: new Date('2030-06-15T10:00:00Z'),
    endsAt: new Date('2030-06-15T11:00:00Z'),
    organizerName: 'John Lawyer',
    organizerEmail: 'lawyer@example.com',
    attendeeName: 'Jane Client',
    attendeeEmail: 'client@example.com',
  };

  beforeEach(() => {
    service = new IcsService();
  });

  describe('generateIcs()', () => {
    it('should generate a valid ICS string for REQUEST method', () => {
      const result = service.generateIcs(baseEvent, 'REQUEST');

      expect(result).toContain('BEGIN:VCALENDAR');
      expect(result).toContain('CALSCALE:GREGORIAN');
      expect(result).toContain('VERSION:2.0');
      expect(result).toContain('METHOD:REQUEST');
      expect(result).toContain('BEGIN:VEVENT');
      expect(result).toContain('END:VEVENT');
      expect(result).toContain('END:VCALENDAR');
      expect(result).toContain('STATUS:CONFIRMED');
      expect(result).toContain('TRANSP:OPAQUE');
      expect(result).toContain('UID:appointment-abc-123@legalcalendar.app');
    });

    it('should generate a valid ICS string for CANCEL method', () => {
      const result = service.generateIcs(baseEvent, 'CANCEL');

      expect(result).toContain('METHOD:CANCEL');
      expect(result).toContain('STATUS:CANCELLED');
      expect(result).not.toContain('STATUS:CONFIRMED');
    });

    it('should include SUMMARY with the event title', () => {
      const result = service.generateIcs(baseEvent, 'REQUEST');

      expect(result).toContain('SUMMARY:Legal Consultation');
    });

    it('should include DESCRIPTION when provided', () => {
      const result = service.generateIcs(baseEvent, 'REQUEST');

      expect(result).toContain('DESCRIPTION:Initial consultation meeting');
    });

    it('should omit DESCRIPTION when not provided', () => {
      const eventWithoutDescription: IcsEventData = {
        ...baseEvent,
        description: undefined,
      };
      const result = service.generateIcs(eventWithoutDescription, 'REQUEST');

      expect(result).not.toContain('DESCRIPTION:');
    });

    it('should include LOCATION when location is provided', () => {
      const result = service.generateIcs(baseEvent, 'REQUEST');

      expect(result).toContain('LOCATION:Office Room 1');
    });

    it('should use meetingLink as LOCATION when location is not provided', () => {
      const eventWithMeetingLink: IcsEventData = {
        ...baseEvent,
        location: undefined,
        meetingLink: 'https://meet.example.com/room',
      };
      const result = service.generateIcs(eventWithMeetingLink, 'REQUEST');

      expect(result).toContain('LOCATION:https://meet.example.com/room');
    });

    it('should omit LOCATION when neither location nor meetingLink is provided', () => {
      const eventWithoutLocation: IcsEventData = {
        ...baseEvent,
        location: undefined,
        meetingLink: undefined,
      };
      const result = service.generateIcs(eventWithoutLocation, 'REQUEST');

      expect(result).not.toContain('LOCATION:');
    });

    it('should include ORGANIZER and ATTENDEE lines', () => {
      const result = service.generateIcs(baseEvent, 'REQUEST');
      const unfolded = result.replace(/\r\n /g, '');

      expect(unfolded).toContain(
        'ORGANIZER;CN=John Lawyer:mailto:lawyer@example.com',
      );
      expect(unfolded).toContain(
        'ATTENDEE;CN=Jane Client;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:client@example.com',
      );
    });

    it('should use SEQUENCE 0 by default', () => {
      const result = service.generateIcs(baseEvent, 'REQUEST');

      expect(result).toContain('SEQUENCE:0');
    });

    it('should use provided sequence number', () => {
      const eventWithSequence: IcsEventData = { ...baseEvent, sequence: 1 };
      const result = service.generateIcs(eventWithSequence, 'REQUEST');

      expect(result).toContain('SEQUENCE:1');
    });

    it('should format DTSTART and DTEND as UTC timestamps without dashes or colons', () => {
      const result = service.generateIcs(baseEvent, 'REQUEST');

      expect(result).toContain('DTSTART:20300615T100000Z');
      expect(result).toContain('DTEND:20300615T110000Z');
    });

    it('should escape special characters in text fields', () => {
      const eventWithSpecialChars: IcsEventData = {
        ...baseEvent,
        title: 'Meeting; with, client\\n',
        description: 'Notes: item1, item2; backslash \\',
      };
      const result = service.generateIcs(eventWithSpecialChars, 'REQUEST');

      expect(result).toContain('SUMMARY:Meeting\\; with\\, client\\\\n');
      expect(result).toContain('DESCRIPTION:Notes: item1\\, item2\\; backslash \\\\');
    });

    it('should join lines with CRLF (\\r\\n)', () => {
      const result = service.generateIcs(baseEvent, 'REQUEST');

      expect(result).toContain('\r\n');
      expect(result.split('\r\n').length).toBeGreaterThan(5);
    });

    it('should fold long content lines according to RFC 5545', () => {
      const result = service.generateIcs(
        {
          ...baseEvent,
          title:
            'Reunión de prueba muy larga para validar que la línea SUMMARY se pliegue correctamente y siga siendo compatible con clientes estrictos',
          description:
            'Descripción muy larga con caracteres UTF-8 como reunión, acción y calendario para comprobar el folding del archivo iCalendar.',
        },
        'REQUEST',
      );

      const lines = result.split('\r\n');
      const summaryLines = lines.filter(
        (line) => line.startsWith('SUMMARY:') || line.startsWith(' '),
      );
      const descriptionLines = lines.filter(
        (line) => line.startsWith('DESCRIPTION:') || line.startsWith(' '),
      );

      expect(summaryLines.length).toBeGreaterThan(1);
      expect(descriptionLines.length).toBeGreaterThan(1);
      expect(lines.some((line) => line.startsWith(' '))).toBe(true);
    });
  });
});
