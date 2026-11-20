import type { IntelligenceDocument } from './intelligence'

export type WorkspaceView = 'globe' | 'system' | 'search' | 'dossiers' | 'events' | 'watches' | 'alerts' | 'briefings' | 'sources' | 'layers' | 'settings'
export type AiPermission = 'organize' | 'draft' | 'review' | 'source' | 'apply'

export interface Dossier {
  id: string; title: string; folder: string; collection: string; executiveSummary: string
  clippedDocumentIds: string[]; aiPermissions: AiPermission[]; updatedAt: string
}
export interface WatchRequest {
  id: string; title: string; request: string; sources: string[]; cadence: string
  status: 'draft' | 'ready-for-merlin'; createdAt: string
}
export interface Briefing {
  id: string; title: string; audience: 'Golden Horn'; body: string; status: 'draft' | 'review'; updatedAt: string
}
export interface WorkspaceState { dossiers: Dossier[]; watches: WatchRequest[]; briefings: Briefing[] }

export const emptyWorkspace: WorkspaceState = { dossiers: [], watches: [], briefings: [] }
export const workspaceStorageKey = 'overwatch.workspace.v1'

export function loadWorkspace(): WorkspaceState {
  try {
    const value = localStorage.getItem(workspaceStorageKey)
    if (!value) return emptyWorkspace
    const parsed = JSON.parse(value) as Partial<WorkspaceState>
    return { dossiers: parsed.dossiers ?? [], watches: parsed.watches ?? [], briefings: parsed.briefings ?? [] }
  } catch { return emptyWorkspace }
}

export function saveWorkspace(state: WorkspaceState) { localStorage.setItem(workspaceStorageKey, JSON.stringify(state)) }
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`

export function eventImportance(document: IntelligenceDocument): number {
  const text = `${document.title} ${document.summary ?? ''}`.toLowerCase()
  const critical = ['war', 'attack', 'military', 'genocide', 'invasion', 'coup', 'earthquake', 'assassination']
  const major = ['election', 'sanction', 'ceasefire', 'treaty', 'summit', 'court', 'crisis', 'disaster']
  return critical.reduce((score, term) => score + (text.includes(term) ? 3 : 0), 0)
    + major.reduce((score, term) => score + (text.includes(term) ? 1 : 0), 0)
}

export function dailyMajorEvents(documents: readonly IntelligenceDocument[]) {
  const days = new Map<string, IntelligenceDocument[]>()
  documents.forEach(document => {
    const rawDate = document.publication_time ?? document.storage_time
    const parsedDate = new Date(rawDate)
    const day = Number.isNaN(parsedDate.getTime()) ? rawDate.slice(0, 10) : parsedDate.toISOString().slice(0, 10)
    const items = days.get(day) ?? []; items.push(document); days.set(day, items)
  })
  return [...days.entries()].sort(([a], [b]) => b.localeCompare(a)).flatMap(([day, items]) =>
    items.sort((a, b) => eventImportance(b) - eventImportance(a)).filter(item => eventImportance(item) > 0).slice(0, 3).map(document => ({ day, document, importance: eventImportance(document) })))
}
