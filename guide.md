# SDD Workshop: Live Demo Guide

> Step-by-step prompts for the live demo. Each section is a prompt you give the agent, followed by what to expect. Works with both **Antigravity** (`.agents/skills/`) and **Claude Code** (`.claude/skills/`).

---

## The SDD Pipeline

| **Phase** | **What happens** | **Output** |
| --- | --- | --- |
| **0. Constitution** | Define immutable project-level rules | `constitution.md` |
| **1. Specify (BDD)** | Define intent, constraints, Gherkin scenarios | `spec.md`, `.feature` files |
| **2. Plan** | Architecture decisions, components, interfaces | `plan.md` |
| **3. Tasks** | Small, verifiable work items | `task.md` |
| **4. Implement (TDD)** | AI generates code per task (Red-Green-Refactor) | Code + tests |
| **5. Verify** | Tests + static analysis + architecture rules | `evidence.md` |
| **6. Iterate** | Spec wrong or code wrong? Fix the right artifact | Updated spec |

We run this pipeline **twice**: once for the backend pipeline, once for the React frontend.

---

## The Constitution Pattern

The constitution is a project-level `constitution.md` file containing **immutable principles** — architecture rules, technology stack, coding conventions, and forbidden patterns — that apply to *every* spec and *every* task. Think of it as a `.eslintrc` for intent.

**The cascading context chain:**
```
Constitution → Specification → Plan → Tasks → Implementation
   (guards every phase automatically via SDD skills)
```

Every SDD skill reads `constitution.md` as **Step 0** before doing anything else. The constitution uses a **three-tier boundary system**:

| Tier | Meaning | Examples |
|------|---------|----------|
| ✅ **Always do** | Agent proceeds without asking | Version-control all LLM prompts. Specify exact model IDs. Use dependency injection. |
| ⚠️ **Ask first** | Agent pauses for human approval | Adding new dependencies. Changing the GeminiClient interface. |
| 🚫 **Never do** | Hard stop — categorically forbidden | Commit secrets. Call real APIs in tests. Write code without a spec. |

> [!WARNING]
> If `constitution.md` does not exist when an SDD skill is invoked, the agent will pause and ask whether to create one first.

---

## Phase 0: Project Setup + Constitution (~3 min)

### Prompt 1: Create the project and constitution

```text
Create a new TypeScript project called "slide-creator" with:
- A src/ directory for backend pipeline code
- Jest configured with ts-jest and jest-cucumber for Gherkin-based BDD tests
- @google/genai as a dependency
- dotenv for .env file support
- React + Vite for the frontend (separate from backend pipeline)

Create an INSTRUCTIONS.md at the root:

# Slide Creator — SDD Workshop

## Project Overview
An app that turns raw content into a styled slide presentation with AI-generated images.
Backend: 3-stage pipeline (Content Generator → Image Generator → HTML Composer).
Frontend: React app with input form and slide preview.

## Workflow (STRICT)
Follow the SDD pipeline for ALL work:
0. Constitution → 1. Specify → 2. Plan → 3. Tasks → 4. Implement → 5. Verify → 6. Iterate
NEVER write code without a constitution, a spec, and a plan first.

Also create:
- A .env.example with GEMINI_API_KEY=your_api_key_here
- A constitution.md with immutable project rules (see the constitution pattern)
```

> **What happens:** Agent scaffolds the project, installs deps, creates INSTRUCTIONS.md, .env.example, and `constitution.md` with the three-tier boundary system (Always/Ask/Never), architecture rules, technology stack, and forbidden patterns.

---

## Spec 1: The Backend Pipeline (~16 min)

This covers the 3-stage pipeline: Content Generator, Image Generator, HTML Composer. We run the full SDD cycle here.

---

### Step 1: Specify (~2 min)

```text
Use the sdd-specify skill to create the specification for the backend pipeline.

The pipeline has three stages, each a service with a clean contract:

Stage 1: Content Generator — Reads markdown files from an input/ folder, combines 
them, and calls the Gemini API (model: gemini-2.0-flash) to produce a structured 
slide deck. Each slide gets a title, bullet points or body text, speaker notes, and 
an "image prompt" field. The LLM prompt must be version-controlled as a constant 
called CONTENT_GENERATION_PROMPT in the module. The prompt must instruct the LLM 
to output strictly as JSON matching the SlideDeck interface. LLM responses must be 
cleaned of markdown code fences before JSON parsing.

Stage 2: Image Generator — Takes the image prompt from each slide and calls Gemini 
(model: imagen-4.0-fast-generate-001, via @google/genai's generateImages method) to 
generate an image. Returns base64 image data. Handles failures gracefully with a 
fallback placeholder. Must implement a configurable delay (default 6100ms) between 
calls to respect Gemini free-tier rate limits (10 RPM). The delay must be injectable 
via constructor so tests can pass 0.

Stage 3: HTML Composer — Takes the slide deck (now with images) and, for each slide, 
saves the image to slides/assets/ as a .jpg file, then calls the Gemini API with a 
designer-quality prompt (stored as HTML_GENERATION_PROMPT constant) to generate a 
stunning, self-contained HTML slide. The LLM receives the slide title, content, 
speaker notes, relative image path, and slide number. It must creatively integrate 
the image (hero, split-pane, background, floating card, etc.). Falls back to a 
static template if the API fails. Outputs one .html file per slide.

All three stages depend on a shared GeminiClient interface with two methods:
- generateContent(prompt: string): Promise<string>
- generateImageBase64(prompt: string): Promise<string>

This interface must be defined in the spec and plan. The DefaultGeminiClient 
implementation wraps @google/genai. For generateImages, the SDK response shape is:
response.generatedImages[0].image.imageBytes (this is non-obvious and must be 
documented).

Include Gherkin scenarios for all three stages. The Content Generator and HTML 
Composer have external dependencies (Gemini API + file system). The Image Generator  
has an external dependency that must be mockable.
```

> **What happens:** Agent creates `spec.md` with intent, constraints, **model configuration table**, **both versioned LLM prompts**, rate limiting constraint, response cleaning constraint, and `features/*.feature` files with happy paths, edge cases, and error scenarios.

> [!WARNING]
> **Check that `spec.md` includes**: (1) exact model names, (2) both full LLM prompts, (3) the GeminiClient interface, (4) rate limiting strategy, (5) response cleaning requirement. If any are missing, ask the agent to add them before proceeding.

---

### Step 2: Plan (~1 min)

```text
Use the sdd-plan skill to plan the architecture based on our spec. Make sure to 
include the full GeminiClient interface and DefaultGeminiClient skeleton (with the 
exact SDK call patterns and response shapes), the Pipeline orchestrator, the CLI 
entry point (index.ts), testing conventions (jest-cucumber, mocking strategy, 
injectable delayMs), and essential project config (tsconfig.json, jest.config.ts).
```

> **What happens:** Agent creates `plan.md` with the full GeminiClient wrapper code, three stage components, Pipeline orchestrator, CLI entry point, testing conventions, and project config.

> [!WARNING]
> **Check that `plan.md` includes**: (1) `GeminiClient` interface with full TypeScript signature, (2) `DefaultGeminiClient` with SDK call patterns, (3) `index.ts` CLI entry point contract, (4) testing conventions section, (5) `tsconfig.json` and `jest.config.ts` settings.

---

### Step 3: Tasks (~1 min)

```text
Use the sdd-tasks skill to break the plan into a task list.
```

> **What happens:** Agent creates `task.md` with ordered checklist: GeminiClient wrapper → shared types → Content Generator tests → Content Generator impl → Image Generator tests → Image Generator impl → HTML Composer tests → HTML Composer impl → Pipeline orchestrator → CLI entry point.

---

### Step 4: Implement — Content Generator (~4 min)

```text
Use the sdd-implement skill to implement the Content Generator.
```

> **What happens:** Agent writes failing tests mapped to the Gherkin scenarios (RED), implements the generator using the versioned prompt from spec.md (GREEN), and cleans up (REFACTOR). **This is the TDD moment — point it out to the audience.**

---

### Step 5: Implement — Image Generator + HTML Composer (~4 min)

```text
Use the sdd-implement skill to implement the remaining tasks: Image Generator and HTML Composer.
```

> **What happens:** Agent mocks the Gemini API in tests (asserts on prompts sent, returns canned base64), implements the Image Generator with the configurable delay, then builds the HTML Composer with LLM-powered design and fallback. All tests pass.

---

### Step 6: Verify (~1 min)

```text
Use the sdd-verify skill to verify the pipeline.
```

> **What happens:** Agent runs all tests, checks coverage, cross-references specs, and generates `evidence.md`. All green.

---

### Step 7: Iterate (~3 min)

```text
Actually, we need the Content Generator to also output a "totalSlides" count on each slide for pagination, and the HTML Composer should render a progress bar using it. Use the sdd-iterate skill.
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
| 1 | Create project + INSTRUCTIONS.md + .env.example | Setup | 2 min |
| 2 | sdd-specify: Backend pipeline (with model names, prompts, GeminiClient) | Specify | 2 min |
| 3 | sdd-plan: Architecture (with GeminiClient, CLI, testing conventions) | Plan | 1 min |
| 4 | sdd-tasks: Task list | Tasks | 1 min |
| 5 | sdd-implement: Content Generator | Implement | 4 min |
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

## Constitution Compliance Checklist

> Use this checklist **after Phase 0** and **after each Specify step** to verify the constitution and spec are complete:

### Constitution (`constitution.md`)
- [ ] ✅ **Always** tier rules include: versioned prompts, exact model IDs, dependency injection, response cleaning
- [ ] ⚠️ **Ask first** tier rules include: new dependencies, interface changes
- [ ] 🚫 **Never** tier rules include: committing secrets, real API calls in tests, code without a spec
- [ ] Architecture rules define central interface and pipeline structure
- [ ] Technology stack lists exact libraries, models, and test framework
- [ ] Forbidden patterns table covers all known anti-patterns

### Spec (`spec.md`) — must align with constitution
- [ ] **Model names**: Every LLM/API model is identified by exact ID (from constitution)
- [ ] **LLM prompts**: Every prompt is written out in full and assigned a named constant
- [ ] **Rate limiting**: Delay/throttle strategy specified with exact values
- [ ] **Response cleaning**: Post-processing rules for LLM output are explicit

### Plan (`plan.md`) — must align with constitution + spec
- [ ] **Central interface**: Full TypeScript signature with SDK call patterns
- [ ] **Testability knobs**: Injectable params for test speed documented
- [ ] **File structure**: Every file the agent should create is listed
- [ ] **Testing conventions**: Library, BDD pattern, mocking strategy documented
- [ ] **Project config**: `tsconfig.json`, `jest.config.ts`, `.env.example` included

---

## If Something Goes Wrong

**Agent generates code that doesn't pass tests:** Good teaching moment. Say "Watch — it reads the failure, adjusts, and tries again. That's the TDD loop."

**Agent skips a step:** Say "Stop. Follow the sdd-plan skill first." Then reprompt.

**Agent tries to modify feature files during implementation:** Say "No — the spec is the source of truth. Only implementation changes."

**Agent ignores the constitution:** Say "Read constitution.md first. Step 0." Then reprompt.

**The real Gemini call fails or returns weird images:** Have a backup with pre-generated output. Show it, explain the real call would produce something similar, move on.

**Tests are slow:** Pre-run `npm test` once during setup to warm the cache.

**Spec is missing details (model names, prompts, etc.):** Use the **Constitution Compliance Checklist** above. If items are unchecked, ask the agent to fill the gaps before Plan phase.