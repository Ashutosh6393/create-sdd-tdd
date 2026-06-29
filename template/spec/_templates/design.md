# {{Feature Name}} — Design

Source of truth for what to build and how. Derived from the approved PRD. Use glossary
terms verbatim and respect the ADRs in `decisions.md` / `docs/adr/`.

## Problem (recap from PRD)

{{One paragraph, user's perspective.}}

## Scope

In scope: {{...}}
Out of scope: {{see future-work.md}}

## Contracts & interfaces

{{The shapes that cross boundaries — schemas, API request/response, message types,
module interfaces. Decisions, not file paths. Inline a precise snippet only when prose
can't capture it (a type, schema, or state machine).}}

## Seam(s)

{{Where behavior is observed and tested. Highest seam, fewest seams — ideally one. Name
existing seams reused.}}

---

## Slice Plan

Vertical, surgical, independently shippable slices in implementation order. The walking
skeleton lands first; risk is front-loaded. (Slice *status* is tracked in
`implementation.md`, not here.)

### Slice 1 — Walking skeleton: {{thinnest end-to-end behavior}}
- **Seam:** {{where its test observes behavior}}
- **Blast radius:** {{files/modules this slice may touch — nothing else}}
- **Acceptance:** {{observable behavior that proves it works}}

### Slice 2 — {{next thin behavior}}
- **Depends on:** Slice 1
- **Seam:** {{...}}
- **Blast radius:** {{...}}
- **Acceptance:** {{...}}

### Slice 3 — {{...}}
- ...

---

## Testing decisions

- Test external behavior at the seam above; never implementation details.
- Modules under test: {{...}}
- Prior art to mirror: {{similar tests already in the repo}}
