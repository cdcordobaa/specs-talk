# Feature: Web Frontend — Slide Generation UI

## Intent
A simple web interface that allows a user to paste raw markdown or documentation text into a textarea,
click a "Generate" button, and receive a set of AI-generated HTML slides produced by the existing
3-stage backend pipeline (Content Generator → Image Generator → HTML Composer). The slides are
previewed in the browser one at a time with Previous/Next navigation. The feature eliminates the need
to use the CLI and makes the pipeline accessible to non-technical users.

## Actors
- **Presenter / Workshop Participant** — pastes raw notes or documentation, clicks Generate, previews slides.

## Model Configuration

Inherited from the backend pipeline (no new LLM calls are introduced by this feature):

| Purpose | Model Identifier | SDK Method |
|---------|-----------------|------------|
| Text generation | `gemini-2.0-flash` | `ai.models.generateContent(...)` |
| Image generation | `imagen-4.0-fast-generate-001` | `ai.models.generateImages(...)` |

## Constraints

- **No framework:** The frontend is plain HTML + vanilla JavaScript. No React, no Vite, no bundler.
- **API server:** A lightweight Express HTTP server serves the static frontend files AND exposes a REST API.
- **New dependencies (requires user confirmation before implementation):**
  - `express` — HTTP server
  - `@types/express` — TypeScript types
- **API contract:**
  - `POST /api/generate` accepts `{ content: string }` (JSON body).
  - On success: responds with `{ slides: string[] }` — an ordered array of HTML strings, one per slide.
  - On error: responds with HTTP 4xx/5xx and `{ error: string }`.
- **Pipeline reuse:** The server MUST reuse the existing `Pipeline` class from `src/pipeline.ts`. It must NOT duplicate pipeline logic.
- **Temp I/O:** The server writes the submitted content to a temporary input file, runs the pipeline against it, reads back the generated HTML files from the output directory, and returns them. Temp files are cleaned up after each request.
- **`GEMINI_API_KEY`:** Loaded via `dotenv` in the server entry point. The server must refuse to start if the key is absent.
- **LLM Response Cleaning:** Inherited from existing pipeline stages — no additional cleaning required in the server.
- **Rate Limiting:** Inherited from `ImageGenerator` (6100ms delay between image calls by default). The server must not override or bypass this.
- **Static serving:** The server serves the `frontend/` directory as static files at the root path `/`.
- **Port:** Default `3000`, overridable via `PORT` environment variable.

## Stages / Components

1. **Express API Server** (`src/server.ts`): Handles `POST /api/generate`, runs the pipeline, returns slide HTML array.
2. **Frontend UI** (`frontend/index.html`, `frontend/main.js`, `frontend/styles.css`): Textarea input, Generate button, slide viewer with iframe preview and Prev/Next navigation.

## Acceptance Criteria
- [x] Web Frontend UI specified in `features/web_frontend.feature`
- [x] API Server specified in `features/api_server.feature`

## API Prompts
_No new LLM prompts are introduced by this feature. All prompts are defined in `spec.md`._
