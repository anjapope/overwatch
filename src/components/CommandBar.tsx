// Restored from stash and adapted to use application dispatch boundary
import { useAppDispatch } from '../state/provider'
import type { AppCommand } from '../domain/commands'
import type { WorkspaceView } from '../domain/workspace'

export function CommandBar({ active, onNavigate }: { active: WorkspaceView; onNavigate(view: WorkspaceView): void }) {
  const dispatch = useAppDispatch()

  const buildHandler = (cmd: AppCommand) => () => {
    // Emit typed application intent through the dispatch boundary
    dispatch(cmd)
    onNavigate(cmd.type)
  }

  return (
    <nav className="command-bar" role="toolbar" aria-label="Command Bar">
      {(['search','dossiers','events','watches','alerts','briefings','sources','layers','settings'] as const).map(type =>
        <button key={type} className={`cmd-btn ${active === type ? 'active' : ''}`} aria-pressed={active === type} onClick={buildHandler({ type })}>{type[0].toUpperCase() + type.slice(1)}</button>)}
    </nav>
  )
}

export default CommandBar
