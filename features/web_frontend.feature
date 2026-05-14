Feature: Web Frontend — Slide Generation UI

  A plain HTML/JS interface where a user pastes documentation content, triggers
  AI slide generation, and previews the resulting slides in the browser.

  Background:
    Given the user has the slide generation web app open in a browser

  Scenario: User generates slides from pasted content
    Given the user has pasted markdown content into the textarea
    When the user clicks the "Generate" button
    Then a loading indicator is shown
    And the "Generate" button is disabled during generation
    And when generation completes, the first slide is displayed in the preview area

  Scenario: User navigates between generated slides
    Given slides have been successfully generated
    When the user clicks the "Next" button
    Then the next slide is displayed in the preview area
    And the slide counter shows the current slide number out of total

  Scenario: User navigates to the previous slide
    Given slides have been generated and the user is viewing slide 2 or later
    When the user clicks the "Previous" button
    Then the previous slide is displayed

  Scenario: Previous button is disabled on the first slide
    Given slides have been generated and the user is viewing the first slide
    Then the "Previous" button is disabled

  Scenario: Next button is disabled on the last slide
    Given slides have been generated and the user is viewing the last slide
    Then the "Next" button is disabled

  Scenario: Error during generation is shown to the user
    Given the user has pasted content into the textarea
    When the server returns an error response
    Then an error message is displayed to the user
    And the "Generate" button is re-enabled

  Scenario: Empty textarea submission is prevented
    Given the textarea is empty
    When the user clicks the "Generate" button
    Then a validation message is shown asking the user to enter content
    And no API request is made
