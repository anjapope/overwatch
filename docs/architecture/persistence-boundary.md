# Persistence Boundary (Zero 0.5)

This document describes the persistence boundary introduced in Zero 0.5.

Key points:

- Domain types (`Observation`, `ObservationRelationship`, `Epistemic`, etc.) remain authoritative and unchanged.
- Repositories expose domain types at their public API and do not leak storage details.
- The first storage adapter is a file-backed JSON envelope (`schemaVersion: 1`) used to prove the boundary; it is replaceable by any other adapter implementing the repository contracts.
- Payloads must be JSON-compatible to be persisted.
- Saving an Observation with the same ID but different material content results in a conflict error; idempotent identical saves succeed.
- Relationships preserve direction semantics (`sourceId -> targetId`) exactly as established in Zero 0.4.
 - Canonical relationship semantics (sourceId -> targetId):
	 - **sourceId** is the relationship actor / origin (the observation that asserts or performs the relation).
	 - **targetId** is the relationship object / destination (the observation that is acted upon).

	 Per-kind canonical meanings (store as `sourceId -> targetId`):
	 - `derived-from`: source is derived from target (source depends on target).
	 - `corrects`: source corrects target.
	 - `supersedes`: source supersedes target.
	 - `contradicts`: source contradicts target (directional in storage; contradictions are recorded, not auto-resolved).
	 - `supports`: source supports target.

 - Persistence MUST preserve this `sourceId -> targetId` direction without inversion.
- No deletion APIs are provided; historical observations remain recoverable.
- Persistence writes use a temporary file + rename sequence to reduce corruption risk.

See src/persistence/fileAdapter.ts for implementation details and tests in src/persistence/fileAdapter.test.ts.
