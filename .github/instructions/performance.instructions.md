<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/instructions/typescript-5-es2022.instructions.md -->
<!-- and: https://github.com/github/awesome-copilot/blob/main/instructions/reactjs.instructions.md -->
---
description: 'Performance and reliability guidelines for frontend and backend changes'
applyTo: '**/*.ts, **/*.tsx'
---
# Performance Guidelines

## Backend Performance

- Keep database access efficient and avoid unnecessary repeated queries.
- Favor explicit query filtering and pagination for list endpoints.
- Keep CPU-heavy transformations out of hot request paths when possible.
- Ensure background jobs are idempotent and safe to retry.

## Frontend Performance

- Keep initial page rendering lightweight and defer non-critical work.
- Minimize unnecessary re-renders by keeping state local and focused.
- Use route-level or feature-level lazy loading when adding heavy screens.
- Keep charts and large tables responsive by controlling data volume.

## Reliability

- Handle transient failures with clear user feedback and safe fallbacks.
- Avoid silent failures; propagate errors with actionable context.
- Keep asynchronous flows cancellable or guarded against stale state updates.

## Measurement Mindset

- Prefer targeted profiling before applying optimization changes.
- Include performance impact in review notes for significant refactors.
- Preserve readability while optimizing; avoid premature micro-optimizations.
