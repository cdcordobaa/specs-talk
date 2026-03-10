# Skill: SDD Tasks

## When to use
Use this skill AFTER the `sdd-plan` phase is complete (i.e., `plan.md` exists). This is Phase 3 of the SDD Pipeline.

## Purpose
Break the architecture plan into **small, verifiable work items** that can be implemented one at a time using TDD.

## Inputs
- `plan.md`
- `features/*.feature`

## Outputs
- `task.md` — A checklist of implementation tasks

## Process

### 1. Read the Plan
Read `plan.md`. For each component, identify the minimal set of tasks needed to implement it.

### 2. Order Tasks by Dependency
- Shared types / interfaces first
- Pure transformation stages before stages with external dependencies
- Mocking infrastructure before stages that need mocks
- Integration / wiring last

### 3. Write task.md
Create a `task.md` at the project root with this format:

```markdown
# Task List

## Setup
- [ ] Initialize project, install dependencies, configure test runner

## [Component Name]
- [ ] Create TypeScript interfaces for input/output
- [ ] Write failing tests based on Gherkin scenarios
- [ ] Implement the component to pass the tests
- [ ] Refactor

## [Next Component...]
- [ ] ...

## Integration
- [ ] Wire all stages into the pipeline
- [ ] Create CLI entry point
- [ ] End-to-end manual test
```

### Task Quality Rules
Each task MUST be:
- **Small**: Completable in one TDD cycle (< 30 minutes)
- **Verifiable**: Has a clear definition of "done" (test passes, file exists, etc.)
- **Independent**: Can be worked on without completing other tasks in the same group (where possible)
- **Ordered**: Dependencies are listed before dependents

### Task Granularity Guide
- ✅ "Write failing tests for ContentParser based on content-parser.feature" — Good, specific
- ✅ "Implement ContentParser to pass all tests" — Good, verifiable
- ❌ "Build the parser" — Too vague
- ❌ "Set up everything" — Not verifiable

## Rules
- Each checklist item uses `- [ ]` (unchecked) format
- Mark items `- [x]` only when the task is verified complete
- Mark items `- [/]` when work is in progress
- Do NOT add tasks that aren't derived from `plan.md`
- If you discover a missing task during implementation, add it to `task.md` first
