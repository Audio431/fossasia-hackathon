import { detectStrangerRisk } from '../stranger-detector';

describe('detectStrangerRisk – safe messages', () => {
  test('returns safe for short text', () => {
    const r = detectStrangerRisk('hi');
    expect(r.level).toBe('safe');
    expect(r.score).toBe(0);
  });

  test('returns safe for normal conversation', () => {
    const r = detectStrangerRisk('Hey! I saw your post about the new game — have you tried the expansion yet?');
    expect(r.level).toBe('safe');
    expect(r.score).toBe(0);
  });

  test('returns safe for homework talk', () => {
    const r = detectStrangerRisk('Can you help me with the math homework? I got stuck on problem 4.');
    expect(r.level).toBe('safe');
  });

  test('returns safe for sports discussion', () => {
    const r = detectStrangerRisk('Our team won the match last night! It was amazing, we scored 3 goals.');
    expect(r.level).toBe('safe');
  });
});

describe('detectStrangerRisk – single category triggers', () => {
  test('detects secrecy request (parents)', () => {
    const r = detectStrangerRisk("Don't tell your parents about our conversations, okay?");
    expect(r.categories).toContain('secrecy');
    expect(r.score).toBeGreaterThanOrEqual(25);
  });

  test('detects secrecy request (delete chat)', () => {
    const r = detectStrangerRisk('Hey can you delete this chat after reading? Keep it between us.');
    expect(r.categories).toContain('secrecy');
  });

  test('detects meeting request', () => {
    const r = detectStrangerRisk("Let's meet up after school, I can pick you up.");
    expect(r.categories).toContain('meeting');
    expect(r.score).toBeGreaterThanOrEqual(30);
  });

  test('detects personal information request', () => {
    const r = detectStrangerRisk("What's your address? When are your parents out?");
    expect(r.categories).toContain('personal_info');
  });

  test('detects personal info – are you alone', () => {
    const r = detectStrangerRisk('Are you home alone right now?');
    expect(r.categories).toContain('personal_info');
  });

  test('detects gift/bribe offer', () => {
    const r = detectStrangerRisk("I'll give you free Robux if you follow me and send me your number.");
    expect(r.categories).toContain('gift_bribe');
  });

  test('detects isolation attempt', () => {
    const r = detectStrangerRisk("Your friends don't understand you like I do. I'm the only one who gets you.");
    expect(r.categories).toContain('isolation');
  });

  test('detects pressure tactics', () => {
    const r = detectStrangerRisk("Come on, just this once. You have to do this now or I'll be upset.");
    expect(r.categories).toContain('pressure');
  });
});

describe('detectStrangerRisk – severity escalation', () => {
  test('watch level at 15–34', () => {
    const r = detectStrangerRisk("Come on, just this once. Do it now or you'll regret it.");
    expect(r.level).toBe('watch');
  });

  test('warning level when two high-weight categories fire', () => {
    const r = detectStrangerRisk(
      "Don't tell your parents we talk. Let's meet up after school — I'll pick you up!"
    );
    expect(['warning', 'danger']).toContain(r.level);
    expect(r.score).toBeGreaterThanOrEqual(35);
  });

  test('danger level for combined grooming scenario', () => {
    const r = detectStrangerRisk(
      "Our secret, don't tell your parents. Let's meet in person — I'll pick you up. " +
      "Are you home alone? When are your parents away? I'll buy you gifts."
    );
    expect(r.level).toBe('danger');
    expect(r.score).toBe(100);
    expect(r.flags.length).toBeGreaterThanOrEqual(3);
  });

  test('escalates score when 3+ categories fire', () => {
    const baseline = detectStrangerRisk("Don't tell your parents. Let's meet up. I'll give you Robux.");
    expect(baseline.score).toBeGreaterThan(25 + 30 + 20); // more than sum due to escalation
  });
});

describe('detectStrangerRisk – flags contain human-readable descriptions', () => {
  test('flags are non-empty strings', () => {
    const r = detectStrangerRisk("Don't tell anyone we chat. Are you home alone right now?");
    expect(r.flags.length).toBeGreaterThan(0);
    r.flags.forEach(f => expect(typeof f).toBe('string'));
  });

  test('categories and flags are parallel', () => {
    const r = detectStrangerRisk("Don't tell your parents. Let's meet up secretly.");
    expect(r.categories.length).toBe(r.flags.length);
  });
});
