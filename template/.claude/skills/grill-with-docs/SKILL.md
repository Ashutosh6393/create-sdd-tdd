---
name: grill-with-docs
description: A relentless interview to align on an idea BEFORE any code, producing pipeline-ready docs (domain glossary + ADRs) as it goes. This is Phase 1 of the build pipeline; its output feeds /to-prd.
disable-model-invocation: true
---

# Grill With Docs — Phase 1 (Alignment QA)

Your job is to close the translation gap **before** it becomes code. Interrogate the
user's idea until you and they describe the feature identically, then persist what was
decided as durable docs the rest of the pipeline consumes.

Do NOT write any production code. Do NOT write a PRD here. This phase produces
*understanding* + *docs only*.

## How to grill

Explore the repo first so your questions are grounded in the actual codebase, not generic.

Then interrogate. Rules of the interrogation:

- **One sharp question at a time.** Wait for the answer before the next. No questionnaires.
- **Hunt the ambiguity.** When an answer is vague, drill in. "It should be fast" -> "fast
  meaning what p95, under what load?"
- **Force the edge cases.** Empty states, concurrency, failure/timeout, permissions,
  the largest realistic input, the malicious input.
- **Name the non-goals.** Make the user say out loud what this is explicitly NOT doing.
- **Surface the seams.** Ask where the behavior will be observable — that's where tests
  will live. Push toward the **highest seam, fewest seams** (ideal: one).
- **Challenge, don't flatter.** If the idea has a simpler shape or a contradiction, say so.
- **Reflect back.** Periodically restate your current understanding in one paragraph and
  ask "is this right?" Convergence is when the user stops correcting you.

## Exit gate (do not finish until ALL are true)

- [ ] The problem fits in one sentence, and the user agrees with your phrasing of it.
- [ ] Edge cases, failure modes, and explicit non-goals are listed.
- [ ] The test seam(s) are identified.
- [ ] Every open question is either answered or consciously deferred to future work.

## On convergence — write the docs

Persist the outcome so /to-prd and /spec can build on it without re-litigating:

### 1. `docs/glossary.md` (create or extend)

Every domain term that came up, defined precisely and unambiguously. This becomes the
shared vocabulary the PRD and spec MUST reuse verbatim.

```markdown
# Domain Glossary

- **{{Term}}**: {{precise definition}}. {{Note any term it is often confused with.}}
- **{{Term}}**: ...
```

### 2. `docs/adr/ADR-{NNN}-{slug}.md` (one file per real architectural decision)

Only for genuine decisions where an alternative was rejected — not every detail. Number
sequentially, continuing from any existing ADRs.

```markdown
# ADR-{NNN}: {{Decision title}}

## Status
Accepted

## Context
{{What forced a decision? What constraints applied?}}

## Options considered
1. {{Option A}} — {{pros / cons}}
2. {{Option B}} — {{pros / cons}}

## Decision
{{What was chosen and why.}}

## Consequences
- {{What this makes easy, hard, or commits us to.}}
```

### 3. Alignment summary (in chat, not a file)

A short recap: the one-sentence problem, the agreed seam(s), the non-goals, and a pointer
to the glossary terms and ADR numbers you just wrote.

## Hand off

End your turn by telling the user:

> Alignment captured. Glossary and ADRs written. When you're ready, run **/to-prd** to
> synthesize this into a PRD — I won't re-interview you, I'll just synthesize what we've
> agreed here.
