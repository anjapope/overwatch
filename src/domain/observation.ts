import type { ObservationId } from './identifiers'
import type { TemporalContext } from './temporal'
import type { SpatialContext } from './spatial'
import type { ProvenanceReference } from './source'
import type { Epistemic } from './epistemic'

// Generic, serializable observation envelope. TPayload is a typed domain
// payload specific to a future domain (conflict, market, archaeology, etc.).
export interface Observation<TPayload = unknown> {
  id: ObservationId
  temporal: TemporalContext
  spatial?: SpatialContext
  provenance?: ProvenanceReference[]
  epistemic?: Epistemic
  payload?: TPayload
}
