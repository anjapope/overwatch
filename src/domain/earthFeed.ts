import type { IntelligenceDocument } from './intelligence'
export type EarthFeedMode = 'all' | 'science' | 'politics'
export const earthFeedModes: { id: EarthFeedMode; label: string }[] = [
  { id:'all', label:'All evidence' }, { id:'science', label:'Science & space' }, { id:'politics', label:'Politics & security' },
]
const science = /\b(?:nasa|esa|jaxa|noaa|usgs|astronom\w*|astrophysic\w*|planet\w*|lunar|solar|spacecraft|satellite|telescope|asteroid\w*|comet\w*|climate|weather|geolog\w*|earthquake\w*|ocean\w*|scientific|science|research|biodiversity|ecosystem\w*|glacier\w*)\b/iu
const politics = /\b(?:politic\w*|military|conflict\w*|war|warfare|attack\w*|missile\w*|troop\w*|army|navy|defen[cs]e|election\w*|parliament\w*|president\w*|government\w*|diploma\w*|sanction\w*|terror\w*|ceasefire|nato|geopolitic\w*|tariff\w*|legislat\w*|congress\w*|armed|security)\b/iu
export function earthDocumentCategories(document: IntelligenceDocument): EarthFeedMode[] {
  const metadata = `${document.source_id ?? ''} ${document.connector_id ?? ''}`
  const text = `${document.title} ${document.summary ?? ''} ${(document.topics ?? []).join(' ')} ${document.source_name ?? ''} ${document.publisher ?? ''}`
  const categories: EarthFeedMode[] = []
  if (/overwatch-space-|(?:^|[\s_-])pds(?:$|[\s_-])/i.test(metadata) || science.test(text)) categories.push('science')
  if (politics.test(text)) categories.push('politics')
  return categories
}
export function filterEarthFeed(documents: readonly IntelligenceDocument[], mode: EarthFeedMode): IntelligenceDocument[] {
  return documents.filter(document => mode === 'all' || earthDocumentCategories(document).includes(mode))
}
const storageKey = 'overwatch.earth-feed-mode.v1'
export function loadEarthFeedMode(): EarthFeedMode {
  try { const value = localStorage.getItem(storageKey); return value === 'science' || value === 'politics' ? value : 'all' } catch { return 'all' }
}
export function saveEarthFeedMode(mode: EarthFeedMode) {
  try { localStorage.setItem(storageKey, mode) } catch { /* The current selection still works without persistence. */ }
}
