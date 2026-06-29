---
description: Scaffold a feature spec from an approved PRD — create the branch, copy the template, turn the PRD's proposed slices into a reviewable slice plan, and stop for approval. Phase 3 of the build pipeline.
argument-hint: {feature-name}
---

# /spec {{$ARGUMENTS}} — Phase 3 (spec + slice plan)

Turn the approved PRD into a precise, sliced technical spec the per-slice loop can derive
from. Do **NOT** start implementing in this command — this phase ends at a human gate.

## Steps

1. **Locate the PRD** for `$ARGUMENTS` on github issues (the issue labelled `ready-for-agent`, or the PRD in
   the conversation). If you can't find an approved PRD, stop and tell the user to run
   `/to-prd` first.

2. **Create the branch:**
   ```bash
   git checkout -b feat/$ARGUMENTS
   ```

3. **Scaffold the spec folder:**
   ```bash
   cp -r specs/_templates specs/$ARGUMENTS
   ```

4. **Explore the codebase** for existing patterns this feature should follow, and read
   `docs/glossary.md` + relevant `docs/adr/` so the spec stays consistent with both.

5. **Fill in the spec files** (do not invent beyond the PRD; carry decisions over):
   - `design.md` — problem recap, contracts/interfaces, the chosen seam(s), and the
     **Slice Plan**: refine the PRD's *Proposed Slices* into vertical slices, each with a
     **blast radius** (files/modules it may touch) and **acceptance criteria**. Front-load
     the walking skeleton and the riskiest slices.
   - `CLAUDE.md` / `AGENTS.md` — feature-specific context, patterns to follow, and don'ts.
   - `implementation.md` — list every slice under "Next Steps" with status `not-started`.
   - `decisions.md` — copy in any ADRs from `docs/adr/` that govern this feature's area.
   - `future-work.md` — anything the PRD marked out of scope.

6. **STOP at the gate.** Present the slice plan to the user and ask them to confirm the
   slices are vertical, independently shippable, dependency-correct, and that each
   acceptance criterion is something they'd sign off on. Do not implement until they approve.

## Hand off

Once the user approves the slice plan, tell them:

> Slice plan approved. Run **/build-slice $ARGUMENTS** to start the autonomous
> red-green-refactor loop on Slice 1. I'll stop at the slice boundary for your review
> before moving to the next one.
