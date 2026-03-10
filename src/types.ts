export interface Slide {
  title: string;
  content: string; // bullet points or body text
  speakerNotes?: string;
  imagePrompt?: string;
  imageDataBase64?: string; // Populated by Image Generator
}

export interface SlideDeck {
  slides: Slide[];
}
