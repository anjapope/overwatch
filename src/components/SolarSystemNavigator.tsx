import { useState } from 'react'
import { bodiesForDocument, celestialBodies, type CelestialBodyId } from '../domain/space'
import type { IntelligenceDocument } from '../domain/intelligence'

export function SolarSystemNavigator({ observations, onOpenEarth }: { observations: IntelligenceDocument[]; onOpenEarth(): void }) {
  const [selectedId,setSelectedId]=useState<CelestialBodyId>('earth')
  const [focusedId,setFocusedId]=useState<CelestialBodyId>()
  const selected=celestialBodies.find(body=>body.id===selectedId)!
  const routed=observations.filter(document=>bodiesForDocument(document).includes(selected.id))
  if (focusedId) return <BodyOperationsView bodyId={focusedId} observations={observations} onBack={()=>setFocusedId(undefined)} onOpenEarth={onOpenEarth}/>
  return <section className="system-workspace" aria-label="Solar system navigator">
    <header className="operations-header"><div><span className="eyebrow">Compressed-distance operations view</span><h1>Solar system</h1></div><button onClick={onOpenEarth}>Open Earth operations</button></header>
    <div className="system-stage" aria-label="Symbolic clickable solar system overview">
      <div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/>
      {celestialBodies.map(body=><button key={body.id} className={`celestial-body ${body.id} ${selectedId===body.id?'selected':''}`} style={{left:`${body.x}%`,top:`${body.y}%`,'--body-color':body.color,'--body-size':`${body.size}px`} as React.CSSProperties} onClick={()=>setSelectedId(body.id)} aria-label={`Select ${body.name}`}><i/><span>{body.name}</span></button>)}
    </div>
    <aside className="system-dossier"><span className="eyebrow">Selected body</span><h2>{selected.name}</h2><dl><div><dt>Class</dt><dd>{selected.kind}</dd></div><div><dt>Reference frame</dt><dd>{selected.id==='asteroid-belt'?'Heliocentric J2000':'Body-fixed when focused'}</dd></div><div><dt>Routed evidence</dt><dd>{routed.length} observation(s)</dd></div></dl><p>Overview positions and sizes are intentionally symbolic. Operational observations retain provenance and explicit reference frames.</p><button className="primary" onClick={()=>selected.id==='earth'?onOpenEarth():setFocusedId(selected.id)}>{selected.id==='earth'?'Enter Earth Cesium view':`Open ${selected.name} operations`}</button></aside>
  </section>
}

function BodyOperationsView({bodyId,observations,onBack,onOpenEarth}:{bodyId:CelestialBodyId;observations:IntelligenceDocument[];onBack():void;onOpenEarth():void}) {
  const body=celestialBodies.find(item=>item.id===bodyId)!
  const routed=observations.filter(document=>bodiesForDocument(document).includes(bodyId))
  if(bodyId==='earth'){onOpenEarth();return null}
  return <section className={`body-workspace body-${bodyId}`} aria-label={`${body.name} operations view`}>
    <header className="operations-header"><div><span className="eyebrow">Body-focused operations · evidence routed by explicit mention</span><h1>{body.name}</h1></div><button onClick={onBack}>Back to solar system</button></header>
    <div className="body-scene" aria-label={`Stylized ${body.name} body view`}><div className="body-sphere" aria-hidden="true"/>{routed.slice(0,8).map((item,index)=><button key={item.document_id} className="space-marker" style={{left:`${28+(index*19)%58}%`,top:`${24+(index*31)%55}%`}} title={item.title}><i/>{index+1}</button>)}<div className="frame-label">{bodyId==='asteroid-belt'?'HELIOCENTRIC J2000 · CLUSTER VIEW':`${body.name.toUpperCase()}-FIXED · SYMBOLIC VIEW`}</div></div>
    <aside className="body-intelligence"><span className="eyebrow">MERLIN space intelligence</span><h2>{routed.length} routed observation(s)</h2><p>Markers indicate evidence association, not measured surface coordinates. Location awaits source-supplied body-fixed geometry.</p><div className="space-evidence-list">{routed.map(item=><article key={item.document_id}><strong>{item.title}</strong><small>{item.source_name??item.publisher??'Unknown source'} · {item.publication_time??item.storage_time}</small></article>)}{!routed.length&&<div className="feed-message">No current body-specific evidence. The view remains ready for the next MERLIN acquisition.</div>}</div></aside>
  </section>
}
