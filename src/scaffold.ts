import { cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type StackField =
  | 'language'
  | 'framework'
  | 'database'
  | 'validation'
  | 'state'
  | 'testing'
  | 'lint'
  | 'localDev';

export interface ScaffoldOptions {
  projectName: string;
  description?: string;
  stack?: Partial<Record<StackField, string>>;
}

const here = dirname(fileURLToPath(import.meta.url));
const templateDir = join(here, '..', 'template');

// Maps each stack field to its exact placeholder in template/CLAUDE.md and the human label
// used in the {{TODO: …}} marker left for unfilled fields.
export const STACK_PLACEHOLDERS: Record<StackField, { placeholder: string; label: string }> = {
  language: { placeholder: '{{e.g. TypeScript (strict), Bun}}', label: 'Language / runtime' },
  framework: { placeholder: '{{e.g. Next.js, Express}}', label: 'Framework(s)' },
  database: { placeholder: '{{e.g. PostgreSQL + Drizzle (NOT Prisma)}}', label: 'Database / ORM' },
  validation: {
    placeholder: '{{e.g. Zod at every trust boundary; shared schema package}}',
    label: 'Validation',
  },
  state: {
    placeholder: '{{e.g. TanStack Query for server state, Zustand for UI state}}',
    label: 'State / data',
  },
  testing: { placeholder: '{{e.g. Vitest}}', label: 'Testing' },
  lint: { placeholder: '{{e.g. Biome}}', label: 'Lint / format' },
  localDev: { placeholder: '{{e.g. Docker Compose + turbo dev}}', label: 'Local dev' },
};

export async function scaffold(
  options: ScaffoldOptions,
  targetDir: string,
): Promise<void> {
  await assertTargetIsEmpty(targetDir);

  await cp(templateDir, targetDir, { recursive: true });

  // Fill project-level placeholders in the root CLAUDE.md ONLY. Every other file —
  // including spec/_templates/ — is copied verbatim (see ADR-003).
  const claudeMdPath = join(targetDir, 'CLAUDE.md');
  const claudeMd = await readFile(claudeMdPath, 'utf8');
  let filled = claudeMd.replaceAll('{{PROJECT_NAME}}', options.projectName);
  if (options.description !== undefined) {
    filled = filled.replaceAll('{{one-line description}}', options.description);
  }
  for (const field of Object.keys(STACK_PLACEHOLDERS) as StackField[]) {
    const { placeholder, label } = STACK_PLACEHOLDERS[field];
    const value = options.stack?.[field]?.trim();
    filled = filled.replaceAll(placeholder, value ? value : `{{TODO: ${label}}}`);
  }
  await writeFile(claudeMdPath, filled);
}

// Refuse to scaffold into a directory that already has contents, so we never clobber or
// merge into existing work. A missing directory is fine — cp creates it.
async function assertTargetIsEmpty(targetDir: string): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(targetDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw error;
  }
  if (entries.length > 0) {
    throw new Error(`Target directory is not empty: ${targetDir}`);
  }
}
