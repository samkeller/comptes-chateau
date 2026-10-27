---
name: refactor-code
description: 'Refactor code safely while preserving behavior and project conventions'
disable-model-invocation: true
---
# Refactor Code

## Mission

Improve structure and maintainability without changing external behavior.

## Inputs

- Refactor target (file/module/feature)
- Motivation (readability, duplication, complexity, performance)
- Non-negotiable constraints

## Workflow

1. Capture the current behavior and impacted boundaries.
2. Keep changes incremental and focused.
3. Preserve API contracts and data shapes.
4. Update tests and documentation when needed.
5. Validate that architecture boundaries remain respected.

## Output Expectations

- Refactor summary with impacted files.
- Confirmed invariants and preserved behavior.
- Risks and suggested follow-up tasks.
