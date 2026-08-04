/** Levenshtein distance for candidate suggestions. */
export function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i]![0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0]![j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        (matrix[i - 1]![j] ?? 0) + 1,
        (matrix[i]![j - 1] ?? 0) + 1,
        (matrix[i - 1]![j - 1] ?? 0) + cost,
      );
    }
  }
  return matrix[a.length]![b.length] ?? 0;
}

export function suggestCandidates(value: string, pool: iterableOrArray, limit = 3): string[] {
  const items = [...pool];
  return items
    .map((candidate) => ({ candidate, distance: levenshtein(value, candidate) }))
    .sort((a, b) => a.distance - b.distance || a.candidate.localeCompare(b.candidate))
    .filter((item) => item.distance <= Math.max(3, Math.floor(value.length / 2)))
    .slice(0, limit)
    .map((item) => item.candidate);
}

type iterableOrArray = Iterable<string>;

const PRIMITIVES = new Set([
  'string',
  'number',
  'boolean',
  'null',
  'undefined',
  'void',
  'unknown',
  'never',
  'object',
  'Date',
  'any',
]);

/** Extract referenced type IDs from a type expression (strips arrays/unions). */
export function extractTypeTokens(typeExpr: string): string[] {
  return typeExpr
    .split('|')
    .map((part) =>
      part
        .trim()
        .replace(/^ReadonlySet</, '')
        .replace(/^Set</, '')
        .replace(/>$/, '')
        .replace(/\[\]$/, '')
        .trim(),
    )
    .filter((token) => token.length > 0)
    .filter((token) => !PRIMITIVES.has(token))
    .filter((token) => !/^(string|number|boolean)\[\]$/.test(token));
}

export function isTypeId(value: string): boolean {
  return /^(api|view|payload|common)\.[a-z][A-Za-z0-9]*$/.test(value);
}

export function isNormalId(value: string): boolean {
  return /^[a-z][A-Za-z0-9]*$/.test(value);
}

export function isBlankRef(value: string | null | undefined): boolean {
  return value == null || value === '' || value === '-' || value === 'なし';
}
