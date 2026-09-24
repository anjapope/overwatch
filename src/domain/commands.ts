// Typed application command contracts for Overwatch (Phase B)
export type AppCommand =
  | { type: 'search' }
  | { type: 'dossiers' }
  | { type: 'events' }
  | { type: 'watches' }
  | { type: 'alerts' }
  | { type: 'briefings' }
  | { type: 'sources' }
  | { type: 'layers' }
  | { type: 'settings' }

export const commandTypes = [
  'search',
  'dossiers',
  'events',
  'watches',
  'alerts',
  'briefings',
  'sources',
  'layers',
  'settings',
] as const

export type AppCommandType = typeof commandTypes[number]

// Helper to create commands in a consistent way if desired elsewhere
export const createCommand = (type: AppCommandType): AppCommand => ({ type })
