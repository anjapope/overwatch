import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import type { Observation } from '../domain/observation'
import type { ObservationId } from '../domain/identifiers'
import type { ObservationRelationship } from '../domain/relationship'

export class PersistenceError extends Error {}
export class ConflictError extends PersistenceError {}
export class SchemaVersionError extends PersistenceError {}

export interface PersistEnvelope {
  schemaVersion: number
  observations: Record<string, unknown>[]
  relationships: Record<string, unknown>[]
}

export function defaultEnvelope(): PersistEnvelope {
  return { schemaVersion: 1, observations: [], relationships: [] }
}

function canonicalize(obj: unknown): string {
  return JSON.stringify(obj)
}

function ensureJsonSerializable(value: unknown) {
  try {
    JSON.stringify(value)
  } catch {
    throw new PersistenceError('Payload is not JSON-serializable')
  }
}

export class FilePersistence {
  private filePath: string

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(os.tmpdir(), `overwatch-persistence-${Date.now()}.json`)
  }

  private async readEnvelope(): Promise<PersistEnvelope> {
    try {
      const data = await fs.readFile(this.filePath, 'utf8')
      const parsed = JSON.parse(data) as PersistEnvelope
      if (parsed.schemaVersion !== 1) {
        throw new SchemaVersionError('Unsupported schema version: ' + parsed.schemaVersion)
      }
      return parsed
    } catch (err: unknown) {
      // handle missing file specially
      const maybe = err as { code?: string }
      if (maybe?.code === 'ENOENT') {
        return defaultEnvelope()
      }
      throw err
    }
  }

  private async writeEnvelope(env: PersistEnvelope): Promise<void> {
    const tmp = this.filePath + '.tmp'
    const data = JSON.stringify(env, null, 2)
    await fs.writeFile(tmp, data, 'utf8')
    await fs.rename(tmp, this.filePath)
  }

  // Observation persistence
  public async saveObservation(observation: Observation): Promise<void> {
    ensureJsonSerializable(observation.payload)
    const env = await this.readEnvelope()
    const key = String(observation.id)
    const persisted = { ...observation, id: key }
    const existingIndex = env.observations.findIndex((o) => String((o as Record<string, unknown>)['id']) === key)
    const persistedCanonical = canonicalize(persisted)
    if (existingIndex >= 0) {
      const existing = env.observations[existingIndex]
      if (canonicalize(existing) === persistedCanonical) {
        // idempotent
        return
      }
      // conflict — do not overwrite
      throw new ConflictError('Observation ID conflict with different content: ' + key)
    }
    env.observations.push(persisted)
    await this.writeEnvelope(env)
  }

  public async getObservationById(id: ObservationId): Promise<Observation | null> {
    const env = await this.readEnvelope()
    const found = env.observations.find((o) => String((o as Record<string, unknown>)['id']) === String(id))
    return (found as unknown as Observation) ?? null
  }

  public async listObservations(): Promise<Observation[]> {
    const env = await this.readEnvelope()
    return env.observations as unknown as Observation[]
  }

  // Relationship persistence
  public async saveRelationship(relationship: ObservationRelationship): Promise<void> {
    const env = await this.readEnvelope()
    const key = relationship.id ? String(relationship.id) : undefined
    const persisted = { ...relationship, id: key }
    // If id present, check for conflict by id
    if (key) {
        const existingIndex = env.relationships.findIndex((r) => String((r as Record<string, unknown>)['id']) === key)
      const persistedCanonical = canonicalize(persisted)
      if (existingIndex >= 0) {
        const existing = env.relationships[existingIndex]
        if (canonicalize(existing) === persistedCanonical) {
          return
        }
        throw new ConflictError('Relationship ID conflict with different content: ' + key)
      }
      env.relationships.push(persisted)
      await this.writeEnvelope(env)
      return
    }

    // No id: prevent exact duplicate by kind+source+target+note+createdAt
    const dup = env.relationships.find((r) => {
      const rr = r as Record<string, unknown>
      return (
        rr['kind'] === relationship.kind &&
        rr['sourceId'] === relationship.sourceId &&
        rr['targetId'] === relationship.targetId &&
        rr['note'] === relationship.note &&
        rr['createdAt'] === relationship.createdAt
      )
    })
    if (dup) return
    env.relationships.push(persisted)
    await this.writeEnvelope(env)
  }

  public async getRelationshipById(id: string): Promise<ObservationRelationship | null> {
    const env = await this.readEnvelope()
    const found = env.relationships.find((r) => String((r as Record<string, unknown>)['id']) === id)
    return (found as unknown as ObservationRelationship) ?? null
  }

  public async listRelationships(): Promise<ObservationRelationship[]> {
    const env = await this.readEnvelope()
    return env.relationships as unknown as ObservationRelationship[]
  }

  public async findRelationshipsFrom(sourceId: ObservationId): Promise<ObservationRelationship[]> {
    const env = await this.readEnvelope()
    return env.relationships.filter((r) => (r as Record<string, unknown>)['sourceId'] === String(sourceId)) as unknown as ObservationRelationship[]
  }

  public async findRelationshipsTo(targetId: ObservationId): Promise<ObservationRelationship[]> {
    const env = await this.readEnvelope()
    return env.relationships.filter((r) => (r as Record<string, unknown>)['targetId'] === String(targetId)) as unknown as ObservationRelationship[]
  }
}
