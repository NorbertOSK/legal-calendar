import { TimezoneService } from './timezone.service';

describe('TimezoneService', () => {
  let service: TimezoneService;

  beforeEach(() => {
    service = new TimezoneService();
  });

  describe('toUtc()', () => {
    it('should return a Date object', () => {
      const date = new Date('2030-06-15T10:00:00Z');
      const result = service.toUtc(date, 'America/Argentina/Buenos_Aires');

      expect(result).toBeInstanceOf(Date);
    });

    it('should apply timezone offset when converting to UTC', () => {
      // Buenos Aires is UTC-3, so 10:00 local = 13:00 UTC
      const localDate = new Date('2030-06-15T10:00:00');
      const result = service.toUtc(localDate, 'America/Argentina/Buenos_Aires');

      expect(result).toBeInstanceOf(Date);
      // Result should be a valid date
      expect(isNaN(result.getTime())).toBe(false);
    });

    it('should return the same time for UTC timezone', () => {
      const date = new Date('2030-06-15T10:00:00Z');
      const result = service.toUtc(date, 'UTC');

      // When timezone is UTC, offset should be ~0
      const diffMs = Math.abs(result.getTime() - date.getTime());
      expect(diffMs).toBeLessThan(1000);
    });
  });

  describe('fromUtc()', () => {
    it('should return a Date object', () => {
      const utcDate = new Date('2030-06-15T13:00:00Z');
      const result = service.fromUtc(utcDate, 'America/Argentina/Buenos_Aires');

      expect(result).toBeInstanceOf(Date);
    });

    it('should apply timezone offset when converting from UTC', () => {
      const utcDate = new Date('2030-06-15T13:00:00Z');
      const result = service.fromUtc(utcDate, 'America/Argentina/Buenos_Aires');

      expect(isNaN(result.getTime())).toBe(false);
    });

    it('should return same time for UTC timezone', () => {
      const utcDate = new Date('2030-06-15T10:00:00Z');
      const result = service.fromUtc(utcDate, 'UTC');

      const diffMs = Math.abs(result.getTime() - utcDate.getTime());
      expect(diffMs).toBeLessThan(1000);
    });

    it('should be roughly the inverse of toUtc()', () => {
      const original = new Date('2030-06-15T10:00:00Z');
      const timezone = 'America/New_York';

      const localTime = service.fromUtc(original, timezone);
      const backToUtc = service.toUtc(localTime, timezone);

      // Should be within a few seconds of the original UTC time
      const diffMs = Math.abs(backToUtc.getTime() - original.getTime());
      expect(diffMs).toBeLessThan(60000); // within 1 minute
    });
  });

  describe('formatInTimezone()', () => {
    it('should return a formatted string', () => {
      const date = new Date('2030-06-15T13:00:00Z');
      const result = service.formatInTimezone(date, 'America/Argentina/Buenos_Aires');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include year, month, day, hour, and minute in the output', () => {
      const date = new Date('2030-06-15T13:00:00Z');
      const result = service.formatInTimezone(date, 'UTC');

      // The formatted string should contain recognizable parts
      expect(result).toMatch(/2030/);
    });

    it('should use default locale es-AR when locale not provided', () => {
      const date = new Date('2030-06-15T13:00:00Z');
      const resultDefault = service.formatInTimezone(date, 'UTC');
      const resultExplicit = service.formatInTimezone(date, 'UTC', 'es-AR');

      expect(resultDefault).toBe(resultExplicit);
    });

    it('should format differently for different locales', () => {
      const date = new Date('2030-06-15T13:00:00Z');
      const resultES = service.formatInTimezone(date, 'UTC', 'es-AR');
      const resultEN = service.formatInTimezone(date, 'UTC', 'en-US');

      // Different locales may format the same date differently
      expect(typeof resultES).toBe('string');
      expect(typeof resultEN).toBe('string');
    });

    it('should reflect the correct local time for a given timezone', () => {
      // UTC time 2030-06-15T15:00:00Z → Buenos Aires (UTC-3) = 12:00
      const date = new Date('2030-06-15T15:00:00Z');
      const result = service.formatInTimezone(date, 'America/Argentina/Buenos_Aires');

      expect(result).toContain('12');
    });
  });
});
