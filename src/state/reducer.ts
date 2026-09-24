import type { AppState } from './types'
import type { AppCommand } from '../domain/commands'

// Pure reducer: deterministic, framework-independent, Cesium/DOM-free.
function assertNever(x: never): never {
  throw new Error('Unhandled command in reducer: ' + JSON.stringify(x))
}

export function reduceApplicationCommand(state: AppState, command: AppCommand): AppState {
  switch (command.type) {
    case 'search':
    case 'dossiers':
    case 'events':
    case 'watches':
    case 'alerts':
    case 'briefings':
    case 'sources':
    case 'layers':
    case 'settings':
      return { ...state, lastCommand: command }
    default:
      return assertNever(command)
  }
}
