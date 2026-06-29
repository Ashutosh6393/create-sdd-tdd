# create-sdd — Decisions (ADRs)

Architecture Decision Records scoped to this feature. No project-wide `docs/adr/` exist
yet, so these are the first. Add new ones as real choices come up during the build.

---

## ADR-001: Repo restructure — `template/` (shipped) vs `src/` (CLI) vs root dogfooding

### Status
Accepted

### Context
The repo currently *is* the template at its root. We're building a CLI, in this same repo,
that bundles and copies that template — and we want to dogfood the spec-driven workflow to
build the CLI. We must separate "the files we ship" from "the CLI that ships them" from "the
CLI's own development specs," without those three colliding.

### Options considered
1. Template stays at root, CLI in a `cli/` subfolder — package include/exclude must carefully
   carve the root; repo root is a confusing mix of shipped + tooling files.
2. Separate CLI repo, sync template in at build time — clean separation but a sync step that
   drifts (rejected during grilling).
3. One repo: shipped template under `template/`, CLI under `src/`, the CLI's own feature
   spec/PRD at the repo root (`spec/create-sdd/`, `docs/prd/`).

### Decision
Option 3. `template/` holds the shipped content (`.claude/`, `spec/` workflow docs,
`CLAUDE.md`, `AI-BUILD-WORKFLOW.md`). `src/` holds the CLI. The CLI's own dogfooding specs
stay at the repo root and are NOT bundled. The package ships only `template/` (plus built
`dist/`).

### Consequences
- The template you edit is exactly what ships — zero drift.
- The restructure moves the *template's* `spec/_templates` to `template/spec/_templates`;
  our working `spec/create-sdd/` must stay at root. Easy to get wrong during the move — the
  `_templates`-verbatim test guards the bundled copy, but the move itself is manual care.
- After the move, the repo root no longer has a `CLAUDE.md`. Whether the CLI repo grows its
  own root `CLAUDE.md` for development is deferred (see `future-work.md`).

---

## ADR-002: One seam — `scaffold(options, targetDir)`; prompts are a thin adapter

### Status
Accepted

### Context
Prompt-driven CLIs are painful to test through a TTY. We want the copy+fill logic — the part
that must be correct — to be unit-testable without interaction.

### Options considered
1. One function that prompts AND copies AND fills — simplest call graph, but untestable
   without driving prompts.
2. Split: a pure-ish `scaffold(resolvedOptions, targetDir)` engine, with a thin CLI adapter
   that resolves options (arg parse → prompt) and then calls it.

### Decision
Option 2. `scaffold` takes fully-resolved options and touches the filesystem; it does no
prompting or arg parsing. The adapter above it carries no business logic.

### Consequences
- The engine is tested end-to-end against a temp dir (external behavior on disk).
- The adapter's only testable logic is option-resolution (prompts mocked); prompt I/O is not
  unit-tested.

---

## ADR-003: Placeholder fill is scoped to the root template `CLAUDE.md` only

### Status
Accepted

### Context
The template has two placeholder layers: project-level `{{...}}` in root `CLAUDE.md` (filled
now) and per-feature `{{...}}` in `spec/_templates/` (filled later by `/spec`). A naive
global find/replace would corrupt the `_templates` placeholders.

### Options considered
1. Global find/replace across all copied files — simplest, but silently destroys the
   `_templates` placeholders the workflow depends on.
2. Fill only the root `CLAUDE.md`; copy everything else byte-for-byte.

### Decision
Option 2. Substitution targets the root template `CLAUDE.md` exclusively. All other files —
`_templates/`, `AI-BUILD-WORKFLOW.md`, `.claude/`, `settings.json` — are copied verbatim.

### Consequences
- The single biggest correctness risk is contained and is asserted by a mandatory
  regression test from Slice 1 onward.
- Adding future project-level placeholders means adding them to root `CLAUDE.md` and to the
  fill map — not a new mechanism.
