import { describe, expect, it } from 'vitest'
import { validateSpaceObservation, type SpaceObservation } from './space'
describe('space observation contract', () => {
  const observation: SpaceObservation = { id:'obs-1',title:'Lunar observation',observedAt:'2026-11-19T00:00:00Z',frame:{kind:'body-fixed',body:'moon'},sourceDocumentIds:['doc-1'] }
  it('requires evidence-linked, time-bounded observations',()=>expect(validateSpaceObservation(observation)).toBe(true))
  it('rejects orbital elements without a valid epoch',()=>expect(validateSpaceObservation({...observation,frame:{kind:'orbital-elements',centralBody:'earth',epoch:'unknown'}})).toBe(false))
})
