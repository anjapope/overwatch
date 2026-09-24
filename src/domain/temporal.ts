// Temporal context contract: instant or interval. Uses ISO 8601 strings.
export type TemporalContext =
  | { kind: 'instant'; at: string }
  | { kind: 'interval'; start: string; end: string }

export function isInstant(t: TemporalContext): t is { kind: 'instant'; at: string } {
  return t.kind === 'instant'
}

export function isInterval(t: TemporalContext): t is { kind: 'interval'; start: string; end: string } {
  return t.kind === 'interval'
}

// Basic pure validator for interval invariants. Throws on invalid interval.
export function validateInterval(interval: { start: string; end: string }): void {
  const s = Date.parse(interval.start)
  const e = Date.parse(interval.end)
  if (Number.isNaN(s) || Number.isNaN(e)) {
    throw new Error('Invalid ISO date in interval')
  }
  if (e < s) {
    throw new Error('Interval end is before start')
  }
}
