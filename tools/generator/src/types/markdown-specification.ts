/**
 * Intermediate representation produced by the Markdown parser before the
 * specification is converted into a strongly-typed ScreenDefinition.
 */

export type CellValue = string | number | boolean | null | string[];

export interface MarkdownTable {
  headers: string[];
  rows: MarkdownRow[];
  /** 1-based source line where the table header row was found. */
  line: number;
}

export interface MarkdownRow {
  cells: Record<string, CellValue>;
  /** Raw cell values keyed by header, preserving original strings. */
  raw: Record<string, string>;
  /** 1-based source line of the row. */
  line: number;
}

export interface MarkdownSection {
  heading: string;
  level: number;
  /** 1-based source line of the heading. */
  line: number;
  paragraphs: string[];
  tables: MarkdownTable[];
}

export interface MarkdownSpecification {
  sourcePath: string;
  title: string;
  sections: MarkdownSection[];
}
