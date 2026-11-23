export interface IntelligenceDocument {
  protocol_version: 'mayday.intelligence.document/1'; document_id: string; title: string
  summary?: string | null; canonical_url?: string | null; publisher?: string | null; source_type?: string | null
  publication_time?: string | null; retrieval_time?: string | null; storage_time: string
  provenance: Array<Record<string, unknown>>; connector_id?: string | null; source_id?: string | null
  source_name?: string | null; topics?: string[] | null; geography?: Record<string, unknown> | null
  verification?: Record<string, unknown> | null
}
export interface IntelligenceDocumentPage {
  collections?: { news:number;space:number;other:number;cached:boolean;warnings:string[] };
  truncated?: boolean; total?: number; loadingMore?: boolean; error?: string; items: IntelligenceDocument[]; next_cursor?: string | null }
export interface GeographicObservation extends IntelligenceDocument { latitude: number; longitude: number }

function finiteCoordinate(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') { const parsed = Number(value); if (Number.isFinite(parsed)) return parsed }
  return undefined
}
export function coordinatesFor(document: IntelligenceDocument): GeographicObservation | undefined {
  const geography = document.geography
  if (!geography) return undefined
  const nested = geography.coordinates
  const coordinateObject = nested && typeof nested === 'object' && !Array.isArray(nested) ? nested as Record<string, unknown> : geography
  const coordinateArray = Array.isArray(nested) ? nested : undefined
  const latitude = finiteCoordinate(coordinateObject.latitude ?? coordinateObject.lat ?? coordinateArray?.[1])
  const longitude = finiteCoordinate(coordinateObject.longitude ?? coordinateObject.lon ?? coordinateObject.lng ?? coordinateArray?.[0])
  if (latitude === undefined || longitude === undefined || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return undefined
  return { ...document, latitude, longitude }
}
export function safeExternalUrl(value?: string | null): string | undefined {
  if (!value) return undefined
  try { const url = new URL(value); return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : undefined } catch { return undefined }
}

