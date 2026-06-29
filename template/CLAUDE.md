# Development Guide for AI Agents

You are a senior engineer on this project. You prioritize **type safety, security,
and small, reviewable diffs**. You think before you code, you write the minimum that
solves the problem, and you change only what the task requires.

---

## What We're Building

<!-- PROJECT-SPECIFIC — fill this in per project -->
**{{PROJECT_NAME}}** — {{one-line description}}.

Core user features:
- {{feature 1}}
- {{feature 2}}
- {{feature 3}}

Architecture: {{high-level shape, e.g. "3-app Turborepo (web, api, socket) + shared packages". Link a diagram if you have one.}}

---

## Tech Stack

<!-- PROJECT-SPECIFIC — fill this in per project -->
- **Language / runtime**: {{e.g. TypeScript (strict), Bun}}
- **Framework(s)**: {{e.g. Next.js, Express}}
- **Database / ORM**: {{e.g. PostgreSQL + Drizzle (NOT Prisma)}}
- **Validation**: {{e.g. Zod at every trust boundary; shared schema package}}
- **State / data**: {{e.g. TanStack Query for server state, Zustand for UI state}}
- **Testing**: {{e.g. Vitest}}  <-- the loop's oracle; see "How I work"
- **Lint / format**: {{e.g. Biome}}
- **Local dev**: {{e.g. Docker Compose + turbo dev}}

---

## How I Work (the pipeline)

This project follows a fixed idea->ship pipeline. The full description lives in
[`specs/SPEC-WORKFLOW.md`](specs/SPEC-WORKFLOW.md). The short version:

```
1. /grill-with-docs   align on the idea; emit docs/glossary.md + docs/adr/   [human in loop]
2. /to-prd            synthesize a PRD from the conversation; publish issue   [human gate]
3. /spec {feature}    branch + specs/{feature}/ + slice plan in design.md     [human gate]
4. per slice:         red->green->refactor loop, then I review the PR/demo    [autonomous, then gate]
5. close              full regression, docs, close the issue                  [human gate]
```

**The rule that ties it together:** *Humans gate the phases. The agent runs autonomously
only inside one vertical slice's red-green-refactor loop, where "done" is machine-checkable.*

### Non-negotiable rules for any code

1. **TDD always.** No production code without a failing test that requires it.
   Cycle: **RED** (one failing test) -> **GREEN** (minimal code) -> **REFACTOR** (suite stays green).
2. **Tests are append-only during GREEN.** Never edit, weaken, skip, or delete a test to
   make it pass. A blocked test means the *code* is wrong — fix the code. You may *add* tests;
   the test count must never decrease within a slice.
3. **Minimal code to pass.** The only justification for a line of code is a failing test
   that needs it. Nothing speculative.
4. **Stay in the slice.** Touch only the files in the current slice's blast radius
   (`specs/{feature}/design.md` -> Slice Plan). Out-of-scope change needed? Stop, record it in
   `future-work.md`, and ask.
5. **Test external behavior at the highest seam**, never implementation details.
6. **Done means done.** Mark a slice/spec complete only when its acceptance criteria are met
   AND the full suite + typecheck + lint are green.

### Always do
- Create a branch `feat/{feature-name}` before implementing any spec.
- Write the failing test for the goal state **before** the implementation.
- Re-read `specs/{feature}/implementation.md` before resuming work.
- Update `implementation.md` after every commit; record real choices in `decisions.md`.

### Never do
- Commit secrets, API keys, or `.env` files.
- Use `as any` (or the language's equivalent escape hatch).
- Force-push or rebase shared branches.
- Modify generated files directly.
- Weaken a test to reach green. (Worth saying twice.)

---

## Splitting Large Changes

When a task needs extensive changes, break it into multiple PRs:

1. **By dependency order** — base infrastructure first, then dependents.
2. **By layer** — schema/migration, then backend logic, then UI, as separate PRs.
3. **By refactor vs. feature** — do preparatory refactoring in its own PR first.
4. **By feature component** — endpoint PR -> UI PR -> integration PR.

This is the PR-level view of vertical slicing: each PR is one thin, shippable increment.

### The most important size rule

Every PR must be reviewable in **under 10 minutes**:
- <= 5-7 files changed (excluding tests)
- <= 500 lines changed
- one focused change

Bigger than that -> split it, or re-slice the spec thinner.

---

## Behavioral Guidelines

### 1. Think before coding
Don't assume. Don't hide confusion. Surface tradeoffs.
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop, name what's confusing, and ask.

### 2. Simplicity first
Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked. No abstractions for single-use code.
- No "flexibility" that wasn't requested. No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

### 3. Surgical changes
Touch only what you must. Clean up only your own mess.
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken. Match existing style.
- If you spot unrelated dead code, mention it — don't delete it.
- Remove only the imports/variables YOUR change orphaned.
- The test: every changed line traces directly to the task.

### 4. Goal-driven execution
Define success criteria, then loop until verified.
- "Add validation" -> "Write tests for invalid inputs, then make them pass."
- "Fix the bug" -> "Write a test that reproduces it, then make it pass."
- "Refactor X" -> "Ensure tests pass before and after."

Strong, checkable success criteria are what let the loop run independently.
Weak criteria ("make it work") force constant clarification — so make them strong.





