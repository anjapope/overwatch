import { safeExternalUrl, type IntelligenceDocument } from '../domain/intelligence'
interface Props { observations: readonly IntelligenceDocument[]; selectedId?: string; loading: boolean; error?: string; onSelect(document: IntelligenceDocument): void; onRefresh(): void }
function timestamp(document: IntelligenceDocument) { const value = document.publication_time ?? document.retrieval_time ?? document.storage_time; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString() }
export function ObservationFeed({ observations, selectedId, loading, error, onSelect, onRefresh }: Props) {
  const selected = observations.find(item => item.document_id === selectedId)
  const evidenceUrl = safeExternalUrl(selected?.canonical_url)
  return <aside className="observation-panel" aria-label="Live Intelligence observations">
    <header><div><span className="eyebrow">Mayday Intelligence</span><h1>Observations</h1></div><button onClick={onRefresh} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button></header>
    {error && <div className="feed-message error">{error}</div>}
    {!error && !loading && observations.length === 0 && <div className="feed-message">No observations were returned.</div>}
    <div className="observation-list">{observations.map(document => <button key={document.document_id} className={document.document_id === selectedId ? 'selected' : ''} onClick={() => onSelect(document)}><span>{document.source_name ?? document.publisher ?? document.connector_id ?? 'Unknown source'}</span><strong>{document.title || 'Untitled observation'}</strong><small>{timestamp(document)}</small></button>)}</div>
    {selected && <section className="observation-detail"><span className="eyebrow">Selected evidence</span><h2>{selected.title}</h2>{selected.summary && <p>{selected.summary}</p>}<dl><div><dt>Source</dt><dd>{selected.source_name ?? selected.publisher ?? 'Not recorded'}</dd></div><div><dt>Retrieved</dt><dd>{selected.retrieval_time ?? 'Not recorded'}</dd></div><div><dt>Stored</dt><dd>{selected.storage_time}</dd></div><div><dt>Provenance</dt><dd>{selected.provenance.length} record(s)</dd></div></dl>{evidenceUrl && <a href={evidenceUrl} target="_blank" rel="noreferrer">Open source evidence</a>}</section>}
  </aside>
}
