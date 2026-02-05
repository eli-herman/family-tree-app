# Review Tools

> Pre and post implementation code review using the 14B model.

## Overview

Two MCP tools for quality gates:

1. **`local_review_approach`** - Review before coding
2. **`local_review_code`** - Review after coding

Both use the remote 14B model for deeper analysis than the local 7B.

## Why Review Tools?

**Catch issues early:**
- Bad approaches before wasting time implementing
- Bugs before they reach production
- Security issues before they're exploited

**Second opinion:**
- Different perspective than Claude
- Catches things Claude might miss
- Validates assumptions

## local_review_approach

Review a proposed implementation plan **before** writing code.

### Input

```json
{
  "goal": "Add user authentication with JWT tokens",
  "approach": "1. Create auth middleware\n2. Add /login endpoint\n3. Store tokens in localStorage",
  "context": "React Native app with Expo, Firebase backend",
  "existing_file": "src/auth/index.ts"  // optional
}
```

### Output

```json
{
  "verdict": "revise",
  "score": 65,
  "concerns": [
    {
      "severity": "major",
      "issue": "Storing JWT in localStorage is vulnerable to XSS attacks",
      "suggestion": "Use httpOnly cookies or secure storage (expo-secure-store)"
    },
    {
      "severity": "minor",
      "issue": "No mention of token refresh strategy",
      "suggestion": "Add refresh token rotation to handle expiration"
    }
  ],
  "strengths": [
    "Middleware approach is clean and reusable",
    "Separating auth into dedicated module"
  ],
  "missing_considerations": [
    "Error handling for invalid tokens",
    "Logout/token invalidation",
    "Rate limiting on login endpoint"
  ],
  "recommended_changes": [
    "Use expo-secure-store instead of localStorage",
    "Add refresh token mechanism",
    "Include rate limiting"
  ],
  "summary": "Good foundation but has a critical security flaw with token storage. Revise storage strategy before implementing."
}
```

### Verdicts

| Verdict | Meaning | Action |
|---------|---------|--------|
| `approve` | Good to proceed | Implement as planned |
| `revise` | Has issues | Address concerns first |
| `reject` | Fundamental problems | Rethink approach |

### Score Interpretation

| Score | Quality |
|-------|---------|
| 90-100 | Excellent, minor tweaks only |
| 70-89 | Good, some improvements needed |
| 50-69 | Acceptable but risky |
| 0-49 | Needs significant rework |

## local_review_code

Review implemented code **after** writing it.

### Input

```json
{
  "goal": "Add user authentication with JWT tokens",
  "file": "src/auth/middleware.ts",
  "original_file": "src/auth/middleware.ts.bak"  // optional, for diff
}
```

Or with inline code:

```json
{
  "goal": "Add user authentication with JWT tokens",
  "code": "export function authMiddleware(req, res, next) { ... }"
}
```

### Output

```json
{
  "verdict": "revise",
  "score": 72,
  "bugs": [
    {
      "severity": "critical",
      "line": 15,
      "issue": "Token verification doesn't catch expired tokens",
      "fix": "Add try-catch around jwt.verify() and check for TokenExpiredError"
    },
    {
      "severity": "minor",
      "line": 28,
      "issue": "Potential null reference if user not found",
      "fix": "Add null check: if (!user) return res.status(401).json({...})"
    }
  ],
  "security_issues": [
    {
      "severity": "major",
      "issue": "JWT secret is hardcoded",
      "fix": "Move to environment variable: process.env.JWT_SECRET"
    }
  ],
  "style_issues": [
    {
      "issue": "Inconsistent error response format",
      "suggestion": "Use consistent {error: string, code: string} shape"
    }
  ],
  "test_suggestions": [
    "Test with expired token",
    "Test with malformed token",
    "Test with missing Authorization header"
  ],
  "summary": "Functional implementation but has a critical bug with expired token handling and a security issue with hardcoded secret."
}
```

### Severity Levels

| Severity | Meaning | Action |
|----------|---------|--------|
| `critical` | Will cause failures/security breach | Must fix before merge |
| `major` | Significant problem | Should fix before merge |
| `minor` | Small issue | Can fix later |

## Usage in Workflow

### Pre-Implementation

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│ Plan change │───►│ review_approach  │───►│ Approved?   │
└─────────────┘    └──────────────────┘    └──────┬──────┘
                                                   │
                           ┌───────────────────────┼───────────────────────┐
                           │                       │                       │
                           ▼                       ▼                       ▼
                    ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
                    │  Implement  │        │ Revise plan │        │ Rethink     │
                    └─────────────┘        └─────────────┘        └─────────────┘
```

### Post-Implementation

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│ Write code  │───►│  review_code     │───►│ Approved?   │
└─────────────┘    └──────────────────┘    └──────┬──────┘
                                                   │
                           ┌───────────────────────┼───────────────────────┐
                           │                       │                       │
                           ▼                       ▼                       ▼
                    ┌─────────────┐        ┌─────────────┐        ┌─────────────┐
                    │   Commit    │        │ Fix issues  │        │ Major rewrite
                    └─────────────┘        └─────────────┘        └─────────────┘
```

## Routing

Both review tools are marked as `ALWAYS_REMOTE` in the router:

```typescript
const ALWAYS_REMOTE = [
  'review_code',
  'review_approach',
  ...
];
```

This ensures the 14B model is used for thorough analysis.

## Fallback

If remote server is unavailable:
1. Tries local 7B model
2. Returns result with `note: "Fell back to local model"`
3. Quality may be lower

## Best Practices

### When to Review Approach

- **New features** - Before significant new code
- **Refactoring** - Before changing architecture
- **Security-sensitive** - Auth, payments, data handling
- **Performance-critical** - Database queries, algorithms

### When to Review Code

- **After implementing features** - Catch bugs early
- **Before commits** - Quality gate
- **Complex logic** - Validation, state machines
- **Security code** - Auth, encryption, input validation

### Prompt Quality

**Good goal:**
```
"Implement user session management with automatic refresh and secure token storage for React Native"
```

**Bad goal:**
```
"Add auth"
```

More context = better review.

## Limitations

- **14B model** - Smaller than Claude, may miss subtle issues
- **Single file focus** - Doesn't see full codebase context
- **No execution** - Can't actually run or test code
- **False positives** - May flag things that aren't issues

Use as **one input** among many, not the final word.
