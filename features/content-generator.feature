Feature: Content Generator
  As a presenter
  I want to convert Markdown files from the input/ folder into a structured slide deck
  So that I have a machine-readable JSON representation ready for the rest of the pipeline

  Background:
    Given a mocked GeminiClient is available
    And the CONTENT_GENERATION_PROMPT constant is defined in ContentGenerator

  Scenario: Generating slides from multiple Markdown files
    Given the input/ folder contains two Markdown files with combined content
    When the Content Generator runs
    Then it sends the combined Markdown content to the Gemini text model
    And it returns an array of Slide objects each with title, content, speakerNotes, and imagePrompt

  Scenario: LLM response wrapped in markdown fences is cleaned before parsing
    Given the input/ folder contains a Markdown file
    And the Gemini text model returns a response wrapped in ```json fences
    When the Content Generator runs
    Then the markdown fences are stripped from the response
    And the cleaned JSON is parsed into a valid Slide array

  Scenario: Single Markdown file produces a valid slide deck
    Given the input/ folder contains exactly one Markdown file
    When the Content Generator runs
    Then it returns at least one Slide object

  Scenario: Empty input folder produces an error
    Given the input/ folder contains no Markdown files
    When the Content Generator runs
    Then it throws an error indicating no input files were found
