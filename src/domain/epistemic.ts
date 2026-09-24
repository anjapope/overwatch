import type { ConfidenceLevel } from './overwatch'

// Epistemic status distinguishes how the observation was arrived at.
export type EpistemicStatus = 'direct' | 'reported' | 'inferred'

export interface Epistemic {
  status: EpistemicStatus
  // Reuse the existing ConfidenceLevel type from Overwatch where appropriate.
  confidence: ConfidenceLevel
}
