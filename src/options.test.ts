import { describe, expect, it } from 'vitest';
import { defaultProjectName, parseArgs, resolveOptions, type Asker } from './options.js';

describe('parseArgs', () => {
  it('takes the first positional argument as the target directory', () => {
    expect(parseArgs(['my-app'])).toEqual({ targetDir: 'my-app' });
  });

  it('returns no target directory when none is given', () => {
    expect(parseArgs([])).toEqual({ targetDir: undefined });
  });
});

describe('defaultProjectName', () => {
  it('derives the project name from the directory basename', () => {
    expect(defaultProjectName('some/path/my-app')).toBe('my-app');
  });
});

describe('resolveOptions', () => {
  it('uses the dir arg, defaults the name to its basename, and omits cleared stack fields', async () => {
    // Simulate a user who accepts every default (returns the initialValue) but clears the
    // Database and Lint lines (returns empty).
    const ask: Asker = async (message, initialValue) => {
      if (message === 'One-line description') return 'a tiny app';
      if (message === 'Database / ORM' || message === 'Lint / format') return '';
      return initialValue ?? '';
    };

    const { targetDir, options } = await resolveOptions(['some/path/my-app'], ask);

    expect(targetDir).toBe('some/path/my-app');
    expect(options.projectName).toBe('my-app');
    expect(options.description).toBe('a tiny app');
    // accepted defaults keep the example value
    expect(options.stack?.language).toBe('TypeScript (strict), Bun');
    // cleared fields are omitted so scaffold writes a {{TODO: …}} marker
    expect(options.stack).not.toHaveProperty('database');
    expect(options.stack).not.toHaveProperty('lint');
  });

  it('prompts for the target directory when no positional arg is given', async () => {
    const ask: Asker = async (message) =>
      message === 'Project directory' ? 'prompted-dir' : '';

    const { targetDir } = await resolveOptions([], ask);

    expect(targetDir).toBe('prompted-dir');
  });
});
