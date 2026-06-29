# Spec-First Development

This folder holds the design docs for features in development. The agent reads these to
know what to build and to track progress across sessions. It is **Phase 3+** of the build
pipeline (see [`SPEC-WORKFLOW.md`](SPEC-WORKFLOW.md) for the whole thing).

## Where this sits in the pipeline

```
/grill-with-docs  ->  /to-prd  ->  /spec {feature}  ->  /build-slice {feature}  (xN)  ->  close
   (align)            (PRD)        (THIS FOLDER)         (per-slice loop)
```

By the time a folder appears under `specs/`, the idea has already been aligned
(`docs/glossary.md`, `docs/adr/`) and frozen into an approved PRD. `/spec` scaffolds the
folder; `/build-slice` works through its slices one at a time.

## Starting a new feature

Don't copy by hand — run the command, which also creates the branch and fills the files
from the approved PRD:

```
/spec {feature-name}
```

(Equivalent manual scaffold, if you ever need it: `cp -r specs/_templates specs/{feature-name}`.)

## File structure

Each feature folder contains:

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Feature-specific instructions — the agent reads this first |
| `AGENTS.md` | Thin pointer to `CLAUDE.md` for non-Claude agents (keep in sync) |
| `design.md` | Source of truth: what to build, the seams, and the **Slice Plan** |
| `implementation.md` | Living status — per-slice progress, blockers, session notes |
| `decisions.md` | Feature-scoped ADRs (project-wide ADRs live in `docs/adr/`) |
| `future-work.md` | Deferred ideas, tech debt, out-of-scope items |
| `docs/` | Optional: generated documentation + screenshots |

> **Note on slices:** the slice *plan* lives in `design.md`; the slice *status* lives in
> `implementation.md`. There is intentionally no separate `slices.md` — plan and status
> change on different cadences.

## Session continuity

To resume after a break or a fresh context:

```
Continue working on {feature}
```

The agent re-reads `implementation.md` to pick up exactly where it left off — which is why
that file must be updated after every commit.

## The most important rule

Every PR must be reviewable in **under 10 minutes**:

- ≤ 5–7 files changed (excluding tests)
- ≤ 500 lines changed
- one focused change

If a slice is bigger than that, it isn't a slice — re-slice it thinner in `design.md`.
