# 🏗️ Privacy Shadow - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Chrome/Edge)                    │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Content    │      │    Popup     │      │   Background  │
│   Scripts    │      │   Interface  │      │   Service     │
└──────────────┘      └──────────────┘      └──────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Real-Time   │      │   Parent     │      │   Message    │
│  Monitoring  │      │  Dashboard   │      │  Routing     │
└──────────────┘      └──────────────┘      └──────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
                    ┌───────────────────┐
                    │   Detection Core  │
                    └───────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   ML Model   │      │  Rule-Based  │      │   Ensemble   │
│(TensorFlow.js)│     │   Engine     │      │   Algorithm  │
└──────────────┘      └──────────────┘      └──────────────┘
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                                │
                                ▼
                    ┌───────────────────┐
                    │  Risk Assessment  │
                    │   & Alerting      │
                    └───────────────────┘
```

---

## Component Architecture

### 1. Content Scripts (Injection Layer)

```
extension/contents/
├── instagram-stranger-monitor.ts    # Instagram DM monitoring
│   ├── DOM Observation (MutationObserver)
│   ├── Profile Extraction
│   ├── Message Analysis
│   └── Risk Detection Trigger
│
├── form-monitor.ts                   # Form submission monitoring
│   ├── Form Interception
│   ├── Input Validation
│   ├── PII Detection
│   └── Alert Display
│
└── dom-monitor.ts                    # General DOM monitoring
    ├── Social Media Posts
    ├── Comment Sections
    ├── Image Uploads
    └── Content Changes
```

### 2. Detection Core (Analysis Layer)

```
extension/detection/
├── ml-model.ts                       # TensorFlow.js Model
│   ├── Neural Network Architecture
│   ├── Feature Extraction (28 features)
│   ├── Model Training (100 epochs)
│   ├── Prediction Engine
│   └── Confidence Scoring
│
├── ml-features.ts                    # Feature Engineering
│   ├── Account Signals (8)
│   ├── Social Graph (6)
│   ├── Content Analysis (8)
│   └── Context Factors (6)
│
├── training-data-generator.ts        # Synthetic Training Data
│   ├── Safe Conversations (50 samples)
│   ├── Dangerous Patterns (50 samples)
│   └── 16 Scenario Types
│
└── pii-detector.ts                   # PII Pattern Matching
    ├── Personal Info Patterns
    ├── Contact Info Detection
    ├── Location Data Extraction
    └── Sensitive Content Flags
```

### 3. UI Components (Presentation Layer)

```
extension/components/
├── StrangerAlert.tsx                 # Real-time Alert UI
│   ├── Risk Meter (0-100%)
│   ├── Confidence Display
│   ├── Risk Factor Breakdown
│   └── Action Buttons
│
├── RealTimeMonitor.tsx               # Live Monitoring Dashboard
│   ├── Active Conversations
│   ├── Message Feed
│   ├── Risk Analysis
│   └── Performance Metrics
│
├── OnlineSafetyEducation.tsx         # Educational Content
│   ├── Safety Tips (Kids)
│   ├── Parental Guidance
│   ├── Grooming Education
│   └── Warning Signs
│
└── ConversationTimelineAnalyzer.tsx  # Conversation Analysis
    ├── Message Timeline
    ├── Escalation Detection
    ├── Pattern Recognition
    └── AI Insights
```

---

## Data Flow Architecture

### Real-Time Detection Flow

```
┌────────────────────────────────────────────────────────────┐
│ 1. USER ACTION                                             │
│    - Child sends DM on Instagram                          │
│    - Submits form with personal info                       │
│    - Posts comment with sensitive data                    │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ 2. CONTENT SCRIPT DETECTION                               │
│    - MutationObserver detects DOM change                  │
│    - Extracts conversation data                           │
│    - Identifies potential PII or stranger threat           │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ 3. FEATURE EXTRACTION                                    │
│    - Extract 28 features from conversation                │
│    - Account signals (age, followers, verification)       │
│    - Social graph (mutual friends, interaction history)   │
│    - Content analysis (personal info requests, pressure)  │
│    - Context (platform, time, public/private)            │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ 4. ML MODEL PREDICTION                                   │
│    - TensorFlow.js neural network inference               │
│    - Rule-based analysis (complementary)                  │
│    - Ensemble combination (70% ML + 30% rules)           │
│    - Confidence score calculation                         │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ 5. RISK ASSESSMENT                                       │
│    - Calculate risk score (0-100%)                        │
│    - Determine risk level (low/medium/high/critical)      │
│    - Extract top risk factors                             │
│    - Generate actionable recommendation                    │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ 6. ALERT DISPLAY                                          │
│    IF risk >= threshold:                                  │
│    - Show color-coded alert (green/yellow/orange/red)     │
│    - Display confidence score                             │
│    - List top 3 risk factors                             │
│    - Provide action buttons                               │
│    - Log alert for parent dashboard                       │
└────────────────────────────────────────────────────────────┘
```

---

## Machine Learning Pipeline

### Training Pipeline

```
┌────────────────────────────────────────────────────────────┐
│ 1. DATA GENERATION                                        │
│    - TrainingDataGenerator generates 100 synthetic samples │
│    - 50 safe conversations (family, friends, classmates)  │
│    - 50 dangerous patterns (grooming, harvesting, etc.)   │
│    - 16 scenario types covering realistic situations      │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ 2. FEATURE EXTRACTION                                    │
│    - Extract 28 features for each sample                  │
│    - Normalize features to 0-1 range                      │
│    - Create feature vectors for training                  │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ 3. MODEL TRAINING                                        │
│    - Create neural network architecture                   │
│    - Train for 100 epochs with 20% validation split      │
│    - Monitor accuracy and loss during training           │
│    - Save trained model weights                           │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ 4. MODEL VALIDATION                                      │
│    - Test on validation set (20%)                         │
│    - Calculate metrics (accuracy, precision, recall)      │
│    - Verify 87%+ accuracy achieved                        │
└────────────────────────────────────────────────────────────┘
```

### Inference Pipeline

```
┌────────────────────────────────────────────────────────────┐
│ INPUT: Conversation Data                                  │
│   - Profile information                                   │
│   - Message history                                       │
│   - Platform context                                      │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ FEATURE EXTRACTION: 28 features                           │
│   ├─ Account Signals (8)                                 │
│   ├─ Social Graph (6)                                    │
│   ├─ Content Analysis (8)                                │
│   └─ Context Factors (6)                                 │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ ML PREDICTION (TensorFlow.js)                            │
│   - Input: 28 feature vector                              │
│   - Hidden Layer 1: 64 neurons (ReLU)                    │
│   - Hidden Layer 2: 32 neurons (ReLU)                    │
│   - Dropout: 30%                                          │
│   - Hidden Layer 3: 16 neurons (ReLU)                    │
│   - Output: 1 neuron (Sigmoid) → Stranger Probability    │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ RULE-BASED ANALYSIS (Complementary)                      │
│   - Heuristic pattern matching                            │
│   - Known dangerous phrases                               │
│   - Suspicious behavior patterns                         │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ ENSEMBLE COMBINATION                                     │
│   Final Probability = (ML_Prediction × 0.7) + (Rules × 0.3)│
│   Confidence = Calculated based on model certainty        │
└────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ OUTPUT: Stranger Prediction                              │
│   - Probability: 0-1 (stranger likelihood)               │
│   - Confidence: 0-1 (model certainty)                    │
│   - Risk Factors: Top 3 contributing features            │
│   - Recommendation: Action suggestion                     │
└────────────────────────────────────────────────────────────┘
```

---

## Platform Integration Architecture

### Multi-Platform Support

```
                    ┌─────────────────────┐
                    │   Privacy Shadow    │
                    │      Extension      │
                    └─────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │Instagram│         │Twitter/X│         │ Discord │
    │ Monitor │         │ Monitor │         │ Monitor │
    └─────────┘         └─────────┘         └─────────┘
         │                     │                     │
         │                     │                     │
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │ DM &    │         │ Tweets  │         │Messages │
    │ Comments│         │ Replies │         │ Servers │
    └─────────┘         └─────────┘         └─────────┘

         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
    ┌─────────┐         ┌─────────┐         ┌─────────┐
    │Facebook │         │  TikTok │         │ YouTube │
    │ Monitor │         │ Monitor │         │ Monitor │
    └─────────┘         └─────────┘         └─────────┘
```

### Platform-Specific Features

| Platform | Monitor | Detect | Special Features |
|----------|---------|--------|------------------|
| **Instagram** | DMs, Comments, Posts, Bio | Stranger detection, grooming, PII | Thread analysis, story monitoring |
| **Twitter/X** | Tweets, Replies, DMs | Personal info, suspicious links | Hashtag analysis, quote tweets |
| **Discord** | Messages, Servers | Grooming in servers, DM requests | Server context, role analysis |
| **Facebook** | Posts, Comments, Messages | Profile analysis, PII sharing | Friend suggestions, group chats |
| **TikTok** | Comments, Profile | Bot detection, fake accounts | Video content analysis |
| **YouTube** | Comments, Replies | Personal info requests | Channel analysis, comment threads |
| **Generic** | Forms, Inputs | PII in form submissions | Universal form monitoring |

---

## Alert System Architecture

### Alert Levels & Triggers

```
┌─────────────────────────────────────────────────────────────┐
│ RISK LEVEL DETERMINATION                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 0-24%  🟢 LOW RISK      → No Alert                        │
│        │                                                    │
│        │    Known contact, mutual friends, safe behavior   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 25-49% 🟡 MEDIUM RISK   → Info Alert                       │
│        │                                                    │
│        │    Some concerning signals, monitor closely        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 50-69% 🟠 HIGH RISK     → Warning Alert                    │
│        │                                                    │
│        │    Clear danger signs, caution warranted          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 70-89% 🔴 VERY HIGH     → Danger Alert                     │
│        │                                                    │
│        │    Stranger danger, immediate action recommended  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 90-100% 🚨 CRITICAL       → Emergency Alert                 │
│        │                                                    │
│        │    Severe threat, block and report immediately     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Alert Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ALERT DISPLAY UI                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  🔴 STRANGER DANGER DETECTED                          │  │
│  │  Risk Score: 78% │ Confidence: 87%                    │  │
│  ├─────────────────────────────────────────────────────┤  │
│  │                                                       │  │
│  │  ⚠️ TOP RISK FACTORS:                                │  │
│  │  • No mutual friends (0 connections)                 │  │
│  │  • Requests personal information (location)         │  │
│  │  • New account (<14 days old)                        │  │
│  │                                                       │  │
│  │  ┌─────────────┬─────────────┬─────────────┐        │  │
│  │  │Block &Report│I Know This  │Learn Why   │        │  │
│  │  │             │Person       │It's Risky  │        │  │
│  │  └─────────────┴─────────────┴─────────────┘        │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend Stack
- **Framework**: Plasmo (Chrome Extension)
- **UI Library**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Machine Learning Stack
- **Framework**: TensorFlow.js
- **Model Architecture**: Custom Neural Network
- **Training Data**: Synthetic (100 samples, 16 scenarios)
- **Features**: 28 comprehensive signals
- **Training**: 100 epochs, 20% validation split

### Development Tools
- **Package Manager**: npm
- **Build Tool**: Plasmo bundler
- **Linting**: ESLint
- **Testing**: Playwright (E2E), Jest (Unit)
- **CI/CD**: GitHub Actions

---

## Performance Optimization

### Inference Optimization
```
1. Feature Extraction Caching
   - Cache profile data (5 min TTL)
   - Cache mutual friends (10 min TTL)
   - Reduce redundant API calls

2. Model Optimization
   - Quantization (Float32 → Float16)
   - Model pruning (remove weak connections)
   - Batch prediction for multiple messages

3. Lazy Loading
   - Load ML model only when needed
   - Lazy load UI components
   - Code splitting by route

4. Background Processing
   - Web Workers for heavy computations
   - Async feature extraction
   - Non-blocking UI updates
```

### Memory Optimization
```
1. Tensor Management
   - Dispose tensors after use
   - Reuse tensor buffers
   - Limit tensor pool size

2. Event Listeners
   - Remove unused observers
   - Debounce expensive operations
   - Throttle DOM queries

3. State Management
   - Minimize re-renders
   - Use React.memo for components
   - Virtual scrolling for long lists
```

---

## Security Architecture

### Threat Model

```
┌─────────────────────────────────────────────────────────────┐
│ POTENTIAL THREATS                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. PREDATORY BEHAVIOR                                      │
│     • Stranger approaching child                            │
│     • Grooming patterns                                     │
│     • Personal info harvesting                              │
│     • Inappropriate content requests                        │
│                                                             │
│  2. FAKE ACCOUNTS                                           │
│     • Bots impersonating real people                       │
│     • Stolen profile photos                                │
│     • Artificial engagement                                 │
│                                                             │
│  3. MANIPULATION TACTICS                                   │
│     • Pressure and urgency                                 │
│     • Gift offering                                        │
│     • Secrecy requests                                     │
│     • Guilt tripping                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Protection Mechanisms

```
┌─────────────────────────────────────────────────────────────┐
│ DEFENSE IN LAYERS                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LAYER 1: PREVENTION                                        │
│  • Educational resources                                    │
│  • Warning signs                                           │
│  • Risk awareness training                                  │
│                                                             │
│  LAYER 2: DETECTION                                         │
│  • Real-time monitoring                                     │
│  • ML-based pattern recognition                             │
│  • Context-aware analysis                                  │
│                                                             │
│  LAYER 3: ALERTING                                          │
│  • Immediate notifications                                  │
│  • Clear risk explanations                                  │
│  • Actionable recommendations                               │
│                                                             │
│  LAYER 4: INTERVENTION                                      │
│  • Block & Report functionality                             │
│  • Parent dashboard alerts                                  │
│  • Incident logging                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability Architecture

### Horizontal Scaling
```
                    ┌─────────────────────┐
                    │   Chrome Browser    │
                    │     Instance 1      │
                    └─────────────────────┘
                               │
                    ┌─────────────────────┐
                    │   Chrome Browser    │
                    │     Instance 2      │
                    └─────────────────────┘
                               │
                    ┌─────────────────────┐
                    │   Chrome Browser    │
                    │     Instance N      │
                    └─────────────────────┘
```

### Vertical Scaling
```
Current:    Single browser, single extension
Future:     Multiple browsers, mobile apps

┌─────────────────────────────────────────────────────────────┐
│ MULTI-PLATFORM SUPPORT                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Browser Extensions                                        │
│  ├─ Chrome/Edge (✅ Implemented)                           │
│  ├─ Firefox (🚧 Planned)                                  │
│  └─ Safari (🚧 Planned)                                   │
│                                                             │
│  Mobile Apps                                                │
│  ├─ iOS (🚧 Planned)                                      │
│  ├─ Android (🚧 Planned)                                  │
│  └─ React Native (🚧 Planned)                              │
│                                                             │
│  Web Applications                                          │
│  └─ Parent Dashboard (🚧 Planned)                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

This architecture document provides a comprehensive view of the Privacy Shadow system, from high-level design to implementation details. Perfect for technical discussions and architecture reviews! 🏗️
