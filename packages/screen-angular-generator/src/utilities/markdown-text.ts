/** Normalize Markdown-derived cell / paragraph text. */
export function normalizeText(value: string): string {
  return value
    .replace(/\u3000/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeMultiline(value: string): string {
  return value
    .replace(/\u3000/g, ' ')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}

export function stripHeadingNumber(heading: string): string {
  return normalizeText(heading.replace(/^\d+(\.\d+)*\.\s*/, ''));
}
