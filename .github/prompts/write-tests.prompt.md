<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/instructions/prompt.instructions.md -->
---
agent: 'agent'
model: GPT-5.3-Codex
tools: ['codebase', 'search', 'findTestFiles']
description: 'Generate or update tests for changed behavior in frontend or backend'
---
# Write Tests

## Mission

Generate focused tests that validate changed behavior and prevent regressions.

## Inputs

- Target file(s) or feature
- Scope (`unit`, `integration`, or both)
- Critical edge cases

If scope is not provided, infer it from the type of change and explain the choice.

## Workflow

1. Identify existing test conventions and file locations.
2. Cover happy path, edge cases, and failure scenarios.
3. Keep tests deterministic and independent.
4. Avoid implementation-detail assertions when behavior-based assertions are possible.
5. Verify the generated tests align with current project scripts and tooling.

## Output Expectations

- New or updated test files.
- Short coverage summary.
- Any remaining testing gaps.
