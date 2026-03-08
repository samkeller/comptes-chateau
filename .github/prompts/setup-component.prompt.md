<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/instructions/prompt.instructions.md -->
---
agent: 'agent'
model: GPT-5.3-Codex
tools: ['codebase', 'search', 'usages']
description: 'Create a new React component or Node module following repository conventions'
---
# Setup Component or Module

## Mission

Create a new component/module that fits this repository architecture and style.

## Inputs

- Feature name
- Target layer (`react` or `node`)
- Expected behavior
- Dependencies to reuse

If any input is missing, ask concise clarification questions first.

## Workflow

1. Inspect nearby files for naming and folder conventions.
2. Reuse existing interfaces/services/utilities before creating new abstractions.
3. Implement minimal, typed, production-ready code.
4. Add loading/error/empty handling for UI and robust error handling for backend flows.
5. Update related tests when behavior is introduced.

## Output Expectations

- List created/updated files.
- Summarize architectural choices.
- Highlight any assumptions made.
