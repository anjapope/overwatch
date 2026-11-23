import { CallbackPositionProperty, Cartesian2, Cartesian3, Color, LabelStyle, SceneMode, VerticalOrigin, type Entity, type Viewer } from 'cesium'
import { isOccluded, type NearbyWorld } from '../domain/orbitalContext'
/** Lightweight schematic context geometry; no imagery requests or per-frame React updates. */
export function addContextBodies(viewer:Viewer,worlds:NearbyWorld[],radius:number) {
  const entities:Entity[]=[]
  for(const world of worlds) {
    const center=new Cartesian3(...world.positionKm.map(value=>value*1000) as [number,number,number])
    const worldRadius=world.radiusKm*1000
    entities.push(viewer.entities.add({id:`context-${world.body.id}`,position:center,properties:{bodyId:world.body.id},ellipsoid:{stackPartitions:16,slicePartitions:24,radii:new Cartesian3(worldRadius,worldRadius,worldRadius),material:Color.fromCssColorString(world.body.color)}}))
    const labelPosition=new CallbackPositionProperty(()=>{
      const towardCamera=Cartesian3.subtract(viewer.camera.position,center,new Cartesian3())
      Cartesian3.normalize(towardCamera,towardCamera)
      return Cartesian3.add(center,Cartesian3.multiplyByScalar(towardCamera,worldRadius*1.02+10,towardCamera),new Cartesian3())
    },false)
    entities.push(viewer.entities.add({id:`context-label-${world.body.id}`,position:labelPosition,properties:{bodyId:world.body.id},point:{pixelSize:7,color:Color.fromCssColorString(world.body.color),outlineColor:Color.BLACK,outlineWidth:1},label:{text:world.body.name,font:'13px sans-serif',fillColor:Color.WHITE,outlineColor:Color.BLACK,outlineWidth:3,style:LabelStyle.FILL_AND_OUTLINE,verticalOrigin:VerticalOrigin.BOTTOM,pixelOffset:new Cartesian2(0,-9)}}))
  }
  // Keep camera terrain picking on the selected globe. Context geometry must
  // never become the zoom/rotation anchor hundreds of thousands of km away.
  const depthPicking=viewer.scene.useDepthPicking
  viewer.scene.useDepthPicking=false
  const far=viewer.camera.frustum.far
  viewer.camera.frustum.far=Math.max(far,...worlds.map(world=>(world.distanceKm+world.radiusKm)*1000*2))
  const remove=viewer.scene.preRender.addEventListener(()=>{
    const p=viewer.camera.position
    worlds.forEach((world,index)=>{
      // Keep a tiny visual margin so limb labels do not leak through terrain.
      const visible=viewer.scene.mode===SceneMode.SCENE3D && !isOccluded([p.x,p.y,p.z],world.positionKm.map(v=>v*1000) as [number,number,number],radius*.999)
      entities[index*2].show=viewer.scene.mode===SceneMode.SCENE3D;entities[index*2+1].show=visible
    })
  })
  viewer.scene.requestRender()
  return ()=>{if(viewer.isDestroyed())return;remove();entities.forEach(entity=>viewer.entities.remove(entity));viewer.camera.frustum.far=far;viewer.scene.useDepthPicking=depthPicking;viewer.scene.requestRender()}
}
export function lookTowardWorld(viewer:Viewer,world:NearbyWorld,radius:number) {
  if(viewer.scene.mode!==SceneMode.SCENE3D)viewer.scene.morphTo3D(0)
  const direction=Cartesian3.normalize(new Cartesian3(...world.positionKm),new Cartesian3())
  let side=Cartesian3.cross(direction,Cartesian3.UNIT_Z,new Cartesian3())
  if(Cartesian3.magnitude(side)<.001)side=Cartesian3.cross(direction,Cartesian3.UNIT_Y,side)
  Cartesian3.normalize(side,side)
  const destination=Cartesian3.add(Cartesian3.multiplyByScalar(direction,-radius*3,new Cartesian3()),Cartesian3.multiplyByScalar(side,radius*1.25,side),new Cartesian3())
  const forward=Cartesian3.normalize(Cartesian3.negate(destination,new Cartesian3()),new Cartesian3())
  const right=Cartesian3.normalize(Cartesian3.cross(forward,Cartesian3.UNIT_Z,new Cartesian3()),new Cartesian3())
  const up=Cartesian3.normalize(Cartesian3.cross(right,forward,new Cartesian3()),new Cartesian3())
  viewer.camera.setView({destination,orientation:{direction:forward,up}})
  viewer.scene.requestRender()
}
