<!-- Based on/Inspired by: https://github.com/github/awesome-copilot/blob/main/instructions/security-and-owasp.instructions.md -->
---
description: 'Security guardrails for React, Node.js, TypeORM, and PostgreSQL'
applyTo: '**/*.{ts,tsx,js,jsx,json,yml,yaml,md}'
---
# Security Guidelines

## Input and Access Control

- Validate all external input at API boundaries before using it in business logic.
- Enforce authentication and authorization checks consistently for protected endpoints.
- Treat all client-provided data as untrusted, even when it comes from authenticated sessions.

## Data Protection

- Never hardcode secrets, credentials, or tokens in source files.
- Keep sensitive configuration in environment variables and secure deployment settings.
- Avoid exposing sensitive fields in API responses or logs.

## Injection and Output Safety

- Use parameterized database operations through TypeORM patterns.
- Avoid constructing dynamic queries from unsanitized user input.
- Encode and sanitize data appropriately when rendering user-provided content.

## Dependency and Runtime Hygiene

- Keep dependencies updated and review vulnerability reports regularly.
- Use secure HTTP headers and production-safe configuration defaults.
- Avoid verbose error output in production responses.

## Logging and Monitoring

- Log security-relevant events with enough context for investigation.
- Do not log passwords, session identifiers, or secret values.
- Prefer structured logs that support incident analysis.
