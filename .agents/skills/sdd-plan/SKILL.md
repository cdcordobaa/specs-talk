---
name: sdd-plan
description: How to plan architecture from a specification
---

# Skill: SDD Plan

## When to use
Use this skill AFTER the `sdd-specify` phase is complete (i.e., `spec.md` and `.feature` files exist). This is Phase 2 of the SDD Pipeline.

## Purpose
Translate the specification into **architecture decisions**, **component definitions**, and **interface contracts**.

## Inputs
- `spec.md`
- `features/*.feature`

## Outputs
- `plan.md` — Architecture plan document

## Process

### 1. Read the Spec
Read `spec.md` and all `.feature` files. Identify:
- The logical **stages / components** of the system
- The **data flow** between stages
- Which stages have **external dependencies** (LLM calls, file I/O, network)
- Which stages are **pure transformations** (no side effects)

### 2. Define Components
For each component, document:
- **Name**: A clear, descriptive name
- **Responsibility**: What it does (single responsibility)
- **Input interface**: TypeScript type/interface for what it receives
- **Output interface**: TypeScript type/interface for what it returns
- **Side effects**: None, or list them (e.g., "calls Gemini API")
- **Testability**: How it can be tested (pure function, mocked dependency, etc.)

### 3. Define Data Flow
Show how data moves through the pipeline:
```
Input → Stage 1 → Stage 2 → ... → Output
```

### 4. Write plan.md
Create a `plan.md` at the project root:

```markdown
# Architecture Plan

## Overview
[One paragraph summarizing the architecture]

## Data Flow
[Pipeline diagram showing stages]

## Components

### [Component Name]
- **Responsibility**: [what it does]
- **Input**: [TypeScript interface]
- **Output**: [TypeScript interface]
- **Side Effects**: [none or list]
- **Testing Strategy**: [pure / mocked / integration]

### [Next Component...]

## Shared Types
[TypeScript interfaces shared across components]

## External Dependencies
- [List of external services, APIs, libraries]

## File Structure
[Proposed directory/file layout]
```

## Rules
- Every component MUST have a clearly defined input and output contract.
- Components with external dependencies MUST be designed so the dependency can be **mocked** in tests.
- Do NOT make implementation decisions (e.g., specific algorithms). Focus on **what** each component does, not **how**.
- Pure transformation stages should be identified explicitly — they are easier to test and should be implemented first.
