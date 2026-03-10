/**
 * Unit Tests for PII Detector
 */

import {
  detectPII,
  calculatePIIRiskScore,
  hasHighRiskCombinations,
  getPIISummary,
  maskPII,
  DetectedPII
} from '../pii-detector';

describe('PII Detector', () => {
  describe('detectPII', () => {
    it('should detect birthdates in MM/DD/YYYY format', () => {
      const text = 'My birthday is 05/12/2012';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected[0].type).toBe('birthdate');
    });

    it('should detect age expressions', () => {
      const text = 'I am 13 years old';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected[0].type).toBe('birthdate');
    });

    it('should detect phone numbers', () => {
      const text = 'Call me at 123-456-7890';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected[0].type).toBe('contact');
    });

    it('should detect email addresses', () => {
      const text = 'Email me at test@example.com';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected[0].type).toBe('contact');
    });

    it('should detect locations', () => {
      const text = 'I live in Springfield, IL';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected[0].type).toBe('location');
    });

    it('should detect Instagram location patterns', () => {
      const text = '📍 New York City';
      const detected = detectPII(text, { platform: 'instagram', isPublic: true, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected[0].type).toBe('location');
    });

    it('should detect SSN with dashes', () => {
      const text = 'My SSN is 123-45-6789';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(d => d.type === 'financial')).toBe(true);
    });

    it('should detect credit card numbers', () => {
      const text = 'Card number: 4111-1111-1111-1111';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(d => d.type === 'financial')).toBe(true);
    });

    it('should detect obfuscated phone numbers (bare 10 digits)', () => {
      const text = 'Call me: 5551234567';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(d => d.type === 'contact')).toBe(true);
    });

    it('should detect license plate with context', () => {
      const text = 'My license plate is ABC-1234';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(d => d.type === 'identity')).toBe(true);
    });

    it('should detect school team mascot name', () => {
      const text = 'Go Springfield Eagles!';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(d => d.type === 'school')).toBe(true);
    });

    it('should detect "I play for [team]"', () => {
      const text = 'I play for the Riverside Tigers';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(d => d.type === 'school')).toBe(true);
    });

    it('should detect passport with context clue', () => {
      const text = 'passport number: A12345678';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(d => d.type === 'identity')).toBe(true);
    });

    it('should not detect false positives', () => {
      const text = 'Hello world, how are you?';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBe(0);
    });

    it('should detect multiple PII types', () => {
      const text = 'My name is John, I live in Springfield, IL and you can call me at 123-456-7890';
      const detected = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });

      expect(detected.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('calculatePIIRiskScore', () => {
    it('should return 0 for no PII', () => {
      const score = calculatePIIRiskScore([]);
      expect(score).toBe(0);
    });

    it('should calculate higher score for high severity PII', () => {
      const detected = [
        { type: 'birthdate', severity: 'high', description: 'Birth date', matchedText: '05/12/2012', position: { start: 0, end: 10 } }
      ] as DetectedPII[];

      const score = calculatePIIRiskScore(detected);
      expect(score).toBeGreaterThanOrEqual(30);
    });

    it('should increase score for multiple PII items', () => {
      const singlePII = [
        { type: 'contact', severity: 'high', description: 'Phone', matchedText: '123-456-7890', position: { start: 0, end: 12 } }
      ] as DetectedPII[];

      const multiplePII = [
        { type: 'contact', severity: 'high', description: 'Phone', matchedText: '123-456-7890', position: { start: 0, end: 12 } },
        { type: 'location', severity: 'high', description: 'Location', matchedText: 'Springfield, IL', position: { start: 13, end: 28 } }
      ] as DetectedPII[];

      const singleScore = calculatePIIRiskScore(singlePII);
      const multipleScore = calculatePIIRiskScore(multiplePII);

      expect(multipleScore).toBeGreaterThan(singleScore);
    });
  });

  describe('hasHighRiskCombinations', () => {
    it('should detect birthdate + location combination', () => {
      const detected = [
        { type: 'birthdate', severity: 'high', description: 'Birth date', matchedText: '05/12/2012', position: { start: 0, end: 10 } },
        { type: 'location', severity: 'high', description: 'Location', matchedText: 'Springfield, IL', position: { start: 11, end: 26 } }
      ] as DetectedPII[];

      expect(hasHighRiskCombinations(detected)).toBe(true);
    });

    it('should detect contact + school combination', () => {
      const detected = [
        { type: 'contact', severity: 'high', description: 'Phone', matchedText: '123-456-7890', position: { start: 0, end: 12 } },
        { type: 'school', severity: 'medium', description: 'School', matchedText: 'Springfield High', position: { start: 13, end: 28 } }
      ] as DetectedPII[];

      expect(hasHighRiskCombinations(detected)).toBe(true);
    });

    it('should detect financial + address combination', () => {
      const detected = [
        { type: 'financial', severity: 'high', description: 'Credit card', matchedText: '4111-1111-1111-1111', position: { start: 0, end: 19 } },
        { type: 'address', severity: 'high', description: 'Address', matchedText: '123 Main St', position: { start: 20, end: 31 } }
      ] as DetectedPII[];

      expect(hasHighRiskCombinations(detected)).toBe(true);
    });

    it('should not flag single PII type as high risk', () => {
      const detected = [
        { type: 'contact', severity: 'high', description: 'Phone', matchedText: '123-456-7890', position: { start: 0, end: 12 } }
      ] as DetectedPII[];

      expect(hasHighRiskCombinations(detected)).toBe(false);
    });
  });

  describe('getPIISummary', () => {
    it('should return message for no PII', () => {
      const summary = getPIISummary([]);
      expect(summary).toBe('No sensitive information detected');
    });

    it('should summarize detected PII types', () => {
      const detected = [
        { type: 'birthdate', severity: 'high', description: 'Birth date', matchedText: '05/12/2012', position: { start: 0, end: 10 } },
        { type: 'location', severity: 'high', description: 'Location', matchedText: 'Springfield, IL', position: { start: 11, end: 26 } }
      ] as DetectedPII[];

      const summary = getPIISummary(detected);
      expect(summary).toContain('Birthdate');
      expect(summary).toContain('Location');
    });
  });

  describe('maskPII', () => {
    it('should mask detected PII in text', () => {
      const text = 'My birthday is 05/12/2012 and I live in Springfield';
      const detected = [
        { type: 'birthdate', severity: 'high', description: 'Birth date', matchedText: '05/12/2012', position: { start: 14, end: 24 } },
        { type: 'location', severity: 'high', description: 'Location', matchedText: 'Springfield', position: { start: 33, end: 44 } }
      ] as DetectedPII[];

      const masked = maskPII(text, detected);
      expect(masked).toContain('•');
      expect(masked).not.toContain('05/12/2012');
    });
  });
});
