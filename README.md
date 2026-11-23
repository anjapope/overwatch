# Overwatch

## Live Mayday Intelligence integration

Overwatch consumes the existing authenticated, read-only Intelligence provider contract (`mayday.intelligence.document/1`) through Electron's main process. The bearer token is never exposed to the renderer. Records with supported numeric coordinates appear on the Cesium globe; every record remains available in the observation panel with its source, timestamps, provenance count, and safe evidence link.

Configure a distinct least-privilege Overwatch identity on the Intelligence host:

```text
MAYDAY_PROVIDER_TOKENS=overwatch=<generate-a-secret>|intelligence:documents:read
```

On the Overwatch machine, connect over Tailscale HTTPS or an authenticated loopback tunnel:

```bash
MAYDAY_INTELLIGENCE_PROVIDER_URL=https://mayday-3.<tailnet>.ts.net/api/v1/provider \
MAYDAY_INTELLIGENCE_PROVIDER_TOKEN='<same generated secret>' \
npm start
```

Build the native Apple-Silicon Overwatch application instead of launching Electron's generic development shell:

```bash
npm run package:mac
open -n /private/tmp/overwatch-release/Overwatch-darwin-arm64/Overwatch.app --args \
  --mayday-provider-url=http://127.0.0.1:18767/api/v1/provider \
  --mayday-provider-token-file=/secure/path/overwatch-provider.token
```

Build the Fedora-compatible x64 application directory with:

```bash
npm run package:linux
```

The Linux package is written to
`/private/tmp/overwatch-linux-release/Overwatch-linux-x64`. Install that
directory as a unit and keep `provider.json` plus its protected token file
outside the application payload, just as on macOS.

The local package is consistently ad-hoc signed and uses the stable bundle identity `com.mayday.overwatch`. It is built outside synchronized folders because file-provider metadata invalidates strict macOS signature verification. Public distribution requires an Apple Developer ID signature and notarization; do not distribute the ad-hoc package as a trusted release.

For normal Finder launches, `~/Library/Application Support/Overwatch/provider.json` may contain `providerUrl` and `tokenFile`. Store only a protected token-file path there, never the token value itself.

The application rejects plain HTTP except on loopback. Do not commit tokens or place them in Vite variables; `VITE_*` values are renderer-visible. The provider must already be running with the operational Intelligence database. A successful build does not prove access to Mayday 3; verify the connection from the target machine by refreshing the Observations panel.


## Solar atlas and archive requests

The expanded atlas includes 72 selectable bodies/regions and 32 historical and
observatory mission profiles. Distances, sizes and body illustrations are
symbolic. Archive evidence routes by explicit names and source-declared topics;
no spacecraft location or measured surface geometry is inferred. The provider
now follows pagination beyond the previous 100-record limit, bounded to 50 pages
with a visible incomplete-coverage notice if truncated.

The paired Mayday Intelligence change adds PDS4 and legacy PDS catalog acquisition
and 192 prepared watches. They collect metadata and source links, preserving
observation intervals separately from retrieval dates. Live submission is a
separate host action, recorded by the authenticated submission helper. See the
backend's `docs/solar-archive-acquisition.md` for scope and coverage gaps.

Validation: `npm test`, `npm run typecheck`, `npm run build`, and
`node scripts/test-provider-pages.cjs` after building Electron.

## Scientific surfaces and progressive loading

Body operations now offer 26 live-capabilities-verified NASA Trek imagery/relief
layers for Moon, Mars, Mercury, Venus, Titan, Ceres, Vesta, Io, Europa, Ganymede,
Phobos and Ryugu. The Cesium surface viewer provides orbit, tilt, zoom, layer
selection and lunar/Martian feature shortcuts. Regional HiRISE and CTX imagery
remain limited to their published coverage and tile levels. Irregular bodies use
an explicitly approximate reference sphere, not a measured shape mesh.

Mars additionally supports numeric MOLA/HRSC elevation tiles from Esri's public
OnMars MDEM200M service. Its angular Mars-2000-sphere grid is handled directly
with a Mars ellipsoid; Earth CRS metadata is not substituted. A live terrain tile
was decoded as a 513×513 LERC grid, with physical heights retained. Other bodies'
relief maps are imagery, and are labeled accordingly. Exaggeration is explicit.
The view links to NASA's full terrain and measurement tools for additional data.

The Electron tile bridge accepts only catalogued NASA layer IDs and bounded
Mars terrain tile indices. It forwards no provider credentials or cookies and
caches tiles within a 32 MiB memory budget. Geographic context and attribution
are visible in the surface view. No measured coordinates are fabricated from
archive-document titles.

Observation loading displays the first page immediately and streams later pages
in the background. A failed later page retains already loaded records and reports
the error. Refresh cancels the previous scan.

Tests: TypeScript, Vitest, `node scripts/test-provider-pages.cjs`, and
`node scripts/test-planetary-proxy.cjs`. The prepared surface installer combines
the app payload with the paired MERLIN acquisition upgrade; deployment and
native GPU/UI verification must run on the host.

Sources:
- https://trek.nasa.gov/tiles/apidoc/
- https://trek.nasa.gov/
- https://developers.arcgis.com/javascript/latest/sample-code/mars/
- https://astro.arcgis.com/arcgis/rest/services/OnMars/MDEM200M/ImageServer
