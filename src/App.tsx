import { useCallback, useEffect, useMemo, useState } from 'react'
import { OverwatchGlobe } from './components/OverwatchGlobe'
import './App.css'
import CommandBar from './components/CommandBar'
import { AppStateProvider } from './state/provider'
import { ObservationFeed } from './components/ObservationFeed'
import type { IntelligenceDocument, IntelligenceDocumentPage } from './domain/intelligence'
import { buildRegionalDossiers } from './analysis/regionalIntelligence'
import { OperationsWorkspace } from './components/OperationsWorkspace'
import { loadWorkspace, saveWorkspace, type WorkspaceState, type WorkspaceView } from './domain/workspace'
import { SolarSystemNavigator } from './components/SolarSystemNavigator'

function App() {
  const [observations, setObservations] = useState<IntelligenceDocument[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [selectedRegionId, setSelectedRegionId] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>()
  const [loadingMore, setLoadingMore] = useState(false)
  const [activeView, setActiveView] = useState<WorkspaceView>('globe')
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadWorkspace())
  const applyPage = useCallback((page: IntelligenceDocumentPage) => {
    setObservations(page.items)
    setLoadingMore(Boolean(page.loadingMore))
    setError(page.error ?? (page.truncated ? `Showing ${page.items.length} of ${page.total} records; archive coverage in this view is incomplete.` : undefined))
    setSelectedId(current => current && page.items.some(item => item.document_id === current) ? current : page.items[0]?.document_id)
  }, [])
  const load = useCallback(async () => {
    setLoading(true); setError(undefined)
    try {
      const page = window.overwatch
        ? await window.overwatch.listObservations()
        : await fetch('/api/intelligence').then(async response => {
            if (!response.ok) throw new Error(`Mayday Intelligence returned HTTP ${response.status}`)
            return response.json() as Promise<IntelligenceDocumentPage>
          })
      applyPage(page)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load Mayday Intelligence observations') }
    finally { setLoading(false) }
  }, [applyPage])
  useEffect(() => {
    const unsubscribe = window.overwatch?.onObservationProgress?.(applyPage)
    const timer = window.setTimeout(() => void load(), 0)
    return () => { window.clearTimeout(timer); unsubscribe?.() }
  }, [load, applyPage])
  useEffect(() => saveWorkspace(workspace), [workspace])
  const select = useCallback((document: IntelligenceDocument) => setSelectedId(document.document_id), [])
  const dossiers = useMemo(() => buildRegionalDossiers(observations), [observations])
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
            <OverwatchGlobe observations={observations} dossiers={dossiers} selectedId={selectedId} selectedRegionId={selectedRegionId} onSelect={select} onSelectRegion={dossier => setSelectedRegionId(dossier.region.id)} />
            <ObservationFeed observations={observations} selectedId={selectedId} selectedRegion={selectedRegion} loading={loading} error={error} onSelect={select} onCloseRegion={() => setSelectedRegionId(undefined)} onRefresh={() => void load()} />
          </div> : activeView === 'system' ? <SolarSystemNavigator observations={observations} onOpenEarth={() => setActiveView('globe')} onRefresh={() => void load()} loading={loading} error={error} /> : <OperationsWorkspace view={activeView} observations={observations} selectedId={selectedId} workspace={workspace} onChange={setWorkspace} onBack={() => setActiveView('globe')} />}
        </main>
      </div>
    </AppStateProvider>
  )
}

export default App

