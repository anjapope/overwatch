import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { OverwatchGlobe } from './components/OverwatchGlobe'
import './App.css'
import CommandBar from './components/CommandBar'
import { AppStateProvider } from './state/provider'
import { ObservationFeed } from './components/ObservationFeed'
import type { IntelligenceDocument, IntelligenceDocumentPage } from './domain/intelligence'
import { buildRegionalDossiers } from './analysis/regionalIntelligence'
import { OperationsWorkspace } from './components/OperationsWorkspace'
import { loadWorkspace, saveWorkspace, type WorkspaceState, type WorkspaceView } from './domain/workspace'
import { filterEarthFeed, loadEarthFeedMode, saveEarthFeedMode, loadEarthFeedOptions, saveEarthFeedOptions, type EarthFeedOptions, type EarthFeedMode } from './domain/earthFeed'
import { SolarSystemNavigator } from './components/SolarSystemNavigator'

function App() {
  const [earthFeedOptions,setEarthFeedOptions]=useState<EarthFeedOptions>(loadEarthFeedOptions)
  const [earthFeedMode,setEarthFeedMode] = useState<EarthFeedMode>(loadEarthFeedMode)
  const [collections,setCollections] = useState<IntelligenceDocumentPage['collections']>()
  const [observations, setObservations] = useState<IntelligenceDocument[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [selectedRegionId, setSelectedRegionId] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [shouldRetry, setShouldRetry] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const retryCount = useRef(0)
  const requestInFlight = useRef(false)
  const [activeView, setActiveView] = useState<WorkspaceView>('globe')
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadWorkspace())
  const applyPage = useCallback((page: IntelligenceDocumentPage) => {
    setObservations(page.items)
    setCollections(page.collections)
    setLoadingMore(Boolean(page.loadingMore))
    setError(page.error ?? (page.truncated ? `Showing ${page.items.length} of ${page.total} records; archive coverage in this view is incomplete.` : undefined))
    setShouldRetry(Boolean(page.error))
    if (page.error) retryCount.current += 1
    else if (!page.loadingMore) retryCount.current = 0
    setSelectedId(current => current && page.items.some(item => item.document_id === current) ? current : page.items[0]?.document_id)
  }, [])
  const load = useCallback(async () => {
    if (requestInFlight.current) return
    requestInFlight.current = true
    setLoading(true); setError(undefined); setShouldRetry(false)
    try {
      const page = window.overwatch
        ? await window.overwatch.listObservations()
        : await fetch('/api/intelligence').then(async response => {
            if (!response.ok) throw new Error(`Mayday Intelligence returned HTTP ${response.status}`)
            return response.json() as Promise<IntelligenceDocumentPage>
          })
      applyPage(page)
      retryCount.current = 0
    } catch (reason) {
      retryCount.current += 1
      setError(reason instanceof Error ? reason.message : 'Could not load Mayday Intelligence observations')
      setShouldRetry(true)
    }
    finally { requestInFlight.current = false; setLoading(false) }
  }, [applyPage])
  useEffect(() => {
    const unsubscribe = window.overwatch?.onObservationProgress?.(applyPage)
    const timer = window.setTimeout(() => void load(), 0)
    return () => { window.clearTimeout(timer); unsubscribe?.() }
  }, [load, applyPage])
  useEffect(() => {
    if (!shouldRetry) return
    const delay = Math.min(60_000, 2_000 * 2 ** Math.min(retryCount.current - 1, 5))
    const timer = window.setTimeout(() => void load(), delay)
    return () => window.clearTimeout(timer)
  }, [shouldRetry, load])
  useEffect(() => {
    const reconnect = () => { if (shouldRetry) void load() }
    window.addEventListener('online', reconnect)
    window.addEventListener('focus', reconnect)
    return () => {
      window.removeEventListener('online', reconnect)
      window.removeEventListener('focus', reconnect)
    }
  }, [shouldRetry, load])
  useEffect(()=>{
    const timer=window.setInterval(()=>{if(!document.hidden && !loadingMore && !requestInFlight.current)void load()},300_000)
    return ()=>window.clearInterval(timer)
  },[load,loadingMore])
  useEffect(() => saveWorkspace(workspace), [workspace])
  const select = useCallback((document: IntelligenceDocument) => setSelectedId(document.document_id), [])
  const earthObservations = useMemo(() => filterEarthFeed(observations,earthFeedMode,earthFeedOptions), [observations,earthFeedMode,earthFeedOptions])
  const setEarthOptions=(options:EarthFeedOptions)=>{setEarthFeedOptions(options);saveEarthFeedOptions(options);setSelectedId(undefined);setSelectedRegionId(undefined)}
  const setEarthMode = (mode:EarthFeedMode) => { setEarthFeedMode(mode);saveEarthFeedMode(mode);setSelectedId(undefined);setSelectedRegionId(undefined) }
  const dossiers = useMemo(() => buildRegionalDossiers(earthObservations), [earthObservations])
  const selectedRegion = dossiers.find(item => item.region.id === selectedRegionId)

  return (
    <AppStateProvider>
      <div className="app-shell">
        <header className="top-bar">
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true"></span>
            <span className="brand-name">OVERWATCH</span>
          </div>

          <CommandBar active={activeView} onNavigate={setActiveView} />

          <span className="status-pill">{loadingMore ? `${observations.length} RECORDS · LOADING MORE` : `${observations.length} RECORDS`}</span>
        </header>

        <main className="app-main" aria-label="Operational globe workspace">
          {activeView === 'globe' ? <div className="operational-workspace">
            <OverwatchGlobe observations={earthObservations} dossiers={dossiers} selectedId={selectedId} selectedRegionId={selectedRegionId} onSelect={select} onSelectRegion={dossier => setSelectedRegionId(dossier.region.id)} />
            <ObservationFeed observations={earthObservations} earthFeedOptions={earthFeedOptions} onEarthFeedOptionsChange={setEarthOptions} collectionStatus={collections} allObservations={observations} earthFeedMode={earthFeedMode} onEarthFeedModeChange={setEarthMode} selectedId={selectedId} selectedRegion={selectedRegion} loading={loading} retrying={shouldRetry && !loading} error={error} onSelect={select} onCloseRegion={() => setSelectedRegionId(undefined)} onRefresh={() => void load()} />
          </div> : activeView === 'system' ? <SolarSystemNavigator observations={observations} onOpenEarth={() => setActiveView('globe')} onRefresh={() => void load()} loading={loading} error={error} /> : <OperationsWorkspace view={activeView} observations={observations} selectedId={selectedId} workspace={workspace} onChange={setWorkspace} onBack={() => setActiveView('globe')} />}
        </main>
      </div>
    </AppStateProvider>
  )
}

export default App

