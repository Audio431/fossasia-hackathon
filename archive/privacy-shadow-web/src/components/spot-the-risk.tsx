'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Star, ArrowRight, RotateCcw, Trophy } from 'lucide-react';
import { useShadow } from '@/lib/shadow-context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Risk {
  id: string;
  label: string;       // short label shown in the chip
  explanation: string; // why it's risky
  tip: string;         // what to do instead
}

type RoundPhase = 'playing' | 'revealed' | 'complete';

// ---------------------------------------------------------------------------
// RiskChip — an inline piece of content that the user must tap to identify
// ---------------------------------------------------------------------------

function RiskChip({
  risk,
  found,
  onFind,
  showAll,
}: {
  risk: Risk;
  found: boolean;
  onFind: (id: string) => void;
  showAll: boolean;
}) {
  const active = found || showAll;
  return (
    <span className="relative inline">
      <motion.button
        onClick={() => !found && onFind(risk.id)}
        animate={active ? { scale: [1, 1.05, 1] } : {}}
        className={`relative inline px-1 rounded cursor-pointer transition-all font-medium ${
          active
            ? 'bg-red-500/30 text-red-300 ring-2 ring-red-500'
            : 'bg-yellow-500/10 text-yellow-200 ring-1 ring-yellow-500/40 hover:ring-yellow-400 hover:bg-yellow-500/20'
        }`}
      >
        {risk.label}
        {active && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="ml-1 text-red-400"
          >
            ⚠️
          </motion.span>
        )}
      </motion.button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Round definitions
// ---------------------------------------------------------------------------

interface RoundDef {
  id: string;
  type: 'post' | 'chat';
  risks: Risk[];
  render: (props: { found: Set<string>; onFind: (id: string) => void; showAll: boolean }) => React.ReactNode;
}

const ROUNDS: RoundDef[] = [
  // ── Round 1: Instagram post ──────────────────────────────────────────────
  {
    id: 'r1',
    type: 'post',
    risks: [
      {
        id: 'username',
        label: 'maya_bkk2009',
        explanation: 'Your birth year in your username tells strangers your exact age.',
        tip: 'Use a nickname with no year, e.g. "m_creative".',
      },
      {
        id: 'school',
        label: 'Sathorn International School',
        explanation: 'Tagging your school lets strangers know exactly where you are every weekday.',
        tip: 'Tag only the city, not your specific school.',
      },
      {
        id: 'classroom',
        label: 'Room 207, class 9/3',
        explanation: 'Your specific class and room helps someone find you in person.',
        tip: 'Never share your exact classroom or section publicly.',
      },
    ],
    render: ({ found, onFind, showAll }) => (
      <MockPost
        avatar="🧑‍🎓"
        username={<RiskChip risk={{ id: 'username', label: 'maya_bkk2009', explanation: '', tip: '' }} found={found.has('username')} onFind={onFind} showAll={showAll} />}
        timeAgo="2 minutes ago"
        location={<RiskChip risk={{ id: 'school', label: 'Sathorn International School', explanation: '', tip: '' }} found={found.has('school')} onFind={onFind} showAll={showAll} />}
        imageEmoji="🤳"
        imageCaption="Selfie in school uniform, school logo on blazer"
        caption={
          <span>
            First day of Grade 9!{' '}
            <RiskChip risk={{ id: 'classroom', label: 'Room 207, class 9/3', explanation: '', tip: '' }} found={found.has('classroom')} onFind={onFind} showAll={showAll} />{' '}
            anyone else here? 📚 #BackToSchool
          </span>
        }
        likes={47}
        comments={[
          { user: 'nina_k', text: 'yay same class!! 🎉' },
          { user: 'bkk_photos', text: 'Nice uniform!' },
        ]}
      />
    ),
  },

  // ── Round 2: Chat ─────────────────────────────────────────────────────────
  {
    id: 'r2',
    type: 'chat',
    risks: [
      {
        id: 'address',
        label: '42 Sukhumvit Soi 11, Apt 4B',
        explanation: 'Sharing your exact address in a chat can be seen if someone hacks the account or screenshots it.',
        tip: 'Share your address only via a secure, disappearing message or in person.',
      },
      {
        id: 'alone',
        label: 'just me and my little sister',
        explanation: 'Telling someone you\'re home alone (with only a younger sibling) is a safety risk.',
        tip: 'Never broadcast that you\'re home without adults.',
      },
      {
        id: 'schedule',
        label: 'home after 3pm',
        explanation: 'Your daily schedule tells strangers exactly when you\'ll be where.',
        tip: 'Keep your routine private — share it only with people you fully trust.',
      },
    ],
    render: ({ found, onFind, showAll }) => (
      <MockChat
        contactName="Alex 🏃"
        messages={[
          {
            from: 'them',
            text: 'hey can you drop off my notebook today?',
          },
          {
            from: 'me',
            text: (
              <span>
                Sure! Bring it to{' '}
                <RiskChip risk={{ id: 'address', label: '42 Sukhumvit Soi 11, Apt 4B', explanation: '', tip: '' }} found={found.has('address')} onFind={onFind} showAll={showAll} />{' '}
                — I'll be{' '}
                <RiskChip risk={{ id: 'schedule', label: 'home after 3pm', explanation: '', tip: '' }} found={found.has('schedule')} onFind={onFind} showAll={showAll} />
              </span>
            ),
          },
          {
            from: 'them',
            text: 'is your mom home?',
          },
          {
            from: 'me',
            text: (
              <span>
                nah she's on a work trip until Friday, it's{' '}
                <RiskChip risk={{ id: 'alone', label: 'just me and my little sister', explanation: '', tip: '' }} found={found.has('alone')} onFind={onFind} showAll={showAll} />
              </span>
            ),
          },
        ]}
      />
    ),
  },

  // ── Round 3: Instagram post (vacation) ────────────────────────────────────
  {
    id: 'r3',
    type: 'post',
    risks: [
      {
        id: 'hotel',
        label: 'Royal Palms Resort, Phuket',
        explanation: 'Posting your exact hotel while you\'re there broadcasts your location to everyone.',
        tip: 'Post vacation photos AFTER you\'ve returned home.',
      },
      {
        id: 'parents',
        label: 'first trip without our parents',
        explanation: 'Announcing you\'re unsupervised can attract the wrong kind of attention.',
        tip: 'Keep the supervision status of your trips private.',
      },
      {
        id: 'return',
        label: 'back Sunday night',
        explanation: 'Your return date tells people exactly when your home will be empty — a burglary risk.',
        tip: 'Never post your travel return schedule publicly.',
      },
    ],
    render: ({ found, onFind, showAll }) => (
      <MockPost
        avatar="🏖️"
        username="jak_adventures"
        timeAgo="1 hour ago"
        location={<RiskChip risk={{ id: 'hotel', label: 'Royal Palms Resort, Phuket', explanation: '', tip: '' }} found={found.has('hotel')} onFind={onFind} showAll={showAll} />}
        imageEmoji="🌊"
        imageCaption="Beach photo with hotel name sign in background"
        caption={
          <span>
            Best weekend ever!! 🌴{' '}
            <RiskChip risk={{ id: 'parents', label: 'first trip without our parents', explanation: '', tip: '' }} found={found.has('parents')} onFind={onFind} showAll={showAll} />{' '}
            lol. We're{' '}
            <RiskChip risk={{ id: 'return', label: 'back Sunday night', explanation: '', tip: '' }} found={found.has('return')} onFind={onFind} showAll={showAll} />{' '}
            😎 #PhuketVibes
          </span>
        }
        likes={124}
        comments={[
          { user: 'surf_bkk', text: 'so jealous!! 🤙' },
          { user: 'travel.asia', text: 'Which beach is this exactly?' },
        ]}
      />
    ),
  },

  // ── Round 4: Chat (password sharing) ─────────────────────────────────────
  {
    id: 'r4',
    type: 'chat',
    risks: [
      {
        id: 'password',
        label: 'SpotifyPass2024!',
        explanation: 'Sharing any password in a chat is risky — chats can be hacked, screenshotted, or seen by others.',
        tip: 'Never share passwords in messages. Use a family plan or separate account instead.',
      },
      {
        id: 'reuse',
        label: 'same password for school email too',
        explanation: 'Password reuse means one breach unlocks everything. Attackers try leaked passwords everywhere.',
        tip: 'Use a unique password for every account. A password manager helps.',
      },
      {
        id: 'bank',
        label: 'SCB app, same password lol',
        explanation: 'Revealing that a family member reuses a password on a banking app is a serious financial risk.',
        tip: 'Bank passwords must be unique and never shared, even as a joke.',
      },
    ],
    render: ({ found, onFind, showAll }) => (
      <MockChat
        contactName="BFF Priya 💜"
        messages={[
          { from: 'them', text: 'ugh I forgot my Spotify password AGAIN' },
          {
            from: 'me',
            text: (
              <span>
                lol just use mine:{' '}
                <RiskChip risk={{ id: 'password', label: 'SpotifyPass2024!', explanation: '', tip: '' }} found={found.has('password')} onFind={onFind} showAll={showAll} />
                {'. '}also it's{' '}
                <RiskChip risk={{ id: 'reuse', label: 'same password for school email too', explanation: '', tip: '' }} found={found.has('reuse')} onFind={onFind} showAll={showAll} />
              </span>
            ),
          },
          { from: 'them', text: 'omg ur so bad at security 😂 does ur mom do this too' },
          {
            from: 'me',
            text: (
              <span>
                worse — she uses it for the{' '}
                <RiskChip risk={{ id: 'bank', label: 'SCB app, same password lol', explanation: '', tip: '' }} found={found.has('bank')} onFind={onFind} showAll={showAll} />
              </span>
            ),
          },
        ]}
      />
    ),
  },

  // ── Round 5: Stranger danger ───────────────────────────────────────────────
  {
    id: 'r5',
    type: 'post',
    risks: [
      {
        id: 'fullname',
        label: 'Kira Thanawat',
        explanation: 'Your full real name on a public profile makes it easy to find you on other platforms and in real life.',
        tip: 'Use a first name or nickname on public social media accounts.',
      },
      {
        id: 'ageSchool',
        label: 'Age 15 • BKK International School',
        explanation: 'Combining your age and exact school in a public bio gives strangers a very specific profile of you.',
        tip: 'Keep your age and school out of your public bio.',
      },
      {
        id: 'respond',
        label: 'Who is this?? Should I reply?',
        explanation: 'Publicly asking your followers to help identify a stranger reveals you received a message and encourages engagement with the unknown person.',
        tip: 'Block and report unknown accounts directly. Don\'t post about it publicly.',
      },
    ],
    render: ({ found, onFind, showAll }) => (
      <MockPost
        avatar="👧"
        username={<RiskChip risk={{ id: 'fullname', label: 'Kira Thanawat', explanation: '', tip: '' }} found={found.has('fullname')} onFind={onFind} showAll={showAll} />}
        badge={<RiskChip risk={{ id: 'ageSchool', label: 'Age 15 • BKK International School', explanation: '', tip: '' }} found={found.has('ageSchool')} onFind={onFind} showAll={showAll} />}
        timeAgo="15 minutes ago"
        imageEmoji="📱"
        imageCaption="Screenshot of a stranger's DM: 'Hey Kira! saw ur post at school. I'm in Grade 10 too. What class? add me on LINE?'"
        caption={
          <span>
            Got this message from someone I don't know 😨{' '}
            <RiskChip risk={{ id: 'respond', label: 'Who is this?? Should I reply?', explanation: '', tip: '' }} found={found.has('respond')} onFind={onFind} showAll={showAll} />
          </span>
        }
        likes={31}
        comments={[
          { user: 'nat_2010', text: 'never seen them! must be a fake acc' },
          { user: 'priya_bff', text: 'DO NOT REPLY block immediately!!!' },
        ]}
      />
    ),
  },
];

// ---------------------------------------------------------------------------
// MockPost — Instagram-style layout
// ---------------------------------------------------------------------------

function MockPost({
  avatar,
  username,
  badge,
  timeAgo,
  location,
  imageEmoji,
  imageCaption,
  caption,
  likes,
  comments,
}: {
  avatar: string;
  username: React.ReactNode;
  badge?: React.ReactNode;
  timeAgo: string;
  location?: React.ReactNode;
  imageEmoji: string;
  imageCaption: string;
  caption: React.ReactNode;
  likes: number;
  comments: { user: string; text: string }[];
}) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-600 overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-slate-700">
        <div className="text-3xl">{avatar}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{username}</div>
          {badge && <div className="text-xs text-slate-400 mt-0.5">{badge}</div>}
          {location && (
            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              📍 {location}
            </div>
          )}
        </div>
        <span className="text-xs text-slate-500">{timeAgo}</span>
      </div>

      {/* Image mock */}
      <div className="bg-slate-800 flex flex-col items-center justify-center py-10 text-5xl gap-2">
        {imageEmoji}
        <p className="text-xs text-slate-500 px-4 text-center">{imageCaption}</p>
      </div>

      {/* Actions row */}
      <div className="flex gap-4 px-3 pt-2 text-lg">❤️ 💬 📤</div>

      {/* Likes */}
      <div className="px-3 pt-1 text-sm font-semibold text-white">{likes} likes</div>

      {/* Caption */}
      <div className="px-3 pt-1 text-sm">
        <span className="font-semibold text-white mr-1">me</span>
        <span className="text-slate-300">{caption}</span>
      </div>

      {/* Comments */}
      <div className="px-3 pt-2 pb-3 space-y-1">
        {comments.map((c, i) => (
          <div key={i} className="text-sm text-slate-400">
            <span className="font-semibold text-slate-300 mr-1">{c.user}</span>
            {c.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MockChat — WhatsApp-style layout
// ---------------------------------------------------------------------------

function MockChat({
  contactName,
  messages,
}: {
  contactName: string;
  messages: { from: 'me' | 'them'; text: React.ReactNode }[];
}) {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-600 overflow-hidden max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 bg-slate-800 border-b border-slate-700">
        <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-lg">💬</div>
        <div>
          <div className="font-semibold text-white text-sm">{contactName}</div>
          <div className="text-xs text-green-400">Online</div>
        </div>
      </div>

      {/* Messages */}
      <div className="p-3 space-y-2 bg-slate-950 min-h-[200px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                msg.from === 'me'
                  ? 'bg-purple-700 text-white rounded-br-sm'
                  : 'bg-slate-700 text-slate-200 rounded-bl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RiskExplanationCard
// ---------------------------------------------------------------------------

function RiskExplanationCard({ risk, found }: { risk: Risk; found: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 rounded-lg border ${
        found
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-red-500/10 border-red-500/30'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="text-lg flex-shrink-0">{found ? '✅' : '❌'}</span>
        <div>
          <div className="text-sm font-semibold text-white mb-0.5">"{risk.label}"</div>
          <div className="text-xs text-slate-300 mb-1">{risk.explanation}</div>
          <div className="text-xs text-purple-300">💡 {risk.tip}</div>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Score helpers
// ---------------------------------------------------------------------------

const GRADE_CONFIG = [
  { min: 14, label: 'Privacy Pro', emoji: '🏆', color: 'text-yellow-400', msg: 'Outstanding! You have a sharp eye for digital risks.' },
  { min: 11, label: 'Privacy Aware', emoji: '🌟', color: 'text-green-400', msg: 'Great job! You spotted most of the hidden dangers.' },
  { min: 7,  label: 'Getting There', emoji: '🎯', color: 'text-blue-400',  msg: 'Good effort! Keep practicing and you\'ll catch them all.' },
  { min: 0,  label: 'Privacy Newbie', emoji: '📚', color: 'text-orange-400', msg: 'There\'s a lot to learn — and that\'s totally OK. Now you know!' },
];

function getGrade(score: number) {
  return GRADE_CONFIG.find(g => score >= g.min) ?? GRADE_CONFIG[GRADE_CONFIG.length - 1];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SpotTheRisk() {
  const [currentRound, setCurrentRound] = useState(0);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<RoundPhase>('playing');
  const [score, setScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const { removeData } = useShadow();

  const round = ROUNDS[currentRound];
  const totalRisks = round.risks.length;
  const foundCount = round.risks.filter(r => found.has(r.id)).length;
  const allFound = foundCount === totalRisks;

  const handleFind = useCallback((id: string) => {
    if (found.has(id)) return;
    const newFound = new Set(found);
    newFound.add(id);
    setFound(newFound);
  }, [found]);

  const handleReveal = () => {
    const missed = round.risks.filter(r => !found.has(r.id)).length;
    const roundScore = foundCount;
    setScore(s => s + roundScore);
    setRoundScores(prev => [...prev, roundScore]);
    // Reward awareness: reduce shadow slightly for each risk found
    if (foundCount > 0) {
      removeData('browsing', foundCount * 2, 'Spot the Risk: awareness earned');
    }
    setPhase('revealed');
  };

  const handleNext = () => {
    if (currentRound + 1 >= ROUNDS.length) {
      setGameOver(true);
    } else {
      setCurrentRound(r => r + 1);
      setFound(new Set());
      setPhase('playing');
    }
  };

  const handleRestart = () => {
    setCurrentRound(0);
    setFound(new Set());
    setPhase('playing');
    setScore(0);
    setRoundScores([]);
    setGameOver(false);
  };

  const totalPossible = ROUNDS.reduce((s, r) => s + r.risks.length, 0);

  // ── Game over screen ────────────────────────────────────────────────────
  if (gameOver) {
    const grade = getGrade(score);
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-7xl mb-4"
          >
            {grade.emoji}
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-1">{grade.label}</h2>
          <p className="text-slate-400 text-sm mb-6">{grade.msg}</p>

          <div className="inline-flex items-center gap-2 mb-8">
            <Star className="text-yellow-400 w-6 h-6" />
            <span className={`text-4xl font-bold ${grade.color}`}>{score}</span>
            <span className="text-slate-500 text-lg">/ {totalPossible}</span>
          </div>

          {/* Per-round breakdown */}
          <div className="grid grid-cols-5 gap-2 mb-8">
            {ROUNDS.map((r, i) => {
              const rs = roundScores[i] ?? 0;
              const max = r.risks.length;
              const perfect = rs === max;
              return (
                <div key={r.id} className="bg-slate-900 rounded-lg p-2 text-center">
                  <div className="text-lg">{perfect ? '⭐' : '🔵'}</div>
                  <div className="text-xs text-slate-400 mt-1">Round {i + 1}</div>
                  <div className={`text-sm font-bold ${perfect ? 'text-yellow-400' : 'text-slate-300'}`}>
                    {rs}/{max}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-6 text-left">
            <p className="text-sm text-purple-300 font-semibold mb-1">🔑 The big takeaways:</p>
            <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
              <li>Your username, bio, and post location reveal more than you think</li>
              <li>Always post vacation photos <em>after</em> you're home</li>
              <li>Every password shared in a chat is a password that can be stolen</li>
              <li>When in doubt about a stranger online: block and report, don't engage</li>
            </ul>
          </div>

          <button
            onClick={handleRestart}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Playing / revealed screen ───────────────────────────────────────────
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <span>🕵️</span>
            <span>Spot the Risk</span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Tap the risky parts before sharing</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Score</div>
          <div className="text-2xl font-bold text-purple-400">{score}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6">
        {ROUNDS.map((r, i) => (
          <div
            key={r.id}
            className={`h-2 flex-1 rounded-full transition-all ${
              i < currentRound
                ? 'bg-green-500'
                : i === currentRound
                ? 'bg-purple-500'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Round label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="px-3 py-1 bg-slate-700 rounded-full text-xs text-slate-300">
          Round {currentRound + 1} of {ROUNDS.length}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          round.type === 'post'
            ? 'bg-pink-500/20 text-pink-300'
            : 'bg-blue-500/20 text-blue-300'
        }`}>
          {round.type === 'post' ? '📸 Social Media Post' : '💬 Chat Message'}
        </span>
        {phase === 'playing' && (
          <span className="text-xs text-slate-500 ml-auto">
            {foundCount}/{totalRisks} found
          </span>
        )}
      </div>

      {/* Instruction banner */}
      <AnimatePresence mode="wait">
        {phase === 'playing' && (
          <motion.div
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
          >
            <p className="text-xs text-yellow-300">
              <strong>👆 Tap the highlighted text</strong> that you think is a privacy risk.
              There are <strong>{totalRisks}</strong> risks to find in this scene.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenario */}
      <div className="mb-6">
        {round.render({ found, onFind: handleFind, showAll: phase === 'revealed' })}
      </div>

      {/* Action buttons */}
      {phase === 'playing' && (
        <div className="flex gap-3">
          {allFound ? (
            <motion.button
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={handleReveal}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
              All found! See results →
            </motion.button>
          ) : (
            <>
              <button
                onClick={handleReveal}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                I give up — show me
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-400 px-2">
                <span className="text-yellow-400 font-bold">{foundCount}</span>/{totalRisks} found
              </div>
            </>
          )}
        </div>
      )}

      {/* Revealed: explanation cards + next */}
      <AnimatePresence>
        {phase === 'revealed' && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">
                You spotted {foundCount}/{totalRisks} risks
                {foundCount === totalRisks ? ' 🎉' : ''}
              </h3>
              <span className="text-purple-400 font-bold">+{foundCount} pts</span>
            </div>

            {round.risks.map(risk => (
              <RiskExplanationCard key={risk.id} risk={risk} found={found.has(risk.id)} />
            ))}

            <button
              onClick={handleNext}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
            >
              {currentRound + 1 < ROUNDS.length ? (
                <>Next Round <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>See Final Score <Trophy className="w-4 h-4" /></>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
