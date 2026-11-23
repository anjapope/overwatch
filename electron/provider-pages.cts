export interface DocumentPage { items: { document_id: string; protocol_version: string }[]; total: number; next_cursor?: string | null }
export interface ObservationProgress { items: DocumentPage['items']; total: number; truncated: boolean; loadingMore: boolean; error?: string }
export async function collectProviderPages(firstUrl: URL, read: (url: URL) => Promise<unknown>, maxPages = 50, onProgress?: (page: ObservationProgress) => void) {
  const items: DocumentPage['items'] = []
  const identifiers = new Set<string>()
  const cursors = new Set<string>()
  let next = new URL(firstUrl)
  let total = 0
  for (let count = 0; count < maxPages; count++) {
    const raw = await read(next)
    const page = raw as DocumentPage
    if (!page || !Array.isArray(page.items) || !Number.isFinite(page.total)) throw new Error('Mayday Intelligence returned an invalid document page')
    if (count === 0) total = page.total
    for (const item of page.items) {
      if (!item || typeof item.document_id !== 'string' || item.protocol_version !== 'mayday.intelligence.document/1') throw new Error('Mayday Intelligence returned an unsupported document contract')
      if (!identifiers.has(item.document_id)) { items.push(item); identifiers.add(item.document_id) }
    }
    const done = !page.items.length || !page.next_cursor || items.length >= total
    const bounded = count === maxPages - 1
    const progress = { items:[...items], total, truncated:(done || bounded) && items.length < total, loadingMore:!done && !bounded }
    onProgress?.(progress)
    if (done) return progress
    const cursor=page.next_cursor!
    if (cursors.has(cursor)) throw new Error('Mayday Intelligence pagination did not advance')
    cursors.add(cursor)
    next = new URL(firstUrl)
    next.searchParams.set('cursor', cursor)
  }
  return { items, total, truncated:true, loadingMore:false }
}
