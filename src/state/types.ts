import type { AppCommand } from '../domain/commands'

export interface AppState {
  // The last application command that was dispatched. Minimal operational
  // representation for Phase 0.2d — can be extended later when real
  // operational fields are required.
  lastCommand: AppCommand | null
}

export const initialAppState: AppState = {
  lastCommand: null,
}
