# Task List

## Setup
- [x] Initialize project, install dependencies (including `@google/genai`), configure test runner if not done already.
- [x] Set up a mock interface/wrapper for `@google/genai` (in `src/geminiClient.ts`) to be injected into both generator stages.

## Shared Types
- [x] Create `src/types.ts` defining `Slide` and `SlideDeck` interfaces as defined in the plan.

## Content Generator
- [x] Write failing unit and BDD tests for `ContentGenerator` in `src/contentGenerator.test.ts` based on `features/content_generator.feature`, mocking the file system (to simulate an `input/` folder) and using the mock Gemini client.
- [x] Implement `ContentGenerator` in `src/contentGenerator.ts` to read `.md` files from the input directory, aggregate their content, call Gemini (enforcing structured output), and parse the response.

## Image Generator
- [x] Write failing unit and BDD tests for `ImageGenerator` in `src/imageGenerator.test.ts` based on `features/image_generator.feature`, using the mock Gemini client.
- [x] Implement `ImageGenerator` in `src/imageGenerator.ts` to call the (mocked) API, update slides with base64 data, handle failures gracefully, and pass all tests.

## HTML Composer
- [/] Update `src/htmlComposer.test.ts` with new BDD scenarios for LLM-generated HTML (mocked Gemini call, fallback on failure, empty deck does not call API).
- [ ] Update `src/htmlComposer.ts` to accept a `GeminiClient`, define `HTML_GENERATION_PROMPT` as a module constant, and call the LLM per-slide with rendered prompt variables.
- [ ] Implement graceful fallback to static template when the HTML generation LLM call fails.
- [ ] Update `src/pipeline.ts` to inject the `GeminiClient` into the `HTMLComposer` constructor.

## Integration
- [x] Wire all three stages (Content Generator → Image Generator → HTML Composer) into an orchestrator in `src/pipeline.ts`, passing the `input/` and `slides/` paths appropriately.
- [x] Create an integration test or entry point script to verify end-to-end execution.
- [x] Perform a manual end-to-end run with sample markdown files in an actual `input/` folder to verify the complete HTML files in `slides/`.
