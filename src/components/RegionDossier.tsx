import type { RegionalDossier } from '../analysis/regionalIntelligence'
import type { IntelligenceDocument } from '../domain/intelligence'

interface Props {
  dossier: RegionalDossier
  selectedId?: string
  onClose(): void
  onSelect(document: IntelligenceDocument): void
}

function timestamp(document: IntelligenceDocument) {
  const value = document.publication_time ?? document.retrieval_time ?? document.storage_time
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString()
}

export function RegionDossier({ dossier, selectedId, onClose, onSelect }: Props) {
  return <aside className="observation-panel dossier-panel" aria-label={`${dossier.region.name} intelligence dossier`}>
    <header><div><span className="eyebrow">Regional intelligence dossier</span><h1>{dossier.region.name}</h1></div><button onClick={onClose}>All observations</button></header>
    <div className={`signal-banner ${dossier.signal}`}><strong>{dossier.signal === 'conflict' ? 'Conflict signal' : dossier.signal === 'attention' ? 'Elevated attention' : 'Active reporting'}</strong><span>{dossier.observations.length} observation(s) · {dossier.conflictCount} conflict-related</span></div>
    <dl className="dossier-metrics"><div><dt>Source-backed geography</dt><dd>{dossier.sourceBackedCount}</dd></div><div><dt>Deterministic mentions</dt><dd>{dossier.observations.length - dossier.sourceBackedCount}</dd></div></dl>
    <p className="derivation-note">Regional membership is evidence-preserving: source geography is identified separately from deterministic place-name matches. This dossier does not assert that every report describes an event located inside the region.</p>
    <section className="athos-slot"><span className="eyebrow">Athos assessment</span><strong>Enrichment boundary reserved</strong><p>Future analysis must cite document IDs and remain distinct from collected evidence.</p></section>
    <div className="observation-list dossier-list">{dossier.observations.map(item => <button key={item.document.document_id} className={item.document.document_id === selectedId ? 'selected' : ''} onClick={() => onSelect(item.document)}>
      <span>{item.document.source_name ?? item.document.publisher ?? 'Unknown source'} · {item.basis === 'source-backed' ? 'source geography' : 'place mention'}</span>
      <strong>{item.document.title}</strong><small>{timestamp(item.document)}</small>
    </button>)}</div>
  </aside>
}
