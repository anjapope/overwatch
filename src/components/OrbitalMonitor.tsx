import { useCallback, useEffect, useMemo, useState } from 'react'
import './OrbitalMonitor.css'

type Nation = 'Russia' | 'United States' | 'China' | 'Japan' | 'Europe / ESA' | 'India' | 'South Korea' | 'North Korea' | 'Other' | 'Unknown'
type AssetKind = 'Station' | 'Crewed vehicle' | 'Spacecraft' | 'Satellite'
interface SatcatRecord { NORAD_CAT_ID?: number | string; OBJECT_NAME?: string; OWNER?: string; OBJECT_TYPE?: string; INCLINATION?: number | string; APOGEE?: number | string; PERIGEE?: number | string; ORBIT_CENTER?: string }
interface OrbitalAsset extends SatcatRecord { id: string; name: string; owner: string; nation: Nation; kind: AssetKind; apogee: number; perigee: number; inclination: number }
interface Cache { updatedAt: string; items: OrbitalAsset[] }

const CACHE_KEY = 'overwatch.orbital-catalog.v1'
const CACHE_TTL = 12 * 60 * 60 * 1000
const nations: Nation[] = ['Russia', 'United States', 'China', 'Japan', 'Europe / ESA', 'India', 'South Korea', 'North Korea', 'Other', 'Unknown']
const colors: Record<Nation, string> = { Russia: '#f16b72', 'United States': '#67b7ff', China: '#ffca67', Japan: '#f4f1e8', 'Europe / ESA': '#78d6bb', India: '#f29a55', 'South Korea': '#c497ff', 'North Korea': '#ff8fc4', Other: '#90a2b8', Unknown: '#687482' }
const europeOwners = new Set(['ESA','FR','FRA','DE','GER','IT','ITA','GB','UK','ES','ESP','BE','BEL','NL','NLD','SE','SWE','NO','NOR','DK','DNK','FI','FIN','CH','CHE','AT','AUT','PL','POL','CZ','CZE','GR','GRC','PT','PRT','IE','IRL','LU','LUX','RO','ROU','HU','HUN','UA','UKR'])
function ownerToNation(raw: string): Nation {
  const owner = raw.trim().toUpperCase()
  if (!owner) return 'Unknown'
  if (['US','USA','ISS-US'].includes(owner)) return 'United States'
  if (['PRC','CHN','CN','中国'].includes(owner)) return 'China'
  if (['JPN','JAPAN'].includes(owner)) return 'Japan'
  if (['IND','INDIA'].includes(owner)) return 'India'
  if (['KOR','SKOR','ROK','SOUTH KOREA'].includes(owner)) return 'South Korea'
  if (['NKO','DPRK','PRK','NORTH KOREA'].includes(owner)) return 'North Korea'
  if (['CIS','SU','RUS','RU','RUSSIA'].includes(owner)) return 'Russia'
  if (europeOwners.has(owner)) return 'Europe / ESA'
  return 'Other'
}
function assetKind(name: string): AssetKind {
  if (/\b(ISS|TIANGONG|MIR SPACE STATION|SPACE STATION)\b/i.test(name)) return 'Station'
  if (/\b(CREW DRAGON|CREW\s*\d|SOYUZ|SHENZHOU|STARLINER|CREWED)\b/i.test(name)) return 'Crewed vehicle'
  if (/\b(CARGO DRAGON|PROGRESS|CYGNUS|HTV|TIANZHOU|CARGO)\b/i.test(name)) return 'Spacecraft'
  return 'Satellite'
}
function num(value: number | string | undefined): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0 }
function normalize(records: SatcatRecord[]): OrbitalAsset[] {
  return records.filter(item => String(item.OBJECT_TYPE ?? 'PAY').toUpperCase() === 'PAY').filter(item => !item.ORBIT_CENTER || item.ORBIT_CENTER === 'EA').map(item => {
    const name = item.OBJECT_NAME?.trim() || 'Catalog object ' + String(item.NORAD_CAT_ID ?? 'unknown')
    return { ...item, id: String(item.NORAD_CAT_ID ?? item.OBJECT_NAME ?? Math.random()), name, owner: item.OWNER?.trim() || '', nation: ownerToNation(item.OWNER ?? ''), kind: assetKind(name), apogee: num(item.APOGEE), perigee: num(item.PERIGEE), inclination: num(item.INCLINATION) }
  })
}
function readCache(): Cache | null {
  try { const value = localStorage.getItem(CACHE_KEY); if (!value) return null; const parsed = JSON.parse(value) as Cache; return Array.isArray(parsed.items) && parsed.updatedAt ? parsed : null } catch { return null }
}
function orbitalRadius(altitude: number): number { const clamped = Math.max(0, Math.min(40_000, altitude)); return 270 + 150 * Math.log1p(clamped / 120) / Math.log1p(40_000 / 120) }
function stablePhase(id: string): number { let hash = 0; for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) | 0; return (Math.abs(hash) % 10000) / 10000 * Math.PI }
function formatAge(value?: string): string { return value ? new Date(value).toLocaleString() : 'No catalog snapshot' }

export function OrbitalMonitor() {
  const cached = useMemo(readCache, [])
  const [assets, setAssets] = useState<OrbitalAsset[]>(cached?.items ?? [])
  const [updatedAt, setUpdatedAt] = useState(cached?.updatedAt)
  const [selectedNations, setSelectedNations] = useState<Nation[]>([])
  const [selected, setSelected] = useState<OrbitalAsset>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastAttempt, setLastAttempt] = useState(0)

  const refresh = useCallback(async () => {
    const now = Date.now()
    const current = readCache()
    if (current && now - new Date(current.updatedAt).getTime() < CACHE_TTL) { setAssets(current.items); setUpdatedAt(current.updatedAt); return }
    if (now - lastAttempt < 60_000) return
    setLastAttempt(now); setLoading(true); setError('')
    try {
      const response = await fetch('https://celestrak.org/satcat/records.php?GROUP=active&FORMAT=JSON&ACTIVE=1&ONORBIT=1')
      if (!response.ok) throw new Error('CelesTrak returned HTTP ' + response.status)
      const data = await response.json() as SatcatRecord[] | { data?: SatcatRecord[] }
      const rows = Array.isArray(data) ? data : data.data ?? []
      const items = normalize(rows)
      if (!items.length) throw new Error('The catalog response contained no active payload records.')
      const next = { updatedAt: new Date().toISOString(), items }
      localStorage.setItem(CACHE_KEY, JSON.stringify(next))
      setAssets(items); setUpdatedAt(next.updatedAt)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load the public satellite catalog.') }
    finally { setLoading(false) }
  }, [lastAttempt])

  useEffect(() => { void refresh() }, [refresh])
  const visible = assets
  const highlightedCount = selectedNations.length ? assets.filter(item => selectedNations.includes(item.nation)).length : assets.length
  const counts = useMemo(() => nations.reduce((result, nation) => { result[nation] = assets.filter(asset => asset.nation === nation).length; return result }, {} as Record<Nation, number>), [assets])
  const toggleNation = (nation: Nation) => setSelectedNations(current => current.includes(nation) ? current.filter(item => item !== nation) : [...current, nation])

  return <section className="orbital-workspace" aria-label="Near-Earth orbital monitor">
    <header className="orbital-header"><div><span className="eyebrow">Near-Earth Monitor · Public catalog</span><h1>Orbital assets</h1></div><div className="orbital-header-meta"><span>{highlightedCount.toLocaleString()} highlighted / {assets.length.toLocaleString()} active payloads</span><button onClick={() => void refresh()} disabled={loading}>{loading ? 'Updating…' : 'Refresh catalog'}</button></div></header>
    <div className="orbital-controls"><div className="orbital-nationalities"><strong>Highlight nationality</strong><div>{nations.map(nation => <button key={nation} className={selectedNations.length === 0 || selectedNations.includes(nation) ? 'on' : 'dim'} onClick={() => toggleNation(nation)} aria-pressed={selectedNations.includes(nation)}><i style={{backgroundColor:colors[nation]}}/>{nation}<small>{counts[nation].toLocaleString()}</small></button>)}</div></div><p>Owner codes are grouped by catalog attribution. Joint and ambiguous ownership may require manual review.</p></div>
    <div className="orbital-content">
      <div className="orbital-scene">
        <svg viewBox="0 0 1000 560" role="img" aria-label="Semicircular Earth and orbital altitude overview">
          <defs><linearGradient id="orbitalEarth" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2775a8"/><stop offset="1" stopColor="#07111f"/></linearGradient></defs>
          {[200,2000,20000,35786].map(altitude => <path key={altitude} d={'M ' + (500-orbitalRadius(altitude)) + ' 452 A ' + orbitalRadius(altitude) + ' ' + orbitalRadius(altitude) + ' 0 0 1 ' + (500+orbitalRadius(altitude)) + ' 452'} fill="none" stroke="rgba(125,165,204,.2)" strokeDasharray="3 7"/>)}
          <path d="M 240 452 A 260 260 0 0 1 760 452 L 760 560 L 240 560 Z" fill="url(#orbitalEarth)" stroke="#3c92c7" strokeWidth="2"/><path d="M 240 452 A 260 260 0 0 1 760 452" fill="none" stroke="#66b7e8" strokeWidth="2"/>
          <text x="500" y="505" textAnchor="middle" className="orbital-earth-label">EARTH · SURFACE VIEW</text><text x="500" y="535" textAnchor="middle" className="orbital-note">Orbital altitude is logarithmically scaled</text>
          {visible.slice(0, 7000).map(asset => { const altitude = (asset.apogee + asset.perigee) / 2; const radius = orbitalRadius(altitude); const phase = stablePhase(asset.id); const x = 500 + radius * Math.cos(phase); const y = 452 - radius * Math.sin(phase); return <circle key={asset.id} cx={x} cy={y} r={selected?.id === asset.id ? 5 : 2.2} fill={colors[asset.nation]} opacity={!selectedNations.length || selectedNations.includes(asset.nation) ? 0.88 : 0.1} tabIndex={0} role="button" aria-label={asset.name + ', ' + asset.nation + ', altitude ' + Math.round(altitude) + ' km'} onClick={() => setSelected(asset)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') setSelected(asset) }}><title>{asset.name} · {asset.nation} · {Math.round(asset.perigee)}–{Math.round(asset.apogee)} km</title></circle> })}
          <text x="265" y="260" className="orbital-band-label">LEO</text><text x="690" y="210" className="orbital-band-label">MEO</text><text x="710" y="95" className="orbital-band-label">GEO</text>
        </svg>
        {visible.length > 7000 && <span className="orbital-sample-note">Showing 7,000 catalog markers; counts include all filtered records.</span>}
      </div>
      <aside className="orbital-dossier"><span className="eyebrow">{selected ? 'Selected catalog object' : 'Orbit catalog'}</span>
        {selected ? <><h2>{selected.name}</h2><dl><div><dt>Nationality</dt><dd>{selected.nation}</dd></div><div><dt>Catalog owner</dt><dd>{selected.owner || 'Unassigned'}</dd></div><div><dt>Object class</dt><dd>{selected.kind}</dd></div><div><dt>Orbit band</dt><dd>{Math.round(selected.perigee).toLocaleString()}–{Math.round(selected.apogee).toLocaleString()} km</dd></div><div><dt>Inclination</dt><dd>{selected.inclination.toFixed(1)}°</dd></div><div><dt>Catalog ID</dt><dd>{selected.id}</dd></div></dl></> : <><h2>{assets.length ? 'Public orbital inventory' : 'Catalog loading'}</h2><p>Choose a nationality to highlight its cataloged payloads, or select a marker for catalog details.</p><dl><div><dt>Data snapshot</dt><dd>{formatAge(updatedAt)}</dd></div><div><dt>Highlighted</dt><dd>{selectedNations.length ? selectedNations.join(', ') : 'All nationalities'}</dd></div><div><dt>Objects plotted</dt><dd>{Math.min(assets.length, 7000).toLocaleString()}</dd></div></dl></>}
        {error && <p className="orbital-error">{error}</p>}<p className="orbital-caveat">Marker angles are for visual separation, not spacecraft position. This catalog view shows reported orbit altitude and inclination; it is not a live ephemeris.</p><a href="https://celestrak.org/satcat/" target="_blank" rel="noreferrer">Source: CelesTrak SATCAT</a>
      </aside>
    </div>
  </section>
}
