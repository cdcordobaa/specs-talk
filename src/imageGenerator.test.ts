import { defineFeature, loadFeature } from 'jest-cucumber';
import { ImageGenerator } from './imageGenerator';
import { GeminiClient } from './geminiClient';
import { SlideDeck } from './types';

const feature = loadFeature('./features/image_generator.feature');

jest.mock('./geminiClient');

defineFeature(feature, (test) => {
  let imageGenerator: ImageGenerator;
  let mockGeminiClient: jest.Mocked<GeminiClient>;
  let inputDeck: SlideDeck;
  let outputDeck: SlideDeck;
  let executionError: Error | null;

  beforeEach(() => {
    mockGeminiClient = {
      generateContent: jest.fn(),
      generateImageBase64: jest.fn(),
    } as any;
    
    imageGenerator = new ImageGenerator(mockGeminiClient, 0);
    executionError = null;
    jest.clearAllMocks();
  });

  test('Successfully generate images from prompts', ({ given, when, then, and }) => {
    given('the Image Generator is configured with a mocked Gemini client', () => {
      // Configuration in beforeEach
    });

    given('a slide deck with slides containing valid image prompts', () => {
      inputDeck = {
        slides: [
          {
            title: "Slide 1",
            content: "Content 1",
            imagePrompt: "A beautiful sunset"
          },
          {
            title: "Slide 2",
            content: "Content 2",
            imagePrompt: "A shiny apple"
          }
        ]
      };
    });

    when('the image generator processes the slide deck', async () => {
      mockGeminiClient.generateImageBase64.mockImplementation(async (prompt: string) => {
        if (prompt === "A beautiful sunset") return "base64-sunset";
        if (prompt === "A shiny apple") return "base64-apple";
        return "base64-generic";
      });

      try {
        outputDeck = await imageGenerator.process(inputDeck);
      } catch (err) {
        executionError = err as Error;
      }
    });

    then('the Gemini API is called for each image prompt', () => {
      expect(mockGeminiClient.generateImageBase64).toHaveBeenCalledTimes(2);
      expect(mockGeminiClient.generateImageBase64).toHaveBeenCalledWith("A beautiful sunset");
      expect(mockGeminiClient.generateImageBase64).toHaveBeenCalledWith("A shiny apple");
    });

    and('each slide is updated with valid base64 image data', () => {
      expect(outputDeck.slides[0].imageDataBase64).toBe("base64-sunset");
      expect(outputDeck.slides[1].imageDataBase64).toBe("base64-apple");
    });
  });

  test('Generate image with missing or empty prompt', ({ given, when, then, and }) => {
    given('the Image Generator is configured with a mocked Gemini client', () => {});

    given('a slide deck with a slide containing an empty image prompt', () => {
      inputDeck = {
        slides: [
          {
            title: "Slide 1",
            content: "Content 1",
            imagePrompt: "" // empty
          }
        ]
      };
    });

    when('the image generator processes the slide deck', async () => {
      try {
        outputDeck = await imageGenerator.process(inputDeck);
      } catch (err) {
        executionError = err as Error;
      }
    });

    then('the Gemini API is not called for that slide', () => {
      expect(mockGeminiClient.generateImageBase64).not.toHaveBeenCalled();
    });

    and('the slide is assigned a default placeholder image', () => {
      expect(outputDeck.slides[0].imageDataBase64).toBeDefined();
      expect(outputDeck.slides[0].imageDataBase64).toContain('placeholder');
    });
  });

  test('Handle Gemini API failure gracefully', ({ given, when, then, and, but }) => {
    given('the Image Generator is configured with a mocked Gemini client', () => {});

    given('a slide deck with slides containing valid image prompts', () => {
      inputDeck = {
        slides: [
          {
            title: "Slide 1",
            content: "Content 1",
            imagePrompt: "A beautiful sunset"
          }
        ]
      };
    });

    but('the mocked Gemini API is configured to simulate a timeout or failure', () => {
      mockGeminiClient.generateImageBase64.mockRejectedValue(new Error('Network timeout'));
    });

    when('the image generator processes the slide deck', async () => {
      try {
        outputDeck = await imageGenerator.process(inputDeck);
      } catch (err) {
        executionError = err as Error;
      }
    });

    then('the slide is assigned a graceful fallback placeholder image', () => {
      expect(outputDeck.slides[0].imageDataBase64).toBeDefined();
      expect(outputDeck.slides[0].imageDataBase64).toContain('placeholder');
    });

    and('the error is logged without crashing the entire pipeline', () => {
      expect(executionError).toBeNull();
    });
  });
});
