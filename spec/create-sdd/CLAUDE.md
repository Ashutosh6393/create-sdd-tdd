# CLAUDE.md — create-sdd

Feature-specific instructions. The project-root `CLAUDE.md` rules (TDD, test immutability,
minimal/surgical changes, stay-in-slice) all still apply — this file adds local context.

## What this feature does

`create-sdd` is a Node/TypeScript CLI (`npx create-sdd <dir>`) that scaffolds this
spec-driven-development + TDD template into a new project: it copies the bundled `template/`
into an empty directory and interactively fills the project-level placeholders (name,
description, tech stack) in the root template `CLAUDE.md` only.

## Read before working (in order)

1. `design.md` — what to build, the single `scaffold` seam, and the Slice Plan.
2. `implementation.md` — current status; the slice you're on and what's next.
3. `decisions.md` — ADR-001 (repo restructure), ADR-002 (one seam), ADR-003 (fill scope).

## The loop here

Work the **current in-progress slice only**, via `/build-slice create-sdd`. One
red→green→refactor cycle at a time. Stay inside the current slice's blast radius. Tests are
append-only — a blocked test means the code is wrong.

## Code patterns to follow

No prior art in this repo (it was docs-only before this feature). Establish:
- **Test pattern:** Vitest, one unique temp dir per test, run `scaffold` into it, assert on
  the resulting files, clean up. Assert filesystem state, not internals.
- **Engine vs adapter (ADR-002):** `src/scaffold.ts` does copy+fill against the filesystem
  and takes fully-resolved options; `src/cli.ts` only resolves options (arg parse + `@clack`
  prompts) and calls `scaffold`.

## Don't

- Don't add anything not in `design.md` (no git init, no install, no `--here`/`--force`, no
  network fetch, no TODO-listing in the success message).
- Don't skip tests or weaken them to go green.
- Don't touch files outside the current slice's blast radius.
- **Don't ever fill placeholders outside the root template `CLAUDE.md`** (ADR-003). The
  `template/spec/_templates/` placeholders must be copied byte-for-byte.
- Don't move `spec/create-sdd/` or `docs/prd/` into `template/` during the restructure —
  they're the CLI's own dogfooding specs and must not ship.

## Done means

A slice is done only when its acceptance criteria are met AND the full suite + typecheck +
lint are green. The feature is done only when every slice in `design.md` is done.
