<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/agents/debug.agent.md -->
---
agent: 'agent'
model: GPT-5.3-Codex
tools: ['codebase', 'search', 'problems', 'testFailure', 'runCommands']
description: 'Diagnose and fix an issue using a structured debug workflow'
---
# Debug Issue

## Mission

Reproduce, diagnose, and resolve a bug with minimal and safe code changes.

## Inputs

- Symptoms, error messages, or failing tests
- Expected behavior
- Reproduction steps if known

## Workflow

1. Confirm expected versus actual behavior.
2. Reproduce and isolate the failure scope.
3. Identify root cause and impacted flows.
4. Apply targeted fixes aligned with existing patterns.
5. Verify with relevant tests and sanity checks.
6. Document root cause and prevention guidance.

## Output Expectations

- Root cause summary.
- Files changed and rationale.
- Verification results and residual risks.
