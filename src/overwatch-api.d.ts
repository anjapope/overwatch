import type { IntelligenceDocumentPage } from './domain/intelligence'
declare global { interface Window { overwatch?: {
  listObservations(): Promise<IntelligenceDocumentPage>
  onObservationProgress?(callback: (page: IntelligenceDocumentPage) => void): () => void
} } }
export {}
