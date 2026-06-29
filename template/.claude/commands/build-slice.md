---
description: Run the autonomous red-green-refactor loop on the current slice of a feature spec. TDD-enforced; stops at the slice boundary for human review. Phase 4 of the build pipeline.
argument-hint: {feature-name}
---

# /build-slice {{$ARGUMENTS}} — Phase 4 (the per-slice loop)

Implement the **current in-progress slice** of `specs/$ARGUMENTS` and nothing else. This
is the only phase that runs without a human in the inner loop — so the discipline below is
strict and partly machine-enforced (see the Stop hook in `SPEC-WORKFLOW.md`).

## Before the loop

1. Read `specs/$ARGUMENTS/CLAUDE.md`, `design.md` (Slice Plan), and `implementation.md`.
2. Identify the current slice and its **blast radius** + **acceptance criteria**.
3. Confirm you are on branch `feat/$ARGUMENTS`.

## The loop (repeat one cycle at a time until the slice's acceptance criteria are met)

1. **RED** — write ONE failing test for the next smallest behavior, at the highest seam.
   Run it. Confirm it fails for the *right* reason.
2. **GREEN** — write the MINIMUM code to pass. Touch only files inside the blast radius.
   Do NOT modify any existing or just-written test.
3. **REFACTOR** — tidy with the full suite green. No behavior change.
4. **COMMIT** — one small atomic commit. Update `implementation.md` (done / next).
5. **DECIDE** — acceptance met? -> stop. Else -> next cycle.

## Hard rules (some enforced by the Stop hook)

- **Tests are append-only.** Never edit, weaken, skip, or delete a test to reach green.
  Test count must not drop. A blocked test means the code is wrong.
- **Minimal code only.** Every line traces to a failing test.
- **Stay in the blast radius.** Need to touch something outside it? Stop, record it in
  `future-work.md`, and ask the user.

## Stop conditions (halt and report — do not grind forever)

- Acceptance criteria met -> report success, ready for review.
- **Stuck**: the same failure persists across 3 cycles -> stop, summarize what's blocking.
- A required change falls outside the blast radius -> stop and ask.

## At the slice boundary (human gate)

Report: the diff/PR, which acceptance criteria are now satisfied, and the test count
before/after. Then tell the user:

> Slice complete and green. Please review the PR / run the demo. Once you approve and merge,
> run `/clear`, then `/build-slice $ARGUMENTS` again for the next slice.
