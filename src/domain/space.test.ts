import { describe, expect, it } from 'vitest'
import { bodiesForDocument, missionsForDocument, validateSpaceObservation, type SpaceObservation } from './space'
describe('space observation contract', () => {
  const observation: SpaceObservation = { id:'obs-1',title:'Lunar observation',observedAt:'2026-11-19T00:00:00Z',frame:{kind:'body-fixed',body:'moon'},sourceDocumentIds:['doc-1'] }
  it('requires evidence-linked, time-bounded observations',()=>expect(validateSpaceObservation(observation)).toBe(true))
  it('rejects orbital elements without a valid epoch',()=>expect(validateSpaceObservation({...observation,frame:{kind:'orbital-elements',centralBody:'earth',epoch:'unknown'}})).toBe(false))
  it('routes evidence to every explicitly named body without inventing coordinates',()=>{
    expect(bodiesForDocument({title:'Dragonfly mission prepares for Titan'})).toEqual(['titan'])
    expect(bodiesForDocument({title:'Mars rover studies an asteroid'})).toEqual(['mars','asteroid-belt'])
    expect(bodiesForDocument({title:'BepiColombo observes Mercury while Cassini archive illuminates Enceladus'})).toEqual(['mercury','saturn','enceladus'])
  })
  it('routes archival and active mission evidence to mission profiles',()=>{
    expect(missionsForDocument({title:'Voyager 2 archive revisited'})).toEqual(['voyager-2'])
    expect(missionsForDocument({title:'James Webb Space Telescope observes Jupiter'})).toEqual(['jwst'])
  })
})
