# Task List

## Setup
- [ ] Create `.env.example` with `GEMINI_API_KEY=your_api_key_here`
- [ ] Create `input/` directory with a sample `.md` file for manual testing
- [ ] Create `slides/` and `slides/assets/` directories (or confirm they are created at runtime)

## Shared Types (`src/types.ts`)
- [ ] Create `src/types.ts` exporting `Slide`, `SlideWithImage`, and `GeminiClient` interfaces exactly as specified in `plan.md`

## Utility (`src/utils.ts`)
- [ ] Write failing tests in `src/utils.test.ts` for `cleanLLMResponse`:
  - Strips ` ```json ` fences
  - Strips ` ```html ` fences
  - Strips bare ` ``` ` fences
  - Returns unchanged string when no fences are present
  - Handles multiline content inside fences correctly
- [ ] Implement `cleanLLMResponse` in `src/utils.ts` to pass all tests

## GeminiClient Implementation (`src/GeminiClientImpl.ts`)
- [ ] Create `src/GeminiClientImpl.ts` that implements `GeminiClient` using `@google/genai`:
  - `generateContent`: calls `ai.models.generateContent({ model: 'gemini-2.0-flash', contents: prompt })` and returns `response.text ?? ''`
  - `generateImageBase64`: calls `ai.models.generateImages({ model: 'imagen-4.0-fast-generate-001', prompt, config: { numberOfImages: 1, outputMimeType: 'image/jpeg' } })` and returns `response.generatedImages[0].image.imageBytes`
  - Constructor accepts `apiKey: string`
  - No unit tests (never imported in test files)

## Content Generator (`src/ContentGenerator.ts`)
- [ ] Write failing BDD tests in `src/ContentGenerator.test.ts` using `jest-cucumber` bound to `features/content-generator.feature`:
  - Scenario: Generating slides from multiple Markdown files
  - Scenario: LLM response wrapped in markdown fences is cleaned before parsing
  - Scenario: Single Markdown file produces a valid slide deck
  - Scenario: Empty input folder produces an error
- [ ] Implement `ContentGenerator` in `src/ContentGenerator.ts` to pass all tests:
  - Define `CONTENT_GENERATION_PROMPT` const with exact text from `spec.md`
  - Constructor accepts `GeminiClient` and optional `inputDir` (default: `'input'`)
  - `generate()` reads all `.md` files from `inputDir`, joins with `\n\n---\n\n`
  - Throws `"No markdown files found in input/"` when folder is empty
  - Replaces `{CONTENT}` token, calls `generateContent`, cleans response, parses JSON
  - Returns `Slide[]`
- [ ] Verify all Content Generator tests pass with `npm test -- --testPathPattern=ContentGenerator`

## Image Generator (`src/ImageGenerator.ts`)
- [ ] Write failing BDD tests in `src/ImageGenerator.test.ts` using `jest-cucumber` bound to `features/image-generator.feature`:
  - Scenario: Generating an image for each slide
  - Scenario: A delay is applied between successive image generation calls
  - Scenario: Image generation failure falls back to a placeholder
  - Scenario: Single-slide deck generates exactly one image
- [ ] Implement `ImageGenerator` in `src/ImageGenerator.ts` to pass all tests:
  - Define `PLACEHOLDER_BASE64` const (minimal valid base64 string)
  - Constructor accepts `GeminiClient` and optional `delayMs` (default: `6100`)
  - `generate(slides: Slide[])` iterates sequentially, awaits delay between calls (not before first)
  - On `generateImageBase64` failure: calls `console.error`, uses `PLACEHOLDER_BASE64`
  - Returns `SlideWithImage[]`
- [ ] Verify all Image Generator tests pass with `npm test -- --testPathPattern=ImageGenerator`

## HTML Composer (`src/HTMLComposer.ts`)
- [ ] Write failing BDD tests in `src/HTMLComposer.test.ts` using `jest-cucumber` bound to `features/html-composer.feature`:
  - Scenario: Composing an HTML slide with a generated image
  - Scenario: The image is referenced via relative path in the generated HTML
  - Scenario: LLM response wrapped in markdown fences is cleaned before writing
  - Scenario: HTML generation failure falls back to a static template
  - Scenario: Full deck of three slides produces three HTML files and three image files
- [ ] Implement `HTMLComposer` in `src/HTMLComposer.ts` to pass all tests:
  - Define `HTML_GENERATION_PROMPT` const with exact text from `spec.md`
  - Define `FALLBACK_HTML_TEMPLATE` const with a minimal valid HTML page using `{TITLE}`, `{CONTENT}`, `{IMAGE_PATH}` tokens
  - Constructor accepts `GeminiClient` and optional `outputDir` (default: `'slides'`)
  - `compose(slides: SlideWithImage[])` iterates slides:
    - Ensures `{outputDir}/assets/` exists via `fs.mkdir(..., { recursive: true })`
    - Writes base64-decoded image to `{outputDir}/assets/slide-{i}.jpg`
    - Substitutes all four `{TOKEN}` placeholders into `HTML_GENERATION_PROMPT`
    - Calls `generateContent`, cleans response, writes to `{outputDir}/slide-{i}.html`
    - On failure: `console.error`, renders `FALLBACK_HTML_TEMPLATE`, writes fallback HTML
  - Mock `fs/promises` via `jest.mock('fs/promises')` in the test file
- [ ] Verify all HTML Composer tests pass with `npm test -- --testPathPattern=HTMLComposer`

## Pipeline & Entry Point
- [ ] Create `src/Pipeline.ts`:
  - Constructor instantiates `GeminiClientImpl` using `process.env.GEMINI_API_KEY`
  - `run()` calls `ContentGenerator → ImageGenerator → HTMLComposer` in sequence
- [ ] Create `src/index.ts`:
  - Loads dotenv (`import 'dotenv/config'` or `dotenv.config()`)
  - Instantiates `Pipeline` and calls `pipeline.run()`
  - Logs start/completion messages to console
- [ ] Verify all tests still pass with `npm test`

## Integration Verification
- [ ] Run the full test suite and confirm zero failures: `npm test`
- [ ] Build the project with `npm run build` and confirm zero TypeScript errors
- [ ] Perform a manual end-to-end test:
  - Place a `.md` file in `input/`
  - Add a real `GEMINI_API_KEY` to `.env`
  - Run `npx ts-node src/index.ts`
  - Confirm `slides/slide-0.html` and `slides/assets/slide-0.jpg` are created
