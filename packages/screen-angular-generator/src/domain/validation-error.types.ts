export type ValidationSeverity = 'error' | 'warning';

export type ValidationErrorCode =
  | 'SCHEMA_VALIDATION_ERROR'
  | 'DUPLICATE_ID_ERROR'
  | 'REFERENCE_ERROR'
  | 'ARCHITECTURE_ERROR'
  | 'API_VALIDATION_ERROR'
  | 'ACTION_VALIDATION_ERROR'
  | 'STORE_VALIDATION_ERROR'
  | 'FORM_VALIDATION_ERROR'
  | 'MAPPER_VALIDATION_ERROR'
  | 'VALIDATION_CONSISTENCY_ERROR'
  | 'COMPONENT_VALIDATION_ERROR';

export interface ValidationError {
  code: ValidationErrorCode;
  severity: ValidationSeverity;
  file?: string;
  section?: string;
  lineStart?: number;
  lineEnd?: number;
  id?: string;
  field?: string;
  value?: string;
  message: string;
  candidates?: string[];
}
