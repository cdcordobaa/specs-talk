# Architecture Plan — Web Frontend

## Overview
A vanilla HTML/JS frontend served by an Express server. The server exposes a single
`POST /api/generate` endpoint that accepts raw markdown text, writes it to a temp input
file, runs the existing `Pipeline` class, reads back the generated HTML files from the
output directory, and returns an array of **URL paths** (not raw HTML strings) pointing
to those files served statically. The frontend loads each slide in an `<iframe src="...">`,
which keeps image relative paths intact.

> **Spec refinement (flagged):** `spec-frontend.md` described the response as
> `{ slides: string[] }` of HTML strings. The plan changes the element type to
> **URL strings** (e.g. `/slides/slide-1.html`) because `<iframe srcdoc>` cannot
> resolve relative image paths. This preserves the spec's observable intent (slides
> visible in the browser) while making images work correctly.

---

## Data Flow

```
Browser (textarea)
  → POST /api/generate { content: string }
  → [RequestHandler] validates input
  → writes content to input/content.md
  → Pipeline.run("input/", "slides/")
      → ContentGenerator → ImageGenerator → HTMLComposer
      → writes slides/slide-N.html + slides/assets/slide-N.jpg
  → reads fs listing of slides/*.html, sorted by slide number
  → responds { slides: ["/slides/slide-1.html", "/slides/slide-2.html", ...] }
  → Browser (iframe src="/slides/slide-N.html") ← served by express.static("slides/")
```

---

## Components

### Express App Factory (`src/server.ts`)
- **Responsibility:** Creates and configures the Express application. Registers middleware
  (JSON body parser, static file serving) and mounts the `/api/generate` route. Does NOT
  call `app.listen()` — that is the entry point's job (enables testing without port binding).
- **Input:** `apiKey: string` (passed in, not read from env here)
- **Output:** `express.Application`
- **Side Effects:** None (pure factory)
- **Testing Strategy:** Unit-tested via `supertest`. The `Pipeline` class is injected or
  mocked via jest so no real API calls are made.

### Generate Request Handler (inside `src/server.ts`)
- **Responsibility:** Handles `POST /api/generate`. Validates the `content` field,
  writes it to `input/content.md`, runs the pipeline, reads back the output HTML file
  paths, and returns `{ slides: string[] }` of URL paths.
- **Input:** `req.body: { content: string }`
- **Output:** `res.json({ slides: string[] })` on success; `res.status(400|500).json({ error: string })` on failure
- **Side Effects:** Writes to `input/` directory; reads from `slides/` directory; invokes `Pipeline.run()`
- **Validation rules:**
  - `content` field must be present → 400 if missing
  - `content` after `.trim()` must be non-empty → 400 if blank
- **Pipeline dependency:** `Pipeline` is instantiated with the injected `apiKey`.
  For tests, a mock constructor is injected via a factory parameter on the app factory.
- **Slide URL construction:** After pipeline completes, glob `slides/slide-*.html`,
  sort by slide number, map to `/slides/slide-N.html` URL paths.
- **Testing Strategy:** `supertest` + mocked `Pipeline`. Pipeline mock returns immediately;
  filesystem reads use real temp dirs or are mocked via `jest.spyOn(fs, ...)`.

### Server Entry Point (`src/server-entry.ts`)
- **Responsibility:** Loads `.env` via dotenv, validates `GEMINI_API_KEY`, reads `PORT`
  from env (default `3000`), creates the Express app, calls `app.listen()`.
- **Input:** `process.env.GEMINI_API_KEY`, `process.env.PORT`
- **Output:** Running HTTP server on configured port
- **Side Effects:** Reads env vars; binds network port; exits with code 1 on missing API key
- **Testing Strategy:** Not unit-tested directly. API key validation logic is covered by
  the entry-point startup scenario in the feature file (manual / integration only).

### Frontend UI (`frontend/index.html` + `frontend/main.js` + `frontend/styles.css`)
- **Responsibility:** Renders the textarea, Generate button, loading state, error display,
  iframe slide viewer, slide counter, and Prev/Next navigation.
- **Input:** User interaction (textarea content, button clicks)
- **Output:** DOM mutations — shows loading spinner, populates `<iframe src>`, updates counter
- **Side Effects:** Makes `fetch('POST /api/generate')` call; manipulates DOM
- **State managed in `main.js`:**
  - `slides: string[]` — URL array returned by the API
  - `currentIndex: number` — which slide is active
- **UI invariants (enforced via JS, no backend call):**
  - Generate button disabled + spinner shown while fetch is in-flight
  - Empty textarea → show inline validation message, no fetch
  - Prev disabled when `currentIndex === 0`
  - Next disabled when `currentIndex === slides.length - 1`
- **Testing Strategy:** No automated tests (vanilla JS, no test harness). Covered by
  Gherkin scenarios as manual acceptance tests.

---

## Static File Serving

| Route prefix | Directory served | Purpose |
|---|---|---|
| `/` | `frontend/` | Serves `index.html`, `main.js`, `styles.css` |
| `/slides/` | `slides/` | Serves generated `slide-N.html` + `assets/slide-N.jpg` |

Both are mounted via `express.static(...)` in the app factory.

---

## Shared Types (new, in `src/serverTypes.ts`)

```typescript
export interface GenerateRequest {
  content: string;
}

export interface GenerateResponse {
  slides: string[]; // URL paths, e.g. ["/slides/slide-1.html", ...]
}

export interface ErrorResponse {
  error: string;
}
```

---

## External Dependencies

| Package | Version constraint | Purpose |
|---|---|---|
| `express` | `^4.x` | HTTP server + static file serving + routing |
| `@types/express` | matching `^4.x` | TypeScript types for Express |
| `supertest` | `^6.x` | HTTP assertion in Jest tests |
| `@types/supertest` | matching `^6.x` | TypeScript types for supertest |

> All four are new packages. User approval was granted before planning began.

---

## File Structure

```text
src/
├── server.ts              # Express app factory + route handler
├── server.test.ts         # supertest BDD tests for api_server.feature
├── server-entry.ts        # Entry point: dotenv + listen
├── serverTypes.ts         # GenerateRequest / GenerateResponse / ErrorResponse
│
│   [existing — unchanged]
├── types.ts
├── geminiClient.ts
├── contentGenerator.ts
├── imageGenerator.ts
├── htmlComposer.ts
├── pipeline.ts
└── index.ts               # CLI entry point (unchanged)

frontend/
├── index.html             # App shell with textarea, buttons, iframe
├── main.js                # Fetch logic, DOM state machine, navigation
└── styles.css             # Layout, loading spinner, slide viewer styles

features/
├── api_server.feature     # [existing — do not modify]
├── web_frontend.feature   # [existing — do not modify]
│
│   [existing — unchanged]
├── content_generator.feature
├── image_generator.feature
└── html_composer.feature
```

---

## Testing Conventions

- **Framework:** Jest + ts-jest (existing config — no changes)
- **BDD mapping:** `features/api_server.feature` → `src/server.test.ts` using
  `jest-cucumber`'s `defineFeature(loadFeature(...))` pattern
- **HTTP testing:** `supertest` wraps the Express app (not a running server)
- **Pipeline mock:** `jest.mock('./pipeline')` — `Pipeline.prototype.run` returns `Promise<void>`.
  The test sets up a stub output directory with pre-written `slide-*.html` files to simulate
  what the real pipeline would produce.
- **Frontend scenarios:** Covered as manual acceptance tests (no automated JS test harness)

---

## npm Scripts Addition

```json
"start:server": "ts-node src/server-entry.ts"
```

Added to `package.json` `scripts` alongside the existing `build`, `test`, `test:watch`.

---

## `.env.example` (no change required)
```
GEMINI_API_KEY=your_api_key_here
PORT=3000
```
