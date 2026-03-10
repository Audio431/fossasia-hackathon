/**
 * Privacy Shadow — Heuristic Stranger Detection
 *
 * Rule-based scoring that flags grooming patterns, information harvesting,
 * and other high-risk conversation signals. No ML required — deterministic
 * and 100% reliable for the hackathon demo.
 */

export interface StrangerRisk {
  score: number;           // 0–100
  level: 'safe' | 'watch' | 'warning' | 'danger';
  flags: string[];         // Human-readable descriptions of triggered patterns
  categories: string[];    // Which categories fired (secrecy, meeting, etc.)
}

// ─── Pattern Definitions ────────────────────────────────────────────────────

interface RuleGroup {
  category: string;
  weight: number;
  patterns: RegExp[];
  description: string;
}

const RULE_GROUPS: RuleGroup[] = [
  {
    category: 'secrecy',
    weight: 25,
    patterns: [
      /don['']?t\s+tell\s+(your\s+)?(parents?|mom|dad|anyone|friends?)/i,
      /keep\s+(this|it|our\s+chat)\s+(secret|between\s+us|private)/i,
      /our\s+(little\s+)?secret/i,
      /delete\s+(this|these|our)\s+(chat|message|conversation)/i,
      /don['']?t\s+(show|tell)\s+(anyone|your\s+mom|your\s+dad)/i,
    ],
    description: 'Asking to keep the conversation secret',
  },
  {
    category: 'meeting',
    weight: 30,
    patterns: [
      /meet\s+(up|me|in\s+person)/i,
      /come\s+(over|hang\s+out)\s+(with\s+me|at\s+my\s+place)/i,
      /let['']?s\s+(hang|get\s+together|meet)/i,
      /pick\s+you\s+up/i,
      /i['']?ll\s+(come\s+to\s+you|find\s+you)/i,
      /video\s+(call|chat)\s+(me|now|tonight|later)/i,
    ],
    description: 'Requesting to meet in person or video call',
  },
  {
    category: 'personal_info',
    weight: 20,
    patterns: [
      /where\s+do\s+you\s+(live|go\s+to\s+school)/i,
      /what['']?s\s+your\s+(address|phone|number|school)/i,
      /send\s+(me\s+)?(your\s+)?(number|address|photo|pic)/i,
      /are\s+you\s+(home\s+)?alone/i,
      /when\s+(are\s+)?your\s+parents\s+(away|out|gone|not\s+home)/i,
      /what\s+time\s+do\s+you\s+get\s+home/i,
    ],
    description: 'Asking for personal information or schedule',
  },
  {
    category: 'age_inappropriate',
    weight: 35,
    patterns: [
      /send\s+(me\s+)?(a\s+)?(naked|nude|sexy|hot)\s+(pic|photo|picture)/i,
      /take\s+off\s+your/i,
      /have\s+you\s+ever\s+(had\s+sex|kissed|done\s+it)/i,
      /do\s+you\s+(like|want)\s+(older|mature)\s+(guys?|girls?|men|women)/i,
      /you['']?re\s+(so\s+)?(sexy|hot|mature\s+for\s+your\s+age)/i,
      /mature\s+for\s+your\s+age/i,
    ],
    description: 'Sexually inappropriate content',
  },
  {
    category: 'gift_bribe',
    weight: 20,
    patterns: [
      /i['']?ll\s+(buy|give|send)\s+you/i,
      /want\s+(free|free\s+)?(gift|money|cash|robux|vbucks|discord\s+nitro)/i,
      /i\s+have\s+(gift\s+cards?|money\s+for\s+you)/i,
      /earn\s+(easy\s+)?(money|cash)/i,
      /follow\s+me\s+and\s+i['']?ll\s+(give|send|pay)/i,
    ],
    description: 'Offering gifts, money, or game currency',
  },
  {
    category: 'isolation',
    weight: 20,
    patterns: [
      /your\s+friends?\s+(don['']?t|wouldn['']?t)\s+understand/i,
      /only\s+i\s+understand\s+you/i,
      /your\s+parents?\s+(are\s+)?(mean|wrong|unfair|don['']?t\s+care)/i,
      /you\s+should\s+(leave|run\s+away|move\s+out)/i,
      /i['']?m\s+the\s+only\s+one\s+(who\s+)?(cares|loves|gets)\s+you/i,
    ],
    description: 'Trying to isolate from family and friends',
  },
  {
    category: 'pressure',
    weight: 15,
    patterns: [
      /you\s+(have\s+to|must|need\s+to)\s+(do\s+this|send|respond)/i,
      /if\s+you\s+(don['']?t|won['']?t)\s+(respond|reply|send)/i,
      /do\s+it\s+now\s+or/i,
      /last\s+(chance|time\s+i['']?ll\s+ask)/i,
      /come\s+on,?\s+just\s+(this\s+once|do\s+it)/i,
    ],
    description: 'Using pressure or ultimatums',
  },
];

// ─── Detector ───────────────────────────────────────────────────────────────

export function detectStrangerRisk(text: string): StrangerRisk {
  if (!text || text.trim().length < 10) {
    return { score: 0, level: 'safe', flags: [], categories: [] };
  }

  let score = 0;
  const flags: string[] = [];
  const categories: string[] = [];

  for (const group of RULE_GROUPS) {
    for (const pattern of group.patterns) {
      if (pattern.test(text)) {
        if (!categories.includes(group.category)) {
          score += group.weight;
          categories.push(group.category);
          flags.push(group.description);
        }
        break; // Only count each category once
      }
    }
  }

  // Escalate if multiple categories fire
  if (categories.length >= 3) score = Math.min(score + 15, 100);
  if (categories.length >= 4) score = Math.min(score + 20, 100);

  score = Math.min(score, 100);

  const level: StrangerRisk['level'] =
    score >= 60 ? 'danger' :
    score >= 35 ? 'warning' :
    score >= 15 ? 'watch' :
    'safe';

  return { score, level, flags, categories };
}
