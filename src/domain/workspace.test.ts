import { describe, expect, it } from 'vitest'
import { dailyMajorEvents, defaultWatchRequests, eventImportance } from './workspace'
import type { IntelligenceDocument } from './intelligence'

const doc = (id: string, title: string, day = '2026-11-19'): IntelligenceDocument => ({
  protocol_version: 'mayday.intelligence.document/1', document_id: id, title,
  publication_time: `${day}T12:00:00Z`, storage_time: `${day}T12:01:00Z`, provenance: [],
})
describe('operational workspace', () => {
  it('ranks conflict intelligence above routine news', () => expect(eventImportance(doc('1', 'Military attack during war'))).toBeGreaterThan(eventImportance(doc('2', 'Routine policy update'))))
  it('limits the registry to three major events per day', () => {
    const result = dailyMajorEvents([doc('1', 'War'), doc('2', 'Attack'), doc('3', 'Election'), doc('4', 'Routine')])
    expect(result).toHaveLength(3); expect(result.map(item => item.document.document_id)).not.toContain('4')
  })
  it('ships the authorized outer-system archival requisition',()=>{
    expect(defaultWatchRequests[0]).toMatchObject({id:'watch-outer-solar-system-archives',status:'ready-for-merlin'})
    expect(defaultWatchRequests[0].request).toContain('Voyager 1 and 2')
    expect(defaultWatchRequests[0].request).toContain('Historical mission material must be labeled archive data')
  })
})
