// Lightweight branded identifier types to avoid accidental interchange.
type BrandedString<T extends string> = string & { readonly __brand?: T }

export type ObservationId = BrandedString<'ObservationId'>
export type SourceId = BrandedString<'SourceId'>

export const observationId = (s: string): ObservationId => s as ObservationId
export const sourceId = (s: string): SourceId => s as SourceId
