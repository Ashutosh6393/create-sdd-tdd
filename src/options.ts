import { basename, resolve } from 'node:path';
import {
  STACK_PLACEHOLDERS,
  type ScaffoldOptions,
  type StackField,
} from './scaffold.js';

export interface ParsedArgs {
  targetDir: string | undefined;
}

// Asks one question, optionally offering an editable default. Injected so option resolution
// can be tested without a real terminal (see ADR-002).
export type Asker = (message: string, initialValue?: string) => Promise<string>;

// Parse CLI arguments. v1 has a single positional: the target directory.
export function parseArgs(args: string[]): ParsedArgs {
  return { targetDir: args[0] };
}

// Default the project name to the target directory's basename.
export function defaultProjectName(targetDir: string): string {
  return basename(resolve(targetDir));
}

// Strip the {{e.g. … }} wrapper to get the example shown as an editable prompt default.
function exampleFor(placeholder: string): string {
  return placeholder.replace(/^\{\{e\.g\. /, '').replace(/\}\}$/, '');
}

// Resolve the target directory and ScaffoldOptions by asking the user. The directory comes
// from the positional arg or a prompt; the name defaults to the dir basename; each stack
// line offers its template example as an editable default, and a cleared (empty) answer is
// omitted so scaffold writes a {{TODO: …}} marker instead of a fake value.
export async function resolveOptions(
  argv: string[],
  ask: Asker,
): Promise<{ targetDir: string; options: ScaffoldOptions }> {
  const { targetDir: argDir } = parseArgs(argv);
  const targetDir = argDir ?? (await ask('Project directory'));

  const projectName = await ask('Project name', defaultProjectName(targetDir));
  const description = await ask('One-line description');

  const stack: Partial<Record<StackField, string>> = {};
  for (const field of Object.keys(STACK_PLACEHOLDERS) as StackField[]) {
    const { placeholder, label } = STACK_PLACEHOLDERS[field];
    const answer = (await ask(label, exampleFor(placeholder))).trim();
    if (answer) stack[field] = answer;
  }

  return { targetDir, options: { projectName, description, stack } };
}
