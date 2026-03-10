import { detectPII } from '../pii-detector';

describe('Detailed False Positive Analysis', () => {
  it('Bare 5-digit ZIP code in context', () => {
    const text = "My zip code is 12345";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\nZIP test: "${text}"`);
    console.log(`  Result: ${result.map(r => `${r.type}:"${r.matchedText}"`).join(', ')}`);
  });

  it('Bare 10-digit number (like order)', () => {
    const text = "My order 1234567890 arrived";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\n10-digit test: "${text}"`);
    console.log(`  Result: ${result.map(r => `${r.type}:"${r.matchedText}"`).join(', ')}`);
  });

  it('@ mention without phone context', () => {
    const text = "Check @johndoe out!";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\n@ mention test: "${text}"`);
    console.log(`  Result: ${result.map(r => `${r.type}:"${r.matchedText}"`).join(', ')}`);
  });

  it('Discord handle format but NOT in contact context', () => {
    const text = "My favorite game dev is example#1234";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\nDiscord# test: "${text}"`);
    console.log(`  Result: ${result.map(r => `${r.type}:"${r.matchedText}"`).join(', ')}`);
  });

  it('License plate vs normal text', () => {
    const text = "The car has ABC-1234 on the back";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\nLicense plate test: "${text}"`);
    console.log(`  Result: ${result.map(r => `${r.type}:"${r.matchedText}"`).join(', ')}`);
  });
});
