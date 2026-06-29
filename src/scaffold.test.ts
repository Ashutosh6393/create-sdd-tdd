import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
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
});
