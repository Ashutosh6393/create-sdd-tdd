# create-sdd — Design

Source of truth for what to build and how. Derived from the approved PRD
(`docs/prd/create-sdd.md`). No project glossary or `docs/adr/` exist yet, so this spec
establishes the first ADRs in `decisions.md`.

## Problem (recap from PRD)

Starting a new project from this spec-driven-development + TDD template means copying its
files by hand and editing root `CLAUDE.md` to fill project-level placeholders — slow,
error-prone, and dangerously easy to disturb the per-feature `{{...}}` placeholders in
`spec/_templates/` that must stay blank until `/spec` fills them. We want one command,
`npx create-sdd <dir>`, that copies the template into a new project and interactively fills
only the things known at project start (name, description, tech stack).

## Scope

In scope:
- A Node/TypeScript CLI published to npm, invoked `npx create-sdd <dir>`.
- The bundled template lives in `template/`; the CLI copies from there.
- A `scaffold` engine that copies the template into an empty target dir and fills the
  project-level placeholders in the **root template `CLAUDE.md` only**.
- Interactive prompts (`@clack/prompts`) for project name, one-line description, and the 8
  tech-stack lines, with the `e.g. …` examples as editable defaults and blank → `{{TODO: …}}`.
- Refuse to scaffold into a non-empty directory.
- Print a success summary + next-steps handoff (`cd <dir>`, run `/grill-with-docs`).

Out of scope: see `future-work.md` (git init, dependency install, `--here`/`--force`,
network/`--ref`, TODO-listing in the success message, npm publishing).

## Repo restructure (enabling change, lands in Slice 1)

The repo currently *is* the template at its root. We split it so the shipped template and
the CLI that ships it are clearly separated, and so we can dogfood the workflow to build
the CLI:

| Path | Role |
|------|------|
| `template/` | The **shipped** template: `template/.claude/`, `template/spec/` (the workflow docs `_templates/`, `README.md`, `SPEC-WORKFLOW.md`), `template/CLAUDE.md`, `template/AI-BUILD-WORKFLOW.md`. This is what the package bundles and copies. |
| `src/` | The CLI source (`scaffold`, CLI adapter). |
| `spec/create-sdd/` (repo root) | The CLI's **own** feature spec — dogfooding. Stays at root; NOT shipped inside `template/`. |
| `docs/prd/` (repo root) | The CLI's own PRD. Stays at root; not shipped. |

Critical: the restructure moves the *template's* `spec/_templates` to
`template/spec/_templates`. Our working `spec/create-sdd/` and `docs/prd/` remain at the
repo root. (See ADR-001.)

## Contracts & interfaces

The one boundary that matters is the scaffold engine. Prose-precise shape:

```ts
type StackField =
  | 'language' | 'framework' | 'database' | 'validation'
  | 'state' | 'testing' | 'lint' | 'localDev';

interface ScaffoldOptions {
  projectName: string;            // required; CLI defaults it to the dir basename
  description: string;            // required (may be empty string)
  stack: Partial<Record<StackField, string>>; // omitted/blank field → {{TODO: <field>}}
}

// Copies template/ into targetDir and fills root CLAUDE.md only.
// Throws if targetDir exists and is non-empty.
function scaffold(options: ScaffoldOptions, targetDir: string): Promise<void>;
```

`scaffold` takes **fully-resolved** options — it does no prompting and no arg parsing. The
CLI adapter resolves options (parse arg → prompt for missing) and then calls it.

## Seam(s)

**One seam: `scaffold(options, targetDir)`**, tested end-to-end against a unique temp
directory. Tests assert on the resulting filesystem (files present, root `CLAUDE.md`
contents, `_templates` untouched) — external behavior, never internals. The CLI adapter and
prompt I/O sit *above* the seam and carry no business logic, so they aren't driven through a
real TTY in tests; option-resolution is the only adapter logic worth a unit test.

---

## Slice Plan

Vertical, surgical, independently shippable slices in implementation order. A non-TDD prep
step (Slice 0) lays the rails; the walking skeleton (Slice 1) then lands the first test and
carries the riskiest guard (the `_templates` verbatim rule) from day one. (Slice *status*
lives in `implementation.md`.)

### Slice 0 — Prep: repo restructure + project skeleton (no production code, no tests)
- **Seam:** none — this is enabling infrastructure, not behavior. It deliberately contains
  no production logic, so there is nothing to test-drive; the first failing test arrives in
  Slice 1.
- **Blast radius:** move existing template content under `template/` (per ADR-001:
  `.claude/`, `spec/_templates`, `spec/README.md`, `spec/SPEC-WORKFLOW.md`, `CLAUDE.md`,
  `AI-BUILD-WORKFLOW.md` → `template/…`); add `package.json`, `tsconfig.json` (strict),
  `vitest.config.ts`, `tsup.config.ts`. Do NOT move `spec/create-sdd/` or `docs/`.
- **Acceptance (mechanical, not a behavior test):** `npm install` succeeds; `vitest run`
  runs and reports 0 tests; `tsc --noEmit` passes; the full shipped template exists under
  `template/` (incl. `template/.claude/` and the empty `settings.json`) and the repo root no
  longer holds the moved files; `spec/create-sdd/` and `docs/prd/` are untouched at root.

### Slice 1 — Walking skeleton: copy the bundled template + fill the project name
- **Depends on:** Slice 0
- **Seam:** `scaffold(options, targetDir)` — the first test lands here.
- **Blast radius:** `src/scaffold.ts` + `src/scaffold.test.ts` only.
- **Acceptance:** given an empty temp dir and `{ projectName: 'demo' }`, after `scaffold`
  the dir contains the full `template/` tree including `.claude/` and the empty
  `settings.json`; root `CLAUDE.md` has `demo` substituted for `{{PROJECT_NAME}}`; and — the
  risk guard — every file under `spec/_templates/` is byte-identical to the bundled
  template (its `{{Feature Name}}`-style placeholders are NOT touched).

### Slice 2 — Refuse a non-empty target directory
- **Depends on:** Slice 1
- **Seam:** `scaffold(options, targetDir)`.
- **Blast radius:** `src/scaffold.ts`, `src/scaffold.test.ts`.
- **Acceptance:** calling `scaffold` against a dir that exists and contains any file rejects
  with a clear error and writes nothing; against a new or empty dir it proceeds. (No partial
  writes on rejection.)

### Slice 3 — Fill the description and 8 stack lines; blanks become TODO markers
- **Depends on:** Slice 1
- **Seam:** `scaffold(options, targetDir)`.
- **Blast radius:** `src/scaffold.ts`, `src/scaffold.test.ts` (and a small options/types
  module if extracted).
- **Acceptance:** provided `description` and each provided `stack` field are substituted
  into root `CLAUDE.md`; an omitted/blank stack field is written as `{{TODO: <field-label>}}`
  (a visibly-unfilled marker, not a fake value); `spec/_templates/` remains byte-identical.

### Slice 4 — CLI adapter: arg parse + prompts + wiring + next-steps message
- **Depends on:** Slices 1–3
- **Seam:** option-resolution unit (prompts mocked); the rest is a thin shell over `scaffold`.
- **Blast radius:** `src/cli.ts` (bin entry), `package.json` (`bin` field), an
  option-resolution helper + its test.
- **Acceptance:** `<dir>` arg is parsed; when omitted the user is prompted for it; project
  name defaults to the dir basename; name/description/stack are prompted via `@clack` with
  `e.g.` defaults; on completion the CLI calls `scaffold`, prints a success summary and the
  handoff (`cd <dir>`, run `/grill-with-docs`); a cancelled prompt aborts before any files
  are written and exits non-zero. Verified by option-resolution unit tests (dir → default
  name; provided values) plus a manual `node . my-app` smoke run — prompt I/O itself is not
  unit-tested (per Testing decisions).

---

## Testing decisions

- Test external behavior at the `scaffold` seam; never implementation details. Inputs are
  resolved `ScaffoldOptions`; outputs are files on disk.
- Pattern to establish (no prior art — repo is docs-only today): each test creates a unique
  temp dir, runs `scaffold` into it, asserts on the resulting files, and cleans up. Vitest is
  the oracle (matches the template's own designated test framework).
- Modules under test: `scaffold` directly. The CLI adapter's only testable logic is
  option-resolution (with prompts mocked); the prompt I/O is not driven through a real TTY.
- The `_templates`-verbatim regression assertion is mandatory from Slice 1 and must remain
  green in every later slice — it is the single biggest correctness guard.
