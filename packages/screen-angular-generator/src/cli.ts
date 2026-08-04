#!/usr/bin/env node
import { Command } from 'commander';

import { runAllCommand } from './commands/all-command.js';
import { runCheckCommand } from './commands/check-command.js';
import { runCompileCommand } from './commands/compile-command.js';
import { runGenerateCommand } from './commands/generate-command.js';
import { runParseCommand } from './commands/parse-command.js';
import { runResolveCommand } from './commands/resolve-command.js';
import { runValidateCommand } from './commands/validate-command.js';

const program = new Command();

program
  .name('screen-angular-generator')
  .description('Markdown screen/components specification tooling')
  .version('0.1.0');

async function run(action: () => Promise<void>): Promise<void> {
  try {
    await action();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[ERROR] ${message}`);
    process.exitCode = 1;
  }
}

function generateOptions(options: Record<string, unknown>) {
  return {
    spec: String(options.spec),
    target: String(options.target),
    angularVersion: Number(options.angularVersion ?? 22),
    componentApi: (options.componentApi as 'decorators' | 'signals') ?? 'decorators',
    templateControlFlow:
      (options.templateControlFlow as 'builtIn' | 'structuralDirectives') ?? 'builtIn',
    dependencyInjection: (options.dependencyInjection as 'inject' | 'constructor') ?? 'inject',
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
    clean: Boolean(options.clean),
    allowVersionMismatch: Boolean(options.allowVersionMismatch),
  };
}

program
  .command('parse')
  .requiredOption('--spec <path>')
  .action(async (options: { spec: string }) => run(() => runParseCommand(options)));

program
  .command('validate')
  .requiredOption('--spec <path>')
  .action(async (options: { spec: string }) => run(() => runValidateCommand(options)));

program
  .command('resolve')
  .requiredOption('--spec <path>')
  .action(async (options: { spec: string }) => run(() => runResolveCommand(options)));

program
  .command('compile')
  .requiredOption('--spec <path>')
  .action(async (options: { spec: string }) => run(() => runCompileCommand(options)));

program
  .command('generate')
  .requiredOption('--spec <path>')
  .requiredOption('--target <path>')
  .option('--angular-version <n>', 'Angular major version', '22')
  .option('--component-api <api>', 'decorators|signals', 'decorators')
  .option('--template-control-flow <mode>', 'builtIn|structuralDirectives', 'builtIn')
  .option('--dependency-injection <mode>', 'inject|constructor', 'inject')
  .option('--dry-run', 'Plan only', false)
  .option('--force', 'Overwrite generated files', false)
  .option('--clean', 'Delete obsolete manifest files', false)
  .option('--allow-version-mismatch', 'Allow non-22 Angular', false)
  .action(async (options: Record<string, unknown>) =>
    run(() => runGenerateCommand(generateOptions(options))),
  );

program
  .command('all')
  .requiredOption('--spec <path>')
  .requiredOption('--target <path>')
  .option('--angular-version <n>', 'Angular major version', '22')
  .option('--component-api <api>', 'decorators|signals', 'decorators')
  .option('--template-control-flow <mode>', 'builtIn|structuralDirectives', 'builtIn')
  .option('--dependency-injection <mode>', 'inject|constructor', 'inject')
  .option('--dry-run', 'Plan only', false)
  .option('--force', 'Overwrite generated files', false)
  .option('--clean', 'Delete obsolete manifest files', false)
  .option('--allow-version-mismatch', 'Allow non-22 Angular', false)
  .action(async (options: Record<string, unknown>) =>
    run(() => runAllCommand(generateOptions(options))),
  );

program
  .command('check')
  .requiredOption('--target <path>')
  .requiredOption('--feature <name>')
  .action(async (options: { target: string; feature: string }) =>
    run(() => runCheckCommand(options)),
  );

await program.parseAsync(process.argv);
