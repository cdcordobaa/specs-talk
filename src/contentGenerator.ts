import * as fs from 'fs';
import * as path from 'path';
import { GeminiClient } from './geminiClient';
import { SlideDeck } from './types';

export class ContentGenerator {
  private client: GeminiClient;

  constructor(client: GeminiClient) {
    this.client = client;
  }

  async generateFromFolder(folderPath: string): Promise<SlideDeck> {
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Folder ${folderPath} does not exist`);
    }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md'));
    let combinedContent = '';

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      combinedContent += fs.readFileSync(filePath, 'utf-8') + '\n\n';
    }

    const prompt = `
You are an expert presentation generator. I will provide raw notes or markdown content. 
Generate a complete, structured slide deck from this content. 
For each slide, you must provide:
- title: A short presentation title
- content: Bullet points or body text
- speakerNotes: Notes for the speaker
- imagePrompt: A detailed prompt describing an image that visually complements the slide content.

Output strictly as JSON matching this format:
{
  "slides": [
    {
      "title": "...",
      "content": "...",
      "speakerNotes": "...",
      "imagePrompt": "..."
    }
  ]
}

Raw content:
${combinedContent}
    `;

    try {
      const response = await this.client.generateContent(prompt);
      
      // Attempt to clean JSON (e.g., if LLM adds ```json block)
      let cleanedJson = response.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
      }

      const deck: SlideDeck = JSON.parse(cleanedJson);
      return deck;

    } catch (err: any) {
      throw new Error(`External API failure during slide generation: ${err.message}`);
    }
  }
}
