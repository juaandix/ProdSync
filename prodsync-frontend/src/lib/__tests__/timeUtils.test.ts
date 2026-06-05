import { parseTime, formatTime, formatTimeToDecimal } from '../timeUtils';

describe('timeUtils', () => {
  describe('parseTime', () => {
    it('should parse decimal strings correctly', () => {
      expect(parseTime('1.5')).toBe(1.5);
    });

    it('should parse "h m" format correctly', () => {
      expect(parseTime('2h 30m')).toBe(2.5);
    });

    it('should parse "h" format correctly', () => {
      expect(parseTime('3h')).toBe(3);
    });

    it('should parse colon-separated format correctly', () => {
      expect(parseTime('1:15')).toBe(1.25);
    });

    it('should return 0 for empty string', () => {
      expect(parseTime('')).toBe(0);
    });

    it('should handle invalid formats by returning NaN', () => {
      expect(parseTime('invalid')).toBeNaN();
    });
  });

  describe('formatTime', () => {
    it('should format decimal hours into "h m" format', () => {
      expect(formatTime(2.5)).toBe('2h 30m');
    });

    it('should handle integer hours', () => {
      expect(formatTime(3)).toBe('3h 0m');
    });

    it('should handle zero hours', () => {
      expect(formatTime(0)).toBe('0h 0m');
    });

    it('should round minutes correctly', () => {
      expect(formatTime(1.99)).toBe('1h 59m');
    });

    it('should handle rounding up to the next hour', () => {
      expect(formatTime(1.999)).toBe('2h 0m');
    });
  });

  describe('formatTimeToDecimal', () => {
    it('should format an integer correctly', () => {
      expect(formatTimeToDecimal(5)).toBe('5.00h');
    });

    it('should format a decimal number correctly', () => {
      expect(formatTimeToDecimal(2.5)).toBe('2.50h');
    });

    it('should round to two decimal places', () => {
      expect(formatTimeToDecimal(1.758)).toBe('1.76h');
    });

    it('should handle zero correctly', () => {
      expect(formatTimeToDecimal(0)).toBe('0.00h');
    });

    it('should handle negative numbers gracefully', () => {
      expect(formatTimeToDecimal(-10)).toBe('0.0h');
    });

    it('should handle NaN gracefully', () => {
      expect(formatTimeToDecimal(NaN)).toBe('0.0h');
    });

    it('should format a number with one decimal place', () => {
      expect(formatTimeToDecimal(3.1)).toBe('3.10h');
    });
  });
});
