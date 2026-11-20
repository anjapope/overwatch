import { useState } from 'react'
import { celestialBodies, type CelestialBodyId } from '../domain/space'

export function SolarSystemNavigator({ onOpenEarth }: { onOpenEarth(): void }) {
  const [selectedId,setSelectedId]=useState<CelestialBodyId>('earth')
  const selected=celestialBodies.find(body=>body.id===selectedId)!
  return <section className="system-workspace" aria-label="Solar system navigator">
    <header className="operations-header"><div><span className="eyebrow">Compressed-distance operations view</span><h1>Solar system</h1></div><button onClick={onOpenEarth}>Open Earth operations</button></header>
    <div className="system-stage" role="img" aria-label="Symbolic clickable solar system overview">
      <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/>
      {celestialBodies.map(body=><button key={body.id} className={`celestial-body ${body.id} ${selectedId===body.id?'selected':''}`} style={{left:`${body.x}%`,top:`${body.y}%`,'--body-color':body.color,'--body-size':`${body.size}px`} as React.CSSProperties} onClick={()=>setSelectedId(body.id)} aria-label={`Select ${body.name}`}><i/><span>{body.name}</span></button>)}
    </div>
    <aside className="system-dossier"><span className="eyebrow">Selected body</span><h2>{selected.name}</h2><dl><div><dt>Class</dt><dd>{selected.kind}</dd></div><div><dt>Reference frame</dt><dd>{selected.id==='asteroid-belt'?'Heliocentric J2000':'Body-fixed when focused'}</dd></div><div><dt>Status</dt><dd>{selected.status}</dd></div></dl><p>Overview positions and sizes are intentionally symbolic. Operational observations will retain epochs, uncertainty, provenance, and explicit reference frames.</p>{selected.id==='earth'&&<button className="primary" onClick={onOpenEarth}>Enter Earth Cesium view</button>}</aside>
  </section>
}
