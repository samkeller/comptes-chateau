<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/instructions/typescript-5-es2022.instructions.md -->
<!-- and: https://github.com/github/awesome-copilot/blob/main/instructions/reactjs.instructions.md -->
---
description: 'TypeScript standards for React frontend and Node backend in this repository'
applyTo: '**/*.ts, **/*.tsx'
---
# TypeScript Project Standards

Apply these rules to all TypeScript changes in this repository.

## Type Safety

- Keep strict typing at all boundaries: controller input, service output, and DTO mapping.
- Avoid `any`; use `unknown` with explicit narrowing when input shape is uncertain.
- Reuse existing interfaces from `react/src/interfaces` and backend DTO shapes before creating new types.
- Model nullable database values explicitly and handle them before rendering or returning API responses.

## Naming and Structure

- Use `PascalCase` for components, classes, and entity names.
- Use `camelCase` for variables, functions, and object properties.
- Keep domain naming consistent between frontend and backend for the same business concept.
- Prefer small focused modules over large multi-purpose files.

## Frontend Conventions

- Use functional React components with hooks.
- Keep display logic in components and move data-fetching logic to `react/src/services`.
- Prefer PrimeReact components before introducing custom UI building blocks.
- Always represent loading, error, and empty states explicitly in pages.

## Backend Conventions

- Keep controllers thin and delegate business behavior to `node/src/services`.
- Validate and sanitize request inputs at API boundaries.
- Handle async errors consistently with `try/catch` and return coherent API error responses.
- Keep TypeORM entity changes aligned with generated migrations only.

## Reliability and Quality

- Update tests when behavior changes in services, controllers, or critical UI flows.
- Keep functions focused and predictable, especially in financial calculations.
- Prefer explicit mappings from entities to API DTOs over implicit object spreading.
