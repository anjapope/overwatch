import { describe, expect, it } from 'vitest'
import { bodiesForDocument, missionsForDocument, validateSpaceObservation, celestialBodies, solarSystemGroups, type SpaceObservation } from './space'
describe('space observation contract', () => {
  const observation: SpaceObservation = { id:'obs-1',title:'Lunar observation',observedAt:'2026-11-19T00:00:00Z',frame:{kind:'body-fixed',body:'moon'},sourceDocumentIds:['doc-1'] }
  it('requires evidence-linked, time-bounded observations',()=>expect(validateSpaceObservation(observation)).toBe(true))
  it('rejects orbital elements without a valid epoch',()=>expect(validateSpaceObservation({...observation,frame:{kind:'orbital-elements',centralBody:'earth',epoch:'unknown'}})).toBe(false))
  it('routes evidence to every explicitly named body without inventing coordinates',()=>{
    expect(bodiesForDocument({title:'Dragonfly mission prepares for Titan'})).toEqual(['titan'])
    expect(bodiesForDocument({title:'Mars rover studies an asteroid'})).toEqual(['mars','asteroid-belt'])
    expect(bodiesForDocument({title:'BepiColombo observes Mercury while Cassini archive illuminates Enceladus'})).toEqual(['mercury','enceladus'])
  })
  it('routes archival and active mission evidence to mission profiles',()=>{
    expect(missionsForDocument({title:'Voyager 2 archive revisited'})).toEqual(['voyager-2'])
    expect(missionsForDocument({title:'James Webb Space Telescope observes Jupiter'})).toEqual(['jwst'])
  })
})


describe('solar catalog coverage', () => {
  it('contains all planets, five dwarf planets and major outer-system moons', () => {
    const ids = celestialBodies.map(body => body.id)
    for (const id of ['sun','mercury','venus','earth','mars','jupiter','saturn','uranus','neptune','ceres','pluto','eris','haumea','makemake','triton','charon','titania','oberon','phobos','deimos']) expect(ids).toContain(id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const body of celestialBodies) if (body.parent) expect(ids).toContain(body.parent)
  })
  it('makes every catalog body reachable through a primary or satellite group', () => {
    const primary = solarSystemGroups.flatMap(group => group.bodies)
    for (const body of celestialBodies) expect(primary.includes(body.id) || (body.parent && primary.includes(body.parent))).toBeTruthy()
  })
  it('routes outer planets and historical missions without matching fragments', () => {
    expect(bodiesForDocument({title:'Voyager 2 observations of Neptune and Triton'})).toEqual(['neptune','triton'])
    expect(bodiesForDocument({title:'New Horizons studied Pluto, Charon and Arrokoth'})).toEqual(['pluto','charon','arrokoth'])
    expect(bodiesForDocument({title:'Titania observations'})).toEqual(['titania'])
    expect(missionsForDocument({title:'Pioneer 10 and New Horizons historical data'})).toEqual(['pioneer-10','new-horizons'])
  })
})

it('does not route another planet’s moon to Earth’s Moon',()=>{
 expect(bodiesForDocument({title:'Neptune moon Triton archive'})).toEqual(['neptune','triton'])
 expect(bodiesForDocument({title:'Archive record',topics:['MOON']})).toEqual(['moon'])
})
