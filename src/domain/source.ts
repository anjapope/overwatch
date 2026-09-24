import type { SourceId } from './identifiers'

export type SourceKind = 'web' | 'document' | 'dataset' | 'sensor' | 'human' | 'other'

export interface Source {
  id: SourceId
  kind: SourceKind
  title?: string
  uri?: string
  description?: string
}

// ProvenanceReference connects an observation to a source without embedding
// the full Source object. Locator can be used to point to page/record/row.
export interface ProvenanceReference {
  sourceId: SourceId
  locator?: string
  citedAt?: string // ISO timestamp when the citation was recorded
}
