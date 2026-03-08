<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/instructions/code-review-generic.instructions.md -->
---
description: 'Code review standards and pull request quality gates'
applyTo: '**/*.{ts,tsx,js,jsx,md,yml,yaml,json}'
---
# Code Review Standards

## Review Priorities

- Critical first: security issues, correctness bugs, data corruption risk, and breaking contract changes.
- Important second: missing test coverage, performance regressions, and architecture drift.
- Suggestions third: readability improvements and non-blocking refactors.

## Correctness and Domain Safety

- Verify business rules remain consistent for budgets, operations, recurring expenses, and dashboard aggregates.
- Confirm date and timezone handling is explicit and stable.
- Check that entity-to-DTO mappings preserve expected API contracts.

## Backend Review Checklist

- Controllers stay thin and defer business logic to services.
- Inputs are validated and errors are handled consistently.
- Database interactions are safe, typed, and avoid hidden side effects.
- Schema-impacting changes are accompanied by TypeORM CLI migration updates.

## Frontend Review Checklist

- Pages handle loading, error, and empty states explicitly.
- PrimeReact usage is consistent and avoids unnecessary custom components.
- Data-fetching concerns stay in services or dedicated helpers.
- UI changes preserve accessibility and responsive behavior.

## Testing and Quality Gates

- New or changed behavior has relevant unit/integration tests.
- Tests are deterministic and cover failure cases.
- Build and test commands relevant to changed areas pass before merge.
- Documentation is updated when behavior or contracts change.
