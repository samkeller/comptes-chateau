<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/instructions/nodejs-javascript-vitest.instructions.md -->
<!-- and: https://github.com/github/awesome-copilot/blob/main/instructions/typescript-5-es2022.instructions.md -->
---
description: 'Testing standards for Node and React applications using Vitest'
applyTo: '**/*.{test,spec}.ts, **/*.{test,spec}.tsx, node/src/**/*.ts, react/src/**/*.ts, react/src/**/*.tsx'
---
# Testing Standards

## Scope

- Add or update tests for every behavior change in controllers, services, and critical UI flows.
- Prioritize business rules, financial computations, and data transformation logic.
- Cover happy path, edge cases, and error handling for each changed unit.

## Backend Testing

- Keep service tests deterministic and isolate side effects with mocks or test fixtures.
- Validate controller responses for status codes and response shape consistency.
- Use integration tests for routes that involve multiple layers.
- Verify date-sensitive behavior and recurring-expense logic with stable, explicit test data.

## Frontend Testing

- Test user-visible behavior rather than component internals.
- Verify loading, error, and empty states for data-driven screens.
- Mock network calls in a consistent way across test files.
- Include tests for form validation rules and navigation-critical interactions.

## Test Quality

- Keep test names descriptive and outcome-focused.
- Avoid flaky assertions tied to timing assumptions.
- Keep fixtures minimal, readable, and aligned with domain semantics.
- Ensure new tests fail for the right reason before fixing implementation.

## Execution Expectations

- Run targeted tests for touched areas before broad test runs.
- Keep test files close to related code or in the established project test locations.
- Do not change production logic only to simplify tests.
