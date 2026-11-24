import { describe, expect, it } from 'vitest'
import { buildRegionalDossiers } from './regionalIntelligence'
import type { IntelligenceDocument } from '../domain/intelligence'

const observation = (title: string, geography: Record<string, unknown> | null = null): IntelligenceDocument => ({
  protocol_version: 'mayday.intelligence.document/1', document_id: title, title,
  storage_time: '2026-11-19T12:00:00Z', provenance: [], geography,
})

describe('regional intelligence', () => {
  it('marks conflict mentions red without claiming source-backed geography', () => {
    const dossiers = buildRegionalDossiers([observation('Drone attack on Crimea bridge')])
    const easternEurope = dossiers.find(item => item.region.id === 'eastern-europe')
    expect(easternEurope).toMatchObject({ signal: 'conflict', conflictCount: 1, sourceBackedCount: 0 })
    expect(easternEurope?.observations[0].basis).toBe('deterministic-mention')
  })

  it('preserves source-backed regional attribution', () => {
    const dossiers = buildRegionalDossiers([observation('Court ruling', { country: 'Myanmar' })])
    const southeastAsia = dossiers.find(item => item.region.id === 'southeast-asia')
    expect(southeastAsia?.sourceBackedCount).toBe(1)
  })
})
