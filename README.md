# Spec-Driven Development (SDD) — Workshop

> Build software with AI agents the right way: spec first, code last.

This repo is a live demo and teaching kit for **Spec-Driven Development (SDD)** — a discipline for working with AI coding agents that keeps humans in control of requirements while letting agents handle implementation.

The concrete example app built throughout the demo is a **Slide Creator**: it reads raw markdown content, calls the Gemini API to generate structured slides and AI images, and outputs self-contained HTML presentations.

---

## What Is SDD?

AI coding agents are fast. The problem is that "fast" often means "fast in the wrong direction" — agents invent implementation details, skip planning, and produce code that nobody can trace back to a requirement.

SDD fixes this by enforcing a strict artifact chain before any code is written:

```
Constitution → Specification → Plan → Tasks → Implementation → Evidence
```

Each artifact must exist before the next one starts. The agent reads upstream artifacts at every step. Requirements flow top-down; code never drives requirements.

---

## The 7-Phase Pipeline

| # | Phase | Skill | Output |
|---|-------|-------|--------|
| 0 | **Constitution** | *(manual)* | `constitution.md` — immutable project rules |
| 1 | **Specify** | `sdd-specify` | `spec.md` + `features/*.feature` |
| 2 | **Plan** | `sdd-plan` | `plan.md` — architecture and interfaces |
| 3 | **Tasks** | `sdd-tasks` | `task.md` — verifiable checklist |
| 4 | **Implement** | `sdd-implement` | Code in `src/` + tests |
| 5 | **Verify** | `sdd-verify` | `evidence.md` — test results + compliance |
| 6 | **Iterate** | `sdd-iterate` | Updated artifacts (top-down) |

**Never skip or merge phases.** Each artifact must exist before the next phase begins.

---

## The Constitution Pattern

`constitution.md` is the highest-level artifact. It contains immutable project-level rules that apply to every spec, plan, task, and line of code. Think of it as an `.eslintrc` for intent.

Every SDD skill reads `constitution.md` as **Step 0** before doing anything else. If it doesn't exist, the skill will ask whether to create one first.

The constitution uses a **three-tier boundary system**:

| Tier | Meaning | Example |
|------|---------|---------|
| ✅ **Always do** | Agent proceeds without asking | Version-control all LLM prompts. Specify exact model IDs. Use dependency injection. |
| ⚠️ **Ask first** | Agent pauses for human approval | Adding new npm dependencies. Changing a central interface. |
| 🚫 **Never do** | Hard stop — categorically forbidden | Commit secrets. Call real APIs in tests. Write code without a spec. |

The cascading chain:
```
constitution.md
    └── spec.md + features/*.feature
            └── plan.md
                    └── task.md
                            └── src/ (implementation)
                                    └── evidence.md
```

A change at any level flows **downward only**. If a constraint changes, update `spec.md` first — not the code.

---

## Skills

Skills are structured prompt files that tell the AI agent exactly how to execute each SDD phase. They encode the discipline so the agent doesn't have to rediscover it.

### Where skills live

This repo ships two sets of skills for two different agent runtimes:

| Runtime | Skill location | How to invoke |
|---------|---------------|---------------|
| **Claude Code** | `.claude/skills/<phase>/SKILL.md` | `/sdd-specify`, `/sdd-plan`, etc. |
| **Antigravity** | `.agents/skills/<phase>/SKILL.md` | `Use the sdd-specify skill` |

### What a skill contains

Each skill file (`SKILL.md`) has a YAML frontmatter header and the following sections:

```
---
name: sdd-specify
description: Phase 1 of SDD — ...
---

## When to use       ← which situations trigger this skill
## Purpose           ← what the phase achieves
## Inputs            ← which artifacts to read (always starts with constitution.md)
## Outputs           ← what artifacts to produce
## Process           ← step-by-step instructions for the agent
  ### 0. Read the Constitution   ← mandatory first step in every skill
  ### 1. ...
  ### 2. ...
## Rules             ← hard constraints the agent must not violate
```

### The 6 skills

#### `sdd-specify` — Phase 1
Gathers intent, defines constraints, and produces `spec.md` and Gherkin `.feature` files.
- Requires: `constitution.md`
- Produces: `spec.md`, `features/*.feature`
- Key rule: Every LLM prompt must be written out in full and versioned as a named constant in `spec.md`.

#### `sdd-plan` — Phase 2
Translates the spec into architecture decisions, TypeScript interfaces, and component contracts.
- Requires: `constitution.md`, `spec.md`, `features/*.feature`
- Produces: `plan.md`
- Key rule: Every component with an external dependency must be designed for mockability. No implementation decisions — only contracts.

#### `sdd-tasks` — Phase 3
Breaks `plan.md` into a small, ordered checklist of TDD work items.
- Requires: `constitution.md`, `plan.md`
- Produces: `task.md`
- Key rule: Each task must be completable in one TDD cycle (under 30 minutes) and have a clear definition of done.

#### `sdd-implement` — Phase 4
Implements one task at a time using strict Red → Green → Refactor TDD.
- Requires: `constitution.md`, `task.md`, `plan.md`, `features/*.feature`
- Produces: Code in `src/`, updated `task.md`
- Key rule: Write the failing test first. Never write implementation code without a failing test.

#### `sdd-verify` — Phase 5
Runs all tests, checks coverage, verifies architecture rules, and produces an evidence bundle.
- Requires: `constitution.md`, all source + test files, all artifacts
- Produces: `evidence.md`
- Key rule: If verification fails, fix the code — don't update `evidence.md` to hide the failure.

#### `sdd-iterate` — Phase 6
Handles requirement changes by flowing updates top-down through the artifact chain.
- Requires: `constitution.md`
- Key rule: Never change the code to accommodate a new requirement without updating the spec first.

**Decision tree for iteration:**
```
Something changed or a test fails unexpectedly
│
├─ SPEC wrong?          → Fix spec.md + features/*.feature first, then cascade down
├─ NEW requirement?     → Add Gherkin scenarios, update spec → plan → tasks → implement
├─ CONSTITUTION wrong?  → Update constitution.md first (requires ⚠️ approval), then cascade
└─ CONSTRAINT changing? → Update spec.md constraints, then plan → tasks → implement
```

---

## Example App: Slide Creator

The demo app built during the workshop is a three-stage AI pipeline:

```
input/*.md  →  Content Generator  →  Image Generator  →  HTML Composer  →  slides/*.html
                (Gemini text)         (Imagen images)      (Gemini HTML)
```

| Stage | What it does |
|-------|-------------|
| **Content Generator** | Reads markdown files, calls `gemini-2.0-flash` to produce a structured `SlideDeck` JSON |
| **Image Generator** | Takes each slide's image prompt, calls `imagen-4.0-fast-generate-001` to generate a base64 image |
| **HTML Composer** | Saves images to `slides/assets/`, calls Gemini again to generate a designer-quality HTML slide for each |

All three stages share a `GeminiClient` interface injected via constructor — meaning tests never call the real API.

### Running the pipeline

```bash
# Install dependencies
npm install

# Copy env and add your Gemini API key
cp .env.example .env
# edit .env and set GEMINI_API_KEY=...

# Add content to process
echo "# My Talk\n- SDD is great\n- Spec first" > input/slide.md

# Run the pipeline
npx ts-node src/index.ts

# Slides appear in slides/
```

### Running tests

```bash
npm test
```

---

## Repo Structure

```
.
├── constitution.md          # Immutable project rules (read first, always)
├── spec.md                  # Feature specification + versioned LLM prompts
├── plan.md                  # Architecture plan + component contracts
├── task.md                  # Implementation checklist
├── evidence.md              # Test results + constitution compliance
│
├── features/                # Gherkin BDD scenarios
│   ├── content_generator.feature
│   ├── image_generator.feature
│   └── html_composer.feature
│
├── src/                     # Implementation
│   ├── types.ts             # Shared TypeScript interfaces
│   ├── geminiClient.ts      # GeminiClient interface + DefaultGeminiClient
│   ├── contentGenerator.ts
│   ├── imageGenerator.ts
│   ├── htmlComposer.ts
│   ├── pipeline.ts          # Orchestrator
│   └── index.ts             # CLI entry point
│
├── .claude/skills/          # SDD skills for Claude Code
│   ├── sdd-specify/SKILL.md
│   ├── sdd-plan/SKILL.md
│   ├── sdd-tasks/SKILL.md
│   ├── sdd-implement/SKILL.md
│   ├── sdd-verify/SKILL.md
│   └── sdd-iterate/SKILL.md
│
├── .agents/skills/          # SDD skills for Antigravity
│   └── (same structure)
│
├── guide.md                 # Step-by-step live demo script with prompts
├── INSTRUCTIONS.md          # Short SDD workflow reference
└── input/                   # Drop .md files here to process
```

---

## Branches

| Branch | Purpose |
|--------|---------|
| `main` | Clean starting point for the workshop |
| `claude-sdd` | Basic SDD skills for Claude Code (no constitution layer) |
| `antigravity-sdd` | Full SDD skills with constitution, worked example, and all artifacts |
| `claude-demo-sdd` | Clean slate for live demo with Claude Code |

Start from `main` or `claude-demo-sdd` for a live demo. Use `antigravity-sdd` as the reference implementation.

---

## Key Rules (Summary)

1. **Constitution first.** Read `constitution.md` before starting any phase.
2. **No code without a spec.** `spec.md` and at least one `.feature` file must exist before any `src/*.ts` file.
3. **No spec without a plan.** `plan.md` must exist before `task.md`.
4. **No task without a failing test.** Write the test (RED) before the implementation (GREEN).
5. **Never modify `.feature` files during implementation.** Only during Specify or Iterate.
6. **Requirements flow downward.** Spec → Plan → Tasks → Code. Never the reverse.
7. **Iterate top-down.** If something changes, update the highest affected artifact first.
