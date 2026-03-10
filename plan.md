# Architecture Plan — Slide Creator Pipeline

## Overview

The Slide Creator Pipeline is a three-stage, unidirectional TypeScript pipeline that transforms Markdown files into a polished HTML slide deck. A single `Pipeline` orchestrator wires three independent stage classes — `ContentGenerator`, `ImageGenerator`, `HTMLComposer` — each injected with a shared `GeminiClient` interface. No stage may depend on a downstream stage; data flows strictly left-to-right: `input/ → Slide[] → SlideWithImage[] → slides/`. A thin real implementation (`GeminiClientImpl`) wraps `@google/genai` and is the only module that touches the SDK directly.

---

## Data Flow

```
input/*.md
    │
    ▼
ContentGenerator.generate()
    │  reads all .md files, joins content, sends CONTENT_GENERATION_PROMPT
    │  returns: Slide[]
    ▼
ImageGenerator.generate(slides: Slide[])
    │  calls generateImageBase64 per slide (with 6100ms delay between calls)
    │  returns: SlideWithImage[]
    ▼
HTMLComposer.compose(slides: SlideWithImage[])
    │  per slide: saves image → slides/assets/slide-{i}.jpg
    │             sends HTML_GENERATION_PROMPT → writes slides/slide-{i}.html
    ▼
slides/slide-0.html … slide-N.html
slides/assets/slide-0.jpg … slide-N.jpg
```

---

## Shared Types (`src/types.ts`)

```typescript
export interface Slide {
  title: string;
  content: string;
  speakerNotes: string;
  imagePrompt: string;
}

export interface SlideWithImage extends Slide {
  imageBase64: string;
}

export interface GeminiClient {
  generateContent(prompt: string): Promise<string>;
  generateImageBase64(prompt: string): Promise<string>;
}
```

---

## Components

### `GeminiClientImpl` — `src/GeminiClientImpl.ts`

- **Responsibility**: The only module that imports and uses `@google/genai`. Implements the `GeminiClient` interface. Constructed with `GEMINI_API_KEY` from environment.
- **Input**: A prompt string per method.
- **Output**: `Promise<string>` — raw text from the model, or raw base64 image bytes.
- **Side Effects**: Calls Gemini API over the network.
- **SDK Call Patterns** (must match these exactly):

  ```typescript
  // Text generation
  import { GoogleGenAI } from '@google/genai';
  const ai = new GoogleGenAI({ apiKey });

  // generateContent
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
  });
  return response.text ?? '';

  // generateImageBase64
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-fast-generate-001',
    prompt,
    config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
  });
  return response.generatedImages[0].image.imageBytes; // base64 string
  ```

- **Testing Strategy**: Never instantiated in unit tests. All tests inject a `jest.fn()` mock that implements `GeminiClient`.
- **Injectable Knobs**: `apiKey: string` via constructor.

---

### `ContentGenerator` — `src/ContentGenerator.ts`

- **Responsibility**: Reads all `.md` files from `input/`, concatenates them with `\n\n---\n\n` separators, injects the combined text into `CONTENT_GENERATION_PROMPT`, calls `generateContent`, strips markdown fences from the response, and parses the resulting JSON into `Slide[]`.
- **Input**: None (reads from `input/` directory using Node `fs/promises`).
- **Output**: `Promise<Slide[]>`
- **Side Effects**: File system reads (`fs.readdir`, `fs.readFile`).
- **Throws**: Error with message `"No markdown files found in input/"` when the folder is empty or missing.
- **Prompt Constant**: `CONTENT_GENERATION_PROMPT` — defined as a module-level `const` in this file. The `{CONTENT}` token is replaced at runtime via `.replace('{CONTENT}', combinedMarkdown)`.
- **Response Cleaning**: Calls shared `cleanLLMResponse(raw)` before `JSON.parse`.
- **Testing Strategy**: Mock `fs/promises` via `jest.mock('fs/promises')`. Inject a mock `GeminiClient`. No real file I/O or API calls.
- **Injectable Knobs**: `GeminiClient` (constructor injection), `inputDir?: string` (default: `'input'`) for testability.

---

### `ImageGenerator` — `src/ImageGenerator.ts`

- **Responsibility**: Iterates over `Slide[]` in sequence, calls `generateImageBase64` with each slide's `imagePrompt`, waits `delayMs` between calls, and returns `SlideWithImage[]`. On failure per slide, logs the error and substitutes a placeholder base64 string.
- **Input**: `Slide[]`
- **Output**: `Promise<SlideWithImage[]>`
- **Side Effects**: Calls Gemini image API per slide. Logs failures with `console.error`.
- **Rate Limiting**: `delayMs` is applied *between* calls (not before the first). Implementation uses `await new Promise(r => setTimeout(r, delayMs))`.
- **Placeholder**: A minimal valid base64 JPEG string constant defined in this file as `PLACEHOLDER_BASE64`.
- **Testing Strategy**: Inject a mock `GeminiClient`. Pass `delayMs: 0` in all tests.
- **Injectable Knobs**: `GeminiClient` (constructor), `delayMs?: number` (default: `6100`).

---

### `HTMLComposer` — `src/HTMLComposer.ts`

- **Responsibility**: For each `SlideWithImage` (by index):
  1. Decodes `imageBase64` and writes it to `slides/assets/slide-{index}.jpg`.
  2. Builds the HTML prompt by substituting `{TITLE}`, `{CONTENT}`, `{SPEAKER_NOTES}`, `{IMAGE_PATH}` into `HTML_GENERATION_PROMPT` (where `IMAGE_PATH = assets/slide-{index}.jpg`).
  3. Calls `generateContent`, strips markdown fences from the response.
  4. Writes the resulting HTML to `slides/slide-{index}.html`.
  5. On `generateContent` failure: logs the error and writes a static fallback HTML template that shows `title` and `content` and still references `assets/slide-{index}.jpg`.
- **Input**: `SlideWithImage[]`
- **Output**: `Promise<void>`
- **Side Effects**: File system writes (`fs/promises` — `mkdir`, `writeFile`). Calls Gemini text API per slide.
- **Prompt Constant**: `HTML_GENERATION_PROMPT` — defined as a module-level `const` in this file. The four `{TOKEN}` placeholders are replaced at runtime.
- **Fallback Template**: A module-level `const` named `FALLBACK_HTML_TEMPLATE` containing a minimal but valid HTML page that uses `{TITLE}`, `{CONTENT}`, and `{IMAGE_PATH}` tokens.
- **Response Cleaning**: Calls shared `cleanLLMResponse(raw)` before writing HTML.
- **Testing Strategy**: Mock `fs/promises` via `jest.mock('fs/promises')`. Inject a mock `GeminiClient`. Assert on `writeFile` call arguments.
- **Injectable Knobs**: `GeminiClient` (constructor), `outputDir?: string` (default: `'slides'`).

---

### `Pipeline` — `src/Pipeline.ts`

- **Responsibility**: Wires all three stages. Constructs a `GeminiClientImpl`, injects it into `ContentGenerator`, `ImageGenerator`, and `HTMLComposer`, then calls them in sequence.
- **Input**: None (entry point reads from environment and filesystem).
- **Output**: `Promise<void>`
- **Side Effects**: All I/O delegated to stage classes.
- **Testing Strategy**: Not unit-tested directly. Covered by integration tests or manual verification.

---

### `cleanLLMResponse` — `src/utils.ts`

- **Responsibility**: A pure utility function. Strips leading/trailing markdown code fences from an LLM response string.
- **Input**: `raw: string`
- **Output**: `string`
- **Side Effects**: None.
- **Algorithm**: Apply the regex `/^```[\w]*\n?/` on the leading line and `/\n?```$/` on the trailing line (or a single multiline replace: `/^```[^\n]*\n?([\s\S]*?)\n?```$/`).
- **Testing Strategy**: Pure function — tested with simple unit assertions, no mocks needed.

---

## File Structure

```
slide-creator/
├── constitution.md
├── spec.md
├── plan.md
├── task.md                        ← created in Phase 3
├── evidence.md                    ← created in Phase 5
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── jest.config.ts
├── .env                           ← gitignored; contains GEMINI_API_KEY
├── .env.example                   ← committed; placeholder values
│
├── input/                         ← source Markdown files (presenter-provided)
│   └── *.md
│
├── slides/                        ← pipeline output (generated at runtime)
│   ├── slide-0.html
│   ├── slide-1.html
│   └── assets/
│       ├── slide-0.jpg
│       └── slide-1.jpg
│
├── features/                      ← Gherkin feature files (do not edit during implementation)
│   ├── content-generator.feature
│   ├── image-generator.feature
│   └── html-composer.feature
│
└── src/
    ├── types.ts                   ← Slide, SlideWithImage, GeminiClient interfaces
    ├── utils.ts                   ← cleanLLMResponse pure utility
    ├── GeminiClientImpl.ts        ← real @google/genai wrapper
    ├── ContentGenerator.ts        ← Stage 1
    ├── ImageGenerator.ts          ← Stage 2
    ├── HTMLComposer.ts            ← Stage 3
    ├── Pipeline.ts                ← orchestrator
    ├── index.ts                   ← entry point (loads dotenv, runs Pipeline)
    │
    ├── utils.test.ts              ← unit tests: cleanLLMResponse
    ├── ContentGenerator.test.ts   ← BDD + unit tests (jest-cucumber)
    ├── ImageGenerator.test.ts     ← BDD + unit tests (jest-cucumber)
    └── HTMLComposer.test.ts       ← BDD + unit tests (jest-cucumber)
```

---

## Testing Conventions

| Concern | Approach |
|---------|----------|
| Framework | Jest + ts-jest (`preset: 'ts-jest'`, `testEnvironment: 'node'`) |
| BDD binding | `jest-cucumber`: `defineFeature(loadFeature('../../features/X.feature'), ...)` |
| Test file location | `src/*.test.ts` (matches current `jest.config.ts` `roots: ['<rootDir>/src']`) |
| Mocking GeminiClient | `const mockClient: jest.Mocked<GeminiClient> = { generateContent: jest.fn(), generateImageBase64: jest.fn() }` |
| Mocking fs/promises | `jest.mock('fs/promises')` at top of test file; cast with `jest.mocked(fs)` |
| Rate-limit delay in tests | Always construct `ImageGenerator` with `delayMs: 0` |
| No real API calls | Enforced by never importing `GeminiClientImpl` in any test file |

---

## External Dependencies

| Dependency | Version in package.json | Purpose |
|------------|------------------------|---------|
| `@google/genai` | `^1.44.0` | Gemini text + image API |
| `dotenv` | `^17.3.1` | Load `GEMINI_API_KEY` from `.env` |
| `typescript` | `^5.9.3` | Language |
| `ts-jest` | `^29.4.6` | TypeScript Jest transform |
| `jest-cucumber` | `^4.5.0` | Gherkin BDD test binding |
| `jest` | `^29.7.0` | Test runner |

No new dependencies required. All necessary packages are already in `package.json`.

---

## Project Configuration

### `tsconfig.json` (existing — no changes needed)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### `jest.config.ts` (existing — no changes needed)
```typescript
import type { Config } from 'jest';
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.test.ts'],
};
export default config;
```

### `.env.example` (to be created)
```
GEMINI_API_KEY=your_api_key_here
```

---

## Architecture Invariants

These rules must not be violated during implementation:

1. No stage file (`ContentGenerator.ts`, `ImageGenerator.ts`, `HTMLComposer.ts`) may import `@google/genai`.
2. No test file may import `GeminiClientImpl`.
3. `SlideWithImage` is only produced by `ImageGenerator` — `HTMLComposer` never constructs it.
4. `slides/assets/*.jpg` files are written only by `HTMLComposer`.
5. The `GeminiClient` interface signature must not change without user approval.
6. `cleanLLMResponse` must be the single shared implementation — not duplicated per stage.
