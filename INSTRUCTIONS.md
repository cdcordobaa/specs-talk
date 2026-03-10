# Slide Creator — SDD Workshop

## Project Overview
An app that turns raw content into a styled slide presentation with AI-generated images.
- **Backend**: 3-stage pipeline (Content Generator → Image Generator → HTML Composer)
- **Frontend**: React app with input form, slide preview carousel, and HTML export

## Tech Stack
- TypeScript (strict mode)
- Jest + ts-jest + jest-cucumber for testing
- `@google/genai` for Gemini-powered image generation
- React + Vite for the frontend

## Testing
- Run all tests: `npm test`
- Feature files: `features/*.feature`
- Unit tests co-located: `src/foo.ts` → `src/foo.test.ts`

## Workflow (STRICT) — Spec-Driven Development (SDD)

You MUST follow these steps in order. **Never write implementation code without a spec and a plan.**

0. **Constitution** — Read `constitution.md` before ANY phase (immutable project-level rules)
1. **Specify** — Create `spec.md` + Gherkin `features/*.feature` files
2. **Plan** — Create `plan.md` with architecture and component contracts
3. **Tasks** — Create `task.md` with small, verifiable checklist items
4. **Implement** — Write tests FIRST (TDD: Red → Green → Refactor), code in `src/`
5. **Verify** — Create `evidence.md` showing tests pass and architecture rules hold
6. **Iterate** — If requirements change, update `spec.md` FIRST, then flow changes down

## Rules
- **Read `constitution.md` before starting any SDD phase.** It is the highest-level artifact.
- Before writing any `.ts` implementation file, confirm that `spec.md` and `plan.md` exist.
- Do not skip or merge steps. Each artifact (`constitution.md`, `spec.md`, `plan.md`, `task.md`, `evidence.md`) must exist before moving to the next step.
- Keep each source file focused on a single responsibility.
- Use `@google/genai` only through the `GeminiClient` interface — do not scatter API calls.
- NEVER modify `.feature` files during implementation — only during Specify or Iterate phases.
- Use the SDD skills in `.agents/skills/` (Antigravity) or `.claude/skills/` (Claude Code) for guidance on each phase.
