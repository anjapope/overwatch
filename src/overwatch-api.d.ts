import type { IntelligenceDocumentPage } from './domain/intelligence'
declare global { interface Window { overwatch?: {
  getResourceUsage?():Promise<{sampleSeconds:number;rssMiB:number;cpuPercent:number;systemTotalMiB:number;systemAvailableMiB:number;swapUsedMiB?:number;logicalCpus:number;gpu:string;processes:{type:string;pid:number;rssMiB:number;cpuPercent:number}[]}>
  listObservations(): Promise<IntelligenceDocumentPage>
  onObservationProgress?(callback: (page: IntelligenceDocumentPage) => void): () => void
} } }
export {}
