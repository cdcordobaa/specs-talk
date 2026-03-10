# SDD Workshop: Antigravity Instructions

> Step-by-step prompts and workflow for the live demo. Each section is a prompt you give Antigravity, followed by what you expect to happen.

---

## The SDD Pipeline

We will demonstrate the 6-phase SDD pipeline:

| **Phase** | **What happens** | **Output** |
| --- | --- | --- |
| **1. Specify (BDD)** | Define intent, constraints, Gherkin scenarios | `spec.md`, `.feature` files |
| **2. Plan** | Architecture decisions, components, interfaces | `plan.md` |
| **3. Tasks** | Small, verifiable work items | `task.md` |
| **4. Implement (TDD)** | AI generates code per task (Red-Green-Refactor) | Code + tests |
| **5. Verify** | Tests + static analysis + architecture rules | `evidence.md` |
| **6. Iterate** | Spec wrong or code wrong? Fix the right artifact | Updated spec |

---

## Phase 1: Project Setup + SDD Skills Generation

First, we set up the project and teach Antigravity the 6 SDD skills that govern the entire workflow.

---

### Prompt 1: Create the project and INSTRUCTIONS.md

```text
Create a new TypeScript project called "slide-creator" with:
- A src/ directory
- tests configured with Jest and ts-jest
- @google/genai as a dependency

Create an INSTRUCTIONS.md file at the project root that says:

# Slide Creator — SDD Workshop

## Project Overview
A pipeline that turns raw content (markdown, JSON, plain text) into a styled HTML presentation.
Three stages: Content Parser → Image Generator → HTML Composer.

## Workflow (STRICT)
We follow a strict 6-step Spec-Driven Development (SDD) Pipeline:
1. Specify: Create spec.md
2. Plan: Create plan.md
3. Tasks: Create task.md
4. Implement: Write code and tests
5. Verify: Create evidence.md
6. Iterate: Update specs if requirements change

NEVER write implementation code without a spec and a plan.
```

> **What happens:** Antigravity scaffolds the project structure, installs dependencies, and creates the INSTRUCTIONS.md defining the SDD pipeline.

---

### Prompt 2: Generate the 6 SDD Skills

```text
Create 6 Antigravity skills in .agents/skills/ that define our SDD Pipeline.

1. Skill: sdd-specify (at .agents/skills/sdd-specify/SKILL.md)
Description: How to write specifications (BDD)
Content: Guide the user to define intent, constraints, and acceptance criteria using Gherkin scenarios. Output MUST be saved to `spec.md` and `features/*.feature`.

2. Skill: sdd-plan (at .agents/skills/sdd-plan/SKILL.md)
Description: How to plan architecture
Content: Read `spec.md`. Define architecture decisions, technical components, and interfaces. Output MUST be saved to `plan.md`.

3. Skill: sdd-tasks (at .agents/skills/sdd-tasks/SKILL.md)
Description: How to break a plan into tasks
Content: Read `plan.md`. Break work into small, verifiable items in a checklist format. Output MUST be saved to `task.md`.

4. Skill: sdd-implement (at .agents/skills/sdd-implement/SKILL.md)
Description: How to implement a task (TDD)
Content: Read `task.md`. Pick the next uncompleted task. Write tests FIRST (Red), see them fail, write minimal code to pass (Green), and Refactor. NEVER change specs.

5. Skill: sdd-verify (at .agents/skills/sdd-verify/SKILL.md)
Description: How to verify the implementation
Content: Run all tests, perform static analysis, and verify architecture rules. Output the results to an evidence bundle saved at `evidence.md`.

6. Skill: sdd-iterate (at .agents/skills/sdd-iterate/SKILL.md)
Description: How to iterate on feedback
Content: If tests fail because the spec was wrong, FIX THE SPEC (`spec.md`) before touching code. If code is wrong, stay in implementation phase.
```

> **What happens:** Antigravity generates all 6 skills in their respective folders. We now have a specialized AI agent for each step of the pipeline.

---

## Phase 2: Building with SDD (The Live Demo)

Now we trigger the 6 phases one by one to build the Slide Creator.

---

### Step 1: Specify (BDD in Action)

```text
Use the sdd-specify skill to specify our slide creator pipeline.
The app is a pipeline with three stages, each one a service with a clean contract:
Stage 1: Content Parser — Takes raw content and produces a structured slide deck object (each slide gets a title, bullet points, speaker notes, and an 'image prompt' describing a visual).
Stage 2: Image Generator — Takes the image prompt and calls the Gemini image generation model to produce a visual (base64 or URL). Handles failures gracefully with a placeholder fallback.
Stage 3: HTML Composer — Takes the structured slide deck (with images) and renders it into an HTML document with consistent layout, specific CSS classes, and alt text derived from the prompt.

Include Gherkin scenarios for the Content Parser and Image Generator.
```

> **What happens:** Antigravity outputs a `spec.md` with intent and constraints, plus a `features/content-parser.feature` file containing the BDD behavior.

---

### Step 2: Plan

```text
Use the sdd-plan skill to plan the architecture based on the spec we just made.
```

> **What happens:** Antigravity outputs `plan.md` defining three stages: Content Parser (pure transformation), Image Generator (LLM integration mapped to a service contract), and HTML Composer (pure transformation).

---

### Step 3: Tasks

```text
Use the sdd-tasks skill to break the plan into a task list.
```

> **What happens:** Antigravity creates `task.md` with verifiable checklist items (e.g. 1. Set up Jest. 2. Build Parser. 3. Mock Image Gen Service. 4. Build Image Generator. 5. Build HTML Composer. 6. Wire CLI).

---

### Step 4: Implement (TDD in Action)

```text
Use the sdd-implement skill to implement the Content Parser task.
```

> **What happens:** Antigravity generates unit tests mapped to the Gherkin feature file, sees them fail (RED), writes the parser in `src/` to pass them (GREEN), and cleans up (REFACTOR). The classic TDD loop seamlessly drives the SDD implementation phase.

---

### Step 5: Verify

```text
Use the sdd-verify skill to verify the current progress.
```

> **What happens:** Antigravity runs `npm test`, verifies it works, and generates an `evidence.md` file proving the pipeline is robust so far.

---

### Step 6: Iterate

```text
Actually, we need an extra constraint. The Content Parser should also output a "totalSlides" count for pagination. Use the sdd-iterate skill to enforce this.
```

> **What happens:** Wait, watch! Antigravity won't just hack the code. It updates `spec.md` FIRST, then updates `plan.md`/`task.md`, and only THEN modifies the tests and code to accommodate the new requirement.

---

### Step 7: Finish Implementation & Payoff

```text
Use the sdd-implement skill to finish the remaining tasks (Image Generator, HTML Composer, and CLI wiring). Mock the Gemini API for tests (asserting on what prompt was sent to the model and returning a canned base64 image), but use the real GEMINI_API_KEY env for the CLI script.
```

> **What happens:** Antigravity finishes the project. You run the final pipeline: `GEMINI_API_KEY=xxx npm run generate examples/sample-outline.json`.

---

## Phase 3: The Payoff

Open `presentation.html` in a browser. Full-screen it. The audience sees a real slide deck — with titles, bullet points, speaker notes, and AI-generated base64 images corresponding to the slide's "image prompt".

The closing line: **"6 phases. Zero undocumented hacks. All driven by spec artifacts. And the output is a presentation."**

---

## Prompt Cheat Sheet (Quick Reference)

| # | Prompt summary | Phase | Time |
|---|---------------|-------|------|
| 1 | Create project + INSTRUCTIONS.md | Setup | 2 min |
| 2 | Generate 6 SDD Pipeline skills | Setup | 3 min |
| 3 | Run sdd-specify (BDD output)| Specify | 1 min |
| 4 | Run sdd-plan | Plan | 1 min |
| 5 | Run sdd-tasks | Tasks | 1 min |
| 6 | Run sdd-implement (TDD loop) | Implement | 4 min |
| 7 | Run sdd-verify | Verify | 1 min |
| 8 | Run sdd-iterate (New requirement) | Iterate | 3 min |
| 9 | Finish rendering with sdd-implement (Images + HTML) | Implement | 4 min |
| 10| Wire CLI + run with real API | Payoff | 3 min |
| | Open HTML in browser | Payoff | 30 sec |
| | **Total** | | **~24 min** |

Buffer of 6 minutes for narration, audience questions, and things taking slightly longer than expected.

---

## If Something Goes Wrong

**Antigravity generates code that doesn't pass tests:** This is actually fine — it's a teaching moment. Say "Watch — Antigravity reads the failure, adjusts, and tries again. This is the TDD loop in action."

**Antigravity skips a step:** If it tries to write code before planning, say, "Stop. Follow the sdd-plan skill first."

**The real LLM call fails or returns weird images:** Have a backup HTML file ready with pre-generated output. Show it, explain the real call would produce something similar, move on.