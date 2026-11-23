import snapshot from '../content/orbitalSnapshot.json'
import { celestialBodies, type CelestialBody } from './space'
export type Vector3 = [number,number,number]
export interface Orientation { ra:number; dec:number; meridian:number }
interface SnapshotBody { positionKm:number[]; radiusKm:number; rotation:Orientation|null }
const bodies:Record<string,SnapshotBody> = snapshot.bodies
export const orbitalContextEpoch = snapshot.epoch
export const orbitalContextSources = snapshot.sources
const dot=(a:Vector3,b:Vector3)=>a.reduce((sum,v,i)=>sum+v*b[i],0)
/** ICRF -> IAU body axes using the secular PCK model at the snapshot epoch. */
export function bodyFixedVector(vector:Vector3,orientation:Orientation):Vector3 {
  const alpha=orientation.ra*Math.PI/180,delta=orientation.dec*Math.PI/180,w=orientation.meridian*Math.PI/180
  const node:Vector3=[-Math.sin(alpha),Math.cos(alpha),0]
  const east:Vector3=[-Math.sin(delta)*Math.cos(alpha),-Math.sin(delta)*Math.sin(alpha),Math.cos(delta)]
  const pole:Vector3=[Math.cos(delta)*Math.cos(alpha),Math.cos(delta)*Math.sin(alpha),Math.sin(delta)]
  const x=dot(vector,node),y=dot(vector,east)
  return [Math.cos(w)*x+Math.sin(w)*y,-Math.sin(w)*x+Math.cos(w)*y,dot(vector,pole)]
}
export function relativeVector(origin:number[],target:number[]):Vector3 {
  return [target[0]-origin[0],target[1]-origin[1],target[2]-origin[2]]
}
export interface NearbyWorld { body:CelestialBody; positionKm:Vector3; distanceKm:number; radiusKm:number }
export function nearbyWorlds(bodyId:string):NearbyWorld[] {
  const origin=bodies[bodyId],body=celestialBodies.find(item=>item.id===bodyId)
  if(!origin || !body)return []
  const family=body.parent ?? body.id
  let candidates=celestialBodies.filter(item=>item.id!==bodyId && (item.id===family || item.parent===family))
  if(!candidates.length && bodyId!=='sun')candidates=celestialBodies.filter(item=>item.id==='sun')
  if(bodyId==='sun')candidates=celestialBodies.filter(item=>item.kind==='planet')
  return candidates.flatMap(target=>{
    const record=bodies[target.id]
    if(!record)return []
    const relative=relativeVector(origin.positionKm,record.positionKm)
    return [{body:target,positionKm:origin.rotation?bodyFixedVector(relative,origin.rotation):relative,distanceKm:Math.hypot(...relative),radiusKm:record.radiusKm}]
  }).sort((a,b)=>a.distanceKm-b.distanceKm)
}
export function hasBodyOrientation(bodyId:string):boolean { return Boolean(bodies[bodyId]?.rotation) }
/** A sphere blocks the camera-to-label segment. Labels never show through the selected globe. */
export function isOccluded(camera:Vector3,target:Vector3,radius:number):boolean {
  const segment=relativeVector(camera,target),squared=dot(segment,segment)
  if(!squared)return false
  const t=Math.max(0,Math.min(1,-dot(camera,segment)/squared))
  const closest=camera.map((v,i)=>v+t*segment[i])
  return t>0 && t<1 && Math.hypot(...closest)<radius
}
