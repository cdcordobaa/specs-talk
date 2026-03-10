import { GeminiClient } from './geminiClient';
import { SlideDeck } from './types';

export class ImageGenerator {
  private client: GeminiClient;
  
  // A simple base64 placeholder (1x1 transparent pixel or similar) 
  // For demonstration, just using a string indicating it's a placeholder.
  private readonly PLACEHOLDER_BASE64 = 'base64-placeholder-image-data';

  private delayMs: number;

  constructor(client: GeminiClient, delayMs: number = 6100) {
    this.client = client;
    this.delayMs = delayMs;
  }

  async process(deck: SlideDeck): Promise<SlideDeck> {
    const outputDeck: SlideDeck = { slides: [] };

    for (const slide of deck.slides) {
      // Clone the slide so we don't mutate the input directly if not desired
      const newSlide = { ...slide };

      if (!newSlide.imagePrompt || newSlide.imagePrompt.trim() === '') {
        newSlide.imageDataBase64 = this.PLACEHOLDER_BASE64;
      } else {
        // Sleep if necessary to avoid free tier limits (10 RPM)
        if (this.delayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, this.delayMs));
        }
        
        try {
          const base64 = await this.client.generateImageBase64(newSlide.imagePrompt);
          newSlide.imageDataBase64 = base64;
        } catch (error) {
          console.error("Failed to generate image:", error);
          newSlide.imageDataBase64 = this.PLACEHOLDER_BASE64;
        }
      }

      outputDeck.slides.push(newSlide);
    }

    return outputDeck;
  }
}
