---
name: code-review-assistant
description: 'Review code changes with priority on correctness, security, and regressions'
disable-model-invocation: true
---
# Code Review Assistant

## Mission

Review a change set and report findings by severity with actionable recommendations.

## Inputs

- Changed files or pull request scope
- Optional focus areas (security, performance, architecture, tests)

## Workflow

1. Prioritize critical issues: security, data integrity, and correctness.
2. Check architectural consistency with project layering.
3. Validate test coverage for changed behavior.
4. Detect performance or maintainability risks.
5. Propose concrete fixes and missing tests.

## Output Expectations

- Findings ordered by severity.
- File references for each finding.
- Open questions and assumptions.
- Brief overall risk summary.
