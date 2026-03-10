# Skill: SDD Iterate

## When to use
Use this skill when requirements change, a new constraint is discovered, or verification reveals a spec-level problem. This is Phase 6 of the SDD Pipeline.

## Purpose
Ensure that changes flow **top-down through the artifact chain**: spec → plan → tasks → code. Never hack the code directly when the real problem is in the spec.

## The Golden Rule

> **If the spec is wrong, fix the spec. If the code is wrong, fix the code. Never confuse the two.**

## Decision Tree

```
A requirement changed or a test fails unexpectedly
│
├─ Is the SPEC wrong? (the behavior described in .feature files is incorrect)
│   │
│   ├─ YES → Update spec.md and features/*.feature FIRST
│   │         Then update plan.md if architecture is affected
│   │         Then update task.md with new/modified tasks
│   │         Then implement changes using sdd-implement
│   │
│   └─ NO → The spec is correct. The CODE is wrong.
│            Fix the implementation in src/
│            Do NOT touch .feature files
│            Run tests until GREEN
│
├─ Is there a NEW requirement? (something not covered by any scenario)
│   │
│   ├─ Add new scenarios to the relevant .feature file
│   │   Update spec.md to reflect the new requirement
│   │   Update plan.md if new components are needed
│   │   Add new tasks to task.md
│   │   Implement using sdd-implement
│   │
│   └─ (This is essentially a mini SDD cycle: Specify → Plan → Tasks → Implement)
│
└─ Is a CONSTRAINT changing? (e.g., different API, new performance requirement)
    │
    ├─ Update the Constraints section of spec.md
    │   Update plan.md (architecture may change)
    │   Update task.md
    │   Implement changes
    │
    └─ (Always start from the highest affected artifact)
```

## Process

### 1. Identify What Changed
- Is it a new requirement?
- Is it a correction to an existing requirement?
- Is it a constraint change?

### 2. Update Artifacts Top-Down
Always follow this order:
1. `spec.md` + `features/*.feature` (if behavior changes)
2. `plan.md` (if architecture is affected)
3. `task.md` (add/modify tasks)
4. Implementation (using `sdd-implement` skill)

### 3. Verify
After implementing changes, use the `sdd-verify` skill to confirm everything is consistent.

## Rules
- NEVER modify code to accommodate a new requirement without updating the spec first
- NEVER delete a passing test to make a change easier
- If a Gherkin scenario needs to change, that's OK — but do it consciously in this phase, not during implementation
- Document the reason for the iteration in `spec.md` (e.g., "Added totalSlides field per pagination requirement")
- After iteration, ALL previous tests must still pass (unless the spec explicitly changed their expected behavior)
