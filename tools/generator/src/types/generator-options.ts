export interface ConvertOptions {
  input: string;
  output?: string;
}

export interface ValidateOptions {
  input: string;
}

export interface GenerateOptions {
  input: string;
  output?: string;
  dryRun: boolean;
  force: boolean;
}

export interface AllOptions {
  input: string;
  screenOutput?: string;
  codeOutput?: string;
  dryRun: boolean;
  force: boolean;
  runTest: boolean;
}

export type FileChangeType = 'CREATE' | 'UPDATE' | 'UNCHANGED' | 'DELETE';

export interface FileChange {
  type: FileChangeType;
  /** Path relative to the project root, using forward slashes. */
  relativePath: string;
  absolutePath: string;
  nextContent: string | null;
}

export interface RenderedFile {
  /** Path relative to the code output root, using forward slashes. */
  relativePath: string;
  content: string;
}
