import type { IntelligenceDocument } from '../domain/intelligence'

export type RegionalSignal = 'conflict' | 'attention' | 'activity'
export type GeographicBasis = 'source-backed' | 'deterministic-mention'

export interface RegionDefinition {
  id: string
  name: string
  bounds: readonly [west: number, south: number, east: number, north: number]
  matchers: readonly RegExp[]
}

export interface RegionalObservation {
  document: IntelligenceDocument
  basis: GeographicBasis
  conflict: boolean
}

export interface RegionalDossier {
  region: RegionDefinition
  observations: RegionalObservation[]
  signal: RegionalSignal
  conflictCount: number
  sourceBackedCount: number
}

// These are deliberately broad operational zones, not political boundaries.
// Country-level geometry can replace them later without changing the dossier contract.
export const REGIONS: readonly RegionDefinition[] = [
  { id: 'north-america', name: 'North America', bounds: [-168, 15, -52, 72], matchers: [/\bunited states\b/i, /\bu\.s\.\b/i, /\bcanada\b/i, /\bmexico\b/i, /\bflorida\b/i, /\btrump\b/i] },
  { id: 'latin-america', name: 'Latin America & Caribbean', bounds: [-118, -56, -34, 27], matchers: [/\bvenezuela\b/i, /\bhaiti\b/i, /\bbrazil\b/i, /\bargentina\b/i, /\bchile\b/i, /\bcolombia\b/i, /\bcaribbean\b/i] },
  { id: 'europe', name: 'Europe', bounds: [-25, 34, 42, 72], matchers: [/\beurope\b/i, /\beuropean\b/i, /\bunited kingdom\b/i, /\bbritain\b/i, /\bbritish\b/i, /\bengland\b/i, /\bscotland\b/i, /\blondon\b/i, /\bgermany\b/i, /\bfrance\b/i, /\bberlin\b/i] },
  { id: 'eastern-europe', name: 'Eastern Europe', bounds: [20, 40, 62, 72], matchers: [/\bukraine\b/i, /\brussia\b/i, /\brussian\b/i, /\bcrimea\b/i, /\bbelarus\b/i, /\bmoldova\b/i, /\bbaltic\b/i] },
  { id: 'middle-east', name: 'Middle East', bounds: [26, 12, 64, 42], matchers: [/\bgaza\b/i, /\bisrael\b/i, /\bpalestin/i, /\biran\b/i, /\biraq\b/i, /\bsyria\b/i, /\blebanon\b/i, /\byemen\b/i] },
  { id: 'africa', name: 'Africa', bounds: [-20, -36, 52, 38], matchers: [/\bafrica\b/i, /\bkenya\b/i, /\buganda\b/i, /\bsenegal\b/i, /\bsudan\b/i, /\bethiopia\b/i, /\bcongo\b/i, /\bnigeria\b/i, /\bsomalia\b/i] },
  { id: 'south-asia', name: 'South Asia', bounds: [60, 5, 92, 38], matchers: [/\bindia\b/i, /\bindian\b/i, /\bpakistan\b/i, /\bbangladesh\b/i, /\bafghanistan\b/i, /\bsri lanka\b/i] },
  { id: 'southeast-asia', name: 'Southeast Asia', bounds: [92, -12, 142, 29], matchers: [/\bmyanmar\b/i, /\brohingya\b/i, /\bthailand\b/i, /\bvietnam\b/i, /\bphilippines\b/i, /\bindonesia\b/i] },
  { id: 'east-asia', name: 'East Asia', bounds: [100, 20, 150, 55], matchers: [/\bchina\b/i, /\bchinese\b/i, /\bxi\b/i, /\bjapan\b/i, /\bkorea\b/i, /\btaiwan\b/i] },
  { id: 'oceania', name: 'Oceania', bounds: [110, -50, 180, 0], matchers: [/\baustralia\b/i, /\bnew zealand\b/i, /\bpacific islands?\b/i] },
]

const conflictPattern = /\b(war|warfare|conflict|military|attack|strike|missile|drone|bomb|invasion|troops?|armed|genocide|ceasefire|assassination|occupation)\b/i
const attentionPattern = /\b(crisis|disaster|emergency|sanction|protest|deadlock|missing|killed|deadly|security|climate)\b/i

function documentText(document: IntelligenceDocument): string {
  return [document.title, document.summary, ...(document.topics ?? []), JSON.stringify(document.geography ?? {})].filter(Boolean).join(' ')
}

function sourceBacked(document: IntelligenceDocument, region: RegionDefinition): boolean {
  if (!document.geography) return false
  const geography = JSON.stringify(document.geography)
  return region.matchers.some(matcher => matcher.test(geography))
}

export function buildRegionalDossiers(observations: readonly IntelligenceDocument[]): RegionalDossier[] {
  return REGIONS.map(region => {
    const regional = observations.flatMap(document => {
      const text = documentText(document)
      if (!region.matchers.some(matcher => matcher.test(text))) return []
      return [{ document, basis: sourceBacked(document, region) ? 'source-backed' : 'deterministic-mention', conflict: conflictPattern.test(text) } satisfies RegionalObservation]
    })
    const conflictCount = regional.filter(item => item.conflict).length
    const signal: RegionalSignal = conflictCount > 0 ? 'conflict' : regional.some(item => attentionPattern.test(documentText(item.document))) ? 'attention' : 'activity'
    return { region, observations: regional, signal, conflictCount, sourceBackedCount: regional.filter(item => item.basis === 'source-backed').length }
  }).filter(dossier => dossier.observations.length > 0)
}

// Athos will implement this boundary later. Its assessments remain additive and
// must cite document IDs; they never replace the deterministic/source-backed record.
export interface RegionalAssessmentEnricher {
  readonly id: string
  assess(dossier: RegionalDossier): Promise<{ summary: string; citedDocumentIds: string[] }>
}
