# PRD: create-sdd — a CLI to scaffold the spec-driven-development template

> Status: ready-for-agent
> Source: synthesized from the `/grill-me` session on the template repo.
> Note: no external issue tracker is configured for this repo, so this PRD lives in-repo.

## Problem Statement

I have a reusable project template that encodes a full AI build workflow — spec-driven
development plus TDD (red → green → refactor). It ships `.claude/` commands and skills,
a `spec/` workflow with per-feature `_templates/`, and root `CLAUDE.md` /
`AI-BUILD-WORKFLOW.md` guidance.

To start a new project with it today, I have to manually copy the template files into a new
directory and hand-edit `CLAUDE.md` to fill in project-level placeholders (project name,
description, tech stack). This is slow, error-prone, and easy to get wrong — in particular,
it's easy to accidentally disturb the per-feature `{{...}}` placeholders in `spec/_templates/`
that are *meant* to stay blank until the `/spec` command fills them later.

## Solution

A small CLI, `create-sdd`, published to npm and run with `npx create-sdd <dir>`. It scaffolds
a new project from the bundled template in one command: it creates the target directory, copies
the template, interactively asks for the handful of things I genuinely know at project start
(name, one-line description, tech stack), writes those into the root `CLAUDE.md`, and leaves
everything else — features, architecture, and all the per-feature templates — untouched as
guided placeholders for the workflow (`/grill-with-docs`, `/to-prd`, `/spec`) to discover later.
When it finishes, it tells me exactly what to do next.

## User Stories

1. As a developer starting a new project, I want to run a single `npx create-sdd my-app`
   command, so that I get the whole spec-driven workflow scaffold without copying files by hand.
2. As a developer, I want the CLI to create a new `./my-app` directory and scaffold into it,
   so that my new project is cleanly isolated from where I ran the command.
3. As a developer, I want to omit the directory argument and be prompted for it, so that I'm
   not forced to remember the exact argument order.
4. As a developer, I want the project name to default to the target directory name, so that I
   can just press enter in the common case.
5. As a developer, I want to be prompted for a one-line project description, so that the root
   `CLAUDE.md` reflects what I'm building from the first commit.
6. As a developer, I want to be prompted for each of the 8 tech-stack lines (language/runtime,
   framework(s), database/ORM, validation, state/data, testing, lint/format, local dev), so
   that `CLAUDE.md` describes the stack I actually chose.
7. As a developer, I want each stack prompt to show the template's `e.g. …` example as an
   editable default, so that I can accept, tweak, or replace it quickly.
8. As a developer who hasn't decided a given stack line yet, I want to leave a stack prompt
   blank, so that the CLI writes a clearly-marked `{{TODO: …}}` placeholder instead of a fake
   value I'd have to remember to fix.
9. As a developer, I do NOT want to be asked about features or architecture during scaffolding,
   so that those decisions are deferred to `/grill-with-docs` where they belong.
10. As a developer, I want the per-feature `spec/_templates/` placeholders to be copied
    verbatim, so that the later `/spec` command can fill them as designed.
11. As a developer, I want the CLI to refuse to scaffold into a non-empty directory, so that I
    never accidentally clobber existing work.
12. As a developer, I want the CLI to copy hidden files like `.claude/` and the empty
    `settings.json`, so that the workflow tooling is present in the new project.
13. As a developer, I want a clear success summary when scaffolding completes, so that I know
    it worked and which files were created.
14. As a developer, I want the success message to tell me to `cd my-app` and run
    `/grill-with-docs`, so that I'm handed straight into the next step of the pipeline.
15. As a developer on Windows, macOS, or Linux, I want the CLI to behave identically, so that
    the template is portable across my machines.
16. As a developer, I want the CLI to only require Node (via `npx`), so that I don't have to
    install a new toolchain to use it.
17. As a maintainer of the template, I want the template content and the CLI to live in one
    repo, so that the files I edit are exactly the files that ship — no sync/drift step.
18. As a maintainer, I want the placeholder fill to be scoped strictly to root `CLAUDE.md`, so
    that no global find/replace can corrupt the `_templates/` placeholders.
19. As a maintainer, I want the copy+fill engine separated from the interactive prompts, so
    that I can unit-test the engine against a temp directory without a TTY.
20. As a developer, I want the CLI to exit non-zero with a readable error when it refuses
    (e.g. non-empty dir), so that I can script around it and trust its exit codes.
21. As a developer who cancels a prompt (Ctrl-C), I want the CLI to abort cleanly without
    leaving a half-written directory, so that I can re-run from a clean state.

## Implementation Decisions

- **Runtime / distribution:** TypeScript (strict), built to ESM with `tsup`, published to npm,
  invoked as `npx create-sdd <dir>`. Node is the only runtime requirement.
- **Repo restructure:** this repo is reorganized so template content moves under `template/`
  (`template/.claude/`, `template/spec/`, `template/CLAUDE.md`,
  `template/AI-BUILD-WORKFLOW.md`) and CLI source lives under `src/`. The npm package bundles
  `template/`. One repo, zero drift.
- **Template source:** bundled inside the package; the CLI copies from its own install
  directory. Works offline, version-locked to the CLI.
- **Core module — `scaffold`:** a single function that accepts fully-resolved options
  (target dir, project name, description, the 8 stack values) and performs:
  (a) empty-dir validation, (b) recursive copy of `template/` including dotfiles, (c) scoped
  placeholder fill of root `CLAUDE.md` only, returning a result describing files written and
  TODO placeholders left. This is the testable seam.
- **Resolved options shape (from the design discussion):** each stack value is either a
  user-provided string or "unfilled". Unfilled stack values are written as `{{TODO: <field>}}`;
  provided values replace the corresponding `{{e.g. …}}` token. Project name and description
  are required (project name defaults to the dir basename).
- **Prompt layer:** a thin adapter using `@clack/prompts` resolves options (arg parse → dir
  prompt if missing → name/description/stack prompts) and then calls `scaffold`. It contains no
  copy/fill logic. Cancellation aborts before any files are written.
- **Placeholder-fill scoping:** replacement targets root `CLAUDE.md` exclusively. The
  `spec/_templates/` tree and `AI-BUILD-WORKFLOW.md` (which has no placeholders) are copied
  byte-for-byte. This is a hard rule, not an optimization.
- **Directory safety:** if the target exists and is non-empty, abort with a clear message and
  non-zero exit. Proceed only into a new or empty directory.
- **Out-of-scope side effects:** no `git init`, no dependency install in v1 (kept to copy +
  interactive fill).
- **Post-scaffold:** print a success summary plus next-steps guidance (`cd <dir>`, run
  `/grill-with-docs`).

## Testing Decisions

- **What makes a good test here:** assert *external behavior* — the state of the filesystem
  after `scaffold` runs against a temp directory — never internal helpers or the prompt
  library's internals. Inputs are resolved options; outputs are files on disk and the returned
  result.
- **Primary seam under test:** `scaffold(options, targetDir)`. This is the single, highest
  seam. Representative cases:
  - Given a fresh temp dir + provided name/description/stack, the new dir contains the full
    template tree, including `.claude/` and the empty `settings.json`.
  - Root `CLAUDE.md` has the provided name, description, and stack values substituted.
  - Blank stack values produce `{{TODO: <field>}}` markers in root `CLAUDE.md`.
  - **Regression guard:** files under `spec/_templates/` are byte-identical to the bundled
    template — their `{{Feature Name}}`-style placeholders are NOT replaced.
  - A non-empty target dir is refused (throws / returns an error result), and no files are
    written.
  - The returned result lists the files written and the TODO placeholders remaining.
- **Modules tested:** `scaffold` (engine) directly. The prompt adapter is a thin shell with no
  business logic; if covered at all, it's via option-resolution unit tests with prompts mocked,
  not by driving a real TTY.
- **Prior art to mirror:** none in this repo yet (it's docs-only today). The Vitest +
  temp-directory pattern (create a unique temp dir per test, run `scaffold` into it, assert on
  disk, clean up) is the convention to establish. Vitest is chosen deliberately to match the
  template's own designated test oracle.

## Out of Scope

- `git init`, initial commit, or any VCS action.
- Dependency installation or running the chosen stack's package manager.
- Fetching the template from GitHub at runtime, `--ref`/version selection, or any network
  access (template is bundled).
- Scaffolding into the current/existing directory (`--here`) or a `--force` override for
  non-empty dirs.
- Prompting for features or architecture — deferred to `/grill-with-docs` by design.
- Filling placeholders in any file other than root `CLAUDE.md`.
- Generating an `AGENTS.md` pointer file (referenced by `spec/README.md` but not present in the
  template today).
- Publishing the package to npm as part of this work (build/release is a separate concern).

## Further Notes

- The single biggest correctness risk is placeholder scoping: a naive global find/replace would
  corrupt the `spec/_templates/` placeholders. The verbatim-`_templates` regression test is the
  guard and should exist from Slice 1.
- The chosen name `create-sdd` (Spec-Driven Development) follows the npm `create-<thing>`
  convention so `npx create-sdd` resolves automatically. npm availability should be confirmed
  before first publish.
- Natural next pipeline step: `/spec create-sdd` to branch and turn these decisions into a
  reviewable slice plan. A likely Slice 1 (walking skeleton) is: copy the bundled template into
  an empty temp dir and fill root `CLAUDE.md` with a provided project name — proven by the
  filesystem assertions above.
