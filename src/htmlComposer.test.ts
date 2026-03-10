import { defineFeature, loadFeature } from 'jest-cucumber';
import { HTMLComposer } from './htmlComposer';
import { GeminiClient } from './geminiClient';
import { SlideDeck } from './types';
import * as fs from 'fs';
import * as path from 'path';

const feature = loadFeature('./features/html_composer.feature');

// Mock dependencies
jest.mock('fs', () => {
  const actualFs = jest.requireActual('fs');
  return {
    ...actualFs,
    existsSync: jest.fn().mockImplementation((p) => actualFs.existsSync(p)),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
  };
});

const GENERATED_HTML = '<html><body><h1>LLM Slide</h1></body></html>';

defineFeature(feature, (test) => {
  let htmlComposer: HTMLComposer;
  let mockGeminiClient: jest.Mocked<GeminiClient>;
  let inputDeck: SlideDeck;
  let executionError: Error | null;

  beforeEach(() => {
    mockGeminiClient = {
      generateContent: jest.fn(),
      generateImageBase64: jest.fn(),
    } as any;

    htmlComposer = new HTMLComposer(mockGeminiClient);
    executionError = null;
    jest.clearAllMocks();

    // Default mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockClear();
    (fs.writeFileSync as jest.Mock).mockClear();
  });

  test('Compose individual HTML files and external assets from a complete slide deck', ({ given, and, when, then }) => {
    given('a valid slide deck containing text content and base64 images', () => {
      inputDeck = {
        slides: [
          {
            title: "Slide 1",
            content: "First slide content",
            imagePrompt: "A sunset",
            imageDataBase64: "base64-img-1"
          },
          {
            title: "Slide 2",
            content: "Second slide content",
            imagePrompt: "A mountain",
            imageDataBase64: "base64-img-2"
          }
        ]
      };
    });

    and('a target "slides" output folder', () => {
      // Represented by the 'slides' passed as arg to renderDeck
    });

    and('a mocked Gemini client that returns designer HTML', () => {
      mockGeminiClient.generateContent.mockResolvedValue(GENERATED_HTML);
    });

    when('the HTML composer renders the deck', async () => {
      try {
        await htmlComposer.renderDeck(inputDeck, 'slides');
      } catch (err) {
        executionError = err as Error;
      }
    });

    then('it produces one HTML file in the "slides" folder for each slide', () => {
      expect(executionError).toBeNull();
      const htmlCalls = (fs.writeFileSync as jest.Mock).mock.calls.filter(call => (call[0] as string).endsWith('.html'));
      expect(htmlCalls.length).toBe(2);
      expect(htmlCalls[0][0]).toContain(path.normalize('slides/slide-1.html'));
      expect(htmlCalls[1][0]).toContain(path.normalize('slides/slide-2.html'));
    });

    and('it produces image files in a "slides/assets" subfolder', () => {
      const assetCalls = (fs.writeFileSync as jest.Mock).mock.calls.filter(call => (call[0] as string).includes(path.normalize('assets/')));
      expect(assetCalls.length).toBe(2);
      expect(assetCalls[0][0]).toContain(path.normalize('slides/assets/slide-1.jpg'));
      expect(assetCalls[1][0]).toContain(path.normalize('slides/assets/slide-2.jpg'));
    });

    and('each HTML file references its corresponding image via a relative path', () => {
      // Verify the Gemini prompt contained the correct relative image path
      expect(mockGeminiClient.generateContent).toHaveBeenCalledTimes(2);
      expect(mockGeminiClient.generateContent.mock.calls[0][0]).toContain('assets/slide-1.jpg');
      expect(mockGeminiClient.generateContent.mock.calls[1][0]).toContain('assets/slide-2.jpg');
    });

    and('each file contains the LLM-generated HTML content', () => {
      const htmlCalls = (fs.writeFileSync as jest.Mock).mock.calls.filter(call => (call[0] as string).endsWith('.html'));
      expect(htmlCalls[0][1]).toBe(GENERATED_HTML);
      expect(htmlCalls[1][1]).toBe(GENERATED_HTML);
    });
  });

  test('Compose HTML from a deck with no slides', ({ given, and, when, then }) => {
    given('an empty slide deck', () => {
      inputDeck = { slides: [] };
    });

    and('a mocked Gemini client that returns designer HTML', () => {
      mockGeminiClient.generateContent.mockResolvedValue(GENERATED_HTML);
    });

    when('the HTML composer renders the deck', async () => {
      try {
        await htmlComposer.renderDeck(inputDeck, 'slides');
      } catch (err) {
        executionError = err as Error;
      }
    });

    then('it produces a single index or placeholder HTML indicating no content', () => {
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
      const callArgs = (fs.writeFileSync as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toContain(path.normalize('slides/index.html'));
      expect(callArgs[1]).toContain('No slides available');
    });

    and('no individual slide files are created in the "slides" folder', () => {
      // Verified above — only one call total
    });

    and('the Gemini client is not called', () => {
      expect(mockGeminiClient.generateContent).not.toHaveBeenCalled();
    });
  });

  test('Render a slide with missing required fields', ({ given, and, when, then }) => {
    given('a slide deck containing a slide lacking a title or content', () => {
      inputDeck = {
        slides: [
          {
            title: "",
            content: ""
          }
        ]
      };
    });

    and('a mocked Gemini client that returns designer HTML', () => {
      mockGeminiClient.generateContent.mockResolvedValue(GENERATED_HTML);
    });

    when('the HTML composer renders the deck', async () => {
      try {
        await htmlComposer.renderDeck(inputDeck, 'slides');
      } catch (err) {
        executionError = err as Error;
      }
    });

    then('it throws a compilation error indicating missing required slide data', () => {
      expect(executionError).not.toBeNull();
      expect(executionError?.message).toContain('Missing required slide data');
    });

    and('the HTML generation process is aborted without writing invalid files', () => {
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  test('Fallback to static HTML if Gemini API fails during slide generation', ({ given, and, when, then }) => {
    given('a valid slide deck containing text content and base64 images', () => {
      inputDeck = {
        slides: [
          {
            title: "Slide 1",
            content: "First slide content",
            imageDataBase64: "base64-img-1"
          }
        ]
      };
    });

    and('a mocked Gemini client that is configured to fail', () => {
      mockGeminiClient.generateContent.mockRejectedValue(new Error('API unavailable'));
    });

    and('a target "slides" output folder', () => {
      // Represented by the 'slides' passed as arg to renderDeck
    });

    when('the HTML composer renders the deck', async () => {
      try {
        await htmlComposer.renderDeck(inputDeck, 'slides');
      } catch (err) {
        executionError = err as Error;
      }
    });

    then('it falls back to a static HTML template for the failed slide', () => {
      const htmlCalls = (fs.writeFileSync as jest.Mock).mock.calls.filter(call => (call[0] as string).endsWith('.html'));
      expect(htmlCalls.length).toBe(1);
      // Fallback HTML still contains the title
      expect(htmlCalls[0][1]).toContain('Slide 1');
    });

    and('the pipeline does not crash', () => {
      expect(executionError).toBeNull();
    });
  });
});
