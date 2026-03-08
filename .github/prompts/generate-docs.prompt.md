<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/instructions/prompt.instructions.md -->
---
agent: 'agent'
model: GPT-5.3-Codex
tools: ['codebase', 'search']
description: 'Generate or update project documentation based on actual code behavior'
---
# Generate Documentation

## Mission

Produce accurate documentation that reflects current implementation.

## Inputs

- Documentation target (`README`, API docs, feature docs, runbook)
- Intended audience (developer, reviewer, operator)
- Scope of changed behavior

## Workflow

1. Inspect source files and scripts before writing docs.
2. Document behavior, contracts, and operational commands precisely.
3. Keep language concise and domain-aligned.
4. Include assumptions, limitations, and known caveats where relevant.
5. Ensure links and referenced paths are valid.

## Output Expectations

- Updated documentation files.
- Summary of what changed and why.
- Any unresolved documentation gaps.
