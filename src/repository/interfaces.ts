import type { Observation } from '../domain/observation'
import type { ObservationId } from '../domain/identifiers'
import type { ObservationRelationship } from '../domain/relationship'

export interface ObservationRepository {
  save(observation: Observation): Promise<void>
  getById(id: ObservationId): Promise<Observation | null>
  list(): Promise<Observation[]>
}

export interface RelationshipRepository {
  save(relationship: ObservationRelationship): Promise<void>
  getById(id: string): Promise<ObservationRelationship | null>
  list(): Promise<ObservationRelationship[]>
  findFrom(sourceId: ObservationId): Promise<ObservationRelationship[]>
  findTo(targetId: ObservationId): Promise<ObservationRelationship[]>
}
