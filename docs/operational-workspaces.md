# Operational workspaces

The command bar opens persistent analyst workspaces backed by browser-local storage (`overwatch.workspace.v1`). Intelligence evidence remains read-only and retains its Mayday document identifier and provenance.

## Authority boundaries

- The human operator can create, edit, organize, clip, and delete dossier material.
- AI permissions are denied by default and granted per dossier: organize, draft, review, source suggestion, and apply.
- Granting **apply** does not grant any other capability. It only permits approved changes inside that dossier.
- Athos and other future assessment services must cite Mayday document IDs and keep generated assessment separate from collected evidence.
- A Watch can be marked `ready-for-merlin`, producing a reviewed request package. Overwatch does not claim dispatch because MERLIN currently has no authenticated watch-write endpoint.
- Golden Horn briefings remain drafts or review products. Distribution is never automatic.

## Workspaces

- **Dossiers:** folders, collections, executive summaries, per-action AI authority, and evidence clipping.
- **Events:** a maximum of three high-importance events per day, using transparent keyword scoring.
- **Watches:** source-bounded special collection requests staged for MERLIN.
- **Alerts:** major findings and matches against authorized watch requests.
- **Briefings:** collaborative Golden Horn drafting and review state.
- **Sources:** live source inventory derived from the current Mayday page.
- **Search:** full-text filtering over loaded observations.

Local storage is appropriate for this operational prototype, not multi-user deployment. Shared deployment requires an authenticated persistence service, an audit log, concurrency controls, and a MERLIN write contract.
