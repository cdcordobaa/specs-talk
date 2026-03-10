Feature: Image Generator
  As a presenter
  I want each slide's imagePrompt to be turned into a base64-encoded image
  So that the HTML Composer has a visual asset to integrate into each slide

  Background:
    Given a mocked GeminiClient is available
    And the Image Generator is configured with a delayMs of 0 for testing

  Scenario: Generating an image for each slide
    Given a slide deck with three slides each having an imagePrompt
    When the Image Generator runs
    Then it calls generateImageBase64 once per slide
    And it returns a SlideWithImage array where each entry has a non-empty imageBase64 string

  Scenario: A delay is applied between successive image generation calls
    Given a slide deck with two slides
    And the Image Generator is configured with a delayMs of 100
    When the Image Generator runs
    Then it waits at least 100ms before generating the second image

  Scenario: Image generation failure falls back to a placeholder
    Given a slide deck with two slides
    And generateImageBase64 throws an error for the second slide
    When the Image Generator runs
    Then it logs the error to console.error
    And it uses a placeholder base64 string for the failed slide
    And it still returns a complete SlideWithImage array with two entries

  Scenario: Single-slide deck generates exactly one image
    Given a slide deck with one slide
    When the Image Generator runs
    Then generateImageBase64 is called exactly once
    And the result contains one SlideWithImage entry
