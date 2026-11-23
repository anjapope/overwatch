import { afterEach, describe, expect, it, vi } from 'vitest'
import { earthDocumentCategories, filterEarthFeed, loadEarthFeedMode, saveEarthFeedMode } from './earthFeed'
import type { IntelligenceDocument } from './intelligence'
const doc=(title:string,extra:Partial<IntelligenceDocument>={}):IntelligenceDocument=>({protocol_version:'mayday.intelligence.document/1',document_id:title,title,storage_time:'2026-11-23T00:00:00Z',provenance:[],...extra})
afterEach(()=>{vi.unstubAllGlobals()})
describe('Earth evidence lens',()=>{
  it('separates mission archives from military and political reporting',()=>{
    const records=[doc('Untitled archive',{source_id:'overwatch-space-pds-io'}),doc('New election results'),doc('Unclassified note')]
    expect(filterEarthFeed(records,'science').map(d=>d.title)).toEqual(['Untitled archive'])
    expect(filterEarthFeed(records,'politics').map(d=>d.title)).toEqual(['New election results'])
    expect(filterEarthFeed(records,'all')).toEqual(records)
  })
  it('supports mixed science/security stories and avoids substring matches',()=>{
    expect(earthDocumentCategories(doc('NASA studies military satellite damage'))).toEqual(['science','politics'])
    expect(earthDocumentCategories(doc('Award ceremony at the warehouse'))).toEqual([])
    expect(earthDocumentCategories(doc('New data',{topics:['climate']}))).toEqual(['science'])
  })
  it('persists a validated mode and remains usable when storage is unavailable',()=>{
    const storage={getItem:vi.fn(()=> 'science'),setItem:vi.fn()}
    vi.stubGlobal('localStorage',storage)
    expect(loadEarthFeedMode()).toBe('science')
    saveEarthFeedMode('politics');expect(storage.setItem).toHaveBeenCalledWith('overwatch.earth-feed-mode.v1','politics')
    storage.getItem.mockReturnValue('unexpected');expect(loadEarthFeedMode()).toBe('all')
    storage.getItem.mockImplementation(()=>{throw Error('denied')})
    storage.setItem.mockImplementation(()=>{throw Error('denied')})
    expect(loadEarthFeedMode()).toBe('all');expect(()=>saveEarthFeedMode('science')).not.toThrow()
  })
})

describe('Earth feed volume protection',()=>{
  it('hides archive/test batches and caps each news source without modifying retained records',()=>{
    const records=[...Array.from({length:100},(_,i)=>doc('News '+i,{source_id:'overwatch-bbc-world',document_id:'n'+i})),doc('Archive',{source_id:'overwatch-space-pds4'}),doc('Fixture',{source_id:'test-news'})]
    const filtered=filterEarthFeed(records,'all',{includeArchives:false,hideTests:true,perSourceLimit:25,collapseRepeats:true})
    expect(filtered).toHaveLength(25);expect(filtered.every(d=>d.source_id==='overwatch-bbc-world')).toBe(true)
    expect(records).toHaveLength(102)
  })
  it('collapses repeated records by source and URL, while allowing limits to be disabled',()=>{
    const records=[doc('Same',{document_id:'1',source_id:'news',canonical_url:'https://example.org/story'}),doc('Updated',{document_id:'2',source_id:'news',canonical_url:'https://example.org/story'})]
    expect(filterEarthFeed(records,'all',{includeArchives:true,hideTests:false,perSourceLimit:0,collapseRepeats:true})).toHaveLength(1)
    expect(filterEarthFeed(records,'all',{includeArchives:true,hideTests:false,perSourceLimit:0,collapseRepeats:false})).toHaveLength(2)
  })
})
