import { describe, it, expect } from 'vitest'
import { observationId, sourceId } from './identifiers'
import { validateInterval } from './temporal'
import type { TemporalContext } from './temporal'
import { validateCoordinate } from './spatial'
import type { Observation } from './observation'

describe('Observation domain contracts', () => {
  it('validates instant temporal context', () => {
    const t: TemporalContext = { kind: 'instant', at: '2023-01-01T00:00:00Z' }
    expect(t.kind).toBe('instant')
  })

  it('validates interval temporal context and rejects reversed intervals', () => {
    const good: TemporalContext = { kind: 'interval', start: '2023-01-01T00:00:00Z', end: '2023-01-02T00:00:00Z' }
    expect(() => validateInterval({ start: (good as { start: string; end: string }).start, end: (good as { start: string; end: string }).end })).not.toThrow()

    const bad: TemporalContext = { kind: 'interval', start: '2023-01-03T00:00:00Z', end: '2023-01-02T00:00:00Z' }
    expect(() => validateInterval({ start: (bad as { start: string; end: string }).start, end: (bad as { start: string; end: string }).end })).toThrow()
  })

  it('validates coordinate boundaries', () => {
    expect(() => validateCoordinate({ latitude: 0, longitude: 0 })).not.toThrow()
    expect(() => validateCoordinate({ latitude: 90, longitude: 180 })).not.toThrow()
    expect(() => validateCoordinate({ latitude: -90, longitude: -180 })).not.toThrow()
    expect(() => validateCoordinate({ latitude: 100, longitude: 0 })).toThrow()
    expect(() => validateCoordinate({ latitude: 0, longitude: 200 })).toThrow()
  })

  it('can create an observation with provenance and payload', () => {
    const obs: Observation<{ foo: string }> = {
      id: observationId('obs-1'),
      temporal: { kind: 'instant', at: '2023-01-01T00:00:00Z' },
      provenance: [{ sourceId: sourceId('src-1'), locator: 'page:10', citedAt: '2023-01-02T00:00:00Z' }],
      payload: { foo: 'bar' },
    }

    expect(obs.id).toBe('obs-1')
    expect(obs.payload).toEqual({ foo: 'bar' })
    expect(obs.provenance && obs.provenance[0].sourceId).toBe('src-1')
  })
})
