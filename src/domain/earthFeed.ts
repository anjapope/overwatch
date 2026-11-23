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
  if (/overwatch-(?:bbc-world|bbc-business|un-news|govuk)\b/i.test(metadata) || politics.test(text)) categories.push('politics')
  return categories
}
export function filterEarthFeed(documents: readonly IntelligenceDocument[], mode: EarthFeedMode, options?:EarthFeedOptions): IntelligenceDocument[] {
  const counts=new Map<string,number>(),seen=new Set<string>()
  return [...documents].sort((a,b)=>(Date.parse(b.publication_time || b.storage_time)||0)-(Date.parse(a.publication_time || a.storage_time)||0)).filter(document=>{
    if(mode!=='all' && !earthDocumentCategories(document).includes(mode))return false
    if(!options)return true
    if(!options.includeArchives && mode!=='science' && isBulkArchive(document))return false
    if(options.hideTests && isTestSource(document))return false
    const source=document.source_id || document.connector_id || document.source_name || document.publisher || 'unknown'
    const title=document.title.trim().toLocaleLowerCase().replace(/\s+/g,' ')
    const signature=source+'|'+(document.canonical_url || title)
    if(options.collapseRepeats && seen.has(signature))return false
    if(options.perSourceLimit && (counts.get(source)??0)>=options.perSourceLimit)return false
    seen.add(signature);counts.set(source,(counts.get(source)??0)+1);return true
  })
}
const storageKey = 'overwatch.earth-feed-mode.v1'
export function loadEarthFeedMode(): EarthFeedMode {
  try { const value = localStorage.getItem(storageKey); return value === 'science' || value === 'politics' ? value : 'all' } catch { return 'all' }
}
export function saveEarthFeedMode(mode: EarthFeedMode) {
  try { localStorage.setItem(storageKey, mode) } catch { /* The current selection still works without persistence. */ }
}

export interface EarthFeedOptions { includeArchives:boolean; hideTests:boolean; perSourceLimit:number; collapseRepeats:boolean }
export const defaultEarthFeedOptions:EarthFeedOptions={includeArchives:false,hideTests:true,perSourceLimit:25,collapseRepeats:true}
const optionsKey='overwatch.earth-feed-options.v1'
export function loadEarthFeedOptions():EarthFeedOptions {
  try {
    const value=JSON.parse(localStorage.getItem(optionsKey) || '{}')
    return {includeArchives:value.includeArchives===true,hideTests:value.hideTests!==false,collapseRepeats:value.collapseRepeats!==false,perSourceLimit:[0,10,25,100].includes(value.perSourceLimit)?value.perSourceLimit:25}
  } catch{return {...defaultEarthFeedOptions}}
}
export function saveEarthFeedOptions(options:EarthFeedOptions) {try{localStorage.setItem(optionsKey,JSON.stringify(options))}catch{/* Session settings still work. */}}
export function isBulkArchive(document:IntelligenceDocument):boolean {
  return document.source_type==='pds' || [document.source_id,document.connector_id].some(id=>id?.startsWith('overwatch-space-'))
}
export function isTestSource(document:IntelligenceDocument):boolean {
  return [document.source_id,document.connector_id].some(id=>id && /(?:^|[-_])(?:test|demo|fixture|example)(?:$|[-_])/i.test(id))
}
