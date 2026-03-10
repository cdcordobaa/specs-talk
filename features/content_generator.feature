Feature: Content Generator Stage

  As a pipeline stage
  I want to process markdown files from an input folder using an LLM (Gemini)
  So that I can produce a structured slide deck object intelligently

  Background:
    Given the Content Generator is configured with a mocked Gemini client
    And an "input" folder exists

  Scenario: Generate structured slide deck from valid markdown files
    Given the "input" folder contains one or more valid markdown files
    When the generator reads the folder and calls the Gemini API to process the content
    Then it produces a structured slide deck containing multiple slides
    And each slide includes a title, content body, and speaker notes
    And each slide includes an image prompt field describing a visual

  Scenario: Handle Gemini API failure gracefully during text generation
    Given the "input" folder contains valid markdown files
    But the mocked Gemini API is configured to simulate a timeout or failure
    When the generator attempts to process the content
    Then it throws a generation error indicative of an external API failure
    And the pipeline execution is halted gracefully
