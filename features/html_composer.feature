Feature: HTML Composer Stage

  As a pipeline stage
  I want to render a slide deck with images into individual HTML files
  So that the presentation can be displayed in a browser slide-by-slide

  Scenario: Compose individual HTML files and external assets from a complete slide deck
    Given a valid slide deck containing text content and base64 images
    And a target "slides" output folder
    And a mocked Gemini client that returns designer HTML
    When the HTML composer renders the deck
    Then it produces one HTML file in the "slides" folder for each slide
    And it produces image files in a "slides/assets" subfolder
    And each HTML file references its corresponding image via a relative path
    And each file contains the LLM-generated HTML content

  Scenario: Compose HTML from a deck with no slides
    Given an empty slide deck
    And a mocked Gemini client that returns designer HTML
    When the HTML composer renders the deck
    Then it produces a single index or placeholder HTML indicating no content
    And no individual slide files are created in the "slides" folder
    And the Gemini client is not called

  Scenario: Render a slide with missing required fields
    Given a slide deck containing a slide lacking a title or content
    And a mocked Gemini client that returns designer HTML
    When the HTML composer renders the deck
    Then it throws a compilation error indicating missing required slide data
    And the HTML generation process is aborted without writing invalid files

  Scenario: Fallback to static HTML if Gemini API fails during slide generation
    Given a valid slide deck containing text content and base64 images
    And a mocked Gemini client that is configured to fail
    And a target "slides" output folder
    When the HTML composer renders the deck
    Then it falls back to a static HTML template for the failed slide
    And the pipeline does not crash
