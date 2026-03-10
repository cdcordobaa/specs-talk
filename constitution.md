# Constitution — Slide Creator

> **This file contains immutable project-level rules that apply to EVERY specification, plan, task, and implementation in this project.** The agent MUST read this file before starting ANY SDD phase. These rules cannot be overridden by individual specs.

---

## Core Principles

### ✅ Always Do

- **Version-control all LLM prompts.** Every prompt sent to an LLM must be written out in full in `spec.md` and stored as a named constant (e.g., `CONTENT_GENERATION_PROMPT`, `HTML_GENERATION_PROMPT`) in the source module that uses it. The agent must never invent prompts at implementation time.
- **Specify exact model identifiers.** Every LLM or image-generation model must be identified by its exact API model ID (e.g., `gemini-2.0-flash`, `imagen-4.0-fast-generate-001`) in `spec.md`. Never leave model selection to the implementing agent.
- **Document SDK call patterns.** When using third-party SDKs with non-obvious APIs, the exact method names and response traversal paths must be documented in `plan.md` (e.g., `response.generatedImages[0].image.imageBytes`).
- **Specify all operational constraints.** Rate limits, delays, retries, and throttle strategies must be explicit in `spec.md` with exact values (e.g., "6100ms delay between image generation calls").
- **Clean LLM responses before use.** All LLM text responses must be stripped of markdown code fences (` ```json `, ` ```html `, etc.) before parsing or writing to disk. This must be stated as a constraint in `spec.md`.
- **Use dependency injection for all external services.** Every stage that calls an external API must accept its client via constructor injection. Never instantiate clients inside business logic.

### ⚠️ Ask First

- **Adding new npm dependencies.** Before adding any package not in `package.json`, pause and confirm with the user.
- **Changing the GeminiClient interface.** The `GeminiClient` interface is the project's central contract. Any change to its signature requires explicit approval.
- **Modifying the constitution.** If a constitution rule seems wrong, propose a change — don't silently ignore it.

### 🚫 Never Do

- **Never commit API keys or secrets.** Use `.env` files and `dotenv`. The `.env` file must be in `.gitignore`. A `.env.example` must exist with placeholder values.
- **Never call real APIs during tests.** All external service calls (Gemini, file system in unit tests) must be mocked via `jest.mock()` or dependency injection.
- **Never write implementation code without a spec.** `spec.md` and at least one `.feature` file must exist before any `src/*.ts` file is created.
- **Never invent prompts during implementation.** LLM prompts are defined in `spec.md`. The implementation must use the exact text from the spec, stored as a named constant.

---

## Architecture Rules

- **Three-stage unidirectional pipeline.** Data flows: `input/ → Content Generator → Image Generator → HTML Composer → slides/`. No stage may depend on a downstream stage.
- **GeminiClient is the central contract.** All three stages depend on the `GeminiClient` interface. It has exactly two methods:
  ```typescript
  interface GeminiClient {
    generateContent(prompt: string): Promise<string>;
    generateImageBase64(prompt: string): Promise<string>;
  }
  ```
- **One class per stage.** Each pipeline stage is a single TypeScript class in its own file: `ContentGenerator`, `ImageGenerator`, `HTMLComposer`.
- **Single orchestrator.** The `Pipeline` class wires all stages and injects the shared `GeminiClient`. Stages never instantiate their own clients.
- **External assets, not embedded data.** Images are saved to `slides/assets/*.jpg` as files. HTML references them via relative paths. Never embed base64 data URIs in final HTML.
- **Graceful degradation.** If any LLM call fails, the stage must not crash the pipeline. Image Generator uses a placeholder; HTML Composer uses a static fallback template.
- **Injectable test knobs.** Any value that would make tests slow or flaky (e.g., API rate-limit delay) must be injectable via constructor parameter with a sensible production default.

---

## Technology Stack

| Category | Choice | Notes |
|----------|--------|-------|
| Language | TypeScript (strict mode) | `tsconfig.json` with `strict: true`, `esModuleInterop: true` |
| Runtime | Node.js | CommonJS modules (`module: "commonjs"`) |
| LLM SDK | `@google/genai` | Wrapped in `GeminiClient` interface — never used directly in stages |
| Text model | `gemini-2.0-flash` | Via `ai.models.generateContent(...)` |
| Image model | `imagen-4.0-fast-generate-001` | Via `ai.models.generateImages(...)` |
| Test runner | Jest + ts-jest | Preset: `ts-jest`, environment: `node` |
| BDD tests | jest-cucumber | `defineFeature(loadFeature(...))` pattern |
| Env config | dotenv | `.env` file at project root, loaded in `index.ts` |
| Feature files | `features/*.feature` | Gherkin syntax, one feature per pipeline stage |

---

## Forbidden Patterns

| 🚫 Pattern | Why | What to do instead |
|------------|-----|-------------------|
| `any` type in TypeScript | Defeats type safety | Use proper interfaces from `types.ts` |
| Hardcoded API keys | Security risk | Use `process.env.GEMINI_API_KEY` via dotenv |
| Real API calls in tests | Slow, flaky, costs money | Mock via `jest.mock()` + dependency injection |
| Direct `@google/genai` usage in stages | Breaks testability | Import and use `GeminiClient` interface only |
| Embedded base64 in HTML | Bloats HTML files, breaks caching | Save to `assets/*.jpg`, reference via relative path |
| Modifying `.feature` files during implementation | Spec is source of truth | Only modify features in Specify or Iterate phases |
| Skipping SDD phases | Produces undocumented code | Always: specify → plan → tasks → implement → verify |
| `try-catch` that silently swallows errors | Hides failures | Always `console.error` the error, then apply fallback |
| `setTimeout` in tests without injectable delay | Makes tests slow (6+ seconds per slide) | Accept `delayMs` via constructor, pass `0` in tests |
