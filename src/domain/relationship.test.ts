import { describe, it, expect } from 'vitest'
import { observationId } from './identifiers'
import type { ObservationRelationship } from './relationship'
import { relationshipId, relationshipsFrom, relationshipsTo, isSuperseded, correctionsFor, validateRelationship } from './relationship'

describe('Observation relationships', () => {
  const A = observationId('A')
  const B = observationId('B')
  const C = observationId('C')

  it('valid derived-from relationship', () => {
    const r: ObservationRelationship = { id: relationshipId('r1'), kind: 'derived-from', sourceId: A, targetId: C }
    expect(() => validateRelationship(r)).not.toThrow()
  })

  it('valid correction relationship and correctionsFor helper', () => {
    const r: ObservationRelationship = { id: relationshipId('r2'), kind: 'corrects', sourceId: B, targetId: A }
    const rels = [r]
    expect(correctionsFor(A, rels)).toHaveLength(1)
  })

  it('supersession and isSuperseded helper', () => {
    const r: ObservationRelationship = { id: relationshipId('r3'), kind: 'supersedes', sourceId: C, targetId: B }
    expect(isSuperseded(B, [r])).toBe(true)
  })

  it('contradiction relationship is representable', () => {
    const r: ObservationRelationship = { id: relationshipId('r4'), kind: 'contradicts', sourceId: A, targetId: B }
    expect(relationshipsFrom(A, [r])).toHaveLength(1)
    expect(relationshipsTo(B, [r])).toHaveLength(1)
  })

  it('rejects self-reference', () => {
    const r: ObservationRelationship = { id: relationshipId('r5'), kind: 'supersedes', sourceId: A, targetId: A }
    expect(() => validateRelationship(r)).toThrow()
  })
})
