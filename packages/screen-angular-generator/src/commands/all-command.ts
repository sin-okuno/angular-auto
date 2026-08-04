import { runCompileCommand } from './compile-command.js';
import { runGenerateCommand } from './generate-command.js';
import type { GenerateCommandOptions } from './generate-command.js';

export async function runAllCommand(options: GenerateCommandOptions): Promise<void> {
  await runCompileCommand({ spec: options.spec });
  if (process.exitCode && process.exitCode !== 0) {
    return;
  }
  await runGenerateCommand(options);
}
