export type ParserWarningCode = 'UNCLASSIFIED_TABLE' | 'MALFORMED_TABLE' | 'EMPTY_TABLE';

export interface ParserWarning {
  code: ParserWarningCode;
  file: string;
  section: string;
  lineStart: number;
  lineEnd: number;
  message: string;
  columns?: string[];
}
