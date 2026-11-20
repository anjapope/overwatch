export type ReferenceFrame =
  | { kind: 'body-fixed'; body: CelestialBodyId }
  | { kind: 'earth-centered-inertial'; standard: 'J2000' }
  | { kind: 'heliocentric'; standard: 'J2000' }
  | { kind: 'orbital-elements'; centralBody: CelestialBodyId; epoch: string }

export type CelestialBodyId = 'sun' | 'earth' | 'moon' | 'mars' | 'jupiter' | 'saturn' | 'titan' | 'asteroid-belt'
export interface SpaceObservation {
  id: string; title: string; observedAt: string; frame: ReferenceFrame
  uncertainty?: string; sourceDocumentIds: string[]
}
export interface CelestialBody { id: CelestialBodyId; name: string; kind: string; color: string; x: number; y: number; size: number; parent?: CelestialBodyId; status: string }

// Deliberately compressed and symbolic: positions support navigation, not ephemeris claims.
export const celestialBodies: CelestialBody[] = [
  { id:'sun',name:'Sun',kind:'star',color:'#ffd36a',x:8,y:50,size:34,status:'Space weather anchor' },
  { id:'earth',name:'Earth',kind:'planet',color:'#49a8ff',x:34,y:37,size:20,status:'Operational' },
  { id:'moon',name:'Moon',kind:'natural satellite',color:'#cbd2d9',x:40,y:30,size:9,parent:'earth',status:'Body view foundation ready' },
  { id:'mars',name:'Mars',kind:'planet',color:'#df6848',x:51,y:61,size:16,status:'Body view planned' },
  { id:'asteroid-belt',name:'Asteroid belt',kind:'minor-body region',color:'#a38e79',x:62,y:45,size:12,status:'Clustered object layer planned' },
  { id:'jupiter',name:'Jupiter',kind:'planet',color:'#d9a874',x:73,y:67,size:28,status:'System context' },
  { id:'saturn',name:'Saturn',kind:'planet',color:'#e6cb83',x:89,y:35,size:25,status:'System context' },
  { id:'titan',name:'Titan',kind:'natural satellite',color:'#d99e42',x:94,y:24,size:10,parent:'saturn',status:'Body view planned' },
]

export function validateSpaceObservation(value: SpaceObservation): boolean {
  if (!value.id || !value.title || !value.sourceDocumentIds.length || Number.isNaN(new Date(value.observedAt).getTime())) return false
  if (value.frame.kind === 'orbital-elements') return !Number.isNaN(new Date(value.frame.epoch).getTime())
  return true
}
