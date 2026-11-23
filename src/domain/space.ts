import catalog from './solarCatalog.json'
import type { IntelligenceDocument } from './intelligence'

export type CelestialBodyId = (typeof catalog.bodies)[number]['id']
export type ReferenceFrame =
  | { kind: 'body-fixed'; body: CelestialBodyId }
  | { kind: 'earth-centered-inertial'; standard: 'J2000' }
  | { kind: 'heliocentric'; standard: 'J2000' }
  | { kind: 'orbital-elements'; centralBody: CelestialBodyId; epoch: string }
export interface SpaceObservation {
  id: string; title: string; observedAt: string; frame: ReferenceFrame
  uncertainty?: string; sourceDocumentIds: string[]
}
export interface CelestialBody {
  id: CelestialBodyId; name: string; kind: string; color: string; x: number; y: number; size: number
  parent?: CelestialBodyId; status: string; aliases: string[]
}
export interface SpaceMissionProfile {
  id: string; name: string; agency: string; kind: string; status: string; focus: string; terms: RegExp
}
export const celestialBodies: CelestialBody[] = catalog.bodies
const currentOnlyBodies = new Set(['sun','mercury','venus','earth','moon','mars','phobos','deimos','asteroid-belt','eros','itokawa','bennu','ryugu','didymos'])
const currentEvidenceWindowMs = 30*24*60*60*1000
export function usesCurrentEvidenceOnly(bodyId:CelestialBodyId):boolean { return currentOnlyBodies.has(bodyId) }
/** Inner-system evidence is recent-only; outer-system mission records retain their historical context. */
export function isCurrentBodyEvidence(bodyId:CelestialBodyId,document:IntelligenceDocument,now=Date.now()):boolean {
  if(!currentOnlyBodies.has(bodyId))return true
  if(document.source_type==='pds' || [document.source_id,document.connector_id].some(id=>id?.startsWith('overwatch-space-')))return false
  const published=Date.parse(document.publication_time ?? '')
  return Number.isFinite(published) && published >= now-currentEvidenceWindowMs
}
const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const expression = (terms: string[]) => new RegExp(`(?:^|[^\\p{L}\\p{N}])(?:${terms.map(escaped).join('|')})(?=$|[^\\p{L}\\p{N}])`, 'iu')
export const spaceMissionProfiles: SpaceMissionProfile[] = catalog.missions.map(mission => ({ ...mission, terms: expression(mission.aliases) }))
const bodyTerms = new Map(celestialBodies.map(body => [body.id, expression(body.id === 'moon' ? ['lunar','Luna',"Earth’s moon","Earth's moon"] : body.id === 'sun' ? ['Sun','Sol'] : body.aliases)]))
export interface BodyRoutableDocument { title: string; summary?: string | null; topics?: string[] | null; source_id?: string | null }
export function bodiesForDocument(document: BodyRoutableDocument): CelestialBodyId[] {
  const text = `${document.title} ${document.summary ?? ''} ${(document.topics ?? []).join(' ')}`
  const matches = celestialBodies.filter(body => bodyTerms.get(body.id)!.test(text) || (document.topics ?? []).some(topic => body.aliases.some(alias => alias.toLocaleLowerCase() === topic.toLocaleLowerCase()))).map(body => body.id)
  if (document.source_id === 'overwatch-space-artemis' && !matches.includes('moon')) matches.push('moon')
  return matches
}
export function missionsForDocument(document: BodyRoutableDocument): string[] {
  const text = `${document.title} ${document.summary ?? ''} ${(document.topics ?? []).join(' ')}`
  return spaceMissionProfiles.filter(mission => mission.terms.test(text)).map(mission => mission.id)
}
export function validateSpaceObservation(value: SpaceObservation): boolean {
  if (!value.id || !value.title || !value.sourceDocumentIds.length || Number.isNaN(new Date(value.observedAt).getTime())) return false
  if (value.frame.kind === 'orbital-elements') return !Number.isNaN(new Date(value.frame.epoch).getTime())
  return true
}
export const solarSystemGroups = [
  { id:'inner', name:'Inner solar system', bodies:['sun','mercury','venus','earth','mars'] },
  { id:'jupiter-system', name:'Jupiter system', bodies:['jupiter'] },
  { id:'saturn-system', name:'Saturn system', bodies:['saturn'] },
  { id:'uranus-system', name:'Uranus system', bodies:['uranus'] },
  { id:'neptune-system', name:'Neptune system', bodies:['neptune'] },
  { id:'dwarfs', name:'Dwarf planets', bodies:['ceres','pluto','eris','haumea','makemake'] },
  { id:'small-bodies', name:'Asteroids & distant worlds', bodies:['vesta','pallas','hygiea','eros','itokawa','bennu','ryugu','didymos','psyche','arrokoth','quaoar','sedna','gonggong','orcus'] },
  { id:'comets', name:'Comets & regions', bodies:['halley','67p','tempel-1','wild-2','hartley-2','asteroid-belt','kuiper-belt','oort-cloud'] },
]
