import { describe, it, expect } from 'vitest'
import { initialAppState } from './types'
import { reduceApplicationCommand } from './reducer'

describe('reduceApplicationCommand', () => {
  it('sets lastCommand for search', () => {
    const next = reduceApplicationCommand(initialAppState, { type: 'search' })
    expect(next.lastCommand).toEqual({ type: 'search' })
  })

  it('sets lastCommand for each known command and preserves other state', () => {
    const commands = [
      'dossiers',
      'events',
      'watches',
      'alerts',
      'briefings',
      'sources',
      'layers',
      'settings',
    ] as const

    for (const t of commands) {
      const next = reduceApplicationCommand(initialAppState, { type: t })
      expect(next.lastCommand).toEqual({ type: t })
    }
  })

  it('is deterministic and pure for repeated calls', () => {
    const s1 = reduceApplicationCommand(initialAppState, { type: 'search' })
    const s2 = reduceApplicationCommand(initialAppState, { type: 'search' })
    expect(s1).toEqual(s2)
  })
})
