---
name: sdd-verify
description: How to verify the implementation against specs and architecture rules
---

# Skill: SDD Verify

## When to use
Use this skill AFTER one or more `sdd-implement` cycles are complete. This is Phase 5 of the SDD Pipeline. Run this periodically to validate overall project health.

## Purpose
Run all tests, perform static analysis, and verify architecture rules. Produce an **evidence bundle** that proves the implementation is correct and complete.

## Inputs
- `constitution.md` — Project-level immutable rules (MUST be read before starting)
- All source code in `src/`
- All test files
- `spec.md`, `plan.md`, `task.md`
- `features/*.feature`

## Outputs
- `evidence.md` — Evidence bundle document

## Process

### 0. Read the Constitution
**Before doing anything else**, read `constitution.md`. During verification, you will check compliance against constitution rules in addition to spec/plan alignment.

### 1. Run All Tests
```bash
npm test
```
- Capture the full output (pass/fail counts, any error messages)
- ALL tests must pass. If any fail, STOP and fix before continuing.

### 2. Check Test Coverage
If coverage is configured:
```bash
npm test -- --coverage
```
- Document coverage percentages per file/module
- Flag any source file with 0% coverage — it may indicate untested code

### 3. Verify Spec Completeness
Cross-reference:
- Every scenario in `features/*.feature` → has a matching test → test passes
- Every component in `plan.md` → has an implementation in `src/`
- Every task in `task.md` → is marked `- [x]`

Flag any gaps.

### 4. Verify Architecture Rules
Check against `plan.md`:
- Pure transformation stages have NO side effects (no imports of external services)
- Stages with dependencies use dependency injection or module-level imports that can be mocked
- Data flows match the planned pipeline order
- TypeScript interfaces match the contracts defined in the plan

### 5. Write evidence.md
Create or update `evidence.md` at the project root:

```markdown
# Verification Evidence

## Date
[current date/time]

## Test Results
- Total scenarios: [N]
- Passing: [N]
- Failing: [N]
- Test command: `npm test`

## Coverage Summary
| File | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| ... | ...% | ...% | ...% | ...% |

## Spec Completeness
- [x] All Gherkin scenarios have matching tests
- [x] All planned components are implemented
- [x] All tasks in task.md are marked complete
- [ ] [Any gaps found]

## Architecture Compliance
- [x] Pure stages have no side effects
- [x] External dependencies are mockable
- [x] Data flow matches plan.md
- [ ] [Any violations found]

## Outstanding Issues
- [List any issues, or "None"]

## Constitution Compliance
- [x] All LLM prompts are version-controlled in spec.md and stored as named constants
- [x] Exact model identifiers are documented in spec.md
- [x] No real API calls in tests — all external deps are mocked
- [x] No hardcoded API keys or secrets in source code
- [x] All stages use dependency injection for external services
- [x] Injectable test knobs used for rate limiting delays
- [x] No forbidden patterns present (no `any` types, no direct SDK usage in stages)
- [ ] [Any violations found]
```

## Rules
- Do NOT skip any verification step
- If verification fails, do NOT just update `evidence.md` with the failure — go back to `sdd-implement` and fix it first
- The evidence bundle is a **living document** — update it after each verification pass
