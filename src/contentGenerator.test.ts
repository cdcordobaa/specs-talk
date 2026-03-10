import { defineFeature, loadFeature } from 'jest-cucumber';
import { ContentGenerator } from './contentGenerator';
import { GeminiClient } from './geminiClient';
import * as fs from 'fs';
import * as path from 'path';

const feature = loadFeature('./features/content_generator.feature');

// Mock dependencies
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockImplementation((path) => actualFs.existsSync(path)),
    readdirSync: jest.fn().mockImplementation((path) => actualFs.readdirSync(path)),
    readFileSync: jest.fn().mockImplementation((path, options) => actualFs.readFileSync(path, options)),
  };
});
jest.mock('./geminiClient');

defineFeature(feature, (test) => {
  let contentGenerator: ContentGenerator;
  let mockGeminiClient: jest.Mocked<GeminiClient>;
  let resultDeck: any;
  let executionError: Error | null;

  beforeEach(() => {
    mockGeminiClient = {
      generateContent: jest.fn(),
      generateImageBase64: jest.fn(),
    } as any;
    
    // Override mocked fs for tests
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readdirSync as jest.Mock).mockReturnValue(['presentation.md']);
    (fs.readFileSync as jest.Mock).mockReturnValue('# Title\nSome content for the slide');

    contentGenerator = new ContentGenerator(mockGeminiClient);
    resultDeck = null;
    executionError = null;
    jest.clearAllMocks();
  });

  test('Generate structured slide deck from valid markdown files', ({ given, when, then, and }) => {
    given('the Content Generator is configured with a mocked Gemini client', () => {
      // Configuration handled in beforeEach
    });

    and('an "input" folder exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    given('the "input" folder contains one or more valid markdown files', () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['presentation.md']);
      (fs.readFileSync as jest.Mock).mockReturnValue('# Title\nSome content for the slide');
    });

    when('the generator reads the folder and calls the Gemini API to process the content', async () => {
      // Mock Gemini successful response
      mockGeminiClient.generateContent.mockResolvedValue(JSON.stringify({
        slides: [
          {
            title: "Title",
            content: "Some content for the slide",
            speakerNotes: "Speak energetically",
            imagePrompt: "A happy presentation"
          }
        ]
      }));

      try {
        resultDeck = await contentGenerator.generateFromFolder('input');
      } catch (err) {
        executionError = err as Error;
      }
    });

    then('it produces a structured slide deck containing multiple slides', () => {
      expect(executionError).toBeNull();
      expect(resultDeck).toBeDefined();
      expect(resultDeck.slides).toBeDefined();
      expect(resultDeck.slides.length).toBeGreaterThan(0);
    });

    and('each slide includes a title, content body, and speaker notes', () => {
      expect(resultDeck.slides[0].title).toBe("Title");
      expect(resultDeck.slides[0].content).toBeDefined();
      expect(resultDeck.slides[0].speakerNotes).toBeDefined();
    });

    and('each slide includes an image prompt field describing a visual', () => {
      expect(resultDeck.slides[0].imagePrompt).toBeDefined();
    });
  });

  test('Handle Gemini API failure gracefully during text generation', ({ given, when, then, and, but }) => {
    given('the Content Generator is configured with a mocked Gemini client', () => {
      // Configuration handled in beforeEach
    });

    and('an "input" folder exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
    });

    given('the "input" folder contains valid markdown files', () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(['presentation.md']);
      (fs.readFileSync as jest.Mock).mockReturnValue('# Title\nSome content for the slide');
    });

    but('the mocked Gemini API is configured to simulate a timeout or failure', () => {
      mockGeminiClient.generateContent.mockRejectedValue(new Error('API Timeout'));
    });

    when('the generator attempts to process the content', async () => {
      try {
        resultDeck = await contentGenerator.generateFromFolder('input');
      } catch (err) {
        executionError = err as Error;
      }
    });

    then('it throws a generation error indicative of an external API failure', () => {
      expect(executionError).not.toBeNull();
      expect(executionError?.message).toContain('API Timeout');
    });

    and('the pipeline execution is halted gracefully', () => {
      expect(resultDeck).toBeNull();
    });
  });
});
