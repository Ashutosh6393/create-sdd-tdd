#!/usr/bin/env node
import { cancel, intro, isCancel, outro, text } from '@clack/prompts';
import { scaffold } from './scaffold.js';
import { resolveOptions, type Asker } from './options.js';

// The real terminal asker: clack text prompt, aborting cleanly (before any write) on cancel.
const ask: Asker = async (message, initialValue) => {
  const value = await text({ message, initialValue });
  if (isCancel(value)) {
    cancel('Cancelled. No files were written.');
    process.exit(1);
  }
  return value;
};

async function main(): Promise<void> {
  intro('create-sdd — scaffold a spec-driven-development project');

  const { targetDir, options } = await resolveOptions(process.argv.slice(2), ask);

  try {
    await scaffold(options, targetDir);
  } catch (error) {
    cancel(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  outro(
    `Scaffolded into ${targetDir}.\n\n` +
      `Next:\n` +
      `  cd ${targetDir}\n` +
      `  run /grill-with-docs to align the idea`,
  );
}

main();
