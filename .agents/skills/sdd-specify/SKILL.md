---
name: sdd-specify
description: How to write specifications using BDD and Gherkin
---

# Skill: SDD Specify (BDD)

## When to use
Use this skill at the START of any new feature or project. This is Phase 1 of the SDD Pipeline. You MUST complete this phase before moving to planning or implementation.

## Purpose
Define the **intent**, **constraints**, and **acceptance criteria** for the feature. Use Behavior-Driven Development (BDD) to express acceptance criteria as executable Gherkin scenarios.

## Outputs
1. `spec.md` — A specification document
2. `features/*.feature` — Gherkin feature files

## Process

### 1. Gather Intent
Ask clarifying questions if needed. Identify:
- **What** the feature does (user-facing behavior)
- **Why** it exists (business value)
- **Who** uses it (actors / personas)

### 2. Define Constraints
Document non-negotiable boundaries:
- Technology constraints (e.g., "no server", "no frontend framework")
- Performance constraints (e.g., "must handle 100 slides")
- Integration constraints (e.g., "uses Gemini API via @google/genai")

### 3. Write spec.md
Create a `spec.md` file at the project root with this structure:

```markdown
# Feature: [Name]

## Intent
[One paragraph describing what this feature does and why]

## Actors
- [Who interacts with it]

## Constraints
- [List of constraints]

## Stages / Components
- [High-level breakdown of logical units]

## Acceptance Criteria
[Reference to the Gherkin feature files below]
```

### 4. Write Gherkin Feature Files
Create `.feature` files in the `features/` directory. Follow these rules:

#### Structure
- Every file starts with a `Feature:` block describing the capability
- Each `Scenario` tests exactly ONE behavior
- Use `Background` for shared setup across scenarios in the same feature

#### Given/When/Then Rules
- **Given**: Set up preconditions ("Put the system in a known state")
- **When**: Perform ONE action being tested
- **Then**: Assert the expected outcome
- **And/But**: Continue the previous keyword

#### Style Rules
- Write **declaratively**, not imperatively (describe WHAT, not HOW)
- Use **present tense**
- Keep scenarios to **3–5 steps**
- Use **domain language** consistently
- Use `Scenario Outline` + `Examples` for parameterized tests
- Use data tables for structured input

#### Must Include
- At least one **happy path** scenario per feature
- At least one **edge case** scenario (empty input, single item, etc.)
- At least one **error/failure** scenario (invalid data, service failure, etc.)

#### Anti-Patterns to AVOID
- Don't couple scenarios to implementation details
- Don't test multiple behaviors in one scenario
- Don't use vague assertions ("it should work")
- Don't reference UI elements or CSS selectors in scenarios

## Rules
- NEVER skip this phase. No spec → No planning → No code.
- The spec is the **source of truth**. If the spec is wrong, fix the spec — not the code.
- Keep specs focused on **observable behavior**, not internal architecture.
