# CLAUDE.md — create-sdd (the CLI)

Engineering guide for the **`create-sdd` CLI**. This governs work on the tool itself.

> Not to be confused with [`template/CLAUDE.md`](./template/CLAUDE.md), which is the guide
> that ships *inside* scaffolded projects. This file is for developing the scaffolder.

This repo dogfoods the very workflow it ships: its own feature work lives under
`spec/create-sdd/` and was built slice-by-slice with the red→green→refactor loop.

---

## What this is

`create-sdd` is a Node/TypeScript CLI (`npx create-sdd <dir>`) that copies a bundled
project template into a new directory and fills the project-level placeholders (name,
description, tech stack) in the new project's root `CLAUDE.md`.

## Repo layout

| Path | Role |
|------|------|
| `src/` | The CLI. `scaffold.ts` (engine), `options.ts` (arg/prompt resolution), `cli.ts` (`@clack` shell), plus `*.test.ts`. |
| `template/` | The **shipped** template — bundled into the npm package and copied verbatim into new projects. Editing it changes what users get. |
| `spec/create-sdd/` | This CLI's own feature spec (design, decisions, implementation status). Dogfooding — **not** shipped. |
| `docs/prd/` | This CLI's PRD. Not shipped. |

Only `dist/` and `template/` are published (see `package.json` `files`).

## Architecture (two ADRs you must not break)

Decisions live in [`spec/create-sdd/decisions.md`](./spec/create-sdd/decisions.md). The two
that constrain every change:

- **One seam — `scaffold(options, targetDir)`.** The engine takes fully-resolved options and
  touches the filesystem; it does no prompting or arg parsing. `options.ts` resolves options
  (arg → prompt) behind an injectable `Asker` so the wiring is testable without a TTY.
  `cli.ts` is a thin `@clack` shell with no business logic. (ADR-002)
- **Placeholder fill is scoped to the root `CLAUDE.md` only.** Everything else — especially
  `template/spec/_templates/` — is copied byte-for-byte. A global find/replace would corrupt
  the per-feature placeholders the scaffolded `/spec` command depends on. The
  `_templates`-verbatim test is the guard; keep it green. (ADR-003)

## How to work

```bash
npm install
npm test          # vitest run  — the oracle
npm run typecheck # tsc --noEmit (strict)
npm run build     # tsup → dist/cli.js
```

**TDD always.** No production code without a failing test that requires it: **RED** (one
failing test at the highest seam) → **GREEN** (minimum code) → **REFACTOR** (suite stays
green). Tests are **append-only** — never edit, weaken, skip, or delete one to go green; the
test count must not drop. (This is why `ScaffoldOptions.description`/`stack` are optional:
making them required would have broken earlier, immutable tests.)

Test pattern: each scaffold test creates a unique temp dir, runs `scaffold` into it, and
asserts on the resulting files — external behavior, never internals.

## Don't

- Don't fill placeholders anywhere but the root `CLAUDE.md` (ADR-003).
- Don't put business logic in `cli.ts`; it belongs behind the `scaffold`/`resolveOptions`
  seams so it stays testable.
- Don't commit `dist/` (gitignored — it's a build artifact, published via npm).
- Don't track a root `.claude/` — it's gitignored. The shipped Claude config is
  `template/.claude/`. (A filesystem sync once resurrected `git mv`-deleted files into the
  root and they were wrongly re-tracked; verify the tree before committing on synced drives.)

## Status

All slices complete (`spec/create-sdd/implementation.md`). 11 tests green. Remaining manual
step: an interactive smoke run in a real terminal — `npm run build && node dist/cli.js
<new-dir>` — which the headless CI can't drive (`@clack` needs a TTY).
