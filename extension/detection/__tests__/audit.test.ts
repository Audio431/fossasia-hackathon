import { detectPII, hasHighRiskCombinations, DetectedPII } from '../pii-detector';

describe('PII Detector Audit - False Positives', () => {
  it('FALSE POS: @ mention without context', () => {
    const text = "Check out @mention in this post";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\n❌ "@mention" detected: ${result.length} items`, result);
    // Should be 0, but likely matches /@[\w]{1,30}/g
  });

  it('FALSE POS: bare 5-digit as zip code', () => {
    const text = "My zip code is 12345 and yours?";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\n❌ Bare 5-digit detected: ${result.length} items`, result);
    // Should be 0, but likely matches /\b\d{5}(-\d{4})?\b/g
  });

  it('FALSE POS: 10-digit order/product code', () => {
    const text = "Order #1234567890 was delivered";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\n❌ 10-digit order code detected: ${result.length} items`, result);
    // Should be 0, but likely matches /\b\d{10}\b/g
  });

  it('FALSE POS: time of day', () => {
    const text = "See you at 3 pm today";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\n❌ Time of day detected: ${result.length} items`, result);
  });

  it('FALSE POS: spacing between numbers', () => {
    const text = "The code is 5 5 5 1 2 3 4 5 6 7";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\n❌ Spaced numbers detected: ${result.length} items`, result);
    // Should be 0, but /\b\d(?:\s\d){9}\b/g is very loose
  });
});

describe('PII Detector Audit - Missing Patterns', () => {
  it('MISSING: Full name sharing - declarative', () => {
    const text = "my name is Emma Thompson";
    const result = detectPII(text, { platform: 'generic', isPublic: false, isDirectMessage: false });
    console.log(`\n⚠️ Full name not detected: "${text}" -> ${result.length} items`);
  });

  it('MISSING: Username/social handle with context', () => {
    const texts = [
      "my snapchat is emmaT_2009",
      "add me on tiktok as emma_world",
      "my instagram is emma.thompson",
    ];
    texts.forEach(t => {
      const result = detectPII(t, { platform: 'generic', isPublic: false, isDirectMessage: false });
      console.log(`\n⚠️ Social handle not detected: "${t}" -> ${result.length} items`);
    });
  });

  it('MISSING: Daily routine / alone time', () => {
    const texts = [
      "I get home at 3pm every day",
      "I walk alone to school",
      "home alone until 6pm",
      "I'm usually at the park on weekends"
    ];
    texts.forEach(t => {
      const result = detectPII(t, { platform: 'generic', isPublic: false, isDirectMessage: false });
      console.log(`\n⚠️ Routine not detected: "${t}" -> ${result.length} items`);
    });
  });

  it('MISSING: Current location (real-time)', () => {
    const texts = [
      "I'm at the mall right now",
      "just got to Central Park",
      "sitting at Starbucks on 5th Ave"
    ];
    texts.forEach(t => {
      const result = detectPII(t, { platform: 'generic', isPublic: false, isDirectMessage: false });
      console.log(`\n⚠️ Current location not detected: "${t}" -> ${result.length} items`);
    });
  });

  it('MISSING: Age + gender combos', () => {
    const texts = [
      "14f here looking for friends",
      "I'm a 13 year old boy",
      "13f looking to chat"
    ];
    texts.forEach(t => {
      const result = detectPII(t, { platform: 'generic', isPublic: false, isDirectMessage: false });
      console.log(`\n⚠️ Age+gender combo not detected: "${t}" -> ${result.length} items`);
    });
  });

  it('MISSING: Parent/family contact', () => {
    const texts = [
      "my mom's number is 555-1234",
      "my dad's cell is 5551234567",
      "my parents' email is family@example.com"
    ];
    texts.forEach(t => {
      const result = detectPII(t, { platform: 'generic', isPublic: false, isDirectMessage: false });
      console.log(`\n⚠️ Parent contact not detected: "${t}" -> ${result.length} items`);
    });
  });

  it('MISSING: Photo self-identification', () => {
    const texts = [
      "that's me in the photo on the left",
      "this is what I look like with blonde hair"
    ];
    texts.forEach(t => {
      const result = detectPII(t, { platform: 'generic', isPublic: false, isDirectMessage: false });
      console.log(`\n⚠️ Photo self-id not detected: "${t}" -> ${result.length} items`);
    });
  });
});

describe('PII Detector Audit - High-Risk Combinations', () => {
  it('MISSING COMBO: name + location', () => {
    const detected = [
      { type: 'identity', severity: 'high', description: 'Name', matchedText: 'Emma Thompson', position: { start: 0, end: 13 } } as DetectedPII,
      { type: 'location', severity: 'high', description: 'Location', matchedText: 'Springfield, IL', position: { start: 14, end: 28 } } as DetectedPII
    ];
    const hasCombo = hasHighRiskCombinations(detected);
    console.log(`\n⚠️ Name + Location combo not in dangerousCombos: ${hasCombo}`);
  });

  it('MISSING COMBO: name + contact', () => {
    const detected = [
      { type: 'identity', severity: 'high', description: 'Name', matchedText: 'Emma Thompson', position: { start: 0, end: 13 } } as DetectedPII,
      { type: 'contact', severity: 'high', description: 'Phone', matchedText: '555-1234', position: { start: 14, end: 22 } } as DetectedPII
    ];
    const hasCombo = hasHighRiskCombinations(detected);
    console.log(`\n⚠️ Name + Contact combo not in dangerousCombos: ${hasCombo}`);
  });

  it('MISSING COMBO: routine + contact', () => {
    const detected = [
      { type: 'location', severity: 'high', description: 'Routine', matchedText: 'home alone at 3pm', position: { start: 0, end: 16 } } as DetectedPII,
      { type: 'contact', severity: 'high', description: 'Phone', matchedText: '555-1234', position: { start: 17, end: 25 } } as DetectedPII
    ];
    const hasCombo = hasHighRiskCombinations(detected);
    console.log(`\n⚠️ Routine + Contact combo potentially missing: ${hasCombo}`);
  });
});
