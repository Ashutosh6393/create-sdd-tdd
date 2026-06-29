import { cp, readFile, writeFile } from 'node:fs/promises';
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
  await cp(templateDir, targetDir, { recursive: true });

  // Fill project-level placeholders in the root CLAUDE.md ONLY. Every other file —
  // including spec/_templates/ — is copied verbatim (see ADR-003).
  const claudeMdPath = join(targetDir, 'CLAUDE.md');
  const claudeMd = await readFile(claudeMdPath, 'utf8');
  const filled = claudeMd.replaceAll('{{PROJECT_NAME}}', options.projectName);
  await writeFile(claudeMdPath, filled);
}
