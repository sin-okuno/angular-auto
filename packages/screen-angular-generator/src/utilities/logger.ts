export type LogLevel = 'info' | 'warn' | 'error';

export function log(step: string, message: string, level: LogLevel = 'info'): void {
  const prefix = level === 'warn' ? '[WARNING]' : `[${step}]`;
  const line = `${prefix} ${message}`;
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}
