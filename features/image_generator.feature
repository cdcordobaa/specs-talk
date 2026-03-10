Feature: Image Generator Stage

  As a pipeline stage
  I want to generate images for slides using the Gemini API
  So that the presentation has AI-generated visuals complementing the text

  Background:
    Given the Image Generator is configured with a mocked Gemini client

  Scenario: Successfully generate images from prompts
    Given a slide deck with slides containing valid image prompts
    When the image generator processes the slide deck
    Then the Gemini API is called for each image prompt
    And each slide is updated with valid base64 image data

  Scenario: Generate image with missing or empty prompt
    Given a slide deck with a slide containing an empty image prompt
    When the image generator processes the slide deck
    Then the Gemini API is not called for that slide
    And the slide is assigned a default placeholder image

  Scenario: Handle Gemini API failure gracefully
    Given a slide deck with slides containing valid image prompts
    But the mocked Gemini API is configured to simulate a timeout or failure
    When the image generator processes the slide deck
    Then the slide is assigned a graceful fallback placeholder image
    And the error is logged without crashing the entire pipeline
