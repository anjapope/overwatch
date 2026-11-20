export type ReferenceFrame =
  | { kind: 'body-fixed'; body: CelestialBodyId }
  | { kind: 'earth-centered-inertial'; standard: 'J2000' }
  | { kind: 'heliocentric'; standard: 'J2000' }
  | { kind: 'orbital-elements'; centralBody: CelestialBodyId; epoch: string }

export type CelestialBodyId = 'sun' | 'mercury' | 'venus' | 'earth' | 'moon' | 'mars' | 'jupiter' | 'io' | 'europa' | 'ganymede' | 'callisto' | 'saturn' | 'titan' | 'enceladus' | 'asteroid-belt'
export interface SpaceObservation {
  id: string; title: string; observedAt: string; frame: ReferenceFrame
  uncertainty?: string; sourceDocumentIds: string[]
}
export interface CelestialBody { id: CelestialBodyId; name: string; kind: string; color: string; x: number; y: number; size: number; parent?: CelestialBodyId; status: string }
export interface SpaceMissionProfile { id: string; name: string; agency: string; kind: string; status: string; focus: string; terms: RegExp }

// Deliberately compressed and symbolic: positions support navigation, not ephemeris claims.
export const celestialBodies: CelestialBody[] = [
  { id:'sun',name:'Sun',kind:'star',color:'#ffd36a',x:8,y:50,size:34,status:'Space weather anchor' },
  { id:'mercury',name:'Mercury',kind:'planet',color:'#a7a29a',x:21,y:43,size:10,status:'MESSENGER archive requested' },
  { id:'venus',name:'Venus',kind:'planet',color:'#d9aa62',x:27,y:62,size:17,status:'Magellan and Venus Express archive requested' },
  { id:'earth',name:'Earth',kind:'planet',color:'#49a8ff',x:35,y:37,size:20,status:'Operational' },
  { id:'moon',name:"Luna (Earth's moon)",kind:'natural satellite',color:'#cbd2d9',x:41,y:30,size:9,parent:'earth',status:'Body view operational' },
  { id:'mars',name:'Mars',kind:'planet',color:'#df6848',x:51,y:61,size:16,status:'Body view planned' },
  { id:'asteroid-belt',name:'Asteroid belt',kind:'minor-body region',color:'#a38e79',x:62,y:45,size:12,status:'Clustered object layer planned' },
  { id:'jupiter',name:'Jupiter',kind:'planet',color:'#d9a874',x:73,y:67,size:28,status:'System context' },
  { id:'io',name:'Io',kind:'natural satellite',color:'#e7c84f',x:68,y:75,size:7,parent:'jupiter',status:'Galileo and Voyager archive requested' },
  { id:'europa',name:'Europa',kind:'natural satellite',color:'#c9b999',x:76,y:77,size:7,parent:'jupiter',status:'Galileo and Voyager archive requested' },
  { id:'ganymede',name:'Ganymede',kind:'natural satellite',color:'#918578',x:80,y:62,size:8,parent:'jupiter',status:'Galileo, Juno, and Voyager archive requested' },
  { id:'callisto',name:'Callisto',kind:'natural satellite',color:'#6f665e',x:66,y:60,size:8,parent:'jupiter',status:'Galileo and Voyager archive requested' },
  { id:'saturn',name:'Saturn',kind:'planet',color:'#e6cb83',x:89,y:35,size:25,status:'System context' },
  { id:'titan',name:'Titan',kind:'natural satellite',color:'#d99e42',x:94,y:24,size:10,parent:'saturn',status:'Body view planned' },
  { id:'enceladus',name:'Enceladus',kind:'natural satellite',color:'#dce9ef',x:84,y:25,size:7,parent:'saturn',status:'Cassini and Voyager archive requested' },
]

export const spaceMissionProfiles: SpaceMissionProfile[] = [
  { id:'iss',name:'International Space Station',agency:'International partnership',kind:'Crewed orbital laboratory',status:'Active',focus:'Continuous human presence, Earth science, microgravity research, and visiting vehicles.',terms:/\b(ISS|International Space Station)\b/i },
  { id:'jwst',name:'James Webb Space Telescope',agency:'NASA · ESA · CSA',kind:'Infrared observatory',status:'Active at Sun–Earth L2',focus:'Early universe, exoplanets, stellar formation, and solar-system observations.',terms:/\b(JWST|James Webb|Webb Space Telescope)\b/i },
  { id:'voyager-1',name:'Voyager 1',agency:'NASA / JPL',kind:'Interstellar probe',status:'Extended mission',focus:'Jupiter and Saturn archive; heliosphere and interstellar environment.',terms:/\bVoyager 1\b/i },
  { id:'voyager-2',name:'Voyager 2',agency:'NASA / JPL',kind:'Interstellar probe',status:'Extended mission',focus:'Jupiter, Saturn, Uranus, and Neptune archive; heliosphere.',terms:/\bVoyager 2\b/i },
  { id:'cassini',name:'Cassini–Huygens',agency:'NASA · ESA · ASI',kind:'Saturn orbiter and Titan lander',status:'Archive mission',focus:'Saturn, rings, Titan, Enceladus, and the Saturnian system.',terms:/\b(Cassini|Huygens)\b/i },
  { id:'galileo',name:'Galileo',agency:'NASA / JPL',kind:'Jupiter orbiter',status:'Archive mission',focus:'Jupiter, Io, Europa, Ganymede, and Callisto.',terms:/\bGalileo (spacecraft|mission|probe)\b/i },
  { id:'juno',name:'Juno',agency:'NASA / JPL',kind:'Jupiter orbiter',status:'Active extended mission',focus:'Jupiter interior, atmosphere, magnetosphere, and close moon encounters.',terms:/\bJuno\b/i },
]

export function validateSpaceObservation(value: SpaceObservation): boolean {
  if (!value.id || !value.title || !value.sourceDocumentIds.length || Number.isNaN(new Date(value.observedAt).getTime())) return false
  if (value.frame.kind === 'orbital-elements') return !Number.isNaN(new Date(value.frame.epoch).getTime())
  return true
}

const bodyTerms: Record<CelestialBodyId, RegExp> = {
  sun: /\b(sun|solar|heliophysics|coronal|sunspot)\b/i,
  mercury: /\b(mercury|messenger spacecraft|bepicolombo)\b/i,
  venus: /\b(venus|venusian|magellan spacecraft|venus express|veritas|davinci)\b/i,
  earth: /\b(earth|terrestrial|near-earth|geomagnetic|aurora)\b/i,
  moon: /\b(moon|lunar|artemis)\b/i,
  mars: /\b(mars|martian|perseverance|curiosity rover)\b/i,
  jupiter: /\b(jupiter|jovian|galileo spacecraft|juno spacecraft)\b/i,
  io: /\b(io|jovian moon io)\b/i,
  europa: /\b(europa|europa clipper)\b/i,
  ganymede: /\b(ganymede|juice mission)\b/i,
  callisto: /\bcallisto\b/i,
  saturn: /\b(saturn|saturnian|cassini)\b/i,
  titan: /\b(titan|dragonfly)\b/i,
  enceladus: /\benceladus\b/i,
  'asteroid-belt': /\b(asteroid|comet|minor planet|small bod(?:y|ies)|near-earth object|neo)\b/i,
}

export interface BodyRoutableDocument { title: string; summary?: string | null; topics?: string[] | null; source_id?: string | null }
export function bodiesForDocument(document: BodyRoutableDocument): CelestialBodyId[] {
  const text = `${document.title} ${document.summary ?? ''} ${(document.topics ?? []).join(' ')}`
  const matches = celestialBodies.map(body => body.id).filter(id => bodyTerms[id].test(text))
  if (document.source_id === 'overwatch-space-artemis' && !matches.includes('moon')) matches.push('moon')
  return matches
}

export function missionsForDocument(document: BodyRoutableDocument): string[] {
  const text = `${document.title} ${document.summary ?? ''} ${(document.topics ?? []).join(' ')}`
  return spaceMissionProfiles.filter(mission => mission.terms.test(text)).map(mission => mission.id)
}
