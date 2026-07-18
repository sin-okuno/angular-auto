import { Command } from 'commander';

import { runConvert } from './commands/convert.command.js';
import { runValidate } from './commands/validate.command.js';
import { runGenerate } from './commands/generate.command.js';
import { runAll } from './commands/all.command.js';
import { runDryRun } from './commands/dry-run.command.js';
import { runCheck } from './commands/check.command.js';
import { GeneratorError } from './utils/errors.js';
import { logger } from './utils/logger.js';

function fail(error: unknown): never {
  if (error instanceof GeneratorError) {
    logger.error(`\n${error.format()}`);
  } else if (error instanceof Error) {
    logger.error(`\n${error.message}`);
  } else {
    logger.error(`\n${String(error)}`);
  }
  process.exit(1);
}

async function main(): Promise<void> {
  const program = new Command();
  program
    .name('screen-generator')
    .description('Deterministic Angular + NgRx code generator driven by Markdown specs.')
    .version('1.0.0');

  program
    .command('convert')
    .argument('<input>', 'path to the Markdown specification')
    .option('-o, --output <path>', 'output path for screen.yaml')
    .action(async (input: string, opts: { output?: string }) => {
      try {
        await runConvert({ input, output: opts.output });
      } catch (error) {
        fail(error);
      }
    });

  program
    .command('validate')
    .argument('<input>', 'path to screen.yaml')
    .action(async (input: string) => {
      try {
        const result = await runValidate({ input });
        if (!result.ok) {
          process.exitCode = 1;
        }
      } catch (error) {
        fail(error);
      }
    });

  program
    .command('generate')
    .argument('<input>', 'path to screen.yaml')
    .option('-o, --output <path>', 'output directory for generated code')
    .option('--dry-run', 'do not write files', false)
    .option('--force', 'overwrite files without an AUTO-GENERATED header', false)
    .action(
      async (input: string, opts: { output?: string; dryRun: boolean; force: boolean }) => {
        try {
          await runGenerate({
            input,
            output: opts.output,
            dryRun: opts.dryRun,
            force: opts.force,
          });
        } catch (error) {
          fail(error);
        }
      },
    );

  program
    .command('all')
    .argument('<input>', 'path to the Markdown specification')
    .option('--screen-output <path>', 'output path for screen.yaml')
    .option('--code-output <path>', 'output directory for generated code')
    .option('--dry-run', 'do not write files', false)
    .option('--force', 'overwrite files without an AUTO-GENERATED header', false)
    .option('--test', 'run Angular unit tests after building', false)
    .action(
      async (
        input: string,
        opts: {
          screenOutput?: string;
          codeOutput?: string;
          dryRun: boolean;
          force: boolean;
          test: boolean;
        },
      ) => {
        try {
          await runAll({
            input,
            screenOutput: opts.screenOutput,
            codeOutput: opts.codeOutput,
            dryRun: opts.dryRun,
            force: opts.force,
            runTest: opts.test,
          });
        } catch (error) {
          fail(error);
        }
      },
    );

  program
    .command('dry-run')
    .argument('<input>', 'path to the Markdown specification')
    .option('--code-output <path>', 'output directory for generated code')
    .option('--force', 'evaluate overwrite of unheadered files', false)
    .action(async (input: string, opts: { codeOutput?: string; force: boolean }) => {
      try {
        await runDryRun({
          input,
          codeOutput: opts.codeOutput,
          dryRun: true,
          force: opts.force,
          runTest: false,
        });
      } catch (error) {
        fail(error);
      }
    });

  program
    .command('check')
    .argument('<input>', 'path to the Markdown specification')
    .option('--code-output <path>', 'output directory for generated code')
    .action(async (input: string, opts: { codeOutput?: string }) => {
      try {
        const result = await runCheck({
          input,
          codeOutput: opts.codeOutput,
          dryRun: true,
          force: false,
          runTest: false,
        });
        process.exitCode = result.ok ? 0 : 1;
      } catch (error) {
        fail(error);
      }
    });

  await program.parseAsync(process.argv);
}

main().catch(fail);
