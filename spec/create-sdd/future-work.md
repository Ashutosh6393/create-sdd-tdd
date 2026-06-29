# create-sdd — Future Work

Ideas and items deliberately deferred. When the loop hits something outside the current
slice's blast radius, it lands here instead of expanding the slice.

## Enhancements
- `--here` flag to scaffold into the current/existing directory (for adding the workflow to
  an existing project).
- `--force` to scaffold into a non-empty dir, skipping files that already exist.
- Fetch the template from GitHub at runtime + `--ref <branch/tag>` to pick a version
  (currently bundled-only).
- List the remaining `{{TODO: …}}` placeholders in the success output (v1 prints next-steps
  guidance only).
- Generate an `AGENTS.md` pointer in scaffolded feature folders (referenced by
  `template/spec/README.md` but not present in `_templates` today).

## Technical debt
- After the restructure (ADR-001) the repo root loses its `CLAUDE.md`. Decide whether the
  CLI repo grows its own root `CLAUDE.md` for development (separate from the shipped
  `template/CLAUDE.md`).
- This repo is not a git repository yet; `/build-slice` expects a `feat/create-sdd` branch.

## Nice to have
- `git init` + initial commit after scaffolding.
- Dependency install for the chosen stack after scaffolding.
- Publish `create-sdd` to npm (build/release pipeline) — confirm the name is available first.
