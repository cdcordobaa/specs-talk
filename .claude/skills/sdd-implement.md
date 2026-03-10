# Skill: SDD Implement (TDD)

## When to use
Use this skill AFTER the `sdd-tasks` phase is complete (i.e., `task.md` exists with unchecked items). This is Phase 4 of the SDD Pipeline.

## Purpose
Implement each task using strict **Test-Driven Development** (Red → Green → Refactor).

## Inputs
- `task.md` — Pick the next unchecked `- [ ]` task
- `features/*.feature` — The Gherkin scenarios that define expected behavior
- `plan.md` — The architecture and interfaces to follow

## Outputs
- Implementation code in `src/`
- Test files (either jest-cucumber step definitions or unit tests)
- Updated `task.md` with completed items marked `- [x]`

## The TDD Cycle

### 1. RED — Write Failing Tests First
- Read the Gherkin scenario(s) relevant to the current task
- Write test code that asserts the expected behavior
- Run `npm test` — tests MUST fail
- If tests pass before you write implementation, something is wrong — investigate

**What the failure tells you:**
- Module not found → Create the file
- Function not found → Export the function
- Assertion failed → Implement the logic

### 2. GREEN — Write Minimal Implementation
- Write the **minimum** code in `src/` to make failing tests pass
- Do NOT:
  - Add functionality beyond what the specs require
  - Anticipate future requirements
  - Add convenience methods or "nice to have" logic
  - Modify feature files or test files to make them pass
- Run `npm test` — ALL tests must pass

### 3. REFACTOR — Clean Up
- Only after GREEN
- Improve code quality: extract functions, rename variables, reduce duplication
- Run `npm test` after every refactoring change
- If tests go RED during refactoring, **undo the last change**

## Mocking External Dependencies

When implementing stages that call external services (e.g., the Image Generator calling Gemini):

### Mock Rules
- LLM / image generation calls are **ALWAYS mocked** in tests
- Use `jest.mock()` to replace the service module
- The mock should:
  - **Record** the prompts/inputs it receives (for assertion)
  - **Return** configurable canned responses (e.g., a base64 image string)
  - **Be configurable** to simulate failure (for error scenarios)
- **NEVER** call a real API during test runs

### Mock Example Pattern (for Gemini image generation)
```typescript
// In test file
jest.mock('../src/image-generator-service');
import { generateImage } from '../src/image-generator-service';

const mockGenerateImage = generateImage as jest.MockedFunction<typeof generateImage>;

// Happy path
mockGenerateImage.mockResolvedValue({
  imageData: 'base64-encoded-image-data...',
  mimeType: 'image/png'
});

// Failure path
mockGenerateImage.mockRejectedValue(new Error('API unavailable'));
```

### Real Implementation Reference (Gemini @google/genai)
When implementing the REAL service (not the mock), use this pattern:
```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash-exp",
  contents: prompt,
});

// Extract image from response
for (const part of response.candidates[0].content.parts) {
  if (part.inlineData) {
    const imageData = part.inlineData.data; // base64 string
    const mimeType = part.inlineData.mimeType;
  }
}
```

## Updating task.md
- Before starting a task, mark it `- [/]` (in progress)
- After all tests pass, mark it `- [x]` (complete)
- If you discover a missing task, add it to `task.md` before implementing it

## Rules
- NEVER write implementation code without a failing test
- NEVER modify `.feature` files or test files to make them pass
- NEVER skip RED. If tests already pass, investigate why.
- If a test failure reveals a spec problem, STOP and use the `sdd-iterate` skill instead
- One task at a time. Finish it. Mark it done. Then move to the next.
