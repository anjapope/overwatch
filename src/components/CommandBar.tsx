// Restored from stash and simplified for recovery step: inert, stateless
export function CommandBar() {
  const handle = (name: string) => () => {
    // eslint-disable-next-line no-console
    console.log(`[command] ${name} clicked`)
  }

  return (
    <nav className="command-bar" role="toolbar" aria-label="Command Bar">
      <button className="cmd-btn" onClick={handle('Search')}>Search</button>
      <button className="cmd-btn" onClick={handle('Dossiers')}>Dossiers</button>
      <button className="cmd-btn" onClick={handle('Events')}>Events</button>
      <button className="cmd-btn" onClick={handle('Watches')}>Watches</button>
      <button className="cmd-btn" onClick={handle('Alerts')}>Alerts</button>
      <button className="cmd-btn" onClick={handle('Briefings')}>Briefings</button>
      <button className="cmd-btn" onClick={handle('Sources')}>Sources</button>
      <button className="cmd-btn" onClick={handle('Layers')}>Layers</button>
      <button className="cmd-btn" onClick={handle('Settings')}>Settings</button>
    </nav>
  )
}

export default CommandBar
