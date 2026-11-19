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

The application rejects plain HTTP except on loopback. Do not commit tokens or place them in Vite variables; `VITE_*` values are renderer-visible. The provider must already be running with the operational Intelligence database. A successful build does not prove access to Mayday 3; verify the connection from the target machine by refreshing the Observations panel.
