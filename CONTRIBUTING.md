# 🤝 Contributing to Privacy Shadow

Thank you for your interest in contributing to Privacy Shadow! We welcome contributions from the community and are excited to have you involved.

## 🎯 How to Contribute

### Quick Start

1. **Fork the repository**
   ```bash
   # Fork on GitHub
   git clone https://github.com/YOUR_USERNAME/fossasia-hackathon.git
   cd privacy-shadow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**
   - Follow our coding standards
   - Add tests for new features
   - Update documentation

5. **Test your changes**
   ```bash
   npm run lint
   npm run test
   npm run type-check
   npm run build
   ```

6. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to GitHub and create a PR
   - Fill out the PR template
   - Wait for review

---

## 📋 Development Guidelines

### Coding Standards

#### TypeScript
- Use TypeScript for all new files
- Enable strict mode
- Avoid `any` types
- Use interfaces for object shapes
- Add JSDoc comments for functions

#### React
- Use functional components with hooks
- Follow React best practices
- Use props interfaces
- Implement proper error boundaries

#### Styling
- Use Tailwind CSS utility classes
- Follow our design system
- Ensure mobile responsiveness
- Use semantic HTML

### Code Style

```typescript
// ✅ Good
interface UserProfile {
  username: string;
  age: number;
  isVerified: boolean;
}

/**
 * Analyzes user profile for risk factors
 * @param profile - The user profile to analyze
 * @returns Risk score between 0 and 100
 */
function analyzeProfile(profile: UserProfile): number {
  // Implementation
}

// ❌ Bad
function analyzeProfile(profile: any): any {
  // Implementation
}
```

### Naming Conventions

- **Components**: PascalCase (`StrangerAlert.tsx`)
- **Functions**: camelCase (`extractFeatures`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RISK_SCORE`)
- **Interfaces**: PascalCase (`UserProfile`)
- **Types**: PascalCase (`RiskLevel`)

---

## 🧪 Testing Guidelines

### Unit Tests

```typescript
// Example test
describe('MLFeatureExtractor', () => {
  it('should extract account age correctly', () => {
    const extractor = new MLFeatureExtractor();
    const age = extractor.extractAccountAge('2024-01-01');
    expect(age).toBeGreaterThan(0);
  });

  it('should handle invalid dates', () => {
    const extractor = new MLFeatureExtractor();
    const age = extractor.extractAccountAge('invalid');
    expect(age).toBe(0);
  });
});
```

### E2E Tests

```typescript
// Example E2E test
test('detects stranger danger in Instagram DM', async ({ page }) => {
  await page.goto('file:///path/to/test-instagram-dm.html');
  await page.click('button[data-scenario="stranger"]');

  const alert = page.locator('.stranger-alert');
  await expect(alert).toBeVisible();
  await expect(alert).toContainText('STRANGER DANGER');
});
```

### Test Coverage

- Aim for >80% code coverage
- Test critical paths thoroughly
- Include edge cases
- Test error handling

---

## 📖 Documentation Standards

### Code Documentation

```typescript
/**
 * ML-based stranger detection model
 * Uses TensorFlow.js neural network with 28 features
 *
 * @example
 * ```typescript
 * const model = new StrangerDetectionModel();
 * await model.initialize();
 * const prediction = await model.predict(features);
 * ```
 */
class StrangerDetectionModel {
  // Implementation
}
```

### README Updates

When adding features:
1. Update feature list
2. Add new examples
3. Update screenshots
4. Add API documentation

### Comment Style

- Use clear, concise language
- Explain "why" not just "what"
- Include examples for complex logic
- Keep comments up-to-date

---

## 🐛 Bug Reports

### Before Creating a Bug Report

1. **Check existing issues**
   - Search for similar problems
   - Check if already fixed in latest version

2. **Gather information**
   - Browser version and OS
   - Console errors (F12)
   - Steps to reproduce
   - Expected vs actual behavior

3. **Create minimal reproduction**
   - Simplify the problem
   - Remove unrelated factors
   - Test on clean environment

### Bug Report Template

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: Chrome 120
- OS: Windows 11
- Extension Version: 1.0.0

## Screenshots
If applicable, add screenshots

## Additional Context
Any other relevant information
```

---

## ✨ Feature Requests

### Before Requesting

1. **Check if feature exists**
   - Read documentation
   - Check existing issues
   - Review roadmap

2. **Consider the impact**
   - Will this benefit many users?
   - Is it aligned with project goals?
   - Is it technically feasible?

### Feature Request Template

```markdown
## Feature Description
Clear description of the proposed feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this work?

## Alternatives Considered
What other approaches did you consider?

## Additional Context
Drawings, mockups, examples, etc.
```

---

## 🎨 Design Guidelines

### UI Components

- Follow existing design patterns
- Use consistent color scheme
- Maintain accessibility standards
- Test on different screen sizes

### Color Usage

- 🟢 Green (0-24%): Safe
- 🟡 Yellow (25-49%): Caution
- 🟠 Orange (50-69%): Warning
- 🔴 Red (70-89%): Danger
- 🚨 Critical (90-100%): Emergency

### Typography

- Use system fonts for performance
- Maintain readable font sizes
- Ensure proper line height
- Support dark mode (future)

---

## 🚀 Release Process

### Version Bumping

We use semantic versioning:
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Git tag created
- [ ] GitHub release published

---

## 📋 Pull Request Guidelines

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Changes tested locally

## Related Issues
Fixes #123
Related to #456
```

### Review Process

1. **Automated checks**
   - CI/CD pipeline runs
   - Linting checks
   - Test suite

2. **Code review**
   - Maintainer reviews code
   - Provides feedback
   - Requests changes if needed

3. **Approval**
   - At least one approval required
   - All CI checks must pass
   - No merge conflicts

---

## 🌟 Community Guidelines

### Be Respectful
- Treat everyone with respect
- Use inclusive language
- Welcome newcomers
- Assume good intentions

### Constructive Feedback
- Focus on what, not who
- Provide specific examples
- Suggest improvements
- Acknowledge good work

### Collaboration
- Share knowledge freely
- Ask questions openly
- Help when you can
- Learn from others

---

## 🎓 Getting Help

### Resources

- **Documentation**: [README.md](./README.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Features**: [FEATURES.md](./FEATURES.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)

### Communication

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Pull Requests**: Code contributions

### Learning Resources

- **Plasmo Docs**: https://docs.plasmo.com
- **TensorFlow.js**: https://www.tensorflow.org/js
- **React Docs**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org/docs

---

## ⭐ Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in significant features
- Invited to become maintainers (for significant contributions)

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You

Your contributions help make Privacy Shadow better for everyone. Whether you're fixing bugs, adding features, improving documentation, or helping others, we appreciate your time and effort!

**Together, we're protecting young users online!** 🛡️

---

**Need help?** Open an issue or start a discussion!
**Ready to contribute?** Follow the guidelines above and create a PR!
