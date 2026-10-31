/** Pure, seek-safe mapping. Angles are SVG rotations around the dial centre. */
export function clampProgress(progress: number): number {
  return Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
}

export function mapGaugeValue(value: number, minimum = 0, maximum = 1): number {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || maximum <= minimum) {
    throw new RangeError('Gauge maximum must be finite and greater than minimum.');
  }
  const fraction = Number.isFinite(value) ? clampProgress((value - minimum) / (maximum - minimum)) : 0;
  return -120 + fraction * 240;
}

/** Only a simple numeric value with an optional unit is safe to count up. */
export function parseSpecification(value: string): { value: number; unit: string; decimals: number } | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*([^\d]*?)\s*$/.exec(value);
  if (!match || !Number.isFinite(Number(match[1]))) return null;
  return { value: Number(match[1]), unit: match[2], decimals: match[1].split('.')[1]?.length ?? 0 };
}
