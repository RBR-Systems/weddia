/**
 * Returns the number of decimal places in a numeric value.
 * Returns 0 for integers or non-numeric inputs.
 */
export function detectDecimals(n?: number | null): number {
  if (n == null) return 0;
  const s = String(n);
  const m = s.match(/\.(\d+)$/);
  return m ? m[1].length : 0;
}

/**
 * Extracts a numeric value from different input shapes.
 * Returns `null` when the input cannot be parsed as a number.
 */
export function extractNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && !Number.isNaN(value)) return value;

  const s = String(value)
    .trim()
    .replace(/^\((.*)\)$/, "-$1");
  const m = s.match(/-?\d[\d,]*\.?\d*/);
  if (!m) return null;
  const cleaned = m[0].replaceAll(/,/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}
