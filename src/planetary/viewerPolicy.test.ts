import { describe, expect, it } from 'vitest'
import { surfaceCameraPolicy, surfaceQuality, surfaceSceneOptions } from './viewerPolicy'
describe('planetary camera and render policy',()=>{
 it('keeps the scene on the supplied body and disables atmospheric halos',()=>{
  const ellipsoid={radius:11267}
  const options=surfaceSceneOptions(ellipsoid)
  expect(options.ellipsoid).toBe(ellipsoid)
  expect(options.skyAtmosphere).toBe(false)
  expect(options.skyBox).toBe(false)
  expect(options.requestRenderMode).toBe(true)
  expect(options.maximumRenderTimeChange).toBe(Infinity)
 })
 it.each([435,11267,1737400,3396190])('keeps zoom and collision distances proportional for radius %s',radius=>{
  const policy=surfaceCameraPolicy(radius)
  expect(policy.minimumZoomDistance).toBeGreaterThan(0)
  expect(policy.minimumZoomDistance).toBeLessThan(radius*.01)
  expect(policy.maximumZoomDistance).toBe(radius*30)
  expect(policy.minimumCollisionTerrainHeight).toBe(Math.max(1,radius*.0025))
  expect(policy.minimumTrackBallHeight).toBe(radius*1.175)
  expect(policy.inertiaZoom).toBe(0)
 })
 it.each([0,-1,NaN,Infinity])('rejects invalid radius %s',radius=>expect(()=>surfaceCameraPolicy(radius)).toThrow())
 it('reduces pixel and terrain work in responsive mode',()=>{
  expect(surfaceQuality.responsive.resolutionScale**2).toBeCloseTo(.64)
  expect(surfaceQuality.responsive.maximumScreenSpaceError).toBeGreaterThan(surfaceQuality.detailed.maximumScreenSpaceError)
  expect(surfaceQuality.responsive.targetFrameRate).toBe(30)
 })
})
