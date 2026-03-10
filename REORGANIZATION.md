# 📁 Folder Reorganization Plan

## Current Structure Issues
- Duplicate files in `contents/` and `content-scripts/`
- Inconsistent file organization
- Test files mixed with source
- No clear separation of concerns

## Proposed Structure

```
extension/
├── background/              # Background service workers
│   └── background.ts
│
├── components/              # React UI components
│   ├── alerts/             # Alert components
│   │   ├── StrangerAlert.tsx
│   │   ├── KidAlert.tsx
│   │   └── ParentAlert.tsx
│   ├── dashboard/          # Dashboard components
│   │   ├── ParentPopup.tsx
│   │   ├── RealTimeMonitor.tsx
│   │   └── StrangerAnalytics.tsx
│   └── education/          # Educational components
│       ├── OnlineSafetyEducation.tsx
│       └── ConversationTimelineAnalyzer.tsx
│
├── content-scripts/         # Content scripts (unified)
│   ├── platforms/          # Platform-specific scripts
│   │   ├── instagram/
│   │   │   ├── dm-monitor.ts
│   │   │   ├── comment-monitor.ts
│   │   │   └── profile-monitor.ts
│   │   ├── twitter/
│   │   ├── discord/
│   │   └── generic/
│   ├── forms/              # Form monitoring
│   │   └── form-monitor.ts
│   └── shared/             # Shared utilities
│       └── dom-monitor.ts
│
├── core/                   # Core detection logic
│   ├── ml/                 # ML models
│   │   ├── model.ts
│   │   ├── features.ts
│   │   └── training-data.ts
│   ├── detection/          # Detection engines
│   │   ├── stranger-detector.ts
│   │   ├── pii-detector.ts
│   │   └── risk-scoring.ts
│   └── types/              # Shared types
│       └── index.ts
│
├── utils/                  # Utility functions
│   ├── alert-overlay.ts
│   ├── settings.ts
│   └── helpers.ts
│
└── __tests__/              # Test files (unified)
    ├── unit/
    ├── integration/
    └── e2e/
```

## Benefits

✅ **Clear separation**: Each folder has a single purpose
✅ **No duplicates**: Remove duplicate files
✅ **Easy navigation**: Find files quickly
✅ **Scalable**: Easy to add new platforms
✅ **Test separation**: Tests in dedicated folder

## Migration Steps

1. Create new folder structure
2. Move files to new locations
3. Update import paths
4. Remove duplicates
5. Test everything works
6. Commit changes
