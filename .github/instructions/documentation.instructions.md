<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/instructions/typescript-5-es2022.instructions.md -->
<!-- and: https://github.com/github/awesome-copilot/blob/main/instructions/go.instructions.md -->
---
description: 'Documentation requirements for code, APIs, and project changes'
applyTo: '**/*.md, node/src/**/*.ts, react/src/**/*.ts, react/src/**/*.tsx'
---
# Documentation Standards

## General Rules

- Keep documentation concise, accurate, and synchronized with the current behavior.
- Update docs in the same change set when APIs, commands, or flows change.
- Prefer clear domain language over implementation jargon.

## Code Documentation

- Add comments only when intent is not obvious from code structure and naming.
- Document public service methods and controller behaviors when they enforce business rules.
- Clarify non-obvious assumptions for date handling, recurring operations, and financial calculations.

## Project Documentation

- Keep setup and run commands aligned with actual package scripts.
- Document configuration expectations and environment prerequisites.
- Track meaningful architectural decisions in `docs/` when introducing new patterns.

## API and Contract Changes

- Document request/response contract changes when backend DTOs evolve.
- Ensure frontend and backend references stay aligned for shared domain shapes.
- Describe migration impact clearly when schema changes are introduced.
