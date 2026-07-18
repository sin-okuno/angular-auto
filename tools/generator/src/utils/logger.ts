/* eslint-disable no-console */

export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'step';

export interface Logger {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  step(message: string): void;
  plain(message: string): void;
}

const PREFIX: Record<LogLevel, string> = {
  info: '[info]',
  success: '[ok]',
  warn: '[warn]',
  error: '[error]',
  step: '[step]',
};

export const logger: Logger = {
  info(message: string): void {
    console.log(`${PREFIX.info} ${message}`);
  },
  success(message: string): void {
    console.log(`${PREFIX.success} ${message}`);
  },
  warn(message: string): void {
    console.warn(`${PREFIX.warn} ${message}`);
  },
  error(message: string): void {
    console.error(`${PREFIX.error} ${message}`);
  },
  step(message: string): void {
    console.log(`\n${PREFIX.step} ${message}`);
  },
  plain(message: string): void {
    console.log(message);
  },
};
