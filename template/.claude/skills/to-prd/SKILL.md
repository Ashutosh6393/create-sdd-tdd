---
name: to-prd
description: Turn the current conversation (plus the glossary + ADRs from /grill-with-docs) into a PRD and publish it to the issue tracker. No interview — pure synthesis. This is Phase 2 of the build pipeline; its output feeds /spec.
disable-model-invocation: true
---

# To PRD — Phase 2 (synthesize, don't interview)

Take everything already established — this conversation, `docs/glossary.md`, and
`docs/adr/` — and synthesize a PRD. Do **NOT** re-interview the user. If something
critical is genuinely unresolved, the grill phase wasn't finished: name the gap and
suggest re-running `/grill-with-docs` rather than guessing.

## Process

1. **Explore the repo** to understand current state, if you haven't already this session.

2. **Use the glossary.** Every domain term in the PRD must match `docs/glossary.md`
   verbatim. **Respect existing ADRs** in `docs/adr/` for the area you're touching — the
   PRD must not contradict an accepted decision.

3. **Sketch the test seams.** Prefer existing seams to new ones; use the **highest seam
   possible**; the fewer seams across the codebase, the better (ideal: one). If a new seam
   is needed, propose it at the highest point you can.

   **Check the seams with the user before writing the PRD.** This is the Phase-2 gate.

4. **Propose vertical slices.** Decompose the feature into thin, independently shippable
   slices — each cutting through every layer it needs for one small behavior, ordered so a
   walking skeleton lands first and risk is front-loaded. This seeds `/spec`.

5. **Write the PRD** using the template below and **publish it to the github issue tracker** with
   the `ready-for-agent` label. No further triage needed.

## PRD template

```markdown
# PRD: {{Feature name}}

## Problem Statement
The problem the user faces, from the user's perspective.

## Solution
The solution, from the user's perspective.

## User Stories
A LONG, numbered list covering all aspects of the feature, each:
1. As a {{actor}}, I want {{capability}}, so that {{benefit}}.

## Implementation Decisions
Decisions made (NOT file paths or code — those rot):
- Modules to be built/modified and their interfaces
- Architectural decisions (link the ADR number if one was written)
- Schema changes, API contracts, specific interactions
- Technical clarifications from the user

> Exception: if a prototype produced a snippet that encodes a decision more precisely than
> prose (a state machine, reducer, schema, or type shape), inline just the decision-rich
> part and note it came from a prototype. Not a working demo — the important bits only.

## Testing Decisions
- What makes a good test here: only external behavior at the chosen seam, never
  implementation details.
- Which modules will be tested.
- Prior art: similar tests already in the codebase to mirror.

## Proposed Slices
Ordered, vertical, independently shippable. /spec will refine these into the slice plan.
1. **Slice 1 — Walking skeleton:** {{thinnest end-to-end behavior}}
   - Seam: {{where its test observes behavior}}
   - Acceptance: {{observable proof it works}}
2. **Slice 2 — {{next thin behavior}}** (depends on Slice 1)
   - ...

## Out of Scope
What this PRD explicitly does not do.

## Further Notes
Anything else worth recording.
```

## Hand off

After publishing, tell the user:

> PRD published to the tracker with `ready-for-agent`. When you've approved it, run
> **/spec {{feature-name}}** to branch, scaffold `specs/{{feature}}/`, and turn the
> proposed slices into a reviewable slice plan.
