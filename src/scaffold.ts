import { cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface ScaffoldOptions {
  projectName: string;
}

const here = dirname(fileURLToPath(import.meta.url));
const templateDir = join(here, '..', 'template');

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
  const filled = claudeMd.replaceAll('{{PROJECT_NAME}}', options.projectName);
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
