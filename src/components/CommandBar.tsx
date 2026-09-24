// Restored from stash and adapted to use application dispatch boundary
import { useAppDispatch } from '../state/provider'
import type { AppCommand } from '../domain/commands'

export function CommandBar() {
  const dispatch = useAppDispatch()

  const buildHandler = (cmd: AppCommand) => () => {
    // Emit typed application intent through the dispatch boundary
    dispatch(cmd)
  }

  return (
    <nav className="command-bar" role="toolbar" aria-label="Command Bar">
      <button className="cmd-btn" onClick={buildHandler({ type: 'search' })}>Search</button>
      <button className="cmd-btn" onClick={buildHandler({ type: 'dossiers' })}>Dossiers</button>
      <button className="cmd-btn" onClick={buildHandler({ type: 'events' })}>Events</button>
      <button className="cmd-btn" onClick={buildHandler({ type: 'watches' })}>Watches</button>
      <button className="cmd-btn" onClick={buildHandler({ type: 'alerts' })}>Alerts</button>
      <button className="cmd-btn" onClick={buildHandler({ type: 'briefings' })}>Briefings</button>
      <button className="cmd-btn" onClick={buildHandler({ type: 'sources' })}>Sources</button>
      <button className="cmd-btn" onClick={buildHandler({ type: 'layers' })}>Layers</button>
      <button className="cmd-btn" onClick={buildHandler({ type: 'settings' })}>Settings</button>
    </nav>
  )
}

export default CommandBar
