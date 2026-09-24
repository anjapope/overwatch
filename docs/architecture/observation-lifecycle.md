# Observation Lifecycle (Zero 0.4)

This document records the lifecycle and relationship semantics introduced in Zero 0.4.

1. Stable observation identity
   - `ObservationId` identifies an evidentiary observation. Identity is stable; do not mutate meaning under the same `ObservationId`.

2. Relationship vocabulary
   - `derived-from`: target observation analytically depends on source observation.
   - `corrects`: target observation is a correction of the source observation (source remains recoverable).
   - `supersedes`: target observation should be preferred for current use but does not erase source.
   - `contradicts`: target observation conflicts with source; contradiction is recorded, not resolved.
   - `supports`: target observation provides supporting evidence for the source.

3. Directionality
   - Relationships are serialized with `sourceId` → `targetId`.
   - Semantics of direction are documented per-kind above. Contradiction is conceptually symmetric, but the serialized record still stores a direction.

4. Relationship representation
   - `ObservationRelationship` records `kind`, `sourceId`, `targetId`, optional `provenance`, `createdAt`, and optional `note`.
   - Relationships have optional stable identifiers `ObservationRelationshipId` when desired.

5. Lifecycle semantics
   - Do not add mutable booleans like `isSuperseded` to `Observation`; such lifecycle state is derived from relationships.
   - Small pure helpers (e.g., `isSuperseded`) can answer queries without mutating observations.

6. Derivation and epistemic status
   - An inferred observation should have `epistemic.status === 'inferred'` and explicit `derived-from` relationships pointing to its parent observations.
   - Epistemic status and derivation lineage remain distinct concepts.

7. Immutability and corrections
   - Corrections create new observations and a `corrects` relationship rather than mutating the original.

8. Limitations
   - No persistence, graph engines, visualization, or automated resolution implemented here.
