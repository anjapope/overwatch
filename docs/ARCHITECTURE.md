# Overwatch Architecture

## 1. Initial Technology Stack

Overwatch Zero will use:

- Electron — desktop application shell
- TypeScript — application language
- React — renderer UI
- Vite — renderer build/development tooling
- CesiumJS — 3D geospatial visualization
- Vitest — automated testing

Persistent storage will be introduced after the initial globe interaction contract is operational. The architecture must permit later integration with the Mayday shared worker infrastructure and Research Studio knowledge layer.

## 2. Application Boundaries

Overwatch consists conceptually of five layers:

### Presentation Layer
The interactive globe, toolbar, panels, timeline, filters, dossiers, alerts, watchlists, and other analyst-facing interfaces.

### Intelligence Domain Layer
Events, entities, claims, observations, relationships, assessments, watches, alerts, confidence, significance, and analytical state.

### Persistence Layer
Local storage of structured intelligence, source metadata, historical state, user configuration, and analytical products.

### Worker Layer
Bounded background processes responsible for collection, extraction, normalization, geolocation, entity resolution, clustering, corroboration, monitoring, analysis, and briefing.

### Integration Layer
Controlled interfaces between Overwatch, Research Studio, Mayday workers, external datasets, APIs, and future services.

## 3. Process Boundaries

Electron main-process responsibilities should remain separate from renderer responsibilities.

The renderer must not receive unrestricted filesystem, operating-system, database, or credential access.

Privileged capabilities will be exposed through explicit preload/IPC contracts.

Intelligence-domain types should remain independent enough to be used by the renderer, main process, tests, workers, and future services.

## 4. Globe-First Interface Contract

The default renderer view is Earth.

The globe occupies the principal application surface.

Other interface elements should augment rather than replace the geographic context wherever practical.

Initial globe capabilities:

1. Render Earth.
2. Rotate through 360 degrees.
3. Zoom.
4. Display structured event fixtures geographically.
5. Visually differentiate hotspot significance.
6. Select a hotspot.
7. Inspect the selected event.
8. Support later country/region selection without replacing the globe architecture.

## 5. Data Flow

Initial development:

Fixture Data
→ Domain Validation
→ Globe Visualization
→ Geographic Selection
→ Event Inspection

Later production flow:

External Source
→ Collection
→ Original Preservation
→ Normalization
→ Extraction
→ Geolocation
→ Entity Resolution
→ Claim Identification
→ Event Candidate
→ Corroboration / Clustering
→ Event
→ Analysis
→ Globe / Watch / Alert / Briefing
→ Archive

## 6. Shared Domain Model

Geographic rendering must consume structured intelligence objects rather than visualization-specific hardcoded markers.

The globe does not own intelligence data.

It visualizes intelligence data.

This allows fixture events to be replaced by persisted and subsequently live intelligence without rewriting the visualization architecture.

## 7. Single-Machine Requirement

Overwatch must remain fully operational on one compatible computer.

Mayday distributed workers are an enhancement.

Core application operation must never require multiple Mayday machines to be online.

## 8. Research Studio Boundary

Overwatch and Research Studio remain separate applications.

Integration must occur through defined data/service contracts.

Overwatch intelligence objects should eventually be exportable or referenceable from Research Studio without losing provenance.

Shared infrastructure may be extracted where duplication becomes meaningful, but neither application should directly depend on the other's UI implementation.

## 9. Secrets

Credentials and API keys must never be committed to Git.

Local secrets belong in ignored environment/configuration mechanisms.

Example configuration may be committed only with non-secret placeholder values.

## 10. Evolution Rule

The initial implementation may omit capabilities.

It must not encode assumptions that make chartered capabilities unnecessarily difficult to add later.

Overwatch Zero is the first operational slice of the full system, not a redefinition of the system as a minimal product.