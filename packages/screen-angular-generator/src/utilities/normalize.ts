import { normalizeText } from './markdown-text.js';

const TRUE_VALUES = new Set(['true', 'yes', 'はい', '必須', '可']);
const FALSE_VALUES = new Set(['false', 'no', 'いいえ', '任意', '不可', 'なし']);
const NULL_VALUES = new Set(['null', 'なし', '-', '—', '–', '']);

export function normalizeCellValue(raw: string): string | number | boolean | null {
  const text = normalizeText(raw);
  const lower = text.toLowerCase();

  if (NULL_VALUES.has(text) || NULL_VALUES.has(lower)) {
    return null;
  }
  if (TRUE_VALUES.has(text) || TRUE_VALUES.has(lower)) {
    return true;
  }
  if (FALSE_VALUES.has(text) || FALSE_VALUES.has(lower)) {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(text)) {
    return Number(text);
  }
  return text;
}

export function asString(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

export function asBoolean(
  value: string | number | boolean | null | undefined,
  fallback = false,
): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  const normalized = normalizeCellValue(String(value));
  return typeof normalized === 'boolean' ? normalized : fallback;
}

export function asNullableString(value: string | number | boolean | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = asString(value);
  return text.length === 0 ? null : text;
}

export function splitCommaList(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(/[,、]/)
    .map((part) => normalizeText(part))
    .filter((part) => part.length > 0 && part !== '-');
}
