Feature: HTML Composer
  As a presenter
  I want each slide assembled into a stunning self-contained HTML file with its image
  So that I can open the slides directory in a browser and present immediately

  Background:
    Given a mocked GeminiClient is available
    And a mocked file system is available
    And the HTML_GENERATION_PROMPT constant is defined in HTMLComposer

  Scenario: Composing an HTML slide with a generated image
    Given a SlideWithImage with title, content, speakerNotes, imageBase64, and imagePrompt
    When the HTML Composer processes the slide at index 0
    Then it saves the image as slides/assets/slide-0.jpg
    And it calls generateContent with a prompt referencing the relative path assets/slide-0.jpg
    And it writes the resulting HTML to slides/slide-0.html

  Scenario: The image is referenced via relative path in the generated HTML
    Given a SlideWithImage at index 1
    And generateContent returns a valid HTML document
    When the HTML Composer processes the slide
    Then the written HTML file does not contain any base64 data URI
    And the written HTML file references the image via assets/slide-1.jpg

  Scenario: LLM response wrapped in markdown fences is cleaned before writing
    Given a SlideWithImage at index 0
    And generateContent returns an HTML response wrapped in ```html fences
    When the HTML Composer processes the slide
    Then the markdown fences are stripped from the response before writing the file

  Scenario: HTML generation failure falls back to a static template
    Given a SlideWithImage at index 2
    And generateContent throws an error
    When the HTML Composer processes the slide
    Then it logs the error to console.error
    And it writes a static fallback HTML file that displays the slide title and content
    And the fallback HTML still references assets/slide-2.jpg

  Scenario: Full deck of three slides produces three HTML files and three image files
    Given a SlideWithImage array with three entries
    When the HTML Composer processes all slides
    Then it writes three .html files to slides/
    And it writes three .jpg files to slides/assets/
