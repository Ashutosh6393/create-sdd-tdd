# create-sdd — Implementation

Living status. The agent re-reads this before resuming and updates it after every commit.

## Status: done
<!-- not-started | in-progress | blocked | done -->

## Slices

<!-- Mirror the Slice Plan in design.md; flip status as you go. -->
- [x] Slice 0 — Prep: repo restructure + project skeleton (no tests) · done
- [x] Slice 1 — Walking skeleton: copy template + fill project name · done
- [x] Slice 2 — Refuse a non-empty target directory · done
- [x] Slice 3 — Fill description + 8 stack lines; blanks → TODO · done
- [x] Slice 4 — CLI adapter: arg parse + prompts + next-steps message · done

## Current slice

All slices done. Feature complete: `npx create-sdd <dir>` scaffolds the template, fills
name/description/stack, and prints the next-steps handoff.

Remaining manual step: an interactive smoke run in a real terminal —
`node dist/cli.js <new-dir>` (build first with `npm run build`). The headless harness can't
drive `@clack`'s TTY, so this wasn't run here.

## Blocked

None. Git initialized; on branch `feat/create-sdd`.

## Test count

<!-- The Stop hook tracks this in .tdd-test-count; mirror the latest here for humans. -->
Last green: 11

## Session notes

### 2026-06-30
- Done: scaffolded `spec/create-sdd/` from `_templates`; filled design/decisions/spec from
  the approved PRD (`docs/prd/create-sdd.md`). 5-slice plan defined (added Slice 0 prep).
- Done: **Slice 0** — `git init` + `feat/create-sdd` branch; restructured shipped template
  under `template/` (git mv, history preserved); added project skeleton (`package.json`,
  strict `tsconfig.json`, `vitest.config.ts`, `tsup.config.ts`, `.gitignore`). Verified:
  `tsc --noEmit` passes, `vitest run` → 0 tests (exit 0), template intact under `template/`,
  `spec/create-sdd/` + `docs/` untouched.
- Done: **Slice 1** — `scaffold(options, targetDir)` in `src/scaffold.ts` + 3 tests in
  `src/scaffold.test.ts`. Copies bundled `template/` into target (incl. `.claude/`, empty
  `settings.json`), fills `{{PROJECT_NAME}}` in root `CLAUDE.md` only, `_templates` verbatim
  guard green. `tsc --noEmit` clean. Test count 0 → 3.
- ⚠️ Environmental issue hit during Slice 1: the filesystem resurrected the Slice 0
  `git mv` source files (root `.claude/`, `spec/_templates/`, `spec/README.md`,
  `spec/SPEC-WORKFLOW.md`) — a sync/cache layer re-creating deleted files. They got wrongly
  re-tracked by `git add -A` in commit d16438f, then removed in a follow-up correction
  commit. Added `/.claude/` to `.gitignore` as a guard. **The duplicated files may resurrect
  again** — verify the tracked tree before each commit. Likely root cause: the repo lives on
  a synced/cached drive (J:); consider relocating it.
- Done: **Slice 2** — `scaffold` now rejects a non-empty target dir via `assertTargetIsEmpty`
  (checks before any write, so no partial writes); a missing dir is still fine. +1 test
  (4 total). User chose to pause the sync tool and continue here.
- Done: **Slice 3** — fill `{{one-line description}}` and the 8 stack placeholders via a
  `STACK_PLACEHOLDERS` map; blank/omitted stack field → `{{TODO: <label>}}`. `description`
  and `stack` are optional on `ScaffoldOptions` (keeps the append-only Slice-1/2 tests
  valid). +2 tests (6 total). `tsc` clean.
- Done: **Slice 4** — CLI adapter. `src/options.ts` adds `resolveOptions(argv, ask)` (+
  `parseArgs`, `defaultProjectName`) with an injectable `Asker` so the wiring is unit-tested
  without a TTY (ADR-002): dir from arg-or-prompt, name defaults to basename, stack examples
  as editable defaults, cleared field → omitted (→ `{{TODO}}`). `src/cli.ts` is the thin
  `@clack` shell (intro/prompts/cancel/outro) calling `scaffold`; `bin` added to package.json;
  `@clack/prompts` dep added. +5 option tests (11 total). `tsc` clean; `tsup` build produces
  `dist/cli.js` (shebang + exec bit) and the binary launches/renders prompts.
- Feature complete. Manual interactive smoke (`node dist/cli.js <dir>`) pending a real terminal.
