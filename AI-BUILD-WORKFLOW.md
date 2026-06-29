# AI-Assisted Build Workflow

A repeatable pipeline for taking *any* idea to shipped code with Claude, keeping
you in the loop where alignment matters and letting the agent grind autonomously
where it doesn't.

## Core principle

> **Humans gate the phases. Ralph runs inside the slice.**

You stay in the loop at the **boundaries** — idea alignment, PRD approval, slice-plan
approval, per-slice review. The agent runs **unsupervised only inside one vertical
slice's red→green→refactor loop**, where "done" is machine-checkable. This is how you
get tight alignment *and* autonomous throughput without one eating the other.

```
 IDEA
   │
   ▼
┌──────────────┐  HUMAN ── deep QA, surface ambiguity, agree on scope
│ 1. GRILL     │            (grill-me / grill-with-docs → ADRs + glossary)
└──────┬───────┘
       ▼
┌──────────────┐  GATE ──── you approve the PRD + the test seams
│ 2. PRD       │            (to-prd → prd.md + issue + `ready-for-agent`)
└──────┬───────┘
       ▼
┌──────────────┐  GATE ──── you approve design + the SLICE PLAN
│ 3. SPEC      │            (spec-workflow → specs/{feature}/ + slices.md)
└──────┬───────┘
       ▼
┌──────────────┐  AUTONOMOUS per slice ── Ralph loop, TDD-enforced
│ 4. BUILD     │  GATE per slice ──────── you review the PR / demo
│   (loop)     │
└──────┬───────┘
       ▼
┌──────────────┐  GATE ──── final regression, docs, close issue
│ 5. CLOSE     │
└──────────────┘
```

---

## Master checklist

- [ ] **QA before any code** — grill session until you and Claude describe the feature identically
- [ ] **PRD** — synthesized from the conversation, you approve it, seams agreed
- [ ] **Spec-driven** — PRD decomposed into **vertical, surgical, testable slices**
- [ ] **TDD red-green-refactor** — every line of code exists to make a failing test pass
- [ ] **Test immutability** — Claude writes minimal code to pass; it never edits/deletes a test to reach green
- [ ] **Ralph Wiggum loop** — autonomous per-slice grind, state on disk, deterministic exit
- [ ] **Loop engineering** — small units, externalized memory, stuck detection, context hygiene
- [ ] **Human gate per slice** — nothing merges without your review

---

## Phase 1 — Grill (alignment QA) · *human in the loop*

**Goal:** eliminate the translation gap before it becomes code.

**Run:** `/grill-me` (or `/grill-with-docs` to emit ADRs + a domain glossary as you go).

Prefer `grill-with-docs` — the ADRs and glossary it produces are exactly what the next
two phases consume (the PRD uses glossary vocabulary and respects ADRs; the spec
inherits them). One artifact, three phases.

**Exit gate (do not advance until all true):**
- You can state the problem in one sentence and Claude states it the same way.
- Edge cases, failure modes, and non-goals are explicitly listed.
- The rough **test seams** are identified (where will behavior be observed?).
- Open questions are either answered or consciously deferred to `future-work`.

**Output:** shared understanding in-conversation + (optionally) ADRs and glossary on disk.

---

## Phase 2 — PRD · *human gate*

**Goal:** freeze *what* and *why* into a reviewable artifact.

**Run:** `/to-prd` — synthesizes the conversation (no re-interview) into `prd.md` and
publishes to the issue tracker with the `ready-for-agent` label.

The PRD intentionally stays at the product/decision layer: problem, solution, an
exhaustive numbered list of user stories, implementation decisions, **testing
decisions**, the seams, and out-of-scope. No file paths, no code (it rots).

**Built-in QA:** `to-prd` sketches the test seams and *checks them with you* before
writing. Treat this as a real gate — the seam choice determines how testable every
later slice is. Push for the **highest seam, fewest seams** (ideal: one).

**Exit gate:**
- Every user story is something you'd actually accept as "done."
- Testing decisions name *which* modules get tested and the prior art to mimic.
- You approve. The PRD is now the source of product intent.

---

## Phase 3 — Spec + slice plan · *human gate*

**Goal:** turn product intent into a precise, **sliced** technical spec the agent can derive from.

**Run:** the spec workflow → creates `specs/{feature}/` (`design.md`, `CLAUDE.md`,
`implementation.md`, `decisions.md`, `future-work.md`, `docs/`).

**Add the missing piece — `slices.md`.** The base spec template describes a feature; it
doesn't decompose it. You decompose into **vertical slices**:

A good slice is:
- **Vertical** — cuts through every layer it needs (DB → API → UI) for *one* thin behavior, so it's independently demoable. Never "all the DB work" then "all the API work."
- **Surgical** — touches the smallest blast radius; ideally one seam. List the files/modules it's allowed to touch.
- **Testable in isolation** — has its own acceptance test(s) at the agreed seam.
- **Ordered** — walking skeleton first (thinnest end-to-end path that compiles and passes one test), then thicken. Highest-risk/highest-uncertainty slices early.

```markdown
# slices.md

## Slice 1: Walking skeleton — <thinnest end-to-end behavior>
- Seam: <where the test observes behavior>
- Blast radius: <files/modules allowed to change>
- Acceptance: <observable behavior that proves it works>
- Status: not-started

## Slice 2: <next thin behavior>
- Depends on: Slice 1
- ...
```

**Exit gate:**
- The slice order is dependency-correct and each slice is independently shippable.
- Each slice has acceptance criteria *you* would sign off on.
- You approve the plan. Specs are now the source of technical truth.

---

## Phase 4 — Build (the Ralph loop) · *autonomous per slice, human gate at the boundary*

This is where Ralph Wiggum and TDD fuse. For **one slice at a time**, the agent runs a
fixed loop until the slice's acceptance criteria are met.

### The per-iteration contract

Each loop iteration does exactly **one** red-green-refactor cycle:

1. **RED** — write *one* failing test for the smallest next behavior, at the highest seam.
   Run it. Confirm it fails *for the right reason*.
2. **GREEN** — write the **minimal** code to pass. Touch nothing outside the slice's
   blast radius. No speculative generality.
3. **REFACTOR** — clean up with the suite staying green. No behavior change.
4. **COMMIT** — one small atomic commit. Update `implementation.md` (done / next).
5. **DECIDE** — slice acceptance met? → stop. Else → next iteration.

### The two hard rules (mechanically enforced, not trusted)

1. **Minimal code to pass** — the only justification for a line of code is a failing test that needs it.
2. **Test immutability** — during GREEN, existing/just-written tests are **append-only**.
   The agent may *add* tests; it may **not** edit, weaken, skip, or delete one to reach green.
   A blocked test means the *code* is wrong, never the test.

> Why mechanical: a Ralph loop under pressure *will* relax a test to go green. The failing
> test is your backpressure; the hook below is what stops the agent from relieving that
> pressure by cheating.

### Human gate (slice boundary)

When a slice's loop exits, **you** review: read the diff/PR, run the demo, confirm it
matches the acceptance criteria. Approve → merge → next slice. Reject → notes go into
`implementation.md`, loop resumes. Then `/clear` the context before the next slice.

---

## Loop engineering (what makes the Ralph loop actually converge)

Ralph Wiggum works because persistence + a reliable oracle beats cleverness. To keep it
converging instead of thrashing:

- **One unit of progress per iteration.** One test cycle, not a whole slice. Keeps each
  iteration inside a clean, small context window.
- **State lives on disk, not in context.** `implementation.md` (status/next),
  `decisions.md` (ADRs), and the git history *are* the agent's memory. Every iteration
  re-reads them first. This makes the loop **resumable** — kill it mid-run and restart with no loss.
- **Deterministic exit condition.** "Done" must be machine-checkable:
  `all slice tests green ∧ full suite green ∧ typecheck/lint clean ∧ no test files mutated`.
  Never "looks done."
- **Backpressure = TDD.** The agent cannot declare progress without a green test, and
  cannot fake green because the hook blocks test mutation.
- **Stuck detector.** Budget the loop (e.g. max N iterations, or "K iterations with no new
  green test"). On trip: **halt and escalate to you** with a summary — never grind forever.
- **Context hygiene.** Keep `CLAUDE.md` lean. Keep slices small enough that one fits a fresh
  window. `/clear` between slices so old context doesn't rot the new one.
- **Fixed prompt.** The loop prompt is invariant: "Read the spec `CLAUDE.md` and
  `implementation.md`. Run the next red-green-refactor cycle for the current slice. Do not
  modify existing tests. Stop when the slice acceptance criteria are met."

---

## Enforcement scaffolding (drop-in)

### Root `CLAUDE.md` — the rules of engagement

```markdown
# Engineering rules

## TDD is mandatory
- No production code without a failing test that requires it.
- Cycle: RED (one failing test) → GREEN (minimal code) → REFACTOR (suite stays green).
- Write the MINIMUM code to pass. No speculative abstraction.

## Tests are append-only during GREEN
- NEVER edit, weaken, skip, or delete a test to make it pass.
- A blocked test means the code is wrong. Fix the code.
- You may ADD new tests. You may not mutate existing ones to reach green.
- Test count must never decrease within a slice.

## Stay in the slice
- Only touch files in the current slice's blast radius (see specs/{feature}/slices.md).
- Out-of-scope change needed? Stop and record it in future-work.md; ask.

## Test quality
- Test external behavior at the highest seam, never implementation details.
- Mirror the prior-art tests named in the PRD's testing decisions.

## State
- Re-read specs/{feature}/implementation.md before acting.
- Update implementation.md after every commit. Record choices in decisions.md.
```

### `/build-slice` — the loop command (`.claude/commands/build-slice.md`)

```markdown
Read specs/$ARGUMENTS/CLAUDE.md, design.md, slices.md, and implementation.md.
Work the CURRENT in-progress slice only.

Repeat until the slice's acceptance criteria are met:
1. RED   — write ONE failing test for the next smallest behavior. Run it; confirm it fails right.
2. GREEN — minimal code to pass. Touch only the slice's blast radius. Do NOT modify tests.
3. REFACTOR — tidy with the full suite green.
4. COMMIT — one atomic commit; update implementation.md.

Stop and report if: acceptance met, OR you are stuck (same failure 3 cycles),
OR a change would fall outside the blast radius. Never modify a test to go green.
```

### Stop hook — the discipline enforcer (`.claude/hooks/tdd-guard.sh`)

Wire as a `Stop` hook. It runs before the agent is allowed to end a turn and **blocks**
(non-zero exit) if discipline was broken, forcing the loop to correct itself.

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Suite must be green.
npm test --silent || { echo "BLOCK: tests are not green."; exit 2; }

# 2. Typecheck / lint clean.
npm run typecheck --silent || { echo "BLOCK: typecheck failed."; exit 2; }

# 3. Test files must not have been weakened this turn.
#    (compare against the last commit; tests are append-only)
DELETED=$(git diff --cached --numstat -- '**/*.test.*' '**/*.spec.*' \
          | awk '{ if ($2 > 0) print }')   # lines removed from test files
if [ -n "$DELETED" ]; then
  echo "BLOCK: test files had lines removed/modified. Tests are append-only."
  exit 2
fi

# 4. Test count must not decrease.
PREV=$(git show HEAD:.tdd-test-count 2>/dev/null || echo 0)
NOW=$(grep -rEc "\b(it|test)\(" --include='*.test.*' --include='*.spec.*' . | awk -F: '{s+=$2} END{print s}')
if [ "$NOW" -lt "$PREV" ]; then
  echo "BLOCK: test count dropped from $PREV to $NOW."
  exit 2
fi
echo "$NOW" > .tdd-test-count

echo "OK: green, typed, tests intact ($NOW)."
exit 0
```

> Adapt the test/typecheck/lint commands and glob patterns to your stack. The point is the
> four invariants: **green suite · clean types · tests not weakened · count not dropping.**

---

## Failure modes → mitigations

| Failure mode | Symptom | Mitigation |
|---|---|---|
| Test tampering | Agent edits/deletes a test to go green | Stop hook blocks test-file deletions + count drops; CLAUDE.md "append-only" rule |
| Scope creep | Edits leak outside the slice | `slices.md` blast radius + "stay in the slice" rule; review the diff at the gate |
| Over-engineering | Speculative abstractions, big diffs | "minimal code to pass" rule; small slices; refactor only when green |
| Context rot | Agent forgets the plan, drifts | State on disk (`implementation.md`); re-read each iteration; `/clear` between slices |
| Infinite loop / thrash | Same failure repeating | Stuck detector (3 cycles same failure → halt + escalate) |
| Misalignment | Built the wrong thing | Phase-1 grill gate + PRD gate + slice-plan gate before any code |
| Horizontal slicing | Nothing demoable until the end | Enforce vertical slices; walking skeleton first |

---

## Quick reference — the whole pipeline

```text
1. /grill-with-docs            # align; emit ADRs + glossary        [you talk]
2. /to-prd                     # synthesize PRD; approve seams      [you approve]
3. <spec workflow>             # design.md + slices.md              [you approve plan]
4. for each slice:
     /build-slice {feature}    # autonomous red-green-refactor loop [Ralph runs]
     <review PR / demo>        # gate                               [you approve]
     /clear                    # context hygiene before next slice
5. full regression + docs + close issue                            [you sign off]
```

**The discipline in one line:** *talk until aligned → freeze intent in a PRD →
slice it vertically → let Ralph grind each slice under a hook that won't let it cheat →
review every slice before it merges.*
