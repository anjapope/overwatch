/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer } from 'react'
import type { ReactNode } from 'react'
import type { AppCommand } from '../domain/commands'
import { initialAppState } from './types'
import { reduceApplicationCommand as pureReduce } from './reducer'
import type { AppState } from './types'

type Dispatch = (command: AppCommand) => void

const StateContext = createContext<AppState | undefined>(undefined)
const DispatchContext = createContext<Dispatch | undefined>(undefined)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatchInternal] = useReducer(
    (s: AppState, c: AppCommand) => pureReduce(s, c),
    initialAppState,
  )

  const dispatch: Dispatch = (cmd) => dispatchInternal(cmd)

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(StateContext)
  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider')
  }
  return ctx
}

export function useAppDispatch() {
  const ctx = useContext(DispatchContext)
  if (!ctx) {
    throw new Error('useAppDispatch must be used within AppStateProvider')
  }
  return ctx
}
