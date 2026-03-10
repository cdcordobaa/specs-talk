# Architecture Plan

## Overview
The backend pipeline follows a staged, unidirectional data flow architecture. It processes raw text from markdown files in an `input/` folder into styled HTML presentation files in a `slides/` folder across three distinct, loosely coupled stages. The first two stages rely on external LLM calls (Gemini API) to generate and structure content and images, while the final stage generates and writes the HTML files to disk.

## Data Flow
``` text
Input Folder (*.md) 
  → [Content Generator (Gemini LLM)] 
  → SlideDeck (without images) 
  → [Image Generator (Gemini LLM)] 
  → SlideDeck (with images) 
  → [HTML Composer (Gemini LLM + file system)] 
  → Slides Folder (*.html + assets/*.jpg)
```

## Shared Types

```typescript
export interface Slide {
  title: string;
  content: string; // bullet points or body text
  speakerNotes?: string;
  imagePrompt?: string;
  imageDataBase64?: string; // Populated by Image Generator
}

export interface SlideDeck {
  slides: Slide[];
}
```

## Components

### Content Generator
- **Responsibility**: Reads one or many `.md` files from an `input/` folder, combines their content, calls the Gemini API to intelligently generate a structured `SlideDeck` object, extracting and organizing titles, content, notes, and predicting image prompts.
- **Input**: `string` (path to input directory) + `GeminiClient` (dependency injected)
- **Output**: `Promise<SlideDeck>`
- **Side Effects**: Reads from file system (`input/` folder) and makes network calls to the Gemini API (`@google/genai`).
- **Testing Strategy**: Unit testing with a mocked `GeminiClient` and a mocked file system (or temp directory). Assert that Gemini receives the combined file content and returns a valid structured format. Test API failure cases.

### Image Generator
- **Responsibility**: Takes a `SlideDeck`, reads the `imagePrompt` of each slide, calls the Gemini API to generate an image, and updates the slide with `imageDataBase64`.
- **Input**: `SlideDeck` (without images) + `GeminiClient` (dependency injected)
- **Output**: `Promise<SlideDeck>` (with images populated)
- **Side Effects**: Makes network calls to the Gemini API (`@google/genai`).
- **Testing Strategy**: Unit testing with a mocked `GeminiClient`. Test network failures, timeouts, and successful generations. Assert that fallback placeholder images are used on failure.

### HTML Composer
- **Responsibility**: Takes a fully populated `SlideDeck` (with images) and for each slide:
  1. Saves the Base64 image data as a file in `slides/assets/`.
  2. Calls the Gemini LLM with the canonical `HTML_GENERATION_PROMPT`, injecting the slide's title, content, speaker notes, image path, and slide number.
  3. Writes the LLM-generated HTML to a `.html` file in `slides/`.
  4. Falls back to a static template if the LLM call fails.
- **Input**: `SlideDeck` (with images) + `string` (path to output directory) + `GeminiClient` (dependency injected)
- **Output**: `Promise<void>`
- **Side Effects**: Writes multiple HTML and image files to the file system (`slides/` and `slides/assets/` folders). Makes network calls to the Gemini API via the injected `GeminiClient`.
- **Testing Strategy**: Unit testing with a mocked `GeminiClient` and mocked file system. Assert that the correct number of HTML and image files are written, that the HTML uses relative paths, and that the LLM output is written as-is. Test the fallback path when the API fails.

## External Dependencies
- **`@google/genai`**: Used by both the Content Generator and Image Generator components to interface with the Gemini API. Must be wrapped or injected to allow mocking during tests.

## File Structure

```text
src/
├── types.ts                    # Shared TS interfaces (Slide, SlideDeck)
├── contentGenerator.ts         # Content Generator stage implementation
├── contentGenerator.test.ts    # Content Generator unit & BDD tests
├── imageGenerator.ts           # Image Generator stage implementation
├── imageGenerator.test.ts      # Image Generator unit & BDD tests
├── htmlComposer.ts             # HTML Composer stage implementation
├── htmlComposer.test.ts        # HTML Composer unit & BDD tests
├── geminiClient.ts             # Wrapped/Mockable Gemini API Client setup
└── pipeline.ts                 # Orchestrator integrating the three stages
features/
├── content_generator.feature
├── image_generator.feature
└── html_composer.feature
```
