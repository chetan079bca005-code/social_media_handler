# Backend README

## Purpose

Backend service for authentication, social account integration, content operations, AI workflows, and analytics.

## Safe Docs-Only Scope

- Keep backend documentation commits limited to markdown updates.
- Do not include route logic, service changes, or schema edits in docs-only commits.
- Stage only README files when contribution target is documentation.

## Quick Operational Notes

- Validate required environment variables before startup.
- Confirm database and cache services are reachable.
- Run lint/tests separately from documentation contributions.
- Keep API behavior notes aligned with implemented routes.

## Docs Commit Validation

- Run `git status --short` and confirm README-only scope.
- Run `git diff --name-only --cached` before every commit.
- Use explicit commit messages with `docs(backend): ...`.
- Push each docs commit separately if daily contribution count matters.
