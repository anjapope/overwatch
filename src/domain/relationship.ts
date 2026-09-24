import type { ObservationId } from './identifiers'
import type { ProvenanceReference } from './source'

// Lightweight branded identifier for relationships when useful.
type BrandedString<T extends string> = string & { readonly __brand?: T }
export type ObservationRelationshipId = BrandedString<'ObservationRelationshipId'>
export const relationshipId = (s: string): ObservationRelationshipId => s as ObservationRelationshipId

export type RelationshipKind =
  | 'derived-from'
  | 'corrects'
  | 'supersedes'
  | 'contradicts'
  | 'supports'

export interface ObservationRelationship {
  id?: ObservationRelationshipId
  kind: RelationshipKind
  // Canonical direction: `sourceId -> targetId`.
  //
  // Canonical semantics (OVERVIEW):
  // - `sourceId` is the relationship actor / origin (the observation asserting the relation).
  // - `targetId` is the relationship object / destination (the observation acted upon).
  //
  // Per-kind intent (stored as `sourceId -> targetId`):
  // - `derived-from`: source is derived from target (source depends on target).
  // - `corrects`: source corrects target.
  // - `supersedes`: source supersedes target.
  // - `contradicts`: source contradicts target (directional in storage; do not auto-resolve).
  // - `supports`: source supports target.
  //
  // Helper functions in this module rely on `sourceId` as the actor and
  // `targetId` as the affected object; do not invert these roles.
  sourceId: ObservationId
  targetId: ObservationId
  // optional provenance for the relationship itself (who asserted the relation)
  provenance?: ProvenanceReference[]
  createdAt?: string // ISO timestamp when the relationship was recorded
  note?: string
}

// Pure helpers
export function relationshipsFrom(id: ObservationId, rels: readonly ObservationRelationship[]) {
  return rels.filter((r) => r.sourceId === id)
}

export function relationshipsTo(id: ObservationId, rels: readonly ObservationRelationship[]) {
  return rels.filter((r) => r.targetId === id)
}

export function isSuperseded(id: ObservationId, rels: readonly ObservationRelationship[]) {
  return rels.some((r) => r.kind === 'supersedes' && r.targetId === id)
}

export function correctionsFor(id: ObservationId, rels: readonly ObservationRelationship[]) {
  return rels.filter((r) => r.kind === 'corrects' && r.targetId === id)
}

export function validateRelationship(r: ObservationRelationship): void {
  if (r.sourceId === r.targetId) {
    throw new Error('Relationship sourceId and targetId must differ')
  }
  const kinds: RelationshipKind[] = ['derived-from', 'corrects', 'supersedes', 'contradicts', 'supports']
  if (!kinds.includes(r.kind)) {
    throw new Error('Unrecognized relationship kind')
  }
}
