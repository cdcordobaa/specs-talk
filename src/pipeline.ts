import { DefaultGeminiClient } from './geminiClient';
import { ContentGenerator } from './contentGenerator';
import { ImageGenerator } from './imageGenerator';
import { HTMLComposer } from './htmlComposer';
import { SlideDeck } from './types';

export class Pipeline {
  private contentGenerator: ContentGenerator;
  private imageGenerator: ImageGenerator;
  private htmlComposer: HTMLComposer;

  constructor(apiKey?: string) {
    // If apiKey is undefined, it attempts to use process.env.GEMINI_API_KEY
    const client = new DefaultGeminiClient(apiKey);
    this.contentGenerator = new ContentGenerator(client);
    this.imageGenerator = new ImageGenerator(client);
    this.htmlComposer = new HTMLComposer(client);
  }

  async run(inputFolder = 'input', outputFolder = 'slides'): Promise<void> {
    console.log(`Starting pipeline. Reading from: ${inputFolder}`);
    
    // Stage 1
    let deck: SlideDeck;
    try {
      console.log('--- Stage 1: Generating slide structuring and content...');
      deck = await this.contentGenerator.generateFromFolder(inputFolder);
      console.log(`Produced ${deck.slides.length} slides.`);
    } catch (err) {
      console.error('Pipeline failed in Stage 1 Content Generation.');
      throw err;
    }

    // Stage 2
    try {
      console.log('--- Stage 2: Generating images for slides...');
      deck = await this.imageGenerator.process(deck);
      console.log('Images successfully added/generated.');
    } catch (err) {
      console.error('Pipeline failed in Stage 2 Image Generation.');
      throw err;
    }

    // Stage 3
    try {
      console.log('--- Stage 3: Composing styled HTML...');
      await this.htmlComposer.renderDeck(deck, outputFolder);
      console.log(`Pipeline complete. Check the ${outputFolder}/ directory for output.`);
    } catch (err) {
      console.error('Pipeline failed in Stage 3 HTML Composition.');
      throw err;
    }
  }
}
