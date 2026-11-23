import { describe, expect, it } from 'vitest'
import { bodyFixedVector, isOccluded, nearbyWorlds, relativeVector } from './orbitalContext'
import snapshot from '../content/orbitalSnapshot.json'
describe('dated geometric context',()=>{
  it('converts relative ICRF vectors to a right-handed body frame without changing distance',()=>{
    expect(relativeVector([100,200,300],[101,202,303])).toEqual([1,2,3])
    const orientation={ra:17,dec:63,meridian:123}
    const v=bodyFixedVector([1,2,3],orientation)
    expect(Math.hypot(...v)).toBeCloseTo(Math.sqrt(14),10)
    expect(bodyFixedVector([0,1,0],{ra:0,dec:90,meridian:0})[0]).toBeCloseTo(1)
    expect(bodyFixedVector([0,0,1],{ra:0,dec:90,meridian:0})[2]).toBeCloseTo(1)
  })
  it('places Jupiter near Io’s sub-Jovian meridian at a physical orbital distance',()=>{
    const worlds=nearbyWorlds('io'),jupiter=worlds.find(w=>w.body.id==='jupiter')!
    expect(worlds.some(w=>w.body.id==='io')).toBe(false)
    expect(worlds.some(w=>w.body.id==='europa')).toBe(true)
    expect(worlds.some(w=>w.body.id==='ganymede')).toBe(true)
    expect(jupiter.distanceKm).toBeGreaterThan(400000)
    expect(jupiter.distanceKm).toBeLessThan(450000)
    expect(Math.abs(Math.atan2(jupiter.positionKm[1],jupiter.positionKm[0])*180/Math.PI)).toBeLessThan(5)
    expect(jupiter.radiusKm).toBeGreaterThan(69000)
  })
  it('uses one epoch, and never fabricates coordinates for missing objects',()=>{
    expect(snapshot.epoch).toBe('2026-11-23 00:00:00 TDB')
    const earth=nearbyWorlds('moon').find(w=>w.body.id==='earth')!
    expect(earth.distanceKm).toBeGreaterThan(350000);expect(earth.distanceKm).toBeLessThan(410000)
    expect(nearbyWorlds('oort-cloud')).toEqual([])
    expect(nearbyWorlds('unknown')).toEqual([])
  })
  it('occludes hidden labels without hiding unobstructed directions',()=>{
    expect(isOccluded([0,0,3],[0,0,-100],1)).toBe(true)
    expect(isOccluded([0,0,3],[100,0,0],1)).toBe(false)
    expect(isOccluded([0,0,3],[0,0,100],1)).toBe(false)
    expect(isOccluded([0,0,3],[0,0,3],1)).toBe(false)
  })
})
