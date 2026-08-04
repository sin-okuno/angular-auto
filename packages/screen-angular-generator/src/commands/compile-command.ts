import { runParseCommand } from './parse-command.js';
import { runResolveCommand } from './resolve-command.js';
import { runValidateCommand } from './validate-command.js';

export interface CompileCommandOptions {
  spec: string;
}

export async function runCompileCommand(options: CompileCommandOptions): Promise<void> {
  await runParseCommand({ spec: options.spec });
  if (process.exitCode && process.exitCode !== 0) {
    return;
  }
  await runValidateCommand({ spec: options.spec });
  if (process.exitCode && process.exitCode !== 0) {
    return;
  }
  await runResolveCommand({ spec: options.spec });
}
