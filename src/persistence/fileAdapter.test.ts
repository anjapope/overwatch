import { describe, it, expect } from 'vitest'
import * as os from 'os'
import * as fs from 'fs/promises'
import * as path from 'path'
import { FilePersistence, ConflictError, SchemaVersionError } from './fileAdapter'
import { observationId, sourceId } from '../domain/identifiers'
import type { ObservationRelationship } from '../domain/relationship'
import type { Observation } from '../domain/observation'

async function makeTempFile() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ow-test-'))
  return path.join(dir, 'persistence.json')
}

describe('FilePersistence round-trip', () => {
  it('saves and reloads an observation (instant)', async () => {
    const file = await makeTempFile()
    const repo = new FilePersistence(file)
    const obs: Observation = {
      id: observationId('A'),
      temporal: { kind: 'instant' as const, at: '2023-01-01T00:00:00Z' },
      payload: { foo: 'bar' },
    }
    await repo.saveObservation(obs)
    const got = await repo.getObservationById(observationId('A'))
    expect(got).not.toBeNull()
    expect((got?.payload as unknown as Record<string, unknown>)['foo']).toBe('bar')
  })

  it('saves and reloads interval, spatial, provenance, epistemic', async () => {
    const file = await makeTempFile()
    const repo = new FilePersistence(file)
    const obs: Observation = {
      id: observationId('B'),
      temporal: { kind: 'interval' as const, start: '2023-01-01T00:00:00Z', end: '2023-01-02T00:00:00Z' },
      spatial: { kind: 'point', point: { latitude: 10, longitude: 20, altitudeMeters: 5 } },
      provenance: [{ sourceId: sourceId('src-1'), locator: 'p:1', citedAt: '2023-01-02T00:00:00Z' }],
      epistemic: { status: 'direct', confidence: 'moderate' },
      payload: { numbers: [1, 2, 3] },
    }
    await repo.saveObservation(obs)
    const got = await repo.getObservationById(observationId('B'))
    expect((got?.spatial as unknown as { point: { latitude: number } }).point.latitude).toBe(10)
    expect((got?.epistemic as unknown as { status: string }).status).toBe('direct')
  })

  it('saves relationships and finds by from/to; preserves direction', async () => {
    const file = await makeTempFile()
    const repo = new FilePersistence(file)
    // ensure observations exist
    await repo.saveObservation({ id: observationId('A'), temporal: { kind: 'instant' as const, at: '2023-01-01T00:00:00Z' } } as unknown as Observation)
    await repo.saveObservation({ id: observationId('B'), temporal: { kind: 'instant' as const, at: '2023-01-02T00:00:00Z' } } as unknown as Observation)
    await repo.saveObservation({ id: observationId('C'), temporal: { kind: 'instant' as const, at: '2023-01-03T00:00:00Z' } } as unknown as Observation)

    const rel1: ObservationRelationship = { kind: 'derived-from', sourceId: observationId('A'), targetId: observationId('C') }
    const rel2: ObservationRelationship = { kind: 'derived-from', sourceId: observationId('B'), targetId: observationId('C') }
    await repo.saveRelationship(rel1)
    await repo.saveRelationship(rel2)

    const fromA = await repo.findRelationshipsFrom(observationId('A'))
    expect(fromA.length).toBe(1)
    const toC = await repo.findRelationshipsTo(observationId('C'))
    expect(toC.length).toBe(2)
  })

  it('idempotent save and conflict on different content', async () => {
    const file = await makeTempFile()
    const repo = new FilePersistence(file)
    const obs = { id: observationId('X'), temporal: { kind: 'instant' as const, at: '2023-01-01T00:00:00Z' }, payload: { a: 1 } }
    await repo.saveObservation(obs)
    // idempotent
    await repo.saveObservation(obs)
    // different payload -> conflict
    const modified = { ...obs, payload: { a: 2 } }
    await expect(repo.saveObservation(modified as unknown as Observation)).rejects.toThrow(ConflictError)
  })

  it('rejects unsupported schema version when reading', async () => {
    const file = await makeTempFile()
    // write an envelope with wrong schema version
    await fs.writeFile(file, JSON.stringify({ schemaVersion: 999, observations: [], relationships: [] }))
    const repo = new FilePersistence(file)
    await expect(repo.listObservations()).rejects.toThrow(SchemaVersionError)
  })
})
