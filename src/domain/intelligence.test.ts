import { describe, expect, it } from 'vitest'
import { coordinatesFor, safeExternalUrl, type IntelligenceDocument } from './intelligence'
const document = (geography: Record<string, unknown> | null): IntelligenceDocument => ({ protocol_version: 'mayday.intelligence.document/1', document_id: 'doc-1', title: 'Report', storage_time: '2026-11-19T12:00:00Z', provenance: [], geography })
describe('Intelligence provider mapping', () => {
  it('accepts named and GeoJSON-style coordinates', () => {
    expect(coordinatesFor(document({ latitude: 39.77, longitude: -86.16 }))).toMatchObject({ latitude: 39.77, longitude: -86.16 })
    expect(coordinatesFor(document({ coordinates: [-0.12, 51.5] }))).toMatchObject({ latitude: 51.5, longitude: -0.12 })
  })
  it('keeps non-geographic and invalid records off the globe', () => {
    expect(coordinatesFor(document({ city: 'London' }))).toBeUndefined()
    expect(coordinatesFor(document({ lat: 200, lon: 0 }))).toBeUndefined()
  })
  it('allows only HTTP(S) evidence links', () => {
    expect(safeExternalUrl('https://example.com/report')).toBe('https://example.com/report')
    expect(safeExternalUrl('javascript:alert(1)')).toBeUndefined()
  })
})
