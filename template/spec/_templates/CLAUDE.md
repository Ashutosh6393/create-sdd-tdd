# CLAUDE.md — {{Feature Name}}

Feature-specific instructions. The project-root `CLAUDE.md` rules (TDD, test immutability,
minimal/surgical changes, stay-in-slice) all still apply — this file adds local context.

## What this feature does

{{One or two sentences. Use glossary terms verbatim.}}

## Read before working (in order)

1. `design.md` — what to build, the seam(s), and the Slice Plan.
2. `implementation.md` — current status; the slice you're on and what's next.
3. `decisions.md` — ADRs governing this feature; don't contradict them.

## The loop here

Work the **current in-progress slice only**, via `/build-slice {{feature}}`. One
red->green->refactor cycle at a time. Stay inside the current slice's blast radius. Tests
are append-only — a blocked test means the code is wrong.

## Code patterns to follow

{{Reference implementations / similar code already in the repo to mirror. Name files.}}

## Don't

- Don't add anything not in `design.md`.
- Don't skip tests or weaken them to go green.
- Don't touch files outside the current slice's blast radius.
- {{feature-specific don'ts}}

## Done means

A slice is done only when its acceptance criteria are met AND the full suite + typecheck +
lint are green. The feature is done only when every slice in `design.md` is done.
