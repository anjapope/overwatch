import { describe, expect, it } from 'vitest'
import { layersForBody, planetaryLayers, tileUrl } from './planetary'
import elevation from './marsElevation.json'
describe('scientific surface catalog',()=>{
 it('has verified, bounded layers for twelve bodies',()=>{
  expect(new Set(planetaryLayers.map(layer=>layer.body)).size).toBe(12)
  for(const layer of planetaryLayers){
   expect(layer.baseUrl.startsWith('https://trek.nasa.gov/tiles/')).toBe(true)
   expect(layer.matrixLabels.length).toBeGreaterThan(0)
   expect(layer.rectangle[0]).toBeLessThan(layer.rectangle[2])
   expect(layer.rectangle[1]).toBeLessThan(layer.rectangle[3])
   expect(layer.radiusMeters).toBeGreaterThan(0)
  }
 })
 it('does not invent terrain or layers for unmapped worlds',()=>expect(layersForBody('neptune')).toEqual([]))
 it('bounds requests to actual source zoom levels',()=>{
  const layer=layersForBody('moon')[0]
  expect(tileUrl(layer,0,1,0)).toContain('/0/1/0')
  expect(()=>tileUrl(layer,layer.matrixLabels.length,0,0)).toThrow()
  expect(()=>tileUrl(layer,0,2,0)).toThrow()
 })
 it('keeps the Mars elevation datum and tiling grid distinct from Earth',()=>{
  expect(elevation.spatialReference.wkid).toBe(104971)
  expect(elevation.tileInfo.origin).toEqual({x:-180,y:90})
  expect(elevation.tileInfo.format).toBe('LERC')
  expect(elevation.tileInfo.lods[0].resolution*elevation.tileInfo.cols).toBe(180)
 })
})
