import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { EarthFeedSettings } from './EarthFeedSettings'
import { ObservationFeed } from './ObservationFeed'
import { buildRegionalDossiers } from '../analysis/regionalIntelligence'
import { filterEarthFeed } from '../domain/earthFeed'
import type { IntelligenceDocument } from '../domain/intelligence'
const documents:IntelligenceDocument[]=[
  {protocol_version:'mayday.intelligence.document/1',document_id:'science',title:'NASA satellite climate research',storage_time:'2026-11-23',provenance:[],geography:{country:'Ukraine'}},
  {protocol_version:'mayday.intelligence.document/1',document_id:'politics',title:'Military attack in Ukraine',storage_time:'2026-11-23',provenance:[],geography:{country:'Ukraine'}},
]
describe('Earth feed settings panel',()=>{
  it('offers all/science/security lenses with an accessible selected radio',()=>{
    const html=renderToStaticMarkup(<EarthFeedSettings mode="science" documents={documents} onChange={()=>{}}/>)
    expect(html).toContain('Science &amp; space');expect(html).toContain('Politics &amp; security')
    expect(html).toContain('checked="" value="science"')
    expect(html).toContain('map markers, and regional dossiers')
  })
  it('does not show a previously selected hidden article in the filtered feed',()=>{
    const html=renderToStaticMarkup(<ObservationFeed observations={filterEarthFeed(documents,'science')} allObservations={documents} earthFeedMode="science" onEarthFeedModeChange={()=>{}} selectedId="politics" loading={false} onSelect={()=>{}} onCloseRegion={()=>{}} onRefresh={()=>{}}/>)
    expect(html).toContain('NASA satellite climate research')
    expect(html).not.toContain('Military attack in Ukraine')
  })
  it('keeps the filter available in regional dossiers built from the same filtered set',()=>{
    const filtered=filterEarthFeed(documents,'science'),dossier=buildRegionalDossiers(filtered).find(d=>d.region.id==='eastern-europe')!
    const html=renderToStaticMarkup(<ObservationFeed observations={filtered} allObservations={documents} earthFeedMode="science" onEarthFeedModeChange={()=>{}} selectedRegion={dossier} loading={false} onSelect={()=>{}} onCloseRegion={()=>{}} onRefresh={()=>{}}/>)
    expect(html).toContain('Earth view:');expect(html).toContain('NASA satellite climate research')
    expect(html).not.toContain('Military attack in Ukraine')
  })
})
