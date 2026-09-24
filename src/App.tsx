import { OverwatchGlobe } from './components/OverwatchGlobe'
import type { OverwatchEvent } from './domain/overwatch'
import './App.css'
import CommandBar from './components/CommandBar'
import { AppStateProvider } from './state/provider'

function App() {
  const initialEvents: OverwatchEvent[] = []

  return (
    <AppStateProvider>
      <div className="app-shell">
        <header className="top-bar">
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true"></span>
            <span className="brand-name">OVERWATCH</span>
          </div>

          <CommandBar />

          <span className="status-pill">ZERO 0.1</span>
        </header>

        <main className="app-main" aria-label="Operational globe workspace">
          <OverwatchGlobe events={initialEvents} />
        </main>
      </div>
    </AppStateProvider>
  )
}

export default App
