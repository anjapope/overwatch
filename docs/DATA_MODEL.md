# Overwatch Data Model

## 1. Principle

Overwatch intelligence must exist independently of its visualization.

The globe consumes structured intelligence objects. It does not define them.

The initial model deliberately includes fields that will matter when fixture events are replaced with real intelligence.

## 2. Initial Event Object

```typescript
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
```

## 3. Initial Enumerations

```typescript
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

export type SignificanceLevel =
  | 'low'
  | 'moderate'
  | 'significant'
  | 'critical'

export type ConfidenceLevel =
  | 'low'
  | 'moderate'
  | 'high'

export type EventStatus =
  | 'candidate'
  | 'developing'
  | 'corroborated'
  | 'resolved'
  | 'disputed'
```

## 4. Future Core Objects

The following are first-class domain concepts even if they are not implemented during Overwatch Zero:

- Source
- SourceArtifact
- Observation
- Claim
- EventCandidate
- Entity
- Relationship
- Indicator
- Assessment
- Hypothesis
- Watch
- Alert
- Briefing
- AnalystAnnotation

They should not be collapsed permanently into Event.

## 5. Provenance

Future production events must support traceability to their evidentiary basis.

Conceptually:

Assessment
→ Event / Indicator
→ Claim / Observation
→ Source
→ SourceArtifact

IDs should therefore be stable and relationships explicit.

## 6. Geographic Model

Latitude and longitude identify an event's representative geographic position.

They do not imply that all events are point phenomena.

Future geographic representations may include:

- points;
- administrative regions;
- bounding areas;
- lines/routes;
- infrastructure;
- maritime areas;
- multiple associated locations.

The initial point model must therefore not become the permanent limit of Overwatch geography.

## 7. Time Model

`occurredAt` represents when an event occurred or began according to available intelligence.

`detectedAt` represents when Overwatch first detected the event.

These are intentionally distinct.

Future objects may additionally support:

- start/end ranges;
- uncertain dates;
- continuing events;
- source publication time;
- collection time;
- update history.

## 8. Confidence and Significance

Confidence and significance represent different concepts.

**Confidence** concerns the evidentiary basis for believing an event representation is accurate.

**Significance** concerns the analytical importance of the event.

A high-significance event may have low confidence.

A high-confidence event may have low significance.

They must not be collapsed into a single score.

## 9. Fixture Rule

Synthetic development events must use the same `OverwatchEvent` structure expected from later production data.

Components must not depend on special fixture-only fields.

This permits:

Synthetic Events
→ Persisted Events
→ Collected Real Events

without replacing the presentation contract.