# Observation Model (Zero 0.3)

This document describes the foundational observation contracts introduced in Overwatch Zero 0.3.

1. Observation vs Event
   - Observations are bounded assertions or pieces of information about the world.
   - Events (existing `OverwatchEvent`) are domain interpretations that may be constructed from observations. Observations do not replace `OverwatchEvent`.

2. Observation vs Source
   - Sources represent evidentiary origins (web page, document, sensor, human report).
   - Observations reference `ProvenanceReference` items that point to `SourceId` values.

3. Temporal context
   - `TemporalContext` distinguishes `instant` and `interval` kinds.
   - Values use ISO 8601 strings. Simple validators ensure interval invariants.

4. Spatial context
   - `SpatialContext` currently supports `point` with explicit `latitude`, `longitude`, optional `altitudeMeters`.
   - Validators enforce latitude/longitude bounds.

5. Provenance
   - `Source` and `ProvenanceReference` are separate concepts. A provenance reference connects an observation to a `SourceId` and optional locator information.

6. Epistemic status
   - `Epistemic` describes how the observation was derived: `direct`, `reported`, or `inferred`.
   - Confidence uses the existing `ConfidenceLevel` vocabulary (`low|moderate|high`). Confidence applies to the observation's assessment, not to source reliability.

7. Generic payloads
   - `Observation<TPayload>` is a generic serializable envelope carrying domain-specific `payload` without forcing fields into the common model.

8. Limitations & future extension
   - No persistence, ingestion, visualization, or entity/event correlation is implemented.
   - Spatial primitives are intentionally minimal; additional geometries can be added behind the `SpatialContext` discriminant.
