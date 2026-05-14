Feature: API Server — Slide Generation Endpoint

  The Express API server exposes a POST /api/generate endpoint that accepts raw markdown
  content, runs the 3-stage pipeline, and returns generated HTML slides.

  Background:
    Given the server is running with a valid GEMINI_API_KEY

  Scenario: Successful slide generation from valid content
    Given the user submits a POST request to "/api/generate" with valid markdown content
    When the pipeline completes successfully
    Then the response status is 200
    And the response body contains a "slides" array with at least one HTML string
    And each HTML string is a complete HTML document

  Scenario: Empty content is rejected
    Given the user submits a POST request to "/api/generate" with an empty "content" field
    Then the response status is 400
    And the response body contains an "error" field

  Scenario: Missing content field is rejected
    Given the user submits a POST request to "/api/generate" with no "content" field
    Then the response status is 400
    And the response body contains an "error" field

  Scenario: Pipeline failure returns a server error
    Given the user submits a POST request to "/api/generate" with valid markdown content
    When the pipeline throws an unexpected error
    Then the response status is 500
    And the response body contains an "error" field

  Scenario: Server refuses to start without API key
    Given the GEMINI_API_KEY environment variable is not set
    When the server attempts to start
    Then the server exits with a non-zero exit code
    And an error message indicating the missing API key is printed to stderr
