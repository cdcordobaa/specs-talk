# Feature: Slide Creator Pipeline

## Intent
The Slide Creator Pipeline transforms raw Markdown content files into a polished, self-contained HTML slide deck with AI-generated images. It operates as a three-stage unidirectional pipeline: a **Content Generator** converts source Markdown into a structured JSON slide manifest; an **Image Generator** produces one image per slide via Gemini's image model; and an **HTML Composer** assembles each slide into a standalone, visually stunning HTML file. The pipeline is designed for workshop presenters who want to turn notes into a professional deck without manual design work.

## Actors
- **Presenter** — Provides `.md` files in the `input/` folder and runs the pipeline to produce slides in `slides/`.
- **Pipeline** — The orchestrating TypeScript class that wires all three stages and injects a shared `GeminiClient`.

---

## Constraints

### Technology Stack
- Language: TypeScript, strict mode (`strict: true`, `esModuleInterop: true`, `module: "commonjs"`)
- LLM SDK: `@google/genai` — accessed **only** through the `GeminiClient` interface
- Text model: **`gemini-2.0-flash`** via `ai.models.generateContent(...)`
- Image model: **`imagen-4.0-fast-generate-001`** via `ai.models.generateImages(...)`
- Testing: Jest + ts-jest + jest-cucumber; no real API calls in tests

### GeminiClient Interface (central contract — must not change without approval)
```typescript
interface GeminiClient {
  generateContent(prompt: string): Promise<string>;
  generateImageBase64(prompt: string): Promise<string>;
}
```

### Dependency Injection
Every stage accepts its `GeminiClient` via constructor injection. No stage instantiates any client internally.

### LLM Response Cleaning
All text responses from `generateContent` must be stripped of markdown code fences (` ```json `, ` ```html `, ` ``` `, etc.) before being parsed or written to disk. Stripping is applied with a regex that removes opening and closing fence lines.

### Rate Limiting
The Image Generator must wait **6100 ms** between successive `generateImageBase64` calls to respect Gemini free-tier limits (10 RPM). This delay is injectable via constructor parameter `delayMs` (default: `6100`). Tests must pass `delayMs: 0`.

### Graceful Degradation
- **Image Generator**: if `generateImageBase64` throws, log the error with `console.error` and return a placeholder base64 PNG string.
- **HTML Composer**: if `generateContent` throws, log the error with `console.error` and return a static fallback HTML template that still displays `title` and `content`.
- Neither failure may throw or crash the pipeline.

### File System Layout
```
input/          ← source .md files (read by Content Generator)
slides/         ← output HTML files (written by HTML Composer)
slides/assets/  ← output .jpg images (written by HTML Composer)
```

### No Embedded Base64 in HTML
Images are saved as `slides/assets/slide-{index}.jpg`. HTML files reference them via the relative path `assets/slide-{index}.jpg`. Base64 data URIs must never appear in final HTML output.

---

## Stages / Components

| Class | File | Responsibility |
|-------|------|----------------|
| `ContentGenerator` | `src/ContentGenerator.ts` | Reads `input/*.md`, combines content, calls Gemini text model, returns `Slide[]` |
| `ImageGenerator` | `src/ImageGenerator.ts` | Iterates `Slide[]`, calls Gemini image model per slide, returns `SlideWithImage[]` |
| `HTMLComposer` | `src/HTMLComposer.ts` | Saves images to `slides/assets/`, calls Gemini text model for HTML, writes `.html` files |
| `Pipeline` | `src/Pipeline.ts` | Wires all three stages with a shared `GeminiClient` |
| `GeminiClient` (interface) | `src/types.ts` | Central contract; also defines `Slide` and `SlideWithImage` types |

### Shared Types (`src/types.ts`)
```typescript
interface Slide {
  title: string;
  content: string;
  speakerNotes: string;
  imagePrompt: string;
}

interface SlideWithImage extends Slide {
  imageBase64: string;
}

interface GeminiClient {
  generateContent(prompt: string): Promise<string>;
  generateImageBase64(prompt: string): Promise<string>;
}
```

---

## LLM Prompts

### `CONTENT_GENERATION_PROMPT` (used by `ContentGenerator`)

Stored as a `const` named `CONTENT_GENERATION_PROMPT` in `src/ContentGenerator.ts`. The `{CONTENT}` placeholder is replaced at runtime with the combined Markdown text.

```
You are a professional presentation designer. Given the following raw content, create a structured slide deck in JSON format.

Return a JSON array where each element represents one slide with these exact fields:
- "title": a concise slide title (max 8 words)
- "content": the main slide body as a short paragraph or 3-5 bullet points (use "• " prefix for bullets)
- "speakerNotes": detailed speaker notes for the presenter (2-4 sentences)
- "imagePrompt": a vivid, detailed image generation prompt that visually represents the slide's concept (describe style, mood, colors, composition)

Rules:
- Return ONLY valid JSON. No markdown fences, no explanation, no preamble.
- The array must have between 3 and 12 slides.
- Each slide must be self-contained and coherent without the others.
- imagePrompt must be descriptive enough for photorealistic or artistic generation.

Raw content:
{CONTENT}
```

### `HTML_GENERATION_PROMPT` (used by `HTMLComposer`)

Stored as a `const` named `HTML_GENERATION_PROMPT` in `src/HTMLComposer.ts`. The `{TITLE}`, `{CONTENT}`, `{SPEAKER_NOTES}`, and `{IMAGE_PATH}` placeholders are replaced at runtime.

```
You are an award-winning presentation designer and front-end engineer. Create a single, stunning, self-contained HTML slide.

Slide data:
- Title: {TITLE}
- Content: {CONTENT}
- Speaker Notes: {SPEAKER_NOTES}
- Image file (relative path): {IMAGE_PATH}

Design requirements:
- The slide must be exactly 1280×720px (16:9 ratio).
- Use the provided image creatively — choose ONE of these integration patterns based on what suits the content best:
  • Hero: image fills the full background with text overlay and a semi-transparent scrim
  • Split-pane: image occupies 40-60% of the slide on one side, content on the other
  • Background: image as a subtle textured background with high-contrast text
  • Floating card: image in a rounded card floating over a solid gradient background
- Apply a sophisticated color palette derived from the slide's mood (dark tech, warm storytelling, minimal professional, vibrant energy, etc.).
- Use Google Fonts (loaded via @import in <style>). Choose a font pairing appropriate to the mood.
- Typography must be hierarchical: title large and bold, content readable at 1280px width, speaker notes small and muted.
- Add subtle CSS animations (fade-in, slide-up, or scale) to make the slide feel alive.
- The speaker notes must appear in a small, styled footer area or as a hidden tooltip.
- The HTML must be fully self-contained: one <html> document, no external dependencies except Google Fonts and the image.

Output rules:
- Return ONLY the raw HTML. No markdown fences, no explanation, no preamble.
- The <img> src attribute must be exactly: {IMAGE_PATH}
- Do not embed base64 image data.
```

---

## Acceptance Criteria

Acceptance criteria are expressed as executable Gherkin scenarios in:

- `features/content-generator.feature` — Content Generator behaviour
- `features/image-generator.feature` — Image Generator behaviour
- `features/html-composer.feature` — HTML Composer behaviour
