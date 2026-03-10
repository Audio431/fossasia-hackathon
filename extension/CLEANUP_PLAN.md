# 📁 Project Reorganization Plan

## Current Issues
- Root directory cluttered with many files
- Documentation mixed with demo files
- No clear separation of concerns
- Difficult to navigate for contributors

## Proposed Structure

```
privacy-shadow/
├── 📄 README.md                    # Main project README (keep in root)
├── 📄 LICENSE                      # MIT License (keep in root)
├── 📄 package.json                 # Dependencies (keep in root)
├── 📄 tsconfig.json                # TypeScript config (keep in root)
├── 📄 playwright.config.ts          # Test config (keep in root)
├── 📄 .gitignore                   # Git ignore (keep in root)
│
├── 📚 docs/                        # All documentation
│   ├── README.md (overview)
│   ├── QUICKSTART.md
│   ├── DEMO_INSTRUCTIONS.md
│   ├── HACKATHON_SUMMARY.md
│   ├── FEATURES.md
│   ├── ARCHITECTURE.md
│   ├── CONTRIBUTING.md
│   └── REORGANIZATION.md
│
├── 🎬 demos/                       # Demo and test pages
│   ├── showcase.html
│   ├── test-instagram-dm.html
│   ├── test-twitter.html
│   └── assets/
│       ├── images/
│       └── videos/
│
├── 🔧 extension/                   # Browser extension code
│   ├── background.ts
│   ├── popup.tsx
│   ├── content.ts
│   ├── components/
│   ├── contents/
│   ├── detection/
│   ├── utils/
│   └── (all extension files)
│
├── 🧪 tests/                       # Test files
│   ├── unit/
│   ├── e2e/
│   └── fixtures/
│
└── 📸 screenshots/                 # Screenshots for README
    ├── alert-example.png
    ├── dashboard.png
    └── demo-flow.png
```

## Benefits

✅ **Clean root** - Only essential files in root
✅ **Organized docs** - All documentation in one place
✅ **Separate demos** - Demo pages isolated from code
✅ **Easy navigation** - Clear purpose for each folder
✅ **Professional** - Industry-standard structure
