# Claude Code Guide — Reproducing the Slide Creator Pipeline

> **Goal:** Starting from a scratch repo with only `.claude/skills/` and `constitution.md`, reproduce the exact same backend pipeline implementation using Claude Code step-by-step.

---

## Prerequisites

Before starting, your repo must contain:
```
.claude/skills/
├── sdd-specify.md
├── sdd-plan.md
├── sdd-tasks.md
├── sdd-implement.md
├── sdd-verify.md
└── sdd-iterate.md
constitution.md
```

You also need a `.env` file with `GEMINI_API_KEY=your_key_here`.

---

## Step 0: Project Setup

```text
Create a new TypeScript project in the current directory with:
- A src/ directory for backend pipeline code
- Jest configured with ts-jest for TypeScript test support
- jest-cucumber for Gherkin-based BDD tests
- @google/genai as a dependency for Gemini API access
- dotenv for .env file support
- a features/ directory for Gherkin feature files
- a .env.example file with GEMINI_API_KEY=your_api_key_here

Create an INSTRUCTIONS.md at the root:

# Slide Creator — SDD Workshop

## Project Overview
An app that turns raw content into a styled slide presentation with AI-generated images.
Backend: 3-stage pipeline (Content Generator → Image Generator → HTML Composer).

## Workflow (STRICT)
Follow the SDD pipeline for ALL work:
0. Constitution → 1. Specify → 2. Plan → 3. Tasks → 4. Implement → 5. Verify → 6. Iterate
NEVER write code without a constitution, a spec, and a plan first.
Read constitution.md BEFORE starting any phase.
```

> **Verify:** `package.json`, `tsconfig.json`, `jest.config.ts`, `INSTRUCTIONS.md`, `.env.example` all exist.

---

## Step 1: Specify — Backend Pipeline

> **Focus: WHAT the system does — intent, behavior, constraints. NOT how it's coded.**

```text
Use the sdd-specify skill to create the specification for the backend pipeline.
Read constitution.md first.

The pipeline has three stages, each a service with a clean contract:

Stage 1: Content Generator — Reads markdown files from an input/ folder, combines 
their text, and uses a Gemini LLM to produce a structured slide deck. Each slide 
has a title, bullet points or body text, speaker notes, and an image prompt 
describing a visual that complements the content. The LLM must be instructed to 
output strictly as JSON matching the SlideDeck schema. The LLM prompt must be 
version-controlled in the spec and stored as a named constant in the module.

Stage 2: Image Generator — Takes the image prompt from each slide and generates 
an AI image via Gemini. Returns base64 image data. Must handle failures gracefully 
by assigning a fallback placeholder. Must respect Gemini free-tier rate limits 
(10 RPM) by implementing a configurable delay between calls.

Stage 3: HTML Composer — Takes the slide deck (now with images) and produces one 
HTML file per slide in a slides/ folder. For each slide it:
- Saves the image as an external file in slides/assets/
- Uses a Gemini LLM with a designer-quality prompt to generate a stunning, 
  self-contained HTML slide with modern aesthetics and creative image integration 
  (hero, split-pane, background, floating card, etc.)
- Falls back to a static template if the API fails
The design prompt must be version-controlled in the spec and stored as a named 
constant in the module.

All three stages share a common interface for LLM calls that must be mockable 
in tests. The spec must include:
- The exact model identifiers for text and image generation
- Both LLM prompts written out in full
- The rate limiting strategy with exact delay value
- The requirement to clean markdown fences from LLM responses

Include Gherkin feature files for all three stages with happy paths, edge cases, 
and error/failure scenarios.
```

> **Verify:** `spec.md` exists with intent, constraints, model configuration, both prompts, rate limiting, and response cleaning. Three `.feature` files exist in `features/`.

---

## Step 2: Plan — Architecture

> **Focus: HOW the system is built — interfaces, SDK patterns, file structure, testing strategy.**

```text
Use the sdd-plan skill to plan the architecture based on our spec.
Read constitution.md first.

The plan must include ALL of the following (the spec defines what, the plan 
defines how):

1. GeminiClient — the central interface all stages depend on:
   - Define the full TypeScript interface with generateContent(prompt) and 
     generateImageBase64(prompt) methods
   - Define the DefaultGeminiClient implementation skeleton showing the exact 
     @google/genai SDK calls:
     * Text: ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt })
       → returns response.text
     * Images: ai.models.generateImages({ model: "imagen-4.0-fast-generate-001", 
       prompt, config: { outputMimeType: "image/jpeg" } })
       → returns response.generatedImages[0].image.imageBytes
   - IMPORTANT: Document that the image response path is 
     response.generatedImages[0].image.imageBytes (this is non-obvious in the SDK)

2. Shared types — Slide and SlideDeck interfaces with full TypeScript signatures

3. All three stage components with:
   - Input/output types
   - Side effects listed
   - Testing strategy (mocked GeminiClient via DI)
   - Injectable constructor parameters (e.g., ImageGenerator accepts delayMs 
     with default 6100, tests pass 0)

4. Pipeline orchestrator — creates DefaultGeminiClient, injects it into all stages

5. CLI entry point (index.ts) — loads dotenv, reads GEMINI_API_KEY from env, 
   takes input/output dirs from process.argv (defaults: "input", "slides")

6. Testing conventions:
   - jest-cucumber with defineFeature(loadFeature(...)) pattern
   - Each features/*.feature maps to a matching src/*.test.ts
   - All external deps mocked via jest.mock() + dependency injection
   - ImageGenerator tests use delayMs=0

7. Project configuration:
   - tsconfig.json: strict: true, esModuleInterop: true, module: commonjs, 
     target: ES2020
   - jest.config.ts: preset ts-jest, testEnvironment node

8. Complete file structure listing every file
```

> **Verify:** `plan.md` includes GeminiClient code skeleton with SDK patterns, all components, Pipeline + CLI, testing conventions, config, and file structure.

---

## Step 3: Tasks — Breakdown

```text
Use the sdd-tasks skill to break the plan into a task list.
Read constitution.md first.
```

> **Verify:** `task.md` has ordered checklist: GeminiClient wrapper → shared types → Content Generator (tests → impl) → Image Generator (tests → impl) → HTML Composer (tests → impl) → Pipeline orchestrator → CLI entry point.

---

## Step 4: Implement — GeminiClient + Types

```text
Use the sdd-implement skill to implement the GeminiClient wrapper and shared types.
Read constitution.md first.

Create src/types.ts and src/geminiClient.ts as defined in plan.md.
These are infrastructure — implement them according to the plan's specifications.
```

> **Verify:** `src/types.ts` and `src/geminiClient.ts` exist. TypeScript compiles.

---

## Step 5: Implement — Content Generator

```text
Use the sdd-implement skill to implement the Content Generator.
Read constitution.md first.

Follow TDD: write failing tests first mapped to features/content_generator.feature, 
then implement to make them pass. Use the prompt from spec.md as a named constant.
```

> **Verify:** `npm test` — Content Generator tests pass.

---

## Step 6: Implement — Image Generator

```text
Use the sdd-implement skill to implement the Image Generator.
Read constitution.md first.

Follow TDD: write failing tests first mapped to features/image_generator.feature.
Remember the injectable delayMs parameter from plan.md — tests must use 0.
```

> **Verify:** `npm test` — all tests pass including Image Generator.

---

## Step 7: Implement — HTML Composer

```text
Use the sdd-implement skill to implement the HTML Composer.
Read constitution.md first.

Follow TDD: write failing tests first mapped to features/html_composer.feature.
The implementation must use the HTML prompt from spec.md as a named constant, 
save images to assets/, and implement the fallback template.
```

> **Verify:** `npm test` — all tests pass including HTML Composer (happy path, empty deck, missing fields, fallback).

---

## Step 8: Implement — Pipeline + CLI

```text
Use the sdd-implement skill to implement the Pipeline and CLI entry point 
as defined in plan.md. Read constitution.md first.
```

> **Verify:** `npm test` — all 9 tests pass. TypeScript compiles.

---

## Step 9: Verify

```text
Use the sdd-verify skill to verify the entire pipeline.
Read constitution.md first.
```

> **Verify:** `evidence.md` exists with all checks passing, including Constitution Compliance section.

---

## Step 10: End-to-End Run

```text
Create an input/ folder with a file called slide.md containing:

# SDD Quick Demo

This is a short version for testing the pipeline.

---

## Slide 1: Introduction to SDD
- SDD stands for Spec-Driven Development
- It moves quality upstream
- Specified intent is the key

Speaker notes: Explain the high level concept of moving quality upstream.
Image prompt: A futuristic blueprint of a software bridge spanning a gap between intent and code.

---

## Slide 2: The Core Cycle
- Specify
- Plan
- Task
- Implement
- Verify
- Iterate

Speaker notes: Briefly mention the 6 phases.
Image prompt: A clean infographic showing a circular 6-step cycle with vibrant colors and professional icons.

Then delete the slides/ folder and run: npx ts-node src/index.ts input slides
```

> **Verify:** `slides/` contains `.html` files and `slides/assets/` has `.jpg` files. Open HTML in browser — designer-quality slides with creative image integration.

---

## Phase Responsibility Summary

| Phase | Owns | Does NOT own |
|-------|------|-------------|
| **Constitution** | Immutable rules, tech stack, forbidden patterns | Feature-specific behavior |
| **Specify** | Intent, constraints, model identifiers, versioned prompts, rate limits, Gherkin scenarios | SDK call patterns, code skeletons, file structure |
| **Plan** | Architecture, interfaces, SDK patterns, response shapes, testing conventions, config | Business behavior, acceptance criteria |
| **Tasks** | Ordered work items derived from plan | Architectural decisions |
| **Implement** | Code + tests following plan's contracts | Inventing new patterns not in plan |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `imagen-4.0-fast-generate-001` returns 404 | Verify model ID — older names are deprecated |
| Rate limit errors (429) | Default 6100ms delay should handle it. Increase if needed |
| Tests are slow | Ensure `ImageGenerator` tests pass `delayMs=0` |
| LLM returns markdown fences | Code must strip `` ```json `` / `` ```html `` fences |
| HTML has broken images | Verify images save to `slides/assets/`, HTML uses relative paths |

---

## Expected Final File Structure

```
├── constitution.md
├── INSTRUCTIONS.md
├── spec.md
├── plan.md
├── task.md
├── evidence.md
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── jest.config.ts
├── features/
│   ├── content_generator.feature
│   ├── image_generator.feature
│   └── html_composer.feature
├── src/
│   ├── types.ts
│   ├── geminiClient.ts
│   ├── contentGenerator.ts
│   ├── contentGenerator.test.ts
│   ├── imageGenerator.ts
│   ├── imageGenerator.test.ts
│   ├── htmlComposer.ts
│   ├── htmlComposer.test.ts
│   ├── pipeline.ts
│   └── index.ts
├── input/
│   └── slide.md
└── slides/           (generated)
    ├── slide-1.html
    ├── slide-2.html
    └── assets/
        ├── slide-1.jpg
        └── slide-2.jpg
```
