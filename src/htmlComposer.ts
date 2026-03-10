import * as fs from 'fs';
import * as path from 'path';
import { GeminiClient } from './geminiClient';
import { SlideDeck, Slide } from './types';

// ─── Canonical HTML Generation Prompt (version-controlled here) ─────────────
export const HTML_GENERATION_PROMPT = `
You are a world-class presentation designer who writes stunning, self-contained HTML slides.

You will receive a single slide's structured data and an image path. Your task is to produce
a complete, beautiful, production-ready HTML file for that slide.

Design principles you MUST follow:
1. Modern aesthetics: rich dark or vivid color palettes, clean sans-serif typography
   (load from Google Fonts — e.g. Inter, Outfit, or Playfair Display), smooth gradients,
   generous whitespace.
2. Creative image integration: do NOT just place the image below the text. Choose one of
   these layouts creatively based on the content mood:
   - Full-bleed background with text overlay and a dark/gradient scrim
   - Split-pane: image fills one half, content on the other with a contrasting panel
   - Hero image at top with bold headline and colored accent strip below
   - Floating inset card positioned over the image with glassmorphism effect
   - Image as a textured left-side accent strip, content fills the right
3. The slide must feel like a premium conference presentation — polished typography,
   intentional spacing, clear visual hierarchy. NOT a basic webpage.
4. Include subtle CSS animations (fade-in on load, slide-up on headline) for polish.
5. The image must use the EXACT relative path provided — do NOT use placeholders or
   data URIs.
6. Make the slide fill the full viewport (100vw × 100vh).
7. Output ONLY the raw HTML document. No markdown code fences, no explanation text.

Slide data:
- Title: {{TITLE}}
- Content: {{CONTENT}}
- Speaker Notes (context only, do NOT display on slide): {{SPEAKER_NOTES}}
- Image path: {{IMAGE_PATH}}
- Slide number: {{SLIDE_NUM}} of {{TOTAL_SLIDES}}
`.trim();

export class HTMLComposer {
  private client: GeminiClient;

  constructor(client: GeminiClient) {
    this.client = client;
  }

  async renderDeck(deck: SlideDeck, outDir: string): Promise<void> {
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const assetsDir = path.join(outDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    if (deck.slides.length === 0) {
      fs.writeFileSync(path.join(outDir, 'index.html'), this.renderEmptyTemplate(), 'utf-8');
      return;
    }

    for (let i = 0; i < deck.slides.length; i++) {
      const slide = deck.slides[i];
      if (!slide.title || !slide.content) {
        throw new Error("Missing required slide data: title and content are mandatory.");
      }

      const slideNum = i + 1;
      const totalSlides = deck.slides.length;

      // 1. Save image asset
      let relativeImagePath: string | undefined;
      if (slide.imageDataBase64) {
        const imageName = `slide-${slideNum}.jpg`;
        const buffer = Buffer.from(slide.imageDataBase64, 'base64');
        fs.writeFileSync(path.join(assetsDir, imageName), buffer);
        relativeImagePath = `assets/${imageName}`;
      }

      // 2. Build prompt with injected values
      const prompt = HTML_GENERATION_PROMPT
        .replace('{{TITLE}}', slide.title)
        .replace('{{CONTENT}}', slide.content)
        .replace('{{SPEAKER_NOTES}}', slide.speakerNotes ?? '')
        .replace('{{IMAGE_PATH}}', relativeImagePath ?? 'assets/placeholder.jpg')
        .replace('{{SLIDE_NUM}}', String(slideNum))
        .replace('{{TOTAL_SLIDES}}', String(totalSlides));

      // 3. Call LLM, fall back to static template on failure
      let html: string;
      try {
        html = await this.client.generateContent(prompt);
        // Strip markdown fences if the model wraps output despite instructions
        html = html.trim();
        if (html.startsWith('```')) {
          html = html.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
        }
      } catch (err) {
        console.error(`[HTMLComposer] LLM generation failed for slide ${slideNum}, using fallback.`, err);
        html = this.renderFallbackTemplate(slide, slideNum, totalSlides, relativeImagePath);
      }

      // 4. Write HTML file
      fs.writeFileSync(path.join(outDir, `slide-${slideNum}.html`), html, 'utf-8');
    }
  }

  private renderEmptyTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Presentation deck</title></head>
<body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;background:#111;color:#fff;">
  <p>No slides available</p>
</body>
</html>`;
  }

  private renderFallbackTemplate(slide: Slide, slideNum: number, totalSlides: number, imagePath?: string): string {
    const imgHtml = imagePath ? `<img src="${imagePath}" alt="${slide.imagePrompt ?? 'Slide image'}" style="max-width:100%;border-radius:8px;margin-top:1rem;" />` : '';
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${slide.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #0f172a; color: #e2e8f0; height: 100vh; display: flex; align-items: center; justify-content: center; }
    .slide { max-width: 860px; padding: 3rem; }
    h1 { font-size: 2.8rem; font-weight: 700; color: #f1f5f9; margin-bottom: 1.5rem; }
    .content { font-size: 1.2rem; line-height: 1.8; color: #94a3b8; }
    .footer { margin-top: 2rem; font-size: 0.85rem; color: #475569; }
  </style>
</head>
<body>
  <section class="slide">
    <h1>${slide.title}</h1>
    <div class="content">${slide.content}</div>
    ${imgHtml}
    <div class="footer">Slide ${slideNum} of ${totalSlides}</div>
  </section>
</body>
</html>`;
  }
}
