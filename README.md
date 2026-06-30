# create-sdd-tdd

Scaffold a **spec-driven-development + TDD** project in one command.

```bash
npx create-sdd-tdd my-app
```

`create-sdd-tdd` drops a ready-to-use AI build workflow into a new directory: the spec
templates, the `/grill-with-docs → /to-prd → /spec → /build-slice` command pipeline, and a
root `CLAUDE.md` it fills in for you (project name, one-line description, tech stack). The
parts that should emerge from discovery — features and architecture — are left as guided
placeholders for the workflow to fill later.

## Usage

```bash
npx create-sdd-tdd <dir>
```

- Pass a target directory: `npx create-sdd-tdd my-app` creates `./my-app`.
- Omit it and you'll be prompted for one.
- The project name defaults to the directory's basename — press enter to accept.

You'll be asked for:

| Prompt | Notes |
|--------|-------|
| Project name | Defaults to the directory basename. |
| One-line description | A short summary of what you're building. |
| 8 tech-stack lines | Language/runtime, framework, database/ORM, validation, state, testing, lint/format, local dev. Each offers its template example as an editable default. |

Each stack line shows an example as an editable default. **Accept it, overwrite it, or clear
it** — a cleared line is written as a `{{TODO: …}}` marker so you can see at a glance what's
still undecided. Features and architecture stay as placeholders on purpose; `/grill-with-docs`
is where you discover them.

When it finishes:

```
cd my-app
# then run /grill-with-docs to align the idea
```

## What gets scaffolded

```
my-app/
├─ CLAUDE.md              # project guide — name/description/stack filled in for you
├─ AI-BUILD-WORKFLOW.md   # the full idea→ship pipeline
├─ .claude/
│  ├─ commands/           # /spec, /build-slice
│  ├─ skills/             # grill-with-docs, to-prd
│  └─ settings.json
└─ spec/
   ├─ README.md
   ├─ SPEC-WORKFLOW.md
   └─ _templates/         # per-feature spec scaffolding (filled later by /spec)
```

## The workflow it sets up

```
/grill-with-docs  →  /to-prd  →  /spec {feature}  →  /build-slice {feature} (×N)  →  close
   (align)            (PRD)        (branch + spec)      (red→green→refactor loop)
```

Humans gate the phases; the agent runs autonomously only inside one vertical slice's
red→green→refactor loop, where "done" is machine-checkable. See the scaffolded
`AI-BUILD-WORKFLOW.md` and `spec/SPEC-WORKFLOW.md` for the full description.

## Behavior & safety

- **Refuses to scaffold into a non-empty directory** — it never clobbers or merges into
  existing work, and writes nothing if it has to bail.
- **Only the root `CLAUDE.md` is filled.** Every other file — including `spec/_templates/` —
  is copied byte-for-byte, so the per-feature placeholders survive for `/spec` to use.

## Requirements

- Node.js >= 18.

## Out of scope (today)

No `git init`, dependency install, `--here`/`--force`, or fetching the template over the
network — the template is bundled in the package. These may come later.

## Development

This repo is built with its own workflow (it dogfoods the template). See
[`CLAUDE.md`](./CLAUDE.md) for the engineering guide.

```bash
npm install
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # tsup → dist/cli.js
```

## License

MIT
