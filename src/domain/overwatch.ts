export type EventCategory =
  | 'armed-conflict'
  | 'security'
  | 'political'
  | 'diplomatic'
  | 'civil-unrest'
  | 'humanitarian'
  | 'disaster'
  | 'cyber'
  | 'corporate'
  | 'market'
  | 'supply-chain'
  | 'energy'
  | 'technology'
  | 'other'

export type SignificanceLevel = 'low' | 'moderate' | 'significant' | 'critical'

export type ConfidenceLevel = 'low' | 'moderate' | 'high'

export type EventStatus =
  | 'candidate'
  | 'developing'
  | 'corroborated'
  | 'resolved'
  | 'disputed'

export interface OverwatchEvent {
  id: string
  title: string
  summary: string
  category: EventCategory
  occurredAt: string
  detectedAt: string
  location: {
    latitude: number
    longitude: number
    countryCode?: string
    region?: string
    placeName?: string
  }
  significance: SignificanceLevel
  confidence: ConfidenceLevel
  status: EventStatus
  entityIds: string[]
  sourceIds: string[]
  claimIds: string[]
  watchIds: string[]
  tags: string[]
}
