# SDD Workshop: Live Demo Guide

> Step-by-step prompts for the live demo. Each section is a prompt you give the agent, followed by what to expect. Works with both **Antigravity** (`.agents/skills/`) and **Claude Code** (`.claude/skills/`).

---

## The SDD Pipeline

| **Phase** | **What happens** | **Output** |
| --- | --- | --- |
| **1. Specify (BDD)** | Define intent, constraints, Gherkin scenarios | `spec.md`, `.feature` files |
| **2. Plan** | Architecture decisions, components, interfaces | `plan.md` |
| **3. Tasks** | Small, verifiable work items | `task.md` |
| **4. Implement (TDD)** | AI generates code per task (Red-Green-Refactor) | Code + tests |
| **5. Verify** | Tests + static analysis + architecture rules | `evidence.md` |
| **6. Iterate** | Spec wrong or code wrong? Fix the right artifact | Updated spec |

We run this pipeline **twice**: once for the backend pipeline, once for the React frontend.

---

## Phase 0: Project Setup (~2 min)

### Prompt 1: Create the project

```text
Create a new TypeScript project called "slide-creator" with:
- A src/ directory for backend pipeline code
- Jest configured with ts-jest
- @google/genai as a dependency
- React + Vite for the frontend (separate from backend pipeline)
- jest-cucumber for Gherkin-based tests

Create an INSTRUCTIONS.md at the root:

# Slide Creator — SDD Workshop

## Project Overview
An app that turns raw content into a styled slide presentation with AI-generated images.
Backend: 3-stage pipeline (Content Parser → Image Generator → HTML Composer).
Frontend: React app with input form and slide preview.

## Workflow (STRICT)
Follow the 6-step SDD pipeline for ALL work:
1. Specify → 2. Plan → 3. Tasks → 4. Implement → 5. Verify → 6. Iterate
NEVER write code without a spec and a plan first.
```

> **What happens:** Agent scaffolds the project, installs deps, creates INSTRUCTIONS.md.

---

## Spec 1: The Backend Pipeline (~16 min)

This covers the 3-stage pipeline: Content Parser, Image Generator, HTML Composer. We run the full SDD cycle here.

---

### Step 1: Specify (~2 min)

```text
Use the sdd-specify skill to create the specification for the backend pipeline.

The pipeline has three stages, each a service with a clean contract:

Stage 1: Content Parser — Takes raw content (markdown or plain text) and produces a structured slide deck object. Each slide gets a title, bullet points or body text, speaker notes, and an "image prompt" field describing what visual would complement the content.

Stage 2: Image Generator — Takes the image prompt from each slide and calls Gemini (via @google/genai) to generate an image. Returns base64 image data. Handles failures gracefully with a fallback placeholder.

Stage 3: HTML Composer — Takes the slide deck (now with images) and renders it into styled HTML. Each slide becomes a section with title, content area, image with alt text derived from the prompt, and slide number.

Include Gherkin scenarios for all three stages. The Content Parser and HTML Composer are pure transformations. The Image Generator has an external dependency that must be mockable.
```

> **What happens:** Agent creates `spec.md` with intent/constraints and `features/content-parser.feature`, `features/image-generator.feature`, `features/html-composer.feature` with happy paths, edge cases, and error scenarios.

---

### Step 2: Plan (~1 min)

```text
Use the sdd-plan skill to plan the architecture based on our spec.
```

> **What happens:** Agent creates `plan.md` with three components, their TypeScript interfaces, data flow diagram, and testing strategy (pure vs mocked).

---

### Step 3: Tasks (~1 min)

```text
Use the sdd-tasks skill to break the plan into a task list.
```

> **What happens:** Agent creates `task.md` with ordered checklist: shared types → parser tests → parser impl → image gen mock + tests → image gen impl → composer tests → composer impl.

---

### Step 4: Implement — Content Parser (~4 min)

```text
Use the sdd-implement skill to implement the Content Parser.
```

> **What happens:** Agent writes failing tests mapped to the Gherkin scenarios (RED), implements the parser as a pure function (GREEN), and cleans up (REFACTOR). **This is the TDD moment — point it out to the audience.**

---

### Step 5: Implement — Image Generator + HTML Composer (~4 min)

```text
Use the sdd-implement skill to implement the remaining tasks: Image Generator and HTML Composer.
```

> **What happens:** Agent mocks the Gemini API in tests (asserts on prompts sent, returns canned base64), implements the real service using `@google/genai`, then builds the HTML Composer as a pure transformation. All tests pass.

---

### Step 6: Verify (~1 min)

```text
Use the sdd-verify skill to verify the pipeline.
```

> **What happens:** Agent runs all tests, checks coverage, cross-references specs, and generates `evidence.md`. All green.

---

### Step 7: Iterate (~3 min)

```text
Actually, we need the Content Parser to also output a "totalSlides" count on each slide for pagination, and the HTML Composer should render a progress bar using it. Use the sdd-iterate skill.
```

> **What happens:** Watch! The agent updates `spec.md` FIRST, then updates the `.feature` files, then `plan.md`, then `task.md`, and only THEN modifies the code. **This is the key SDD moment — spec drives everything.**

---

## Spec 2: The React Frontend (~10 min)

The pipeline works. Now we put a face on it.

---

### Step 8: Specify Frontend (~2 min)

```text
Use the sdd-specify skill to specify the React frontend for our slide creator.

The frontend has:
- A text area where the user pastes or types raw content
- A "Generate Slides" button that sends the content through the pipeline
- A loading spinner while the pipeline runs
- A slide preview area that renders the output as a carousel
- An "Export HTML" button that downloads the result as a self-contained HTML file
```

> **What happens:** Agent creates a new section in `spec.md` for the frontend and a `features/frontend.feature` with UI behavior scenarios.

---

### Step 9: Plan + Tasks (~2 min)

```text
Use the sdd-plan skill to plan the frontend, then use the sdd-tasks skill to create the task list.
```

> **What happens:** Agent updates `plan.md` with React component architecture and creates new tasks in `task.md`.

---

### Step 10: Implement Frontend (~5 min)

```text
Use the sdd-implement skill to implement the React frontend and wire it to the pipeline.
```

> **What happens:** Agent builds the React components, connects them to the pipeline stages, and runs tests. The app compiles and works.

---

### Step 11: Run it Live — The Payoff (~1 min)

```text
Start the dev server. I want to demo the app.
```

> **What happens:** Agent runs `npm run dev`. You open the browser, paste some content about SDD, hit "Generate Slides", and the audience watches the presentation appear with AI-generated images. **Full-screen it. This is the mic-drop moment.**

---

## Prompt Cheat Sheet

| # | Prompt | Phase | Time |
|---|--------|-------|------|
| 1 | Create project + INSTRUCTIONS.md | Setup | 2 min |
| 2 | sdd-specify: Backend pipeline | Specify | 2 min |
| 3 | sdd-plan: Architecture | Plan | 1 min |
| 4 | sdd-tasks: Task list | Tasks | 1 min |
| 5 | sdd-implement: Content Parser | Implement | 4 min |
| 6 | sdd-implement: Image Gen + Composer | Implement | 4 min |
| 7 | sdd-verify: Evidence bundle | Verify | 1 min |
| 8 | sdd-iterate: Add pagination | Iterate | 3 min |
| 9 | sdd-specify: Frontend | Specify | 2 min |
| 10 | sdd-plan + sdd-tasks: Frontend | Plan+Tasks | 2 min |
| 11 | sdd-implement: React frontend | Implement | 5 min |
| 12 | Run dev server, demo live | Payoff | 1 min |
| | **Total** | | **~28 min** |

Buffer of 2 minutes for narration and audience questions.

---

## Key Moments to Highlight

1. **RED → GREEN** (Step 4): "The tests fail because the code doesn't exist yet. The spec tells us exactly what to build."
2. **Mock assertion** (Step 5): "We never called the real API, but we know exactly what prompt we'd send."
3. **Iterate** (Step 7): "The agent didn't hack the code. It updated the spec first. That's the discipline."
4. **Live demo** (Step 11): "Two SDD cycles. Zero undocumented hacks. And it works."

---

## If Something Goes Wrong

**Agent generates code that doesn't pass tests:** Good teaching moment. Say "Watch — it reads the failure, adjusts, and tries again. That's the TDD loop."

**Agent skips a step:** Say "Stop. Follow the sdd-plan skill first." Then reprompt.

**Agent tries to modify feature files during implementation:** Say "No — the spec is the source of truth. Only implementation changes."

**The real Gemini call fails or returns weird images:** Have a backup with pre-generated output. Show it, explain the real call would produce something similar, move on.

**Tests are slow:** Pre-run `npm test` once during setup to warm the cache.