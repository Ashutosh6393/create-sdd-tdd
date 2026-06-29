import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scaffold } from './scaffold.js';

const here = dirname(fileURLToPath(import.meta.url));
const bundledTemplatesDir = join(here, '..', 'template', 'spec', '_templates');

let target: string;

beforeEach(async () => {
  target = await mkdtemp(join(tmpdir(), 'create-sdd-test-'));
});

afterEach(async () => {
  await rm(target, { recursive: true, force: true });
});

describe('scaffold', () => {
  it('copies the bundled template into the target directory', async () => {
    await scaffold({ projectName: 'demo' }, target);

    expect(existsSync(join(target, 'AI-BUILD-WORKFLOW.md'))).toBe(true);
    expect(existsSync(join(target, 'CLAUDE.md'))).toBe(true);
    // hidden files and the empty settings.json must come along
    expect(existsSync(join(target, '.claude', 'settings.json'))).toBe(true);
    const settings = await readFile(join(target, '.claude', 'settings.json'), 'utf8');
    expect(settings).toBe('');
  });

  it('fills {{PROJECT_NAME}} in the root CLAUDE.md with the project name', async () => {
    await scaffold({ projectName: 'demo' }, target);

    const claudeMd = await readFile(join(target, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('**demo**');
    expect(claudeMd).not.toContain('{{PROJECT_NAME}}');
  });

  it('copies spec/_templates byte-for-byte, leaving its placeholders untouched', async () => {
    await scaffold({ projectName: 'demo' }, target);

    const files = await readdir(bundledTemplatesDir);
    expect(files.length).toBeGreaterThan(0);

    const scaffoldedTemplatesDir = join(target, 'spec', '_templates');
    for (const file of files) {
      const original = await readFile(join(bundledTemplatesDir, file), 'utf8');
      const copied = await readFile(join(scaffoldedTemplatesDir, file), 'utf8');
      expect(copied, `${file} must be copied verbatim`).toBe(original);
    }
  });

  it('fills the one-line description in the root CLAUDE.md', async () => {
    await scaffold({ projectName: 'demo', description: 'a tiny app' }, target);

    const claudeMd = await readFile(join(target, 'CLAUDE.md'), 'utf8');
    expect(claudeMd).toContain('a tiny app');
    expect(claudeMd).not.toContain('{{one-line description}}');
  });

  it('fills provided stack lines and writes {{TODO: …}} for blank or omitted ones', async () => {
    await scaffold(
      {
        projectName: 'demo',
        description: 'x',
        stack: { language: 'Rust', testing: 'Jest', lint: '' },
      },
      target,
    );

    const claudeMd = await readFile(join(target, 'CLAUDE.md'), 'utf8');

    // provided values substituted
    expect(claudeMd).toContain('**Language / runtime**: Rust');
    expect(claudeMd).toContain('**Testing**: Jest');
    // every stack placeholder is resolved (none of the eight {{e.g. …}} tokens remain)
    expect(claudeMd).not.toContain('{{e.g.');
    // blank value → TODO marker
    expect(claudeMd).toContain('**Lint / format**: {{TODO: Lint / format}}');
    // omitted field → TODO marker
    expect(claudeMd).toContain('**Database / ORM**: {{TODO: Database / ORM}}');
  });

  it('refuses to scaffold into a non-empty directory and writes nothing', async () => {
    await writeFile(join(target, 'pre-existing.txt'), 'keep me');

    await expect(scaffold({ projectName: 'demo' }, target)).rejects.toThrow();

    // no template content was written
    expect(existsSync(join(target, 'CLAUDE.md'))).toBe(false);
    expect(existsSync(join(target, '.claude'))).toBe(false);
    // the pre-existing file is untouched
    expect(await readFile(join(target, 'pre-existing.txt'), 'utf8')).toBe('keep me');
  });
});
