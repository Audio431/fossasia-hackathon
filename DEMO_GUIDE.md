# Privacy Shadow - ML Stranger Detection Demo Guide

## 🚀 Quick Start

### Option 1: Open Interactive Demo
Simply open `ML_STRANGER_DEMO.html` in your browser:
```bash
open ML_STRANGER_DEMO.html
# Or double-click the file in Finder
```

### Option 2: Run Extension Demo
1. Build the extension:
```bash
npm install
npm run build
```

2. Load in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `build/chrome-mv3-prod` folder

## 🎯 Demo Scenarios

### 1. Safe Conversation (Low Risk)
**Scenario**: Chatting with a known friend from school

**What happens**:
- ✅ Mutual friends detected: 15
- ✅ Previous interactions: 45
- ✅ Account age: 365 days
- ✅ Verified account: Yes
- ✅ Result: Low risk (8% probability)

### 2. Stranger Danger (High Risk)
**Scenario**: New follower asks for personal info

**What happens**:
- ⚠️ No mutual friends: 0
- ⚠️ New account: 5 days old
- ⚠️ Personal info requests: 1
- ⚠️ Result: High risk (78% probability)

### 3. Grooming Pattern (Critical Risk)
**Scenario**: Escalating inappropriate requests

**What happens**:
- 🚨 Grooming language: 2 instances
- 🚨 Secret requests detected
- 🚨 Late night messaging
- 🚨 Result: Critical risk (92% probability)

### 4. Group Chat (Medium Risk)
**Scenario**: Unknown person in group chat

**What happens**:
- 🔶 Unknown in group
- 🔶 Personal questions
- 🔶 Result: Medium risk (45% probability)

## 📊 Key Features

- **28-Feature ML Engine**: Comprehensive analysis
- **Real-Time Detection**: <200ms inference
- **Hybrid Approach**: ML + Expert rules
- **Visual Alerts**: Color-coded risk levels
- **Parent Dashboard**: Analytics and insights

## 🎨 Demo Highlights

### Visual Appeal
✨ Gradient backgrounds
✨ Smooth animations
✨ Interactive UI
✨ Real-time updates

### Technical Excellence
⚡ TensorFlow.js ML
⚡ React components
⚡ Type-safe TypeScript
⚡ Privacy-first design

## 🏆 Hackathon Advantages

- **Innovation**: First ML-powered stranger detection extension
- **Impact**: Protects children from online predators
- **Technical**: Clean architecture, comprehensive features
- **Presentation**: Interactive, visual, compelling

For detailed demo script and talking points, see the demo page!
