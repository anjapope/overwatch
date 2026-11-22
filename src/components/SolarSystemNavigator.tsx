import { useMemo, useState, type CSSProperties } from 'react'
import { bodiesForDocument, celestialBodies, missionsForDocument, solarSystemGroups, spaceMissionProfiles, type CelestialBody, type CelestialBodyId } from '../domain/space'
import { safeExternalUrl, type IntelligenceDocument } from '../domain/intelligence'

const bodyStyle = (body: CelestialBody) => ({ '--body-color':body.color, '--body-size':`${body.size}px` }) as CSSProperties
function Evidence({ documents }: { documents: IntelligenceDocument[] }) {
  return <div className="space-evidence-list">{documents.map(item => <article key={item.document_id}><strong>{item.title}</strong><small>{item.source_name ?? item.publisher ?? 'Unknown source'} · {item.publication_time ?? item.storage_time}</small>{safeExternalUrl(item.canonical_url) && <a href={safeExternalUrl(item.canonical_url)} target="_blank" rel="noreferrer">Open source record</a>}</article>)}{!documents.length && <div className="feed-message">No evidence in the loaded observation set. Archive coverage has not been verified.</div>}</div>
}
export function SolarSystemNavigator({ observations, onOpenEarth, onRefresh, loading, error }: { observations: IntelligenceDocument[]; onOpenEarth(): void; onRefresh?(): void; loading?: boolean; error?: string }) {
  const [selectedId,setSelectedId] = useState<CelestialBodyId>('earth')
  const [focusedId,setFocusedId] = useState<CelestialBodyId>()
  const [selectedMissionId,setSelectedMissionId] = useState<string>()
  const [search,setSearch] = useState('')
  const routes = useMemo(() => new Map(observations.map(document => [document.document_id, bodiesForDocument(document)])), [observations])
  const selected = celestialBodies.find(body => body.id === selectedId)!
  const routed = observations.filter(document => routes.get(document.document_id)?.includes(selected.id))
  const mission = spaceMissionProfiles.find(item => item.id === selectedMissionId)
  const missionEvidence = mission ? observations.filter(document => missionsForDocument(document).includes(mission.id)) : []
  const select = (id: string) => { setSelectedId(id); setSelectedMissionId(undefined) }
  if (focusedId) return <BodyOperationsView bodyId={focusedId} observations={observations} onBack={() => setFocusedId(undefined)} onOpenEarth={onOpenEarth}/>
  const bodyButton = (body: CelestialBody, moon = false) => <button key={body.id} className={`atlas-body ${moon ? 'satellite' : ''} ${body.id} ${!mission && selectedId === body.id ? 'selected' : ''}`} style={bodyStyle(body)} onClick={() => select(body.id)} aria-label={`Select ${body.name}`} aria-pressed={!mission && selectedId === body.id}><i aria-hidden="true"/><span>{body.name}</span><small>{observations.filter(item => routes.get(item.document_id)?.includes(body.id)).length}</small></button>
  const matches = (body: CelestialBody) => `${body.name} ${body.kind} ${body.aliases.join(' ')}`.toLowerCase().includes(search.toLowerCase().trim())
  return <section className="system-workspace" aria-label="Solar system navigator">
    <header className="operations-header"><div><span className="eyebrow">Solar atlas · symbolic distances and sizes</span><h1>Solar system</h1></div><div className="action-row"><button onClick={onRefresh} disabled={loading}>{loading ? 'Loading…' : 'Refresh evidence'}</button><button onClick={onOpenEarth}>Earth operations</button></div></header>
    <div className="system-stage system-atlas">
      <div className="atlas-toolbar"><label>Find a world<input type="search" placeholder="Neptune, Charon, comet…" value={search} onChange={event => setSearch(event.target.value)}/></label><span>{celestialBodies.length} navigation entries · {spaceMissionProfiles.length} mission profiles</span></div>
      {error && <div role="alert" className="feed-message error">{error}</div>}
      <div className="atlas-grid">{solarSystemGroups.map(group => {
        const primaries = celestialBodies.filter(body => group.bodies.includes(body.id))
        const visible = primaries.filter(body => matches(body) || celestialBodies.some(moon => moon.parent === body.id && matches(moon)))
        return visible.length ? <section key={group.id} className="atlas-system"><h2>{group.name}</h2>{visible.map(body => <div key={body.id} className="atlas-family">{bodyButton(body)}<div className="atlas-satellites">{celestialBodies.filter(moon => moon.parent === body.id && (!search.trim() || matches(body) || matches(moon))).map(moon => bodyButton(moon,true))}</div></div>)}</section> : null
      })}</div>
      {!celestialBodies.some(matches) && <p className="feed-message">No matching navigation entry. The acquisition catalog can cover additional targets.</p>}
      <section className="atlas-missions"><h2>Mission archives</h2><nav className="mission-strip" aria-label="Space mission profiles">{spaceMissionProfiles.map(item => <button key={item.id} className={mission?.id === item.id ? 'selected' : ''} onClick={() => setSelectedMissionId(item.id)} aria-label={`Open ${item.name} profile`}><i className={`mission-icon mission-${item.id}`} aria-hidden="true"/><span>{item.name}</span></button>)}</nav></section>
      <p className="atlas-note">Navigation includes major moons and selected small bodies, not every known object. Counts refer to loaded evidence; zero does not mean no archive exists. Oort cloud is a hypothesized region.</p>
    </div>
    <aside className="system-dossier">{mission ? <><span className="eyebrow">Mission profile</span><h2>{mission.name}</h2><p>{mission.agency} · {mission.kind}</p><p>{mission.focus}</p><p>{mission.status}</p><Evidence documents={missionEvidence}/></> : <><span className="eyebrow">Selected world</span><h2>{selected.name}</h2><dl><div><dt>Class</dt><dd>{selected.kind}</dd></div>{selected.parent && <div><dt>Parent</dt><dd>{celestialBodies.find(body => body.id === selected.parent)?.name}</dd></div>}<div><dt>Loaded evidence</dt><dd>{routed.length} record(s)</dd></div><div><dt>Archive coverage</dt><dd>Verify against MERLIN retrieval results</dd></div></dl><button className="primary" onClick={() => selected.id === 'earth' ? onOpenEarth() : setFocusedId(selected.id)}>Open {selected.name} operations</button><Evidence documents={routed}/></>}</aside>
  </section>
}
function BodyOperationsView({bodyId,observations,onBack,onOpenEarth}:{bodyId:CelestialBodyId;observations:IntelligenceDocument[];onBack():void;onOpenEarth():void}) {
  const body = celestialBodies.find(item => item.id === bodyId)!
  const routed = observations.filter(document => bodiesForDocument(document).includes(bodyId))
  return <section className={`body-workspace body-${bodyId}`} style={bodyStyle(body)} aria-label={`${body.name} operations view`}>
    <header className="operations-header"><div><span className="eyebrow">Body-focused evidence · illustrative view</span><h1>{body.name}</h1></div><div className="action-row"><button onClick={onBack}>Solar atlas</button><button onClick={onOpenEarth}>Earth operations</button></div></header>
    <div className="body-scene" aria-label={`Stylized ${body.name} view`}><div className="body-sphere" aria-hidden="true"/><div className="frame-label">ILLUSTRATION · NO MEASURED SURFACE LOCATIONS</div></div>
    <aside className="body-intelligence"><span className="eyebrow">MERLIN space intelligence</span><h2>{routed.length} loaded record(s)</h2><p>Archive records retain their original observation periods. This illustration has no measured coordinates, terrain, or current spacecraft positions.</p><Evidence documents={routed}/></aside>
  </section>
}
