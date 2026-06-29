# Spec-Driven Development Workflow

The end-to-end pipeline for taking any idea to shipped code with an AI agent. Humans gate
the phases; the agent runs autonomously only inside one slice's red-green-refactor loop.

> Companion docs: project-root `CLAUDE.md` (the rules), `specs/README.md` (the folder),
> and `AI-BUILD-WORKFLOW.md` (the long-form rationale, if present).

## The pipeline

```
 IDEA
   │
   ▼  /grill-with-docs ── deep QA until aligned; emits docs/glossary.md + docs/adr/   [human in loop]
   ▼  /to-prd ────────── synthesize PRD; approve the seams; publish issue             [human gate]
   ▼  /spec {feature} ── branch + specs/{feature}/ + Slice Plan in design.md          [human gate]
   ▼  /build-slice ───── per slice: red->green->refactor loop, then review the PR     [autonomous, then gate]
   ▼  close ──────────── full regression, docs, close the issue                       [human gate]
```

---

## Phase 1 — Grill (alignment QA) · *human in the loop*

`/grill-with-docs`. Relentless one-question-at-a-time interrogation until you and the agent
describe the feature identically. Output: `docs/glossary.md` + `docs/adr/ADR-NNN-*.md`.

**Gate:** problem fits one sentence you agree with; edge cases, failure modes, and
non-goals listed; seam(s) identified; every open question answered or deferred.

## Phase 2 — PRD · *human gate*

`/to-prd`. Pure synthesis of the conversation + glossary + ADRs into `prd.md`, published to
the tracker with `ready-for-agent`. It sketches the **test seams** (highest, fewest) and
**checks them with you** before writing, and proposes the initial vertical slices.

**Gate:** every user story is acceptably "done-able"; testing decisions name modules + prior
art; you approve. The PRD is now the source of product intent.

## Phase 3 — Spec + slice plan · *human gate*

`/spec {feature}`. Creates branch `feat/{feature}`, scaffolds `specs/{feature}/`, and turns
the PRD's proposed slices into a **Slice Plan** in `design.md` — each slice vertical,
surgical, testable, with a blast radius and acceptance criteria.

**Gate:** slices are vertical, independently shippable, dependency-correct, and each
acceptance criterion is one you'd sign off on. Specs are now the technical source of truth.

## Phase 4 — Build · *autonomous per slice, human gate at the boundary*

`/build-slice {feature}`, one slice at a time. See the per-iteration contract below. At each
slice boundary you review the PR/demo, approve+merge, then `/clear` and run the next slice.

## Phase 5 — Close · *human gate*

Full regression green, docs/screenshots generated if wanted, `future-work.md` captures
anything deferred, issue closed.

---

## The per-slice loop (Phase 4 detail)

Each iteration does exactly ONE red-green-refactor cycle:

1. **RED** — one failing test for the smallest next behavior, at the highest seam. Confirm
   it fails for the right reason.
2. **GREEN** — minimal code to pass. Only the slice's blast radius. No test edits.
3. **REFACTOR** — tidy with the suite green. No behavior change.
4. **COMMIT** — one atomic commit; update `implementation.md`.
5. **DECIDE** — acceptance met -> stop; else -> next cycle.

### The two hard rules

1. **Minimal code to pass** — every line traces to a failing test.
2. **Test immutability** — during GREEN, tests are append-only. Never edit, weaken, skip, or
   delete a test to reach green; the count must never drop. A blocked test means the *code*
   is wrong.

> The failing test is the backpressure that forces real progress. The Stop hook below is
> what stops the agent from relieving that pressure by cheating.

---

## Loop engineering (what makes it converge)

- **One unit of progress per iteration** — one cycle, not a whole slice; keeps context small.
- **State on disk, not in context** — `implementation.md` + `decisions.md` + git history are
  the agent's memory; re-read each iteration. This makes the loop resumable after a crash or
  `/clear`.
- **Deterministic exit** — done = `all slice tests green ∧ full suite green ∧ typecheck/lint
  clean ∧ no test files weakened`. Never "looks done."
- **Stuck detector** — same failure 3 cycles, or out-of-blast-radius change needed -> halt
  and escalate. Never grind forever.
- **Context hygiene** — keep `CLAUDE.md` lean; keep slices small enough to fit one window;
  `/clear` between slices.
- **Fixed prompt** — `/build-slice` is invariant: read the spec, run the next cycle, don't
  touch tests, stop at acceptance.

---

## Enforcement: the Stop hook

Wire this as a Claude Code **Stop hook** so it runs before the agent can end a turn and
**blocks** (non-zero exit) if discipline was broken, forcing the loop to self-correct.
Adapt the commands and globs to this project's stack.

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Suite green.
npm test --silent || { echo "BLOCK: tests are not green."; exit 2; }

# 2. Types + lint clean.
npm run typecheck --silent || { echo "BLOCK: typecheck failed."; exit 2; }
npm run lint --silent      || { echo "BLOCK: lint failed."; exit 2; }

# 3. Tests not weakened this turn (lines removed from test files == tampering).
REMOVED=$(git diff --cached --numstat -- '**/*.test.*' '**/*.spec.*' | awk '$2>0')
[ -z "$REMOVED" ] || { echo "BLOCK: test files had lines removed. Tests are append-only."; exit 2; }

# 4. Test count must not decrease.
PREV=$(git show HEAD:.tdd-test-count 2>/dev/null || echo 0)
NOW=$(grep -rEc "\b(it|test)\(" --include='*.test.*' --include='*.spec.*' . | awk -F: '{s+=$2} END{print s}')
[ "$NOW" -ge "$PREV" ] || { echo "BLOCK: test count dropped $PREV -> $NOW."; exit 2; }
echo "$NOW" > .tdd-test-count

echo "OK: green, typed, linted, tests intact ($NOW)."
```

The four invariants: **green suite · clean types/lint · tests not weakened · count not dropping.**

---

## Failure modes -> mitigations

| Failure mode | Mitigation |
|---|---|
| Test tampering | Stop hook blocks test-line removal + count drops; append-only rule |
| Scope creep | Blast radius in `design.md`; stay-in-slice rule; PR review at the gate |
| Over-engineering | Minimal-code rule; small slices; refactor only when green |
| Context rot | State on disk; re-read each iteration; `/clear` between slices |
| Infinite loop | Stuck detector (3 cycles same failure -> halt + escalate) |
| Misalignment | Phase 1/2/3 gates before any code |
| Horizontal slicing | Enforce vertical slices; walking skeleton first |

---

## Don't (when using this workflow)

- Don't write production code without a failing test that requires it.
- Don't modify a test to make it pass.
- Don't touch files outside the current slice's blast radius.
- Don't skip updating `implementation.md` after a commit.
- Don't make an architectural decision without recording it in `decisions.md`.
- Don't advance past a gate without explicit human approval.
