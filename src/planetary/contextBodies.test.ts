import { describe, expect, it, vi } from 'vitest'
import { Cartesian3, Event, SceneMode, type Viewer } from 'cesium'
import { nearbyWorlds } from '../domain/orbitalContext'
import { addContextBodies } from './contextBodies'
describe('context bodies render lifecycle',()=>{
  it('adds lightweight geometry and removes it safely when toggled off',()=>{
    const entities:{show?:boolean}[]=[],preRender=new Event(),remove=vi.fn()
    const viewer={entities:{add:(entity:object)=>{entities.push(entity);return entity},remove},camera:{frustum:{far:1e8},position:new Cartesian3(10000000,0,0)},scene:{mode:SceneMode.SCENE3D,useDepthPicking:true,preRender,requestRender:vi.fn()},isDestroyed:()=>false} as unknown as Viewer
    const worlds=nearbyWorlds('io'),cleanup=addContextBodies(viewer,worlds,1821000)
    expect(entities.length).toBe(worlds.length*2)
    expect(viewer.scene.useDepthPicking).toBe(false)
    expect(viewer.camera.frustum.far).toBeGreaterThan(1e8)
    preRender.raiseEvent()
    cleanup()
    expect(remove).toHaveBeenCalledTimes(worlds.length*2)
    expect(viewer.camera.frustum.far).toBe(1e8)
    expect(viewer.scene.useDepthPicking).toBe(true)
    expect(preRender.numberOfListeners).toBe(0)
  })
  it('does not access destroyed viewer collections during unmount cleanup',()=>{
    let destroyed=false
    const viewer={entities:{add:(entity:object)=>entity,remove:vi.fn()},camera:{frustum:{far:1e8}},scene:{preRender:new Event(),requestRender:vi.fn()},isDestroyed:()=>destroyed} as unknown as Viewer
    const cleanup=addContextBodies(viewer,nearbyWorlds('io'),1821000)
    destroyed=true
    expect(()=>cleanup()).not.toThrow()
    expect(viewer.entities.remove).not.toHaveBeenCalled()
  })
})
