export type ErrorCode =
  | 'MARKDOWN_PARSE_ERROR'
  | 'MISSING_SECTION_ERROR'
  | 'MISSING_COLUMN_ERROR'
  | 'SCHEMA_VALIDATION_ERROR'
  | 'TYPE_REFERENCE_ERROR'
  | 'STORE_REFERENCE_ERROR'
  | 'ACTION_REFERENCE_ERROR'
  | 'API_REFERENCE_ERROR'
  | 'PERMISSION_REFERENCE_ERROR'
  | 'OPERATION_REFERENCE_ERROR'
  | 'DUPLICATE_DEFINITION_ERROR'
  | 'INITIAL_VALUE_ERROR'
  | 'CONCURRENT_UPDATE_ERROR'
  | 'UNSAVED_CHANGES_ERROR'
  | 'TEMPLATE_RENDER_ERROR'
  | 'FILE_WRITE_ERROR'
  | 'PATH_SECURITY_ERROR'
  | 'BUILD_ERROR';

export interface GeneratorErrorDetails {
  section?: string;
  target?: string;
  cause?: string;
  fix?: string;
  line?: number;
}

/**
 * A structured, user-actionable error. The message is rendered so that a
 * developer can locate and fix the problem in the source specification.
 */
export class GeneratorError extends Error {
  readonly code: ErrorCode;
  readonly details: GeneratorErrorDetails;

  constructor(code: ErrorCode, message: string, details: GeneratorErrorDetails = {}) {
    super(message);
    this.name = 'GeneratorError';
    this.code = code;
    this.details = details;
  }

  format(): string {
    const lines: string[] = [`[${this.code}]`];
    if (this.details.section) {
      lines.push(`Section: ${this.details.section}`);
    }
    if (typeof this.details.line === 'number') {
      lines.push(`Line: ${this.details.line}`);
    }
    if (this.details.target) {
      lines.push(`Target: ${this.details.target}`);
    }
    lines.push(this.message);
    if (this.details.fix) {
      lines.push('', 'Fix:', this.details.fix);
    }
    return lines.join('\n');
  }
}

/**
 * A non-fatal validation finding. Errors fail the run; warnings do not.
 */
export interface ValidationIssue {
  code: ErrorCode;
  severity: 'error' | 'warning';
  target: string;
  cause: string;
  fix: string;
}

export function formatIssue(issue: ValidationIssue): string {
  return [
    `[${issue.code}] (${issue.severity})`,
    `Target: ${issue.target}`,
    `Cause: ${issue.cause}`,
    `Fix: ${issue.fix}`,
  ].join('\n');
}
